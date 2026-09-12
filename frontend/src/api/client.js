const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * Cliente HTTP unificado para Corazón Artesano.
 * Maneja cabeceras de autorización, detección de entorno y fallbacks.
 */
export const apiClient = async (endpoint, options = {}) => {
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const primaryUrl = isLocal
    ? endpoint
    : API_URL
      ? `${API_URL}${endpoint}`
      : endpoint;

  const fallbackUrl = isLocal
    ? API_URL
      ? `${API_URL}${endpoint}`
      : null
    : API_URL
      ? endpoint
      : null;


  const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers = new Headers(options.headers || {});

  // Si no se especifica Content-Type y no es FormData, usar application/json por defecto para peticiones con body
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
      throw err;
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
