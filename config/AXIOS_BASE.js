// import axios from 'axios';

// const config = {
//     baseURL: "https://vietchef.ddns.net/no-auth", //Crema
//     headers: {
//         "Content-Type": "application/json",
//     }
// }

// const AXIOS_BASE = axios.create(config);
// export default AXIOS_BASE;


import axios from 'axios';
import { useContext } from 'react';
import { NetworkContext } from '../hooks/networkProvider';
import { useGlobalModal } from '../context/modalContext';

const config = {
    baseURL: "https://vietchef-api.myddns.me/no-auth", // Crema
    headers: {
        "Content-Type": "application/json",
    }
}

const AXIOS_BASE = axios.create(config);

const useAxiosBase = () => {
    const { isConnected } = useContext(NetworkContext);
    const { showModal } = useGlobalModal();

    AXIOS_BASE.interceptors.request.use(
        async (config) => {
            if (!isConnected) {
                showModal("Lỗi kết nối mạng", "Không thể kết nối với internet. Vui lòng kiểm tra lại kết nối và khởi động lại ứng dụng.");
                throw new axios.Cancel("Không có mạng");
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    return AXIOS_BASE;
};

export default useAxiosBase;
