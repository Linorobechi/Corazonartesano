-- ==============================================================================
-- CORAZÓN ARTESANO - ESQUEMA DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
-- Proyecto Supabase: https://nuhsooerkqwuwcucwxcf.supabase.co
-- Instrucciones: Copia y pega este contenido en el SQL Editor de tu panel de Supabase y presiona RUN.
-- ==============================================================================

-- 1. Habilitar extensión para UUID (si se requiere)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: USERS (Usuarios, Compradores, Artesanos y Administradores)
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

-- 3. TABLA: PASSWORD_RESETS (Tokens temporales de recuperación de clave)
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  email VARCHAR(180) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA: PRODUCTS (Catálogo de artesanías)
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

-- 5. TABLA: ORDERS (Compras y pagos procesados)
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

-- 6. TABLA: ORDER_ITEMS (Detalle de productos por orden)
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NULL REFERENCES products(id) ON DELETE SET NULL,
  nombre VARCHAR(180) NOT NULL,
  cantidad INT NOT NULL,
  precio NUMERIC(10,2) NOT NULL
);

-- 7. TABLA: CARTS (Carrito persistente por usuario)
CREATE TABLE IF NOT EXISTS carts (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA: REVIEWS (Opiniones y valoraciones por estrellas)
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(120) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 8. ÍNDICES DE RENDIMIENTO Y BÚSQUEDA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_identificacion ON users(identificacion);
CREATE INDEX IF NOT EXISTS idx_products_destacado ON products(destacado);
CREATE INDEX IF NOT EXISTS idx_products_author_user_id ON products(author_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_product_user_unique ON reviews(product_id, user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ==============================================================================
-- 9. SUPABASE STORAGE (BUCKETS PÚBLICOS Y POLÍTICAS DE ACCESO)
-- ==============================================================================

-- Crear buckets públicos 'productos' y 'avatars'
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true), ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de lectura pública para que las imágenes carguen al instante desde la CDN
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Productos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public Access Productos" ON storage.objects FOR SELECT USING (bucket_id = 'productos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Avatars' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow Uploads Productos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow Uploads Productos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'productos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow Uploads Avatars' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow Uploads Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
  END IF;
END $$;
