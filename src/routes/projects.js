import express from 'express';
import { Project } from '../db/models/Project.js';

const router = express.Router();

// GET /api/v1/projects - Получить список проектов
router.get('/', (req, res, next) => {
  try {
    const skip = parseInt(req.query.skip || '0', 10);
    const limit = parseInt(req.query.limit || '100', 10);
    
    const projects = Project.findAll(skip, limit);
    res.json(projects.map(Project.toJSON));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/projects/:id - Получить проект по ID
router.get('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const project = Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }
    
    res.json(Project.toJSON(project));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/projects - Создать новый проект
router.post('/', (req, res, next) => {
  try {
    const project = Project.create(req.body);
    res.status(201).json(Project.toJSON(project));
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Проект с таким кодом уже существует' });
    }
    next(error);
  }
});

// PUT /api/v1/projects/:id - Обновить проект
router.put('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const existing = Project.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Проект не найден' });
    }
    
    const project = Project.update(id, req.body);
    res.json(Project.toJSON(project));
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Проект с таким кодом уже существует' });
    }
    next(error);
  }
});

// DELETE /api/v1/projects/:id - Удалить проект
router.delete('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const deleted = Project.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Проект не найден' });
    }
    
    res.json({ message: 'Проект удален' });
  } catch (error) {
    next(error);
  }
});

export default router;
