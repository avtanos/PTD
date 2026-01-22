import axios from 'axios';

// Для GitHub Pages используем полный URL, для локальной разработки - относительный
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Если запущено на GitHub Pages, используем полный URL
  if (window.location.hostname.includes('github.io')) {
    // Замените на ваш реальный API URL
    return 'https://your-api-domain.com/api/v1';
  }
  // Для локальной разработки
  return '/api/v1';
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API_URL;
