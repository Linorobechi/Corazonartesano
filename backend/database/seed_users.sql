-- ==============================================================================
-- CORAZÓN ARTESANO - SCRIPT DE POBLACIÓN DE USUARIOS ACTUALES
-- Proyecto: Supabase PostgreSQL
-- Contraseña para todos los usuarios de prueba: admin123
-- Hash Bcrypt generado y verificado: $2b$10$Ivi2fNQEeHqEZa1259JpfOl.jIamTCFe4Up3SQzbAsALHo6nXVPXu
-- ==============================================================================

-- 1. Insertar / Actualizar Usuarios del Sistema
INSERT INTO users (
  id, 
  nombre, 
  email, 
  identificacion, 
  tipo_documento, 
  password, 
  rol, 
  moodle_id, 
  telefono, 
  biografia, 
  especialidad, 
  ubicacion
)
VALUES 
  -- 1. Administrador Principal (Control total de la plataforma)
  (
    1,
    'Administrador Principal',
    'admin@corazonartesano.com',
    '1000000000',
    'CC',
    '$2b$10$Ivi2fNQEeHqEZa1259JpfOl.jIamTCFe4Up3SQzbAsALHo6nXVPXu',
    'admin',
    1,
    '+57 300 000 0000',
    'Administrador general de la plataforma Corazón Artesano.',
    'Gestión de Plataforma',
    'Sincelejo, Sucre'
  ),

  -- 2. Artesana Creadora 1: María Contreras
  (
    2,
    'María Contreras',
    'maria@artesana.com',
    '1065123456',
    'CC',
    '$2b$10$Ivi2fNQEeHqEZa1259JpfOl.jIamTCFe4Up3SQzbAsALHo6nXVPXu',
    'artesano',
    101,
    '+57 301 234 5678',
    'Maestra tejedora de sombreros vueltiaos tradicionales con caña flecha auténtica.',
    'Tejido en Caña Flecha',
    'Sampués, Sucre'
  ),

  -- 3. Comprador / Cliente: Carlos Comprador
  (
    3,
    'Carlos Comprador',
    'carlos@cliente.com',
    '1098765432',
    'CC',
    '$2b$10$Ivi2fNQEeHqEZa1259JpfOl.jIamTCFe4Up3SQzbAsALHo6nXVPXu',
    'comprador',
    NULL,
    '+57 312 987 6543',
    'Amante y coleccionista de piezas artesanales colombianas.',
    NULL,
    'Bogotá, Colombia'
  ),

  -- 4. Artesana Creadora 2: Carmen López
  (
    4,
    'Carmen López',
    'carmen@artesana.com',
    '1065987654',
    'CC',
    '$2b$10$Ivi2fNQEeHqEZa1259JpfOl.jIamTCFe4Up3SQzbAsALHo6nXVPXu',
    'artesano',
    102,
    '+57 310 555 4321',
    'Artesana especialista en accesorios y collares de mostacilla con tintes vegetales.',
    'Bisutería y Tintes Naturales',
    'Sincelejo, Sucre'
  ),

  -- 5. Artesano Creador 3: José Martínez
  (
    5,
    'José Martínez',
    'jose@artesano.com',
    '1065112233',
    'CC',
    '$2b$10$Ivi2fNQEeHqEZa1259JpfOl.jIamTCFe4Up3SQzbAsALHo6nXVPXu',
    'artesano',
    103,
    '+57 315 777 8899',
    'Tejedor de mochilas tradicionales con patrones geométricos ancestrales.',
    'Tejeduría Ancestral',
    'La Guajira, Colombia'
  )

ON CONFLICT (email) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  identificacion = EXCLUDED.identificacion,
  tipo_documento = EXCLUDED.tipo_documento,
  password = EXCLUDED.password,
  rol = EXCLUDED.rol,
  moodle_id = EXCLUDED.moodle_id,
  telefono = EXCLUDED.telefono,
  biografia = EXCLUDED.biografia,
  especialidad = EXCLUDED.especialidad,
  ubicacion = EXCLUDED.ubicacion;

-- 2. Vincular productos de ejemplo con sus autores artesanos
UPDATE products SET author_user_id = 2 WHERE imagen_key = '1.jpeg';
UPDATE products SET author_user_id = 4 WHERE imagen_key = '2.jpeg';
UPDATE products SET author_user_id = 5 WHERE imagen_key = '3.jpeg';

-- 3. Sincronizar el correlativo (secuencia) para que los nuevos registros inicien desde el ID 6 en adelante
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
