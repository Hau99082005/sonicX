import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.19:8989';

const client = axios.create({
  baseURL: BASE_URL,
});

client.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

export default client;
