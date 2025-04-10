import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const config = {
    baseURL: "http://192.168.1.47:8080/api/v1",
    headers: {
        "Content-Type": "application/json",
    }
};

const useAxiosFormData = axios.create(config);

// Add a request interceptor to include the token and handle FormData
useAxiosFormData.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('@token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (config.data instanceof FormData) {
            config.headers["Content-Type"] = "multipart/form-data";
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default useAxiosFormData;