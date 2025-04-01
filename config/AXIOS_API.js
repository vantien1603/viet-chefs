import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For storing/retrieving token

const config = {
    baseURL: "http://192.168.7.170:8080/api/v1", // Crema
    headers: {
        "Content-Type": "application/json",
    }
};

const AXIOS_API = axios.create(config);

// Add a request interceptor to include the token
AXIOS_API.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('@token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default AXIOS_API;