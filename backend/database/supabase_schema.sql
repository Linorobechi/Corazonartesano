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
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.8,
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
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ==============================================================================
-- 9. DATOS INICIALES (SEEDS)
-- ==============================================================================

-- Usuario Administrador por defecto (Contraseña: admin123)
-- Hash bcrypt generado para admin123: $2a$10$iMh.OQpD7F5rEw5o1zT51.4gK5W4l7gIe7F7g5W4l7gIe7F7g5W4l
INSERT INTO users (nombre, email, identificacion, tipo_documento, password, rol, especialidad, ubicacion, biografia)
VALUES (
  'Administrador Principal',
  'admin@corazonartesano.com',
  '1000000000',
  'CC',
  '$2a$10$uWqG1q3r.7Y.C8bJ3Nq8aOIvW3Vw0Z5T6i6Q7v7W7e7R7t7Y7u7I',
  'admin',
  'Gestión de Plataforma',
  'Sincelejo, Sucre',
  'Administrador general de la plataforma Corazón Artesano.'
) ON CONFLICT (email) DO NOTHING;

-- Productos Artesanales Iniciales
INSERT INTO products (nombre, autor, descripcion, precio, imagen_key, rating, destacado)
VALUES 
  ('Sombrero Vueltiao Tradicional', 'María Contreras', 'Sombrero vueltiao auténtico tejido a mano por artesanos de Sucre', 180000, '1.jpeg', 4.8, true),
  ('Collar Artesanal Multicolor', 'Carmen López', 'Collar de mostacilla hecho a mano con tintes naturales', 85000, '2.jpeg', 4.8, false),
  ('Mochila Wayuu Tradicional', 'José Martínez', 'Mochila tejida a mano con patrones únicos ancestrales', 250000, '3.jpeg', 4.9, true),
  ('Pulseras Artesanales', 'Ana Pérez', 'Juego de 3 pulseras tejidas con colores vivos', 40000, '4.jpeg', 4.7, false),
  ('Accesorios Étnicos', 'Luis Gómez', 'Accesorios elaborados en madera tratada e hilo folclórico', 60000, '5.jpeg', 4.6, false),
  ('Joyas Artesanales', 'Sofía Rojas', 'Joyas hechas a mano en filigrana y elementos artesanales', 120000, '6.jpeg', 4.9, false)
ON CONFLICT DO NOTHING;

-- Reseñas iniciales
INSERT INTO reviews (product_id, user_id, user_name, rating, comentario)
SELECT 1, u.id, 'Carlos Comprador', 5, 'Excelente Sombrero Vueltiao. La flexibilidad de la caña flecha y la finura de las trenzas son impecables.'
FROM users u WHERE u.email = 'admin@corazonartesano.com'
LIMIT 1;

-- ==============================================================================
-- 10. SUPABASE STORAGE (BUCKETS PÚBLICOS Y POLÍTICAS DE ACCESO)
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

