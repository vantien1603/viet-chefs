import axios from 'axios';

const config = {
    baseURL: "http://192.168.25.102:8080/no-auth",
    headers: {
        "Content-Type": "application/json",
    }
}

const AXIOS_BASE = axios.create(config);
export default AXIOS_BASE;
