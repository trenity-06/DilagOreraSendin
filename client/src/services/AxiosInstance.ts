import axios from "axios";

const AxiosInstance = axios.create({baseURL: 'http://127.0.0.1:8000/api'});

AxiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
        config.headers["Content-Type"] = "multipart/form-data";
    } else {
        config.headers["Content-Type"] = "application/json";
    }

    return config;
});

AxiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status !== 422) {
            console.error("Unexpected response error:", { status, data });
        }

        return Promise.reject(error);
    }
);

export default AxiosInstance;

