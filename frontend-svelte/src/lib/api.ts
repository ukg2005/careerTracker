import axios from 'axios';

function getApiBaseUrl(): string {
    let envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl.includes('backend:8000')) {
        envUrl = envUrl.replace('backend:8000', '127.0.0.1:8000');
    }
    const fallback = 'http://127.0.0.1:8000/api/';
    const raw = (envUrl || fallback).trim();
    const withTrailingSlash = raw.endsWith('/') ? raw : `${raw}/`;

    if (/\/api\/?$/i.test(withTrailingSlash)) {
        return withTrailingSlash;
    }

    return `${withTrailingSlash}api/`;
}

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status == 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                if (typeof window !== 'undefined') {
                    const refreshToken = localStorage.getItem('refresh_token');
                    const response = await axios.post(
                        `${API_BASE_URL}refresh/`, {
                        refresh: refreshToken
                    });

                    localStorage.setItem('access_token', response.data.access);
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
