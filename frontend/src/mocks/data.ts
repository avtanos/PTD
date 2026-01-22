// Mock данные для разработки и тестирования фронтенда

export interface MockProject {
  id: number;
  name: string;
  code: string;
  address?: string;
  customer?: string;
  contractor?: string;
  description?: string;
  work_type?: string;
  department_id?: number;
  start_date?: string;
  end_date?: string;
  status: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  department_name?: string;
}

export interface MockDepartment {
  id: number;
  code: string;
  name: string;
  short_name?: string;
  description?: string;
  head?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MockExecutiveDocument {
  id: number;
  project_id: number;
  doc_type: string;
  name: string;
  number?: string;
  date?: string;
  description?: string;
  file_path?: string;
  created_by?: string;
  approved_by?: string;
  status: string;
  department?: string;
  ks2_id?: number;
  created_at?: string;
  updated_at?: string;
  project?: { id: number; name: string };
}

export interface MockApplication {
  id: number;
  project_id: number;
  application_type: string;
  number: string;
  date: string;
  requested_by?: string;
  department?: string;
  status: string;
  description?: string;
  warehouse?: string;
  notes?: string;
  total_amount?: number;
  approved_by?: string;
  approval_date?: string;
  project?: { id: number; name: string };
}

export interface MockContract {
  id: number;
  project_id: number;
  contract_number: string;
  contract_date?: string;
  contractor?: string;
  contract_amount?: number;
  status?: string;
  project?: { id: number; name: string };
}

// Мок-данные
export const mockDepartments: MockDepartment[] = [
  {
    id: 1,
    code: 'PTO',
    name: 'Производственно-технический отдел',
    short_name: 'ПТО',
    head: 'Иванов И.И.',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    code: 'OGE',
    name: 'Отдел главного энергетика',
    short_name: 'ОГЭ',
    head: 'Петров П.П.',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 3,
    code: 'OGM',
    name: 'Отдел главного механика',
    short_name: 'ОГМ',
    head: 'Сидоров С.С.',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 4,
    code: 'GEODESY',
    name: 'Геодезический отдел',
    short_name: 'Геодезия',
    head: 'Смирнов А.А.',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 5,
    code: 'WAREHOUSE',
    name: 'Склад',
    short_name: 'Склад',
    head: 'Козлов В.В.',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
  },
];

export const mockProjects: MockProject[] = [
  {
    id: 1,
    name: 'Жилой комплекс "Солнечный"',
    code: 'PROJ-001',
    address: 'г. Москва, ул. Солнечная, д. 1-10',
    customer: 'ООО "Застройщик"',
    contractor: 'ООО "СтройГрупп"',
    description: 'Строительство жилого комплекса из 5 корпусов',
    work_type: 'Строительство',
    department_id: 1,
    start_date: '2024-01-01',
    end_date: '2025-12-31',
    status: 'active',
    is_active: true,
    created_at: '2024-01-10T08:00:00Z',
    department_name: 'ПТО',
  },
  {
    id: 2,
    name: 'Офисный центр "Бизнес Парк"',
    code: 'PROJ-002',
    address: 'г. Санкт-Петербург, пр. Невский, д. 100',
    customer: 'АО "Девелопмент"',
    contractor: 'ООО "СтройГрупп"',
    description: 'Строительство многоэтажного офисного центра',
    work_type: 'Строительство',
    department_id: 1,
    start_date: '2024-03-01',
    end_date: '2026-06-30',
    status: 'active',
    is_active: true,
    created_at: '2024-02-15T09:00:00Z',
    department_name: 'ПТО',
  },
  {
    id: 3,
    name: 'Реконструкция моста через р. Волга',
    code: 'PROJ-003',
    address: 'г. Нижний Новгород, мост через р. Волга',
    customer: 'ГКУ "Дорстрой"',
    contractor: 'ООО "МостСтрой"',
    description: 'Реконструкция автомобильного моста',
    work_type: 'Реконструкция',
    department_id: 2,
    start_date: '2024-02-01',
    end_date: '2025-11-30',
    status: 'active',
    is_active: true,
    created_at: '2024-01-20T10:00:00Z',
    department_name: 'ОГЭ',
  },
  {
    id: 4,
    name: 'Ремонт производственного цеха',
    code: 'PROJ-004',
    address: 'г. Казань, ул. Промышленная, д. 50',
    customer: 'ООО "Завод"',
    contractor: 'ООО "РемСтрой"',
    description: 'Капитальный ремонт производственного цеха',
    work_type: 'Ремонт',
    department_id: 3,
    start_date: '2024-04-01',
    end_date: '2024-10-31',
    status: 'active',
    is_active: true,
    created_at: '2024-03-10T11:00:00Z',
    department_name: 'ОГМ',
  },
  {
    id: 5,
    name: 'Благоустройство парка',
    code: 'PROJ-005',
    address: 'г. Екатеринбург, Центральный парк',
    customer: 'Администрация города',
    contractor: 'ООО "Ландшафт"',
    description: 'Благоустройство территории парка',
    work_type: 'Благоустройство',
    department_id: 1,
    start_date: '2024-05-01',
    end_date: '2024-09-30',
    status: 'active',
    is_active: true,
    created_at: '2024-04-15T12:00:00Z',
    department_name: 'ПТО',
  },
  {
    id: 6,
    name: 'Прокладка инженерных сетей',
    code: 'PROJ-006',
    address: 'г. Новосибирск, мкр. Западный',
    customer: 'ООО "Коммунальщик"',
    contractor: 'ООО "СтройГрупп"',
    description: 'Прокладка водопровода и канализации',
    work_type: 'Сети',
    department_id: 2,
    start_date: '2024-06-01',
    end_date: '2024-12-31',
    status: 'active',
    is_active: true,
    created_at: '2024-05-20T13:00:00Z',
    department_name: 'ОГЭ',
  },
  {
    id: 7,
    name: 'Строительство школы',
    code: 'PROJ-007',
    address: 'г. Краснодар, ул. Школьная, д. 20',
    customer: 'Департамент образования',
    contractor: 'ООО "Образование Строй"',
    description: 'Строительство новой школы на 800 мест',
    work_type: 'Строительство',
    department_id: 1,
    start_date: '2024-07-01',
    end_date: '2026-06-30',
    status: 'draft',
    is_active: true,
    created_at: '2024-06-10T14:00:00Z',
    department_name: 'ПТО',
  },
  {
    id: 8,
    name: 'Завершенный проект',
    code: 'PROJ-008',
    address: 'г. Самара, ул. Завершенная, д. 5',
    customer: 'ООО "Заказчик"',
    contractor: 'ООО "СтройГрупп"',
    description: 'Завершенный проект для тестирования',
    work_type: 'Строительство',
    department_id: 1,
    start_date: '2023-01-01',
    end_date: '2023-12-31',
    status: 'completed',
    is_active: false,
    created_at: '2023-01-01T08:00:00Z',
    department_name: 'ПТО',
  },
];

export const mockExecutiveDocs: MockExecutiveDocument[] = [
  {
    id: 1,
    project_id: 1,
    doc_type: 'executive_scheme',
    name: 'Исполнительная схема фундаментов',
    number: 'ИС-001',
    date: '2024-02-15',
    created_by: 'Иванов И.И.',
    approved_by: 'Петров П.П.',
    status: 'approved',
    department: 'Геодезия',
    created_at: '2024-02-10T10:00:00Z',
    project: { id: 1, name: 'Жилой комплекс "Солнечный"' },
  },
  {
    id: 2,
    project_id: 1,
    doc_type: 'hidden_work_act',
    name: 'Акт на скрытые работы - армирование',
    number: 'АСР-001',
    date: '2024-02-20',
    created_by: 'Сидоров С.С.',
    status: 'in_review',
    department: 'ПТО',
    created_at: '2024-02-18T11:00:00Z',
    project: { id: 1, name: 'Жилой комплекс "Солнечный"' },
  },
  {
    id: 3,
    project_id: 2,
    doc_type: 'test_act',
    name: 'Акт испытаний системы вентиляции',
    number: 'АИ-001',
    date: '2024-04-10',
    created_by: 'Козлов В.В.',
    approved_by: 'Петров П.П.',
    status: 'signed',
    department: 'ОГЭ',
    created_at: '2024-04-05T12:00:00Z',
    project: { id: 2, name: 'Офисный центр "Бизнес Парк"' },
  },
];

export const mockApplications: MockApplication[] = [
  {
    id: 1,
    project_id: 1,
    application_type: 'materials',
    number: 'ЗАЯВ-2024-001',
    date: '2024-02-01',
    requested_by: 'Иванов И.И.',
    department: 'ПТО',
    status: 'approved',
    description: 'Материалы для фундамента',
    total_amount: 2500000,
    approved_by: 'Петров П.П.',
    approval_date: '2024-02-02',
    warehouse: 'Основной склад',
    project: { id: 1, name: 'Жилой комплекс "Солнечный"' },
  },
  {
    id: 2,
    project_id: 1,
    application_type: 'equipment',
    number: 'ЗАЯВ-2024-002',
    date: '2024-02-05',
    requested_by: 'Сидоров С.С.',
    department: 'ПТО',
    status: 'in_process',
    description: 'Спецтехника для земляных работ',
    total_amount: 500000,
    warehouse: 'Основной склад',
    project: { id: 1, name: 'Жилой комплекс "Солнечный"' },
  },
  {
    id: 3,
    project_id: 2,
    application_type: 'materials',
    number: 'ЗАЯВ-2024-003',
    date: '2024-03-10',
    requested_by: 'Козлов В.В.',
    department: 'ОГЭ',
    status: 'submitted',
    description: 'Электротехнические материалы',
    warehouse: 'Основной склад',
    project: { id: 2, name: 'Офисный центр "Бизнес Парк"' },
  },
];

export const mockContracts: MockContract[] = [
  {
    id: 1,
    project_id: 1,
    contract_number: 'ДОГ-2024-001',
    contract_date: '2024-01-15',
    contractor: 'ООО "СтройГрупп"',
    contract_amount: 50000000,
    status: 'active',
    project: { id: 1, name: 'Жилой комплекс "Солнечный"' },
  },
  {
    id: 2,
    project_id: 2,
    contract_number: 'ДОГ-2024-002',
    contract_date: '2024-02-20',
    contractor: 'ООО "СтройГрупп"',
    contract_amount: 75000000,
    status: 'active',
    project: { id: 2, name: 'Офисный центр "Бизнес Парк"' },
  },
  {
    id: 3,
    project_id: 3,
    contract_number: 'ДОГ-2024-003',
    contract_date: '2024-01-25',
    contractor: 'ООО "МостСтрой"',
    contract_amount: 120000000,
    status: 'active',
    project: { id: 3, name: 'Реконструкция моста через р. Волга' },
  },
];

// Вспомогательные функции для работы с мок-данными
export const getMockProjects = (): MockProject[] => mockProjects;
export const getMockProject = (id: number): MockProject | undefined => 
  mockProjects.find(p => p.id === id);

export const getMockDepartments = (): MockDepartment[] => mockDepartments;
export const getMockDepartment = (id: number): MockDepartment | undefined => 
  mockDepartments.find(d => d.id === id);

export const getMockExecutiveDocs = (projectId?: number): MockExecutiveDocument[] => 
  projectId 
    ? mockExecutiveDocs.filter(d => d.project_id === projectId)
    : mockExecutiveDocs;

export const getMockApplications = (projectId?: number): MockApplication[] => 
  projectId 
    ? mockApplications.filter(a => a.project_id === projectId)
    : mockApplications;

export const getMockContracts = (projectId?: number): MockContract[] => 
  projectId 
    ? mockContracts.filter(c => c.project_id === projectId)
    : mockContracts;
