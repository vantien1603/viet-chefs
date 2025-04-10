
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

const useAxios = () => {
    const { user } = useContext(AuthContext);
    // console.log("tokem",user?.token);
    const AXIOS_API = axios.create({
        baseURL: "http://35.240.147.10/api/v1",
        // baseURL: "http://192.168.1.52:8080/api/v1",
        headers: {
            "Content-Type": "application/json",
            ...(user?.token ? { Authorization: `Bearer ${user?.token}` } : {}),
        },
    });

    return AXIOS_API;
};

export default useAxios;

// AXIOS_API.interceptors.request.use(
//     async (config) => {
//         const token = await AsyncStorage.getItem('@token');
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
        
//         if (config.data instanceof FormData) {
//             config.headers["Content-Type"] = "multipart/form-data";
//         }
        
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

// export default AXIOS_API;