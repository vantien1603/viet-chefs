import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useGlobalModal } from "../context/modalContext";
import { NetworkContext } from "../hooks/networkProvider";
import { useModalLogin } from "../context/modalLoginContext";

const useAxios = () => {
    const { user, logoutNoDirect, logout } = useContext(AuthContext);
    const { isConnected } = useContext(NetworkContext);
    const { showModal } = useGlobalModal();
    const { showModalLogin } = useModalLogin();

    const AXIOS_API = axios.create({
        baseURL: "https://vietchef.ddns.net/api/v1",
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

    AXIOS_API.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                if (user?.roleName === "ROLE_CHEF") {
                    showModalLogin("Phiên đăng nhập đã hết hạn", "Vui lòng đăng nhập lại để tiếp tục.");
                    logout?.();
                } else {
                    showModalLogin("Phiên đăng nhập đã hết hạn", "Vui lòng đăng nhập lại để tiếp tục.", true);
                    logoutNoDirect?.();
                }

            }
            return Promise.reject(error);
        }
    );

    return AXIOS_API;
};

export default useAxios;
