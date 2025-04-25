import axios from 'axios';

const config = {
    // baseURL: "http://192.168.7.48:8080/no-auth", //Tro
    // baseURL: "http://10.87.24.103:8080/no-auth", //NVH
    baseURL: "https://vietchef.ddns.net/no-auth", //Crema
    headers: {
        "Content-Type": "application/json",
    }
}

const AXIOS_BASE = axios.create(config);
export default AXIOS_BASE;
