# Mock данные для разработки

## Использование

### Вариант 1: Использование мок-данных напрямую

```typescript
import { mockProjects, mockDepartments } from '../mocks/data';

// Использование в компоненте
const projects = mockProjects;
const departments = mockDepartments;
```

### Вариант 2: Использование через mock API (с симуляцией задержек)

```typescript
import { mockApi } from '../utils/mockApi';

// Использование как обычный API
const response = await mockApi.getProjects({ skip: 0, limit: 10 });
const projects = response.data;
```

### Вариант 3: Включение мок-данных через переменную окружения

Создайте файл `.env` в папке `frontend/`:

```
REACT_APP_USE_MOCK_DATA=true
```

Затем можно создать обертку над axios:

```typescript
import axios from 'axios';
import { mockApi, USE_MOCK_DATA } from '../utils/mockApi';

const api = USE_MOCK_DATA ? mockApi : axios;

// Использование
const projects = await api.get('/projects');
```

## Доступные мок-данные

### Projects (Проекты)
- 8 проектов с различными статусами
- Разные типы работ (Строительство, Реконструкция, Ремонт, Благоустройство, Сети)
- Связи с подразделениями

### Departments (Подразделения)
- 5 подразделений: ПТО, ОГЭ, ОГМ, Геодезия, Склад

### Executive Documents (Исполнительная документация)
- 3 документа разных типов
- Различные статусы (approved, in_review, signed)

### Applications (Заявки)
- 3 заявки разных типов (materials, equipment)
- Различные статусы (approved, in_process, submitted)

### Contracts (Договора)
- 3 договора с разными проектами

## Расширение мок-данных

Добавьте новые данные в файл `data.ts`:

```typescript
export const mockNewEntity = [
  {
    id: 1,
    // поля
  },
];
```

## Симуляция задержек API

Все методы в `mockApi.ts` симулируют задержку сети (150-400ms), чтобы максимально приблизить к реальному поведению API.
