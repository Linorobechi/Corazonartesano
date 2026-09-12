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

export const initiateWompiPayment = async (orderPayload) => {
  const response = await apiClient("/api/wompi/initiate", {
    method: "POST",
    body: JSON.stringify(orderPayload),
  });
  return parseResponse(response);
};

export const verifyWompiPayment = async (transactionId) => {
  const response = await apiClient(`/api/wompi/verify/${transactionId}`);
  return parseResponse(response);
};

