import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const { Pool } = pg;

export const JWT_SECRET = process.env.JWT_SECRET || "corazon-artesano-secret";
export const DATABASE_URL = process.env.DATABASE_URL || "";

// In-Memory Database Fallback if PostgreSQL/Supabase is not connected
export let isUsingMemoryDb = false;

export const setUsingMemoryDb = (val) => {
  isUsingMemoryDb = val;
};

export const memoryDb = {
  users: [],
  products: [],
  orders: [],
  order_items: [],
  reviews: [
    {
      id: 1,
      product_id: 1,
      user_id: 2,
      user_name: "Carlos Comprador",
      rating: 5,
      comentario: "Excelente Sombrero Vueltiao. La flexibilidad de la caña flecha y la finura de las trenzas son impecables.",
      created_at: new Date(),
    },
    {
      id: 2,
      product_id: 3,
      user_id: 2,
      user_name: "Andrea Ramírez",
      rating: 5,
      comentario: "La Mochila Wayuu llegó súper rápido y los colores tradicionales son hermosos. ¡Excelente calidad!",
      created_at: new Date(),
    },
  ],
  password_resets: [],
  nextUserId: 1,
  nextProductId: 1,
  nextOrderId: 1,
  nextReviewId: 3,
};

export const seedProducts = [
  {
    nombre: "Sombrero Vueltiao Tradicional",
    autor: "María Contreras",
    descripcion: "Sombrero vueltiao auténtico tejido a mano por artesanos de Sucre",
    precio: 180000,
    imagen_key: "1.jpeg",
    rating: 4.8,
    destacado: true,
  },
  {
    nombre: "Collar Artesanal Multicolor",
    autor: "Carmen López",
    descripcion: "Collar de mostacilla hecho a mano con tintes naturales",
    precio: 85000,
    imagen_key: "2.jpeg",
    rating: 4.8,
    destacado: false,
  },
  {
    nombre: "Mochila Wayuu Tradicional",
    autor: "José Martínez",
    descripcion: "Mochila tejida a mano con patrones únicos ancestrales",
    precio: 250000,
    imagen_key: "3.jpeg",
    rating: 4.9,
    destacado: true,
  },
  {
    nombre: "Pulseras Artesanales",
    autor: "Ana Pérez",
    descripcion: "Juego de 3 pulseras tejidas con colores vivos",
    precio: 40000,
    imagen_key: "4.jpeg",
    rating: 4.7,
    destacado: false,
  },
  {
    nombre: "Accesorios Étnicos",
    autor: "Luis Gómez",
    descripcion: "Accesorios elaborados en madera tratada e hilo folclórico",
    precio: 60000,
    imagen_key: "5.jpeg",
    rating: 4.6,
    destacado: false,
  },
  {
    nombre: "Joyas Artesanales",
    autor: "Sofía Rojas",
    descripcion: "Joyas hechas a mano en filigrana y elementos artesanales",
    precio: 120000,
    imagen_key: "6.jpeg",
    rating: 4.9,
    destacado: false,
  },
];

let pgPool = null;

if (DATABASE_URL) {
  try {
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10000,
    });
  } catch (err) {
    console.warn("⚠️ [DB] No se pudo inicializar el pool de PostgreSQL:", err.message);
    isUsingMemoryDb = true;
  }
} else {
  // Si no hay DATABASE_URL configurada todavía, activar MemoryDB para desarrollo local
  isUsingMemoryDb = true;
}

export const pool = {
  query: async (text, params) => {
    if (!pgPool || isUsingMemoryDb) {
      throw new Error("Pool PostgreSQL no disponible, usando base de datos en memoria");
    }
    return pgPool.query(text, params);
  },
};

export const ensureDatabase = async () => {
  if (pgPool && !isUsingMemoryDb) {
    try {
      // Probar conexión a Supabase PostgreSQL
      const client = await pgPool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(120) NOT NULL,
            email VARCHAR(180) NOT NULL UNIQUE,
            identificacion VARCHAR(30) NOT NULL UNIQUE,
            tipo_documento VARCHAR(10) DEFAULT 'CC',
            password VARCHAR(255) NOT NULL,
            rol VARCHAR(30) DEFAULT 'comprador',
            moodle_id INT NULL,
            foto VARCHAR(255) NULL,
            telefono VARCHAR(30) NULL,
            biografia TEXT NULL,
            especialidad VARCHAR(120) NULL,
            ubicacion VARCHAR(120) NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS password_resets (
            id SERIAL PRIMARY KEY,
            email VARCHAR(180) NOT NULL,
            token VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(180) NOT NULL,
            autor VARCHAR(120) NOT NULL,
            author_user_id INT REFERENCES users(id) ON DELETE SET NULL,
            descripcion TEXT NOT NULL,
            precio NUMERIC(10,2) NOT NULL,
            imagen_key VARCHAR(80) NOT NULL,
            image_data TEXT NULL,
            rating NUMERIC(2,1) NOT NULL DEFAULT 4.8,
            destacado BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            total NUMERIC(10,2) NOT NULL,
            subtotal NUMERIC(10,2) NOT NULL,
            tax NUMERIC(10,2) NOT NULL,
            shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
            payment_method VARCHAR(50) NOT NULL,
            status VARCHAR(30) NOT NULL,
            transaction_id VARCHAR(100) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id INT NULL REFERENCES products(id) ON DELETE SET NULL,
            nombre VARCHAR(180) NOT NULL,
            cantidad INT NOT NULL,
            precio NUMERIC(10,2) NOT NULL
          );

          CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            user_name VARCHAR(120) NOT NULL,
            rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comentario TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);

        // Check and seed products if empty
        const countRes = await client.query("SELECT COUNT(*) AS total FROM products");
        if (Number(countRes.rows[0]?.total || 0) === 0) {
          for (const p of seedProducts) {
            await client.query(
              `INSERT INTO products (nombre, autor, descripcion, precio, imagen_key, rating, destacado)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [p.nombre, p.autor, p.descripcion, p.precio, p.imagen_key, p.rating, p.destacado]
            );
          }
        }

        // Check and seed Admin in PostgreSQL if not exists
        const ADMIN_EMAIL = "admin@corazonartesano.com";
        const ADMIN_IDENT = "1000000000";
        const adminCheck = await client.query(
          "SELECT id FROM users WHERE email = $1 OR identificacion = $2 LIMIT 1",
          [ADMIN_EMAIL, ADMIN_IDENT]
        );
        if (adminCheck.rows.length === 0) {
          const hashedPassword = await bcrypt.hash("admin123", 10);
          await client.query(
            `INSERT INTO users (nombre, email, identificacion, tipo_documento, password, rol, especialidad, ubicacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              "Administrador Principal",
              ADMIN_EMAIL,
              ADMIN_IDENT,
              "CC",
              hashedPassword,
              "admin",
              "Gestión de Plataforma",
              "Sincelejo, Sucre",
            ]
          );
          console.log(`[SEED] Cuenta de Administrador creada en Supabase PostgreSQL: ${ADMIN_EMAIL}`);
        }
        console.log("✅ [DB] Conectado exitosamente a Supabase PostgreSQL");
      } finally {
        client.release();
      }
    } catch (error) {
      console.warn("⚠️ [DB] No se pudo conectar a Supabase PostgreSQL. Activando base de datos en memoria para desarrollo:", error.message);
      isUsingMemoryDb = true;
    }
  }

  // Populate MemoryDB with seeds if active
  if (isUsingMemoryDb) {
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
          destacado: p.destacado,
        });
      });
    }

    const ADMIN_EMAIL = "admin@corazonartesano.com";
    const ADMIN_IDENT = "1000000000";
    const memAdmin = memoryDb.users.find((u) => u.email === ADMIN_EMAIL);
    if (!memAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      memoryDb.users.push({
        id: memoryDb.nextUserId++,
        nombre: "Administrador Principal",
        email: ADMIN_EMAIL,
        identificacion: ADMIN_IDENT,
        tipo_documento: "CC",
        password: hashedPassword,
        rol: "admin",
        moodle_id: 1,
        foto: null,
        telefono: "+57 300 000 0000",
        biografia: "Administrador general de la plataforma Corazón Artesano.",
        especialidad: "Gestión de Plataforma",
        ubicacion: "Sincelejo, Sucre",
        created_at: new Date(),
      });

      memoryDb.users.push({
        id: memoryDb.nextUserId++,
        nombre: "María Contreras",
        email: "maria@artesana.com",
        identificacion: "1065123456",
        tipo_documento: "CC",
        password: hashedPassword,
        rol: "artesano",
        moodle_id: 101,
        foto: null,
        telefono: "+57 301 234 5678",
        biografia: "Maestra tejedora de sombreros vueltiaos tradicionales.",
        especialidad: "Tejido en Caña Flecha",
        ubicacion: "Sampués, Sucre",
        created_at: new Date(),
      });
      memoryDb.users.push({
        id: memoryDb.nextUserId++,
        nombre: "Carlos Comprador",
        email: "carlos@cliente.com",
        identificacion: "1098765432",
        tipo_documento: "CC",
        password: hashedPassword,
        rol: "comprador",
        moodle_id: null,
        foto: null,
        telefono: "+57 312 987 6543",
        biografia: "Amante de las artesanías y coleccionista.",
        especialidad: "",
        ubicacion: "Bogotá, Colombia",
        created_at: new Date(),
      });
    }
  }
};
