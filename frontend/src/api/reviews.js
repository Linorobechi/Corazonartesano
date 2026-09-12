import { apiClient, parseResponse } from "./client.js";

export const getProductReviews = async (productId) => {
  const response = await apiClient(`/api/products/${productId}/reviews`);
  return parseResponse(response);
};

export const addProductReview = async (productId, reviewData) => {
  const response = await apiClient(`/api/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
  return parseResponse(response);
};

export const getRecentReviews = async () => {
  const response = await apiClient("/api/reviews/recent");
  return parseResponse(response);
};
