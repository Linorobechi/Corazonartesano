import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

process.env.DOTENV_CONFIG_QUIET = "true";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
dotenv.config({ quiet: true });

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
  carts: [],
  order_items: [],
  reviews: [],
  password_resets: [],
  nextUserId: 1,
  nextProductId: 1,
  nextOrderId: 1,
  nextReviewId: 1,
};

/*const seedProducts = [
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
];*/

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
            image_gallery TEXT[] NOT NULL DEFAULT '{}',
            colores TEXT[] NOT NULL DEFAULT '{}',
            destacado BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          ALTER TABLE products ADD COLUMN IF NOT EXISTS colores TEXT[] NOT NULL DEFAULT '{}';
          ALTER TABLE products ADD COLUMN IF NOT EXISTS image_gallery TEXT[] NOT NULL DEFAULT '{}';
          CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            total NUMERIC(10,2) NOT NULL,
            subtotal NUMERIC(10,2) NOT NULL,
            tax NUMERIC(10,2) NOT NULL,
            shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
            payment_method VARCHAR(50) NOT NULL,
            status VARCHAR(30) NOT NULL,
            fulfillment_status VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
            tracking_number VARCHAR(120),
            transaction_id VARCHAR(100) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(120);

          CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id INT NULL REFERENCES products(id) ON DELETE SET NULL,
            nombre VARCHAR(180) NOT NULL,
            cantidad INT NOT NULL,
            precio NUMERIC(10,2) NOT NULL
          );

          CREATE TABLE IF NOT EXISTS carts (
            user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            items JSONB NOT NULL DEFAULT '[]',
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

          CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_product_user_unique
            ON reviews(product_id, user_id);
        `);

        console.log("✅ [DB] Conectado exitosamente a Supabase PostgreSQL");
      } finally {
        client.release();
      }
    } catch (error) {
      console.warn("⚠️ [DB] No se pudo conectar a Supabase PostgreSQL. Activando base de datos en memoria para desarrollo:", error.message);
      isUsingMemoryDb = true;
    }
  }

};
