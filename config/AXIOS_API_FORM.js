import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import { NetworkContext } from "../hooks/networkProvider";
import { useModalLogin } from "../context/modalLoginContext";

const useAxiosFormData = () => {
  const { user, logoutNoDirect } = useContext(AuthContext);
  const { isConnected } = useContext(NetworkContext);
  const { showModalLogin } = useModalLogin();

  const config = {
    baseURL: "https://vietchef-api.ddns.net/api/v1",
    headers: {
      "Content-Type": "application/json",
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
    },
    timeout: 10000,
  };

  const axiosInstance = axios.create(config);

  const retryRequest = async (config, maxRetries = 2) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await axiosInstance(config);
      } catch (error) {
        if (attempt === maxRetries || !error.code || error.code !== "ECONNABORTED") {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  axiosInstance.interceptors.request.use(
    async (config) => {
      if (!isConnected) {
        showModal("Lỗi kết nối mạng", "Không thể kết nối với internet. Vui lòng kiểm tra lại kết nối và khởi động lại ứng dụng.");
        throw new axios.Cancel("Không có mạng");
      }

      if (config.data instanceof FormData) {
        config.headers["Content-Type"] = "multipart/form-data";
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.code === "ECONNABORTED" || error.message === "Network Error") {
        const originalRequest = error.config;
        return retryRequest(originalRequest);
      }
      if (error.response?.status === 401) {
        showModalLogin("Phiên đăng nhập đã hết hạn", "Vui lòng đăng nhập lại để tiếp tục.", true);
        logoutNoDirect?.();
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default useAxiosFormData;