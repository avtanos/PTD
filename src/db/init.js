import { Project } from './models/Project.js';
import { Department } from './models/Department.js';
// Импортируем остальные модели для инициализации
// import { ExecutiveDocument } from './models/ExecutiveDocument.js';
// ... остальные модели будут добавлены позже

console.log('Initializing database...');

try {
  // Инициализируем все таблицы
  Department.init();
  Project.init();
  // ExecutiveDocument.init();
  // ... остальные модели
  
  console.log('Database initialized successfully!');
  process.exit(0);
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}
