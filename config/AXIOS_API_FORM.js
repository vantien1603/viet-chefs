import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

const useAxiosFormData = () => {
    const { user } = useContext(AuthContext);

    const config = {
        baseURL: "http://35.240.147.10/api/v1",
        headers: {
            "Content-Type": "application/json",
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        timeout: 1000,
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
            return Promise.reject(error);
        }
    );

    return axiosInstance;
};

export default useAxiosFormData;