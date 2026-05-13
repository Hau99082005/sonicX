import axios from 'axios';

const BASE_URL = 'http://10.0.2.2:8989';

const client = axios.create({
  baseURL: BASE_URL,
});

export default client;
