import "dotenv/config";
import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import multer from "multer";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "corazon-artesano-secret";
const DB_NAME = process.env.DB_NAME || "corazon_artesano";
const uploadDir = path.join(process.cwd(), "server", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-");

    callback(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

if (process.env.DB_PASSWORD) {
  dbConfig.password = process.env.DB_PASSWORD;
}

const connectionPool = mysql.createPool({
  ...dbConfig,
});

const pool = mysql.createPool({
  ...dbConfig,
  database: DB_NAME,
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

const buildUserResponse = (user) => ({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  identificacion: user.identificacion,
});

const getTableColumns = async (tableName) => {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [DB_NAME, tableName]
  );

  return new Set(rows.map((row) => row.COLUMN_NAME));
};

const getTableConstraints = async (tableName) => {
  const [rows] = await pool.query(
    `SELECT CONSTRAINT_NAME
     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [DB_NAME, tableName]
  );

  return new Set(rows.map((row) => row.CONSTRAINT_NAME));
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  try {
    const token = authHeader.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

const seedProducts = [
  {
    nombre: "Sombrero Vueltiao Tradicional",
    autor: "María Contreras",
    descripcion: "Sombrero vueltiao auténtico tejido a mano",
    precio: 180000,
    imagen_key: "1.jpeg",
    rating: 4.8,
  },
  {
    nombre: "Collar Artesanal Multicolor",
    autor: "Carmen López",
    descripcion: "Collar de mostacilla hecho a mano",
    precio: 85000,
    imagen_key: "2.jpeg",
    rating: 4.8,
  },
  {
    nombre: "Mochila Wayuu Tradicional",
    autor: "José Martínez",
    descripcion: "Mochila tejida con patrones únicos",
    precio: 250000,
    imagen_key: "3.jpeg",
    rating: 4.8,
  },
  {
    nombre: "Pulseras Artesanales",
    autor: "Ana Pérez",
    descripcion: "Pulseras tejidas con colores vivos",
    precio: 40000,
    imagen_key: "4.jpeg",
    rating: 4.8,
  },
  {
    nombre: "Accesorios Étnicos",
    autor: "Luis Gómez",
    descripcion: "Accesorios con identidad cultural",
    precio: 60000,
    imagen_key: "5.jpeg",
    rating: 4.8,
  },
  {
    nombre: "Joyas Artesanales",
    autor: "Sofía Rojas",
    descripcion: "Joyas hechas a mano",
    precio: 120000,
    imagen_key: "6.jpeg",
    rating: 4.8,
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const ensureDatabase = async () => {
  await connectionPool.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL UNIQUE,
      identificacion VARCHAR(30) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(180) NOT NULL,
      autor VARCHAR(120) NOT NULL,
      author_user_id INT NULL,
      descripcion TEXT NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      imagen_key VARCHAR(80) NOT NULL,
      image_data LONGTEXT NULL,
      rating DECIMAL(2,1) NOT NULL DEFAULT 4.8,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_products_author_user
        FOREIGN KEY (author_user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
    )
  `);

  const productColumns = await getTableColumns("products");

  if (!productColumns.has("author_user_id")) {
    await pool.query(
      "ALTER TABLE products ADD COLUMN author_user_id INT NULL AFTER autor"
    );
  }

  if (!productColumns.has("image_data")) {
    await pool.query(
      "ALTER TABLE products ADD COLUMN image_data LONGTEXT NULL AFTER imagen_key"
    );
  }

  const productConstraints = await getTableConstraints("products");

  if (!productConstraints.has("fk_products_author_user")) {
    await pool.query(`
      ALTER TABLE products
        ADD CONSTRAINT fk_products_author_user
        FOREIGN KEY (author_user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
    `);
  }

  const [products] = await pool.query("SELECT COUNT(*) AS total FROM products");

  if (products[0]?.total === 0) {
    for (const product of seedProducts) {
      await pool.query(
        `INSERT INTO products (nombre, autor, descripcion, precio, imagen_key, rating)
         VALUES (?, ?, ?, ?, ?, ?)` ,
        [
          product.nombre,
          product.autor,
          product.descripcion,
          product.precio,
          product.imagen_key,
          product.rating,
        ]
      );
    }
  }
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/products", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         p.id,
         p.nombre,
         COALESCE(u.nombre, p.autor) AS autor,
         p.author_user_id,
         p.descripcion,
         p.precio,
         p.imagen_key,
         p.image_data,
         p.rating
       FROM products p
       LEFT JOIN users u ON u.id = p.author_user_id
       ORDER BY p.id ASC`
    );

    return res.json({
      products: rows.map((product) => ({
        ...product,
        precio: formatCurrency(Number(product.precio)),
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "No se pudieron cargar los productos",
    });
  }
});

app.post("/api/products", authMiddleware, upload.single("image_file"), async (req, res) => {
  try {
    const { nombre, descripcion, precio } = req.body;
    const imageFile = req.file;

    if (!nombre || !descripcion || !precio || !imageFile) {
      return res.status(400).json({
        message: "Todos los campos del producto son obligatorios",
      });
    }

    const parsedPrice = Number(precio);

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        message: "El precio debe ser un número mayor que cero",
      });
    }

    const [authorRows] = await pool.query(
      "SELECT id, nombre FROM users WHERE id = ? LIMIT 1",
      [req.user.id]
    );

    const author = authorRows[0];

    if (!author) {
      return res.status(404).json({
        message: "No se encontró el usuario autenticado",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO products (nombre, autor, author_user_id, descripcion, precio, imagen_key, image_data, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        nombre.trim(),
        author.nombre,
        author.id,
        descripcion.trim(),
        parsedPrice,
        imageFile.originalname,
        `/uploads/${imageFile.filename}`,
        4.8,
      ]
    );

    const [productRows] = await pool.query(
      `SELECT
         p.id,
         p.nombre,
         COALESCE(u.nombre, p.autor) AS autor,
         p.author_user_id,
         p.descripcion,
         p.precio,
         p.imagen_key,
         p.image_data,
         p.rating
       FROM products p
       LEFT JOIN users u ON u.id = p.author_user_id
       WHERE p.id = ?`,
      [result.insertId]
    );

    const product = productRows[0];

    return res.status(201).json({
      message: "Producto creado correctamente",
      product: {
        ...product,
        precio: formatCurrency(Number(product.precio)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "No se pudo crear el producto",
    });
  }
});

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "La imagen es demasiado grande. Usa un archivo de hasta 15 MB.",
      });
    }

    return res.status(400).json({
      message: "No se pudo procesar la imagen seleccionada",
    });
  }

  return next(error);
});

app.post("/api/register", async (req, res) => {
  try {
    const { nombre, email, identificacion, password } = req.body;

    if (!nombre || !email || !identificacion || !password) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios",
      });
    }

    const [existingUserRows] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR identificacion = ? LIMIT 1",
      [email.toLowerCase(), identificacion]
    );

    if (existingUserRows.length > 0) {
      return res.status(409).json({
        message: "Ya existe un usuario con ese correo o identificación",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (nombre, email, identificacion, password) VALUES (?, ?, ?, ?)",
      [nombre.trim(), email.toLowerCase().trim(), identificacion.trim(), hashedPassword]
    );

    const [userRows] = await pool.query(
      "SELECT id, nombre, email, identificacion FROM users WHERE id = ?",
      [result.insertId]
    );

    const user = userRows[0];

    const token = jwt.sign(buildUserResponse(user), JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "No se pudo registrar el usuario",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Debes escribir tu identificación/correo y contraseña",
      });
    }

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR identificacion = ? LIMIT 1",
      [identifier.toLowerCase(), identifier.trim()]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos",
      });
    }

    const userPayload = buildUserResponse(user);
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      message: "Inicio de sesión exitoso",
      token,
      user: userPayload,
    });
  } catch (error) {
    return res.status(500).json({
      message: "No se pudo iniciar sesión",
    });
  }
});

app.get("/api/me", authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

const startServer = async () => {
  await ensureDatabase();

  app.listen(PORT, () => {
    console.log(`Servidor de autenticación escuchando en http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("No se pudo iniciar el servidor:", error);
  process.exit(1);
});