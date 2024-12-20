import axios from 'axios';
import toast from 'react-hot-toast';

const instance = axios.create({
  baseURL: `${process.env.VITE_API_URL}`,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      toast.error(error.response.data.message);

      if (error.response.data.statusCode === 401) {
        localStorage.removeItem('token');
        window.location.replace('/login');
      }

      return Promise.reject(error.response.data);
    }
  }
);

export default instance;
