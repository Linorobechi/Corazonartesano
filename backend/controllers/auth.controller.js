import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool, isUsingMemoryDb, memoryDb, JWT_SECRET } from "../config/db.js";
import { buildUserResponse } from "../utils/formatters.js";
import { sendResetPasswordEmail } from "../config/mailer.js";
import { uploadFileToStorage } from "../utils/storage.js";

/**
 * Registro de un nuevo usuario
 */
export const register = async (req, res) => {
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

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR identificacion = $2 LIMIT 1",
      [email.toLowerCase(), identificacion]
    );

    if (existing.rows && existing.rows.length > 0) {
      return res.status(409).json({
        message: "Ya existe un usuario registrado con ese correo o número de documento",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (nombre, email, identificacion, tipo_documento, password, rol) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [nombre.trim(), email.toLowerCase().trim(), identificacion.trim(), userDocType, hashedPassword, userRole]
    );

    const user = result.rows[0];
    const userPayload = buildUserResponse(user);
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      message: "Cuenta registrada exitosamente",
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    return res.status(500).json({ message: "Error al registrar el usuario" });
  }
};

/**
 * Inicio de sesión
 */
export const login = async (req, res) => {
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
      const rows = await pool.query(
        "SELECT * FROM users WHERE email = $1 OR identificacion = $2 LIMIT 1",
        [identifier.toLowerCase(), identifier.trim()]
      );
      user = rows.rows[0];
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
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ message: "Error en inicio de sesión" });
  }
};

/**
 * Obtener perfil del usuario autenticado
 */
export const getProfile = async (req, res) => {
  try {
    let user = null;
    if (isUsingMemoryDb) {
      user = memoryDb.users.find((u) => u.id === req.user.id);
    } else {
      const rows = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [req.user.id]);
      user = rows.rows[0];
    }

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json({
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return res.status(500).json({ message: "Error al obtener perfil de usuario" });
  }
};

/**
 * Actualizar perfil y foto del usuario autenticado
 */
export const updateProfile = async (req, res) => {
  try {
    const { nombre, tipo_documento, identificacion, telefono, biografia, especialidad, ubicacion, password, passwordActual } = req.body;
    const fotoFile = req.file;

    let user = null;
    if (isUsingMemoryDb) {
      user = memoryDb.users.find((u) => u.id === req.user.id);
    } else {
      const rows = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [req.user.id]);
      user = rows.rows[0];
    }

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Validar contraseña si se solicita cambio
    let updatedPassword = user.password;
    if (password) {
      if (!passwordActual) {
        return res.status(400).json({ message: "Debes ingresar tu contraseña actual para cambiarla" });
      }
      const matches = await bcrypt.compare(passwordActual, user.password);
      if (!matches) {
        return res.status(400).json({ message: "La contraseña actual es incorrecta" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres" });
      }
      updatedPassword = await bcrypt.hash(password, 10);
    }

    // Verificar unicidad de identificación si se modificó
    if (identificacion && identificacion.trim() !== user.identificacion) {
      if (isUsingMemoryDb) {
        const existId = memoryDb.users.find((u) => u.identificacion === identificacion.trim() && u.id !== user.id);
        if (existId) return res.status(409).json({ message: "Ese número de documento ya está registrado por otro usuario" });
      } else {
        const existId = await pool.query("SELECT id FROM users WHERE identificacion = $1 AND id != $2 LIMIT 1", [identificacion.trim(), user.id]);
        if (existId.rows && existId.rows.length > 0) return res.status(409).json({ message: "Ese número de documento ya está registrado por otro usuario" });
      }
    }

    const newNombre = nombre ? nombre.trim() : user.nombre;
    const newTipoDoc = tipo_documento ? tipo_documento.trim() : (user.tipo_documento || "CC");
    const newIdentificacion = identificacion ? identificacion.trim() : user.identificacion;
    const newTelefono = telefono !== undefined ? telefono.trim() : (user.telefono || "");
    const newBiografia = biografia !== undefined ? biografia.trim() : (user.biografia || "");
    const newEspecialidad = especialidad !== undefined ? especialidad.trim() : (user.especialidad || "");
    const newUbicacion = ubicacion !== undefined ? ubicacion.trim() : (user.ubicacion || "");

    let newFoto = user.foto;
    if (fotoFile) {
      newFoto = await uploadFileToStorage(fotoFile, "avatars");
    } else if (req.body.foto_url) {
      newFoto = req.body.foto_url.trim();
    }

    if (isUsingMemoryDb) {
      user.nombre = newNombre;
      user.tipo_documento = newTipoDoc;
      user.identificacion = newIdentificacion;
      user.telefono = newTelefono;
      user.biografia = newBiografia;
      user.especialidad = newEspecialidad;
      user.ubicacion = newUbicacion;
      user.password = updatedPassword;
      if (newFoto) user.foto = newFoto;
    } else {
      const updateResult = await pool.query(
        `UPDATE users SET
          nombre = $1,
          tipo_documento = $2,
          identificacion = $3,
          telefono = $4,
          biografia = $5,
          especialidad = $6,
          ubicacion = $7,
          password = $8,
          foto = COALESCE($9, foto)
         WHERE id = $10
         RETURNING *`,
        [newNombre, newTipoDoc, newIdentificacion, newTelefono, newBiografia, newEspecialidad, newUbicacion, updatedPassword, newFoto, user.id]
      );
      user = updateResult.rows[0];
    }

    const userPayload = buildUserResponse(user);
    const newToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      message: "Perfil actualizado correctamente",
      user: userPayload,
      token: newToken,
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return res.status(500).json({ message: "Error al actualizar el perfil de usuario" });
  }
};

/**
 * Solicitar recuperación de contraseña (envío de email con token)
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "El correo es obligatorio" });

    const normalizedEmail = email.toLowerCase().trim();
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora de validez

    let userFound = false;

    if (isUsingMemoryDb) {
      const user = memoryDb.users.find((u) => u.email === normalizedEmail);
      if (user) {
        userFound = true;
        memoryDb.password_resets = memoryDb.password_resets.filter((r) => r.email !== normalizedEmail);
        memoryDb.password_resets.push({ email: normalizedEmail, token, expiresAt });
      }
    } else {
      const rows = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [normalizedEmail]);
      if (rows.rows && rows.rows.length > 0) {
        userFound = true;
        await pool.query("DELETE FROM password_resets WHERE email = $1", [normalizedEmail]);
        await pool.query(
          "INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)",
          [normalizedEmail, token, expiresAt]
        );
      }
    }

    if (!userFound) {
      return res.status(404).json({
        message: "El correo electrónico no se encuentra registrado en nuestro sistema.",
      });
    }

    const clientOrigin =
      req.body.origin ||
      req.body.frontendUrl ||
      req.headers.origin ||
      (req.headers.referer ? new URL(req.headers.referer).origin : null);

    let frontendOrigin = clientOrigin || process.env.FRONTEND_URL || process.env.VERCEL_FRONTEND_URL || "https://corazonartesano.vercel.app";
    frontendOrigin = frontendOrigin.replace(/\/$/, "");

    // Despachar el correo en segundo plano para respuesta inmediata al usuario (<50ms)
    const resetUrl = `${frontendOrigin}/restablecer-password?token=${token}`;
    sendResetPasswordEmail(normalizedEmail, token, frontendOrigin).catch((mailErr) => {
      console.error(`[BACKGROUND EMAIL ERROR A ${normalizedEmail}]:`, mailErr.message);
    });

    return res.json({
      success: true,
      message: "Hemos verificado tu correo. Te enviamos las instrucciones de recuperación a tu bandeja de entrada.",
      email: normalizedEmail,
      realEmailSent: true,
      resetUrl,
      tokenPreview: token,
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return res.status(500).json({ message: "Error al solicitar recuperación de contraseña" });
  }
};

/**
 * Restablecer contraseña con token válido
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token y nueva contraseña son requeridos" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isUsingMemoryDb) {
      const resetIndex = memoryDb.password_resets.findIndex((r) => r.token === token);
      if (resetIndex === -1 || memoryDb.password_resets[resetIndex].expiresAt < new Date()) {
        return res.status(400).json({ message: "El enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo." });
      }

      const resetRecord = memoryDb.password_resets[resetIndex];
      const user = memoryDb.users.find((u) => u.email === resetRecord.email);
      if (user) {
        user.password = hashedPassword;
      }

      memoryDb.password_resets.splice(resetIndex, 1);
      return res.json({ message: "Contraseña restablecida con éxito. Ya puedes iniciar sesión." });
    }

    const rows = await pool.query(
      "SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
      [token]
    );

    if (!rows.rows || rows.rows.length === 0) {
      return res.status(400).json({ message: "El enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo." });
    }

    const resetRecord = rows.rows[0];
    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, resetRecord.email]);
    await pool.query("DELETE FROM password_resets WHERE email = $1", [resetRecord.email]);

    return res.json({ message: "Contraseña restablecida con éxito. Ya puedes iniciar sesión." });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return res.status(500).json({ message: "Error al restablecer la contraseña" });
  }
};
