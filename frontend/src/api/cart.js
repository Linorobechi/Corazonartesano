import { apiClient, parseResponse } from "./client.js";

export const getSavedCart = async () => parseResponse(await apiClient("/api/cart"));

export const saveCart = async (items) =>
  parseResponse(await apiClient("/api/cart", {
    method: "PUT",
    body: JSON.stringify({ items }),
  }));

export const clearSavedCart = async () =>
  parseResponse(await apiClient("/api/cart", { method: "DELETE" }));
