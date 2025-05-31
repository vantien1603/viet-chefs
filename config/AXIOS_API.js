import axios from "axios";
import { useContext, useMemo } from "react";
import { AuthContext } from "./AuthContext";
import { useGlobalModal } from "../context/modalContext";
import { NetworkContext } from "../hooks/networkProvider";
import { useModalLogin } from "../context/modalLoginContext";

const useAxios = () => {
    const { user, logoutNoDirect, logout } = useContext(AuthContext);
    const { isConnected } = useContext(NetworkContext);
    const { showModal } = useGlobalModal();
    const { showModalLogin } = useModalLogin();
    const AXIOS_API = useMemo(() => {
        const instance = axios.create({
            baseURL: "https://vietchef-api.myddns.me/api/v1",
            headers: {
                "Content-Type": "application/json",
            },
        });

        instance.interceptors.request.use(
            async (config) => {
                if (!isConnected) {
                    showModal(
                        "Lỗi kết nối mạng",
                        "Không thể kết nối với internet. Vui lòng kiểm tra lại kết nối và khởi động lại ứng dụng."
                    );
                    throw new axios.Cancel("Không có mạng");
                }
                // console.log("token to fetch", user?.token);

                if (user?.token) {
                    config.headers.Authorization = `Bearer ${user?.token}`;
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    if (user?.roleName === "ROLE_CHEF") {
                        logout?.();
                        showModalLogin("Phiên đăng nhập đã hết hạn", "Vui lòng đăng nhập lại để tiếp tục.");
                    } else {
                        logoutNoDirect?.();
                        showModalLogin("Phiên đăng nhập đã hết hạn", "Vui lòng đăng nhập lại để tiếp tục.", true);
                    }
                }
                return Promise.reject(error);
            }
        );

        return instance;
    }, [user?.token, isConnected]);

    return AXIOS_API;
};

export default useAxios;
