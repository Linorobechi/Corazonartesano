const RAW_API_URL = (import.meta.env.VITE_API_URL || "").trim();
const DEFAULT_BACKEND_URL = "https://corazon-artesano-backend.onrender.com";

const API_URL = RAW_API_URL
  ? RAW_API_URL.startsWith("http")
    ? RAW_API_URL
    : `https://${RAW_API_URL}`
  : DEFAULT_BACKEND_URL;

/**
 * Cliente HTTP unificado para Corazón Artesano.
 * Maneja cabeceras de autorización, detección de entorno y fallbacks de producción.
 */
export const apiClient = async (endpoint, options = {}) => {
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  // En entorno local usa la ruta relativa del proxy de Vite; en producción usa la URL directa del backend en Render
  const primaryUrl = isLocal ? endpoint : `${API_URL}${endpoint}`;

  // Solo en local se intenta fallback hacia la URL absoluta si falla el proxy
  const fallbackUrl = isLocal && API_URL ? `${API_URL}${endpoint}` : null;

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(primaryUrl, fetchOptions);
    if (!response.ok && fallbackUrl && response.status >= 500) {
      try {
        const altResponse = await fetch(fallbackUrl, fetchOptions);
        if (altResponse.ok) return altResponse;
      } catch {
        // Ignorar fallo de red secundario
      }
    }
  } catch (err) {
    if (fallbackUrl) {
      response = await fetch(fallbackUrl, fetchOptions);
    } else {
      throw new Error(
        "No se pudo comunicar con el servidor en la nube. Si el backend de Render estaba suspendido, puede tardar unos 30 segundos en despertar. Por favor intenta nuevamente."
      );
    }
  }

  return response;
};

/**
 * Helper para parsear la respuesta JSON y arrojar error descriptivo si !ok
 */
export const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || `Error en la petición (Código ${response.status})`;
    throw new Error(errorMsg);
  }
  return data;
};
