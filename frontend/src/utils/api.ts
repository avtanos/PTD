import axios from 'axios';

// Для GitHub Pages используем полный URL, для локальной разработки - относительный
const getApiUrl = () => {
  // Если задан явно через переменную окружения, используем его
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Если запущено на GitHub Pages, но URL не задан - показываем предупреждение
  if (window.location.hostname.includes('github.io')) {
    console.warn(
      '⚠️ REACT_APP_API_URL не настроен! ' +
      'Настройте секрет REACT_APP_API_URL в GitHub Actions или используйте прокси для API.'
    );
    // Возвращаем пустую строку, чтобы запросы не уходили на несуществующий домен
    // В этом случае нужно настроить прокси или использовать другой способ
    return '';
  }
  
  // Для локальной разработки используем относительный путь
  return '/api/v1';
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик для обработки ошибок отсутствующего API URL
api.interceptors.request.use(
  (config) => {
    if (!config.baseURL) {
      console.error('❌ API URL не настроен. Настройте REACT_APP_API_URL или используйте прокси.');
      // На localhost не блокируем запросы, просто предупреждаем
      if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        return Promise.reject(new Error('API URL не настроен'));
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик ответов для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'API URL не настроен') {
      console.warn('⚠️ API запрос заблокирован из-за отсутствия API URL');
    }
    return Promise.reject(error);
  }
);

export default API_URL;
