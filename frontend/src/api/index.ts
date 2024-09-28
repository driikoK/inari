import axios from 'axios';

const instance = axios.create({
  baseURL: `${process.env.API_URL}`,
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.reject(error.response.data);
    }
  }
);

export default instance;
