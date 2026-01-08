import axios, { AxiosRequestConfig } from "axios";
import { generateRistaJWT } from "./jwt";

/**
 * Custom Axios instance with Rista API authentication
 * Automatically injects x-api-key and x-api-token (JWT) headers
 */
export const ristaAxiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_RISTA_BASE_URL || "https://api.ristaapps.com/v1",
});

// Add request interceptor to inject auth headers
ristaAxiosInstance.interceptors.request.use(
  (config) => {
    const apiKey = process.env.NEXT_PUBLIC_RISTA_API_KEY;
    if (apiKey) {
      config.headers["x-api-key"] = apiKey;
      config.headers["x-api-token"] = generateRistaJWT();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  config: AxiosRequestConfig;
}

/**
 * Custom instance wrapper for Orval-generated API functions
 */
export const customInstance = <T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return ristaAxiosInstance.request<unknown, ApiResponse<T>>(config);
};
