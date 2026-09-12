import { apiClient, parseResponse } from "./client.js";

export const checkoutOrder = async (orderPayload) => {
  const response = await apiClient("/api/checkout", {
    method: "POST",
    body: JSON.stringify(orderPayload),
  });
  return parseResponse(response);
};

export const getUserOrders = async () => {
  const response = await apiClient("/api/orders");
  return parseResponse(response);
};

export const createMercadoPagoPreference = async (items) => {
  const response = await apiClient("/api/mercadopago/create-preference", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  return parseResponse(response);
};

export const getMercadoPagoStatus = async (paymentId) => {
  const response = await apiClient(`/api/mercadopago/status/${paymentId}`);
  return parseResponse(response);
};
