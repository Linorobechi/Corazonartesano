const API_URL = import.meta.env.VITE_API_URL || "https://corazonartesano.onrender.com";

const parseResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error en la autenticación");
  }

  return data;
};

export const registerUser = async (payload) => {
  const response = await fetch(`${API_URL}/api/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const loginUser = async (payload) => {
  const response = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const forgotPassword = async (email) => {
  const response = await fetch(`${API_URL}/api/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  return parseResponse(response);
};

export const resetPassword = async (token, password) => {
  const response = await fetch(`${API_URL}/api/reset-password`, {
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
  let response;
  try {
    response = await fetch(`${API_URL}/api/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    response = await fetch("/api/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return parseResponse(response);
};

export const updateUserProfile = async (formData) => {
  const token = localStorage.getItem("auth_token");
  let response;
  try {
    response = await fetch(`${API_URL}/api/user/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch {
    response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  }
  return parseResponse(response);
};