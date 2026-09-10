const API_URL = import.meta.env.VITE_API_URL || "";

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Error en la operación administrativa");
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

const getAuthHeader = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getAdminStats = async () => {
  const response = await safeFetch("/api/admin/stats", {
    headers: getAuthHeader(),
  });
  return parseResponse(response);
};

export const getAdminUsers = async () => {
  const response = await safeFetch("/api/admin/users", {
    headers: getAuthHeader(),
  });
  return parseResponse(response);
};

export const updateUserRole = async (userId, newRole) => {
  const response = await safeFetch(`/api/admin/users/${userId}/role`, {
    method: "PUT",
    headers: getAuthHeader(),
    body: JSON.stringify({ rol: newRole }),
  });
  return parseResponse(response);
};

export const deleteUserAccount = async (userId) => {
  const response = await safeFetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  return parseResponse(response);
};

export const deleteProductAdmin = async (productId) => {
  const response = await safeFetch(`/api/products/${productId}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  return parseResponse(response);
};

export const toggleProductDestacado = async (productId, destacado) => {
  const response = await safeFetch(`/api/admin/products/${productId}/destacado`, {
    method: "PUT",
    headers: getAuthHeader(),
    body: JSON.stringify({ destacado }),
  });
  return parseResponse(response);
};
