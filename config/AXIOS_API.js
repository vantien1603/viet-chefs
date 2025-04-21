import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useGlobalModal } from "../context/modalContext";
import { NetworkContext } from "../hooks/networkProvider";

const useAxios = () => {
    const { user } = useContext(AuthContext);
    const { isConnected } = useContext(NetworkContext);
    const { showModal } = useGlobalModal();

    const AXIOS_API = axios.create({
        baseURL: "http://35.240.147.10/api/v1",
        headers: {
            "Content-Type": "application/json",
            ...(user?.token ? { Authorization: `Bearer ${user?.token}` } : {}),
        },
    });

    AXIOS_API.interceptors.request.use(
        async (config) => {
            if (!isConnected) {
                showModal("Lỗi kết nối mạng", "Không thể kết nối với internet. Vui lòng kiểm tra lại kết nối và khởi động lại ứng dụng.");
                throw new axios.Cancel("Không có mạng");
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    return AXIOS_API;
};

export default useAxios;
