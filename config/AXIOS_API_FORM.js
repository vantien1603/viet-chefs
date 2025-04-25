import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

// Hook to create and configure Axios instance
const useAxiosFormData = () => {
  const { user } = useContext(AuthContext);

  // Base configuration
  const config = {
    baseURL: "https://vietchef.ddns.net/api/v1",
    headers: {
      "Content-Type": "application/json",
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
    },
    timeout: 10000, // 10-second timeout
  };

  // Create Axios instance
  const axiosInstance = axios.create(config);

  // Retry logic for network errors
  const retryRequest = async (config, maxRetries = 2) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await axiosInstance(config);
      } catch (error) {
        if (attempt === maxRetries || !error.code || error.code !== "ECONNABORTED") {
          throw error;
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  // Request interceptor to handle FormData
  axiosInstance.interceptors.request.use(
    async (config) => {
      if (config.data instanceof FormData) {
        config.headers["Content-Type"] = "multipart/form-data";
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for retries
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.code === "ECONNABORTED" || error.message === "Network Error") {
        const originalRequest = error.config;
        return retryRequest(originalRequest);
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default useAxiosFormData;