import "dotenv/config";
import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import multer from "multer";
import fs from "fs";
import path from "path";
import axios from "axios";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

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

// In-Memory Database Fallback if MySQL is not running on host
let isUsingMemoryDb = false;
let memoryDb = {
  users: [],
  products: [],
  orders: [],
  order_items: [],
  reviews: [],
  password_resets: [],
  nextUserId: 1,
  nextProductId: 1,
  nextOrderId: 1,
  nextReviewId: 1,
};

let connectionPool;
let pool;

try {
  connectionPool = mysql.createPool({ ...dbConfig });
  pool = mysql.createPool({ ...dbConfig, database: DB_NAME });
} catch (err) {
  console.warn("MySQL pool error, switching to Memory Storage:", err.message);
  isUsingMemoryDb = true;
}

app.use("/uploads", express.static(uploadDir));

const buildUserResponse = (user) => ({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  identificacion: user.identificacion,
  tipo_documento: user.tipo_documento || "CC",
  rol: user.rol || "comprador",
  moodle_id: user.moodle_id || null,
});

const getTableColumns = async (tableName) => {
  if (isUsingMemoryDb) return new Set();
  try {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [DB_NAME, tableName]
    );
    return new Set(rows.map((row) => row.COLUMN_NAME));
  } catch {
    return new Set();
  }
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
  } catch (_error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }
  const userRole = req.user.rol || "comprador";
  if (!allowedRoles.includes(userRole) && userRole !== "admin") {
    return res.status(403).json({ message: "Acceso denegado: rol no autorizado para esta acción" });
  }
  next();
};

const seedProducts = [
  {
    nombre: "Sombrero Vueltiao Tradicional",
    autor: "María Contreras",
    descripcion: "Sombrero vueltiao auténtico tejido a mano por artesanos de Sucre",
    precio: 180000,
    imagen_key: "1.jpeg",
    rating: 4.8,
  },
  {
    nombre: "Collar Artesanal Multicolor",
    autor: "Carmen López",
    descripcion: "Collar de mostacilla hecho a mano con tintes naturales",
    precio: 85000,
    imagen_key: "2.jpeg",
    rating: 4.8,
  },
  {
    nombre: "Mochila Wayuu Tradicional",
    autor: "José Martínez",
    descripcion: "Mochila tejida a mano con patrones únicos ancestrales",
    precio: 250000,
    imagen_key: "3.jpeg",
    rating: 4.9,
  },
  {
    nombre: "Pulseras Artesanales",
    autor: "Ana Pérez",
    descripcion: "Juego de 3 pulseras tejidas con colores vivos",
    precio: 40000,
    imagen_key: "4.jpeg",
    rating: 4.7,
  },
  {
    nombre: "Accesorios Étnicos",
    autor: "Luis Gómez",
    descripcion: "Accesorios elaborados en madera tratada e hilo folclórico",
    precio: 60000,
    imagen_key: "5.jpeg",
    rating: 4.6,
  },
  {
    nombre: "Joyas Artesanales",
    autor: "Sofía Rojas",
    descripcion: "Joyas hechas a mano en filigrana y elementos artesanales",
    precio: 120000,
    imagen_key: "6.jpeg",
    rating: 4.9,
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const ensureDatabase = async () => {
  try {
    await connectionPool.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL,
        email VARCHAR(180) NOT NULL UNIQUE,
        identificacion VARCHAR(30) NOT NULL UNIQUE,
        tipo_documento VARCHAR(10) DEFAULT 'CC',
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(30) DEFAULT 'comprador',
        moodle_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const userColumns = await getTableColumns("users");
    if (!userColumns.has("tipo_documento")) {
      await pool.query("ALTER TABLE users ADD COLUMN tipo_documento VARCHAR(10) DEFAULT 'CC' AFTER identificacion");
    }
    if (!userColumns.has("rol")) {
      await pool.query("ALTER TABLE users ADD COLUMN rol VARCHAR(30) DEFAULT 'comprador' AFTER password");
    }
    if (!userColumns.has("moodle_id")) {
      await pool.query("ALTER TABLE users ADD COLUMN moodle_id INT NULL");
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(180) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        tax DECIMAL(10,2) NOT NULL,
        shipping DECIMAL(10,2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(50) NOT NULL,
        status VARCHAR(30) NOT NULL,
        transaction_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        nombre VARCHAR(180) NOT NULL,
        cantidad INT NOT NULL,
        precio DECIMAL(10,2) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        user_name VARCHAR(120) NOT NULL,
        rating INT NOT NULL,
        comentario TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [products] = await pool.query("SELECT COUNT(*) AS total FROM products");
    if (products[0]?.total === 0) {
      for (const product of seedProducts) {
        await pool.query(
          `INSERT INTO products (nombre, autor, descripcion, precio, imagen_key, rating)
           VALUES (?, ?, ?, ?, ?, ?)`,
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
  } catch (error) {
    console.warn("No se pudo conectar a MySQL local. Usando base de datos en memoria para desarrollo:", error.message);
    isUsingMemoryDb = true;

    // Populate memoryDb with seeds
    if (memoryDb.products.length === 0) {
      seedProducts.forEach((p) => {
        memoryDb.products.push({
          id: memoryDb.nextProductId++,
          nombre: p.nombre,
          autor: p.autor,
          author_user_id: null,
          descripcion: p.descripcion,
          precio: p.precio,
          imagen_key: p.imagen_key,
          image_data: null,
          rating: p.rating,
        });
      });
    }
  }
};

// SIMULADOR / ENVÍO DE NOTIFICACIONES VÍA CORREO ELECTRÓNICO (RF-10)
const sendEmailNotification = async ({ to, subject, html, text }) => {
  console.log("==========================================");
  console.log(`[EMAIL NOTIFICATION SENT TO: ${to}]`);
  console.log(`Asunto: ${subject}`);
  console.log(text || html);
  console.log("==========================================");
  return true;
};

// ROUTES

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, memoryDb: isUsingMemoryDb });
});

// RF-01 & RF-06: GET PRODUCTS
app.get("/api/products", async (_req, res) => {
  try {
    if (isUsingMemoryDb) {
      const formatted = memoryDb.products.map((p) => ({
        ...p,
        precio: formatCurrency(Number(p.precio)),
        rawPrecio: Number(p.precio),
      }));
      return res.json({ products: formatted });
    }

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
       ORDER BY p.id DESC`
    );

    return res.json({
      products: rows.map((product) => ({
        ...product,
        precio: formatCurrency(Number(product.precio)),
        rawPrecio: Number(product.precio),
      })),
    });
  } catch (_error) {
    return res.status(500).json({ message: "No se pudieron cargar los productos" });
  }
});

// RF-06: CREATE PRODUCT (Artesano / Admin)
app.post("/api/products", authMiddleware, requireRole(["artesano", "admin"]), upload.single("image_file"), async (req, res) => {
  try {
    const { nombre, descripcion, precio } = req.body;
    const imageFile = req.file;

    if (!nombre || !descripcion || !precio) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const parsedPrice = Number(precio);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: "El precio debe ser un número mayor a cero" });
    }

    const autorNombre = req.user.nombre || "Artesano";
    const author_user_id = req.user.id;
    const imagen_key = imageFile ? imageFile.originalname : "1.jpeg";
    const image_data = imageFile ? `/uploads/${imageFile.filename}` : null;

    if (isUsingMemoryDb) {
      const newProd = {
        id: memoryDb.nextProductId++,
        nombre: nombre.trim(),
        autor: autorNombre,
        author_user_id,
        descripcion: descripcion.trim(),
        precio: parsedPrice,
        imagen_key,
        image_data,
        rating: 5.0,
      };
      memoryDb.products.unshift(newProd);
      return res.status(201).json({
        message: "Producto creado correctamente",
        product: { ...newProd, precio: formatCurrency(parsedPrice) },
      });
    }

    const [result] = await pool.query(
      `INSERT INTO products (nombre, autor, author_user_id, descripcion, precio, imagen_key, image_data, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), autorNombre, author_user_id, descripcion.trim(), parsedPrice, imagen_key, image_data, 5.0]
    );

    return res.status(201).json({
      message: "Producto creado correctamente",
      product: {
        id: result.insertId,
        nombre: nombre.trim(),
        autor: autorNombre,
        author_user_id,
        descripcion: descripcion.trim(),
        precio: formatCurrency(parsedPrice),
        rating: 5.0,
        image_data,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "No se pudo crear el producto" });
  }
});

// RF-06: UPDATE PRODUCT (Artesano / Admin)
app.put("/api/products/:id", authMiddleware, requireRole(["artesano", "admin"]), upload.single("image_file"), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio } = req.body;
    const imageFile = req.file;

    if (isUsingMemoryDb) {
      const prodIndex = memoryDb.products.findIndex((p) => p.id === Number(id));
      if (prodIndex === -1) return res.status(404).json({ message: "Producto no encontrado" });

      const prod = memoryDb.products[prodIndex];
      if (req.user.rol !== "admin" && prod.author_user_id && prod.author_user_id !== req.user.id) {
        return res.status(403).json({ message: "No tienes permiso para modificar este producto" });
      }

      if (nombre) prod.nombre = nombre.trim();
      if (descripcion) prod.descripcion = descripcion.trim();
      if (precio) prod.precio = Number(precio);
      if (imageFile) prod.image_data = `/uploads/${imageFile.filename}`;

      return res.json({ message: "Producto actualizado correctamente", product: prod });
    }

    const [rows] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    const prod = rows[0];

    if (req.user.rol !== "admin" && prod.author_user_id && prod.author_user_id !== req.user.id) {
      return res.status(403).json({ message: "No tienes permiso para modificar este producto" });
    }

    const newName = nombre ? nombre.trim() : prod.nombre;
    const newDesc = descripcion ? descripcion.trim() : prod.descripcion;
    const newPrice = precio ? Number(precio) : prod.precio;
    const newImageData = imageFile ? `/uploads/${imageFile.filename}` : prod.image_data;

    await pool.query(
      `UPDATE products SET nombre = ?, descripcion = ?, precio = ?, image_data = ? WHERE id = ?`,
      [newName, newDesc, newPrice, newImageData, id]
    );

    return res.json({ message: "Producto actualizado correctamente" });
  } catch (_error) {
    return res.status(500).json({ message: "Error al actualizar producto" });
  }
});

// RF-06: DELETE PRODUCT (Artesano / Admin)
app.delete("/api/products/:id", authMiddleware, requireRole(["artesano", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    if (isUsingMemoryDb) {
      const prodIndex = memoryDb.products.findIndex((p) => p.id === Number(id));
      if (prodIndex === -1) return res.status(404).json({ message: "Producto no encontrado" });

      const prod = memoryDb.products[prodIndex];
      if (req.user.rol !== "admin" && prod.author_user_id && prod.author_user_id !== req.user.id) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
      }

      memoryDb.products.splice(prodIndex, 1);
      return res.json({ message: "Producto eliminado correctamente" });
    }

    const [rows] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    const prod = rows[0];

    if (req.user.rol !== "admin" && prod.author_user_id && prod.author_user_id !== req.user.id) {
      return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
    }

    await pool.query("DELETE FROM products WHERE id = ?", [id]);
    return res.json({ message: "Producto eliminado correctamente" });
  } catch (_error) {
    return res.status(500).json({ message: "Error al eliminar producto" });
  }
});

// RF-02: USER REGISTRATION (with rol and tipo_documento)
app.post("/api/register", async (req, res) => {
  try {
    const { nombre, email, identificacion, tipo_documento = "CC", password, rol = "comprador" } = req.body;

    if (!nombre || !email || !identificacion || !password) {
      return res.status(400).json({ message: "Todos los campos obligatorios deben diligenciarse" });
    }

    const validRoles = ["artesano", "comprador", "admin"];
    const userRole = validRoles.includes(rol) ? rol : "comprador";
    const userDocType = tipo_documento || "CC";

    if (isUsingMemoryDb) {
      const exists = memoryDb.users.find(
        (u) => u.email === email.toLowerCase() || u.identificacion === identificacion
      );
      if (exists) {
        return res.status(409).json({ message: "Ya existe un usuario registrado con ese correo o número de documento" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        id: memoryDb.nextUserId++,
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        identificacion: identificacion.trim(),
        tipo_documento: userDocType,
        password: hashedPassword,
        rol: userRole,
        moodle_id: null,
      };

      memoryDb.users.push(newUser);
      const userPayload = buildUserResponse(newUser);
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

      return res.status(201).json({
        message: "Cuenta registrada exitosamente",
        token,
        user: userPayload,
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR identificacion = ? LIMIT 1",
      [email.toLowerCase(), identificacion]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Ya existe un usuario registrado con ese correo o número de documento",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (nombre, email, identificacion, tipo_documento, password, rol) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre.trim(), email.toLowerCase().trim(), identificacion.trim(), userDocType, hashedPassword, userRole]
    );

    const [userRows] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    const user = userRows[0];
    const userPayload = buildUserResponse(user);
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      message: "Cuenta registrada exitosamente",
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al registrar el usuario" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Debes ingresar tu documento/correo y contraseña" });
    }

    let user = null;

    if (isUsingMemoryDb) {
      user = memoryDb.users.find(
        (u) => u.email === identifier.toLowerCase() || u.identificacion === identifier.trim()
      );
    } else {
      const [rows] = await pool.query(
        "SELECT * FROM users WHERE email = ? OR identificacion = ? LIMIT 1",
        [identifier.toLowerCase(), identifier.trim()]
      );
      user = rows[0];
    }

    if (!user) {
      return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    }

    const userPayload = buildUserResponse(user);
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      message: "Inicio de sesión exitoso",
      token,
      user: userPayload,
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error en inicio de sesión" });
  }
});

// RF-03: FORGOT & RESET PASSWORD
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "El correo es obligatorio" });

    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    let userFound = false;

    if (isUsingMemoryDb) {
      const user = memoryDb.users.find((u) => u.email === email.toLowerCase());
      if (user) {
        userFound = true;
        memoryDb.password_resets.push({ email: email.toLowerCase(), token, expiresAt });
      }
    } else {
      const [rows] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email.toLowerCase()]);
      if (rows.length > 0) {
        userFound = true;
        await pool.query(
          "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)",
          [email.toLowerCase(), token, expiresAt]
        );
      }
    }

    if (!userFound) {
      // Return ambiguous message for security
      return res.json({
        message: "Si la cuenta existe, hemos enviado un enlace de recuperación a tu correo electrónico.",
        simulatedToken: token,
      });
    }

    const resetUrl = `${req.protocol}://${req.get("host")}/restablecer-password?token=${token}`;

    await sendEmailNotification({
      to: email,
      subject: "Recuperación de Contraseña - Corazón Artesano",
      html: `<p>Hola,</p><p>Has solicitado restablecer tu contraseña. Haz clic en el enlace para continuar:</p><a href="${resetUrl}">${resetUrl}</a>`,
      text: `Has solicitado restablecer tu contraseña. Tu token de recuperación es: ${token}`,
    });

    return res.json({
      message: "Hemos enviado las instrucciones de recuperación a tu correo electrónico.",
      tokenPreview: token,
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error al solicitar recuperación de contraseña" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token y nueva contraseña son requeridos" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isUsingMemoryDb) {
      const resetRecord = memoryDb.password_resets.find((r) => r.token === token);
      if (!resetRecord || resetRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: "El enlace de recuperación es inválido o ha expirado" });
      }
      const user = memoryDb.users.find((u) => u.email === resetRecord.email);
      if (user) {
        user.password = hashedPassword;
      }
      return res.json({ message: "Contraseña restablecida con éxito. Ya puedes iniciar sesión." });
    }

    const [rows] = await pool.query(
      "SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "El enlace de recuperación es inválido o ha expirado" });
    }

    const resetRecord = rows[0];
    await pool.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, resetRecord.email]);
    await pool.query("DELETE FROM password_resets WHERE email = ?", [resetRecord.email]);

    return res.json({ message: "Contraseña restablecida con éxito. Ya puedes iniciar sesión." });
  } catch (_error) {
    return res.status(500).json({ message: "Error al restablecer la contraseña" });
  }
});

// RF-07, RF-09, RF-10: ELECTRONIC CHECKOUT & PAYMENT PROCESSING WITH EMAIL NOTIFICATION
app.post("/api/checkout", authMiddleware, async (req, res) => {
  try {
    const { items, paymentMethod, paymentDetails } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "El carrito de compras está vacío" });
    }

    let subtotal = 0;
    const validatedItems = items.map((item) => {
      const price = Number(item.price || item.precioRaw || 50000);
      const qty = Number(item.quantity || 1);
      subtotal += price * qty;
      return {
        product_id: item.id,
        nombre: item.nombre,
        cantidad: qty,
        precio: price,
      };
    });

    const tax = Math.round(subtotal * 0.19); // 19% IVA
    const shipping = subtotal > 150000 ? 0 : 12000;
    const total = subtotal + tax + shipping;

    // Simulate payment approval logic (Cards ending in 0000 simulate rejection for testing)
    const cardNumber = paymentDetails?.cardNumber || "";
    const isRejected = cardNumber.endsWith("0000");
    const status = isRejected ? "REJECTED" : "APPROVED";
    const transaction_id = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    let orderId;

    if (isUsingMemoryDb) {
      orderId = memoryDb.nextOrderId++;
      const order = {
        id: orderId,
        user_id: req.user.id,
        subtotal,
        tax,
        shipping,
        total,
        payment_method: paymentMethod || "Tarjeta de Crédito",
        status,
        transaction_id,
        created_at: new Date(),
        items: validatedItems,
      };
      memoryDb.orders.unshift(order);
    } else {
      const [resOrder] = await pool.query(
        `INSERT INTO orders (user_id, subtotal, tax, shipping, total, payment_method, status, transaction_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, subtotal, tax, shipping, total, paymentMethod || "Tarjeta de Crédito", status, transaction_id]
      );
      orderId = resOrder.insertId;

      for (const item of validatedItems) {
        await pool.query(
          `INSERT INTO order_items (order_id, product_id, nombre, cantidad, precio) VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.nombre, item.cantidad, item.precio]
        );
      }
    }

    // RF-10: EMAIL NOTIFICATION TO CLIENT ON PAYMENT STATUS
    const clientEmail = req.user.email;
    const clientName = req.user.nombre;
    const isApproved = status === "APPROVED";

    const emailSubject = isApproved
      ? `¡Pago Aprobado! Confirmación de Compra #${orderId} - Corazón Artesano`
      : `Notificación: Pago Rechazado para la Orden #${orderId} - Corazón Artesano`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 10px;">
        <h2 style="color: ${isApproved ? "#2e7d32" : "#c62828"};">
          ${isApproved ? "¡Pago Aprobado Exitosamente!" : "Tu Pago No Pudo Ser Procesado"}
        </h2>
        <p>Hola <strong>${clientName}</strong>,</p>
        <p>${
          isApproved
            ? "Tu pago ha sido procesado con éxito. Tus productos artesanales se están preparando para el envío."
            : "Lamentamos informarte que la transacción fue rechazada por la entidad bancaria. Por favor verifica tus datos o intenta con otro método de pago."
        }</p>

        <div style="background-color: #f9f6f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top:0; color: #8b5e3c;">Resumen de la Transacción</h3>
          <p><strong>N° de Orden:</strong> #${orderId}</p>
          <p><strong>ID Transacción:</strong> ${transaction_id}</p>
          <p><strong>Estado:</strong> ${isApproved ? "APROBADO" : "RECHAZADO"}</p>
          <p><strong>Método de Pago:</strong> ${paymentMethod}</p>
          <p><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</p>
          <p><strong>IVA (19%):</strong> ${formatCurrency(tax)}</p>
          <p><strong>Envío:</strong> ${shipping === 0 ? "GRATIS" : formatCurrency(shipping)}</p>
          <p style="font-size: 18px; color: #8b5e3c;"><strong>Total:</strong> ${formatCurrency(total)}</p>
        </div>

        <p style="font-size: 12px; color: #777;">Corazón Artesano - Apoyando la tradición artesanal colombiana.</p>
      </div>
    `;

    await sendEmailNotification({
      to: clientEmail,
      subject: emailSubject,
      html: emailHtml,
      text: `Estado de Pago para Orden #${orderId}: ${status}. Total: ${formatCurrency(total)}`,
    });

    return res.json({
      message: isApproved ? "Transacción completada exitosamente" : "El pago fue rechazado por el banco",
      orderId,
      status,
      transaction_id,
      subtotal,
      tax,
      shipping,
      total,
      formattedTotal: formatCurrency(total),
      emailSentTo: clientEmail,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al procesar el pago" });
  }
});

// GET USER ORDERS
app.get("/api/orders", authMiddleware, async (req, res) => {
  try {
    if (isUsingMemoryDb) {
      const userOrders = memoryDb.orders.filter((o) => o.user_id === req.user.id);
      return res.json({ orders: userOrders });
    }

    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
      [req.user.id]
    );
    return res.json({ orders });
  } catch (_error) {
    return res.status(500).json({ message: "Error al consultar las compras" });
  }
});

// RF-08: MOODLE COURSES FOR ARTISANS
app.get("/api/moodle/courses", async (_req, res) => {
  try {
    if (process.env.MOODLE_URL && process.env.MOODLE_TOKEN) {
      const response = await axios.get(`${process.env.MOODLE_URL}/webservice/rest/server.php`, {
        params: {
          wstoken: process.env.MOODLE_TOKEN,
          wsfunction: "core_course_get_courses",
          moodlewsrestformat: "json",
        },
      });
      return res.json(response.data);
    }

    // Integrated training course catalog for artisans
    const sampleCourses = [
      {
        id: 101,
        fullname: "Técnicas Ancestrales y Tintes Naturales",
        shortname: "TEJIDO-101",
        summary: "Capacitación avanzada para tejedores y artesanos en conservación de técnicas auténticas y pigmentación natural.",
        categoryname: "Artesanías",
        duration: "4 semanas",
        level: "Intermedio",
        enrolled: true,
        instructor: "Maestra Carmen Palomino",
      },
      {
        id: 102,
        fullname: "Gestión Financiera y Costeo para Artesanos",
        shortname: "FIN-201",
        summary: "Aprende a fijar precios justos, calcular costos de producción y llevar la contabilidad de tu taller artesanal.",
        categoryname: "Emprendimiento",
        duration: "3 semanas",
        level: "Básico",
        enrolled: false,
        instructor: "Lic. Roberto Mendoza",
      },
      {
        id: 103,
        fullname: "Fotografía de Producto con Smartphone",
        shortname: "FOTO-301",
        summary: "Técnicas de iluminación y encuadre para resaltar la belleza de tus productos en catálogo digital e e-commerce.",
        categoryname: "Marketing Digital",
        duration: "2 semanas",
        level: "Todos los niveles",
        enrolled: true,
        instructor: "Sofía Gómez",
      },
      {
        id: 104,
        fullname: "Comercialización Digital y Redes Sociales",
        shortname: "MKT-401",
        summary: "Estrategias prácticas para promocionar artesanías en Instagram, Facebook y mercados virtuales internacionales.",
        categoryname: "Marketing Digital",
        duration: "4 semanas",
        level: "Intermedio",
        enrolled: false,
        instructor: "Carlos Ruiz",
      },
    ];

    return res.json(sampleCourses);
  } catch (_error) {
    return res.status(500).json({ message: "Error al conectar con Moodle" });
  }
});

app.post("/api/moodle/enroll", authMiddleware, requireRole(["artesano", "admin"]), async (req, res) => {
  try {
    const { courseId } = req.body;
    return res.json({
      message: `Te has inscrito correctamente en el curso #${courseId}. Revisa tu correo o la plataforma Moodle.`,
      courseId,
    });
  } catch (_error) {
    return res.status(500).json({ message: "No se pudo inscribir en el curso" });
  }
});

// RF-11: REVIEWS AND STAR RATINGS FOR PRODUCTS
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;

    if (isUsingMemoryDb) {
      const prodReviews = memoryDb.reviews.filter((r) => r.product_id === Number(id));
      return res.json({ reviews: prodReviews });
    }

    const [rows] = await pool.query(
      "SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC",
      [id]
    );
    return res.json({ reviews: rows });
  } catch (_error) {
    return res.status(500).json({ message: "Error al obtener opiniones" });
  }
});

app.post("/api/products/:id/reviews", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comentario } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Debes seleccionar una calificación de 1 a 5 estrellas" });
    }
    if (!comentario || comentario.trim().length === 0) {
      return res.status(400).json({ message: "El comentario u opinión es obligatorio" });
    }

    const userName = req.user.nombre || "Comprador";
    const userId = req.user.id;

    if (isUsingMemoryDb) {
      const newRev = {
        id: memoryDb.nextReviewId++,
        product_id: Number(id),
        user_id: userId,
        user_name: userName,
        rating: Number(rating),
        comentario: comentario.trim(),
        created_at: new Date(),
      };
      memoryDb.reviews.unshift(newRev);

      // Recalculate average rating for product
      const allRev = memoryDb.reviews.filter((r) => r.product_id === Number(id));
      const avg = allRev.reduce((acc, curr) => acc + curr.rating, 0) / allRev.length;
      const prod = memoryDb.products.find((p) => p.id === Number(id));
      if (prod) prod.rating = Number(avg.toFixed(1));

      return res.status(201).json({ message: "Opinión agregada exitosamente", review: newRev });
    }

    await pool.query(
      `INSERT INTO reviews (product_id, user_id, user_name, rating, comentario) VALUES (?, ?, ?, ?, ?)`,
      [id, userId, userName, rating, comentario.trim()]
    );

    // Update product avg rating
    const [avgResult] = await pool.query(
      "SELECT AVG(rating) as avgRating FROM reviews WHERE product_id = ?",
      [id]
    );
    const avg = avgResult[0]?.avgRating ? Number(avgResult[0].avgRating).toFixed(1) : rating;
    await pool.query("UPDATE products SET rating = ? WHERE id = ?", [avg, id]);

    return res.status(201).json({ message: "Opinión agregada exitosamente" });
  } catch (_error) {
    return res.status(500).json({ message: "Error al guardar la opinión" });
  }
});

const startServer = async () => {
  await ensureDatabase();
  app.listen(PORT, () => {
    console.log(`Servidor Corazón Artesano activo en http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("No se pudo iniciar el servidor:", error);
});