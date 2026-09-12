import fs from "fs";
import { supabase } from "../config/supabase.js";

/**
 * Sube un archivo a Supabase Storage y retorna su URL pública CDN.
 * Si falla o no hay conexión, retorna la ruta local de fallback (/uploads/filename).
 * 
 * @param {object} file - Objeto req.file de Multer
 * @param {string} bucket - Nombre del bucket ('productos' | 'avatars')
 * @returns {Promise<string>} URL pública de la imagen
 */
export const uploadFileToStorage = async (file, bucket = "productos") => {
  if (!file) return null;

  const localFallbackUrl = `/uploads/${file.filename}`;

  if (!supabase) {
    return localFallbackUrl;
  }

  try {
    const fileBuffer = fs.readFileSync(file.path);
    const safeName = `${Date.now()}-${file.originalname.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
    const contentType = file.mimetype || "image/jpeg";

    const { error } = await supabase.storage.from(bucket).upload(safeName, fileBuffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.warn(`⚠️ [SUPABASE STORAGE] Error subiendo a bucket ${bucket}:`, error.message);
      return localFallbackUrl;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(safeName);

    // Limpiar archivo temporal en disco local para ahorrar espacio
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch {
      // Ignorar error de limpieza
    }

    console.log(`✨ [SUPABASE STORAGE] Imagen subida exitosamente a CDN: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn("⚠️ [SUPABASE STORAGE] Excepción al procesar archivo:", err.message);
    return localFallbackUrl;
  }
};
