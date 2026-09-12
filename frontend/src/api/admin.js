import { apiClient, parseResponse } from "./client.js";

export const getAdminStats = async () => {
  const response = await apiClient("/api/admin/stats");
  return parseResponse(response);
};

export const getAdminUsers = async () => {
  const response = await apiClient("/api/admin/users");
  return parseResponse(response);
};

export const updateUserRole = async (userId, newRole) => {
  const response = await apiClient(`/api/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ rol: newRole }),
  });
  return parseResponse(response);
};

export const deleteUserAccount = async (userId) => {
  const response = await apiClient(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
  return parseResponse(response);
};

export const deleteProductAdmin = async (productId) => {
  const response = await apiClient(`/api/products/${productId}`, {
    method: "DELETE",
  });
  return parseResponse(response);
};

export const toggleProductDestacado = async (productId, destacado) => {
  const response = await apiClient(`/api/admin/products/${productId}/destacado`, {
    method: "PUT",
    body: JSON.stringify({ destacado }),
  });
  return parseResponse(response);
};
