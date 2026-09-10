const API_URL = import.meta.env.VITE_API_URL || "";

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Error en la autenticación");
  }

  return data;
};

const safeFetch = async (endpoint, options = {}) => {
  let url = API_URL ? `${API_URL}${endpoint}` : endpoint;
  let response;
  try {
    response = await fetch(url, options);
    if (!response.ok && API_URL && url !== endpoint) {
      const localResponse = await fetch(endpoint, options);
      if (localResponse.ok) {
        response = localResponse;
      }
    }
  } catch (err) {
    if (url !== endpoint) {
      response = await fetch(endpoint, options);
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

export const forgotPassword = async (email) => {
  const response = await safeFetch("/api/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
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