import axios from 'axios';

const API = axios.create({
  baseURL: 'https://college-fund-management.onrender.com',
});
API.interceptors.request.use((req) => {
  const user = JSON.parse(localStorage.getItem('user'));
  console.log('🧪 Sending token:', user?.token);
  if (user?.token) {
    req.headers.Authorization = `Bearer ${user.token}`;
  }
  return req;
});


export default API;
