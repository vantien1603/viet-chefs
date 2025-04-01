// import axios from 'axios';

// const config = {
//     // baseURL: "http://192.168.7.93:8080/no-auth", //Tro
//     // baseURL: "http://10.87.24.103:8080/no-auth", //NVH
//     baseURL: "http://192.168.100.10:8080/api/v1", //Crema
//     headers: {
//         "Content-Type": "application/json",
//     }
// }

// const AXIOS_API = axios.create(config);
// export default AXIOS_API;
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

const useAxios = () => {
    const { user } = useContext(AuthContext);
    // console.log("tokem",user?.token);
    const AXIOS_API = axios.create({
        baseURL: "http://192.168.100.10:8080/api/v1",
        // baseURL: "http://192.168.1.52:8080/api/v1",
        headers: {
            "Content-Type": "application/json",
            ...(user?.token ? { Authorization: `Bearer ${user?.token}` } : {}),
        },
    });

    return AXIOS_API;
};

export default useAxios;
