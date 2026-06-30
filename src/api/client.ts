import { AxiosError, AxiosHeaders, create, isAxiosError, type AxiosResponse } from "axios";
import { clearStoredAuth, getStoredAccessToken } from "./token-storage";
import type { ApiEnvelope } from "../types/auth";

const fallbackApiUrl = "http://localhost:3000/api/v1";

export const apiClient = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? fallbackApiUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredAccessToken();

  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearStoredAuth();
    }

    return Promise.reject(error);
  }
);

export function unwrapResponse<T>(response: AxiosResponse<ApiEnvelope<T> | T>): T {
  const body = response.data;

  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiEnvelope<T>).data;
  }

  return body as T;
}

export function getApiErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join("\n");
    }

    if (typeof message === "string") {
      return message;
    }

    if (message && typeof message === "object" && "message" in message) {
      return String(message.message);
    }

    if (error.code === "ECONNABORTED") {
      return "The request timed out. Check that the LCMP API is running.";
    }
  }

  return "Unable to complete the request. Please try again.";
}
