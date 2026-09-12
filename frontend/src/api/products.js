import { apiClient, parseResponse } from "./client.js";

export const getProducts = async () => {
  const response = await apiClient("/api/products");
  return parseResponse(response);
};

export const createProduct = async (formData) => {
  const response = await apiClient("/api/products", {
    method: "POST",
    body: formData,
  });
  return parseResponse(response);
};

export const updateProduct = async (productId, formData) => {
  const response = await apiClient(`/api/products/${productId}`, {
    method: "PUT",
    body: formData,
  });
  return parseResponse(response);
};

export const deleteProduct = async (productId) => {
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
