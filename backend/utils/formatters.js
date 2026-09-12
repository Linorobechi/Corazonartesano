/**
 * Formatea un valor numérico a moneda colombiana (COP)
 * @param {number} value
 * @returns {string}
 */
export const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Normaliza y estructura los datos públicos de un usuario para respuesta API y JWT
 * @param {object} user
 * @returns {object}
 */
export const buildUserResponse = (user) => ({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  identificacion: user.identificacion,
  tipo_documento: user.tipo_documento || "CC",
  rol: user.rol || "comprador",
  moodle_id: user.moodle_id || null,
  foto: user.foto || null,
  telefono: user.telefono || "",
  biografia: user.biografia || "",
  especialidad: user.especialidad || "",
  ubicacion: user.ubicacion || "",
  created_at: user.created_at || null,
});
