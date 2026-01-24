import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Устанавливаем тему из localStorage при загрузке
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// Используем HashRouter для GitHub Pages или если URL содержит hash
// BrowserRouter для обычного localhost без hash
const useHashRouter = window.location.hostname.includes('github.io') || 
                      window.location.pathname.includes('/PTD') ||
                      window.location.hash.length > 0;
const Router = useHashRouter ? HashRouter : BrowserRouter;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
