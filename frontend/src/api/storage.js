import { supabase } from "../config/supabase.js";

/**
 * Sube una imagen directamente desde el Frontend a Supabase Storage y retorna su URL CDN pública
 * @param {File} file - Archivo seleccionado por el usuario en el input file
 * @param {string} bucket - Nombre del bucket ('productos' | 'avatars')
 * @returns {Promise<string|null>} URL pública CDN
 */
export const uploadImageDirectlyToSupabase = async (file, bucket = "productos") => {
  if (!file) return null;
  if (!supabase) {
    console.warn("⚠️ Supabase no configurado en Frontend; se usará la subida vía API FormData.");
    return null;
  }

  try {
    const fileExt = file.name.split(".").pop();
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { error } = await supabase.storage.from(bucket).upload(safeName, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      console.warn("Error en subida directa a Supabase Storage:", error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(safeName);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn("Excepción en subida directa:", err.message);
    return null;
  }
};
