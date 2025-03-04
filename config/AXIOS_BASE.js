import axios from 'axios';

const config = {
    // baseURL: "http://192.168.7.93:8080/no-auth", //Tro
    // baseURL: "http://10.87.24.103:8080/no-auth", //NVH
    baseURL: "http://192.168.1.14:8080/no-auth", //Crema
    headers: {
        "Content-Type": "application/json",
    }
}

const AXIOS_BASE = axios.create(config);
export default AXIOS_BASE;
