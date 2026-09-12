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
