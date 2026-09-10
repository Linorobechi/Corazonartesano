const API_URL = import.meta.env.VITE_API_URL || "https://corazonartesano.onrender.com";

const parseResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Error en la operación administrativa");
  }
  return data;
};

const getAuthHeader = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getAdminStats = async () => {
  let response;
  try {
    response = await fetch(`${API_URL}/api/admin/stats`, {
      headers: getAuthHeader(),
    });
  } catch {
    response = await fetch("/api/admin/stats", {
      headers: getAuthHeader(),
    });
  }
  return parseResponse(response);
};

export const getAdminUsers = async () => {
  let response;
  try {
    response = await fetch(`${API_URL}/api/admin/users`, {
      headers: getAuthHeader(),
    });
  } catch {
    response = await fetch("/api/admin/users", {
      headers: getAuthHeader(),
    });
  }
  return parseResponse(response);
};

export const updateUserRole = async (userId, newRole) => {
  let response;
  try {
    response = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify({ rol: newRole }),
    });
  } catch {
    response = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify({ rol: newRole }),
    });
  }
  return parseResponse(response);
};

export const deleteUserAccount = async (userId) => {
  let response;
  try {
    response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
  } catch {
    response = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
  }
  return parseResponse(response);
};

export const deleteProductAdmin = async (productId) => {
  let response;
  try {
    response = await fetch(`${API_URL}/api/products/${productId}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
  } catch {
    response = await fetch(`/api/products/${productId}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
  }
  return parseResponse(response);
};
