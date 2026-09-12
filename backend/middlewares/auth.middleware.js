import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/db.js";

/**
 * Middleware para validar token de autorización JWT
 */
export const authMiddleware = (req, res, next) => {
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

/**
 * Middleware de autenticación opcional: adjunta req.user si el token es válido, pero no bloquea si falta.
 */
export const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (_error) {
    // Token inválido o expirado, se continúa como invitado
  }
  return next();
};

/**
 * Middleware para control de acceso basado en roles (RBAC)
 * @param {string[]} allowedRoles - Lista de roles permitidos (ej. ['artesano', 'admin'])
 */
export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }
  const userRole = req.user.rol || "comprador";
  if (!allowedRoles.includes(userRole) && userRole !== "admin") {
    return res.status(403).json({ message: "Acceso denegado: rol no autorizado para esta acción" });
  }
  next();
};
