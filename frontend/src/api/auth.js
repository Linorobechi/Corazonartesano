import { apiClient, parseResponse } from "./client.js";

export const registerUser = async (payload) => {
  const response = await apiClient("/api/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

export const loginUser = async (payload) => {
  const response = await apiClient("/api/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

export const forgotPassword = async (email, origin) => {
  const clientOrigin =
    origin ||
    (typeof window !== "undefined" && window.location ? window.location.origin : undefined);

  const response = await apiClient("/api/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, origin: clientOrigin }),
  });
  return parseResponse(response);
};

export const resetPassword = async (token, password) => {
  const response = await apiClient("/api/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
  return parseResponse(response);
};

export const getUserProfile = async () => {
  const response = await apiClient("/api/user/profile");
  return parseResponse(response);
};

export const updateUserProfile = async (formData) => {
  const response = await apiClient("/api/user/profile", {
    method: "PUT",
    body: formData,
  });
  return parseResponse(response);
};