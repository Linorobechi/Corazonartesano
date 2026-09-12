const API_URL = import.meta.env.VITE_API_URL || "";

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Error en la autenticación");
  }

  return data;
};

const safeFetch = async (endpoint, options = {}) => {
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  let primaryUrl = endpoint;
  let fallbackUrl = null;

  if (isLocal) {
    // En entorno de desarrollo local, usar el proxy de Vite (/api) primero
    primaryUrl = endpoint;
    fallbackUrl = API_URL ? `${API_URL}${endpoint}` : null;
  } else {
    // En producción (Vercel), usar el backend configurado en API_URL
    primaryUrl = API_URL ? `${API_URL}${endpoint}` : endpoint;
    fallbackUrl = API_URL ? endpoint : null;
  }

  let response;
  try {
    response = await fetch(primaryUrl, options);
    if (!response.ok && fallbackUrl && response.status >= 500) {
      try {
        const altResponse = await fetch(fallbackUrl, options);
        if (altResponse.ok) return altResponse;
      } catch {
        // Ignorar error de red secundario
      }
    }
  } catch (err) {
    if (fallbackUrl) {
      response = await fetch(fallbackUrl, options);
    } else {
      throw err;
    }
  }
  return response;
};

export const registerUser = async (payload) => {
  const response = await safeFetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const loginUser = async (payload) => {
  const response = await safeFetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const forgotPassword = async (email, origin) => {
  const clientOrigin =
    origin ||
    (typeof window !== "undefined" && window.location ? window.location.origin : undefined);

  const response = await safeFetch("/api/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, origin: clientOrigin }),
  });

  return parseResponse(response);
};

export const resetPassword = async (token, password) => {
  const response = await safeFetch("/api/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });

  return parseResponse(response);
};

export const getUserProfile = async () => {
  const token = localStorage.getItem("auth_token");
  const response = await safeFetch("/api/user/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
};

export const updateUserProfile = async (formData) => {
  const token = localStorage.getItem("auth_token");
  const response = await safeFetch("/api/user/profile", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return parseResponse(response);
};