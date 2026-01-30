// Mock данные для разработки и тестирования фронтенда

/** Единые значения статусов выполнения (дорожная карта, синхронизация с бэкендом) */
export const EXECUTION_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  ON_APPROVAL: 'on_approval',
  COMPLETED: 'completed',
} as const;

/** Статусы проекта */
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  DRAFT: 'draft',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended',
} as const;

/** Статусы заявки */
export const APPLICATION_STATUS = {
  APPROVED: 'approved',
  IN_PROCESS: 'in_process',
  SUBMITTED: 'submitted',
  REJECTED: 'rejected',
} as const;

/** Статусы изменения проекта */
export const CHANGE_STATUS = {
  APPROVED: 'approved',
  IMPLEMENTED: 'implemented',
  IN_APPROVAL: 'in_approval',
  SUBMITTED: 'submitted',
} as const;

/** Статусы документа по сроку действия (дорожная карта) */
export const DOCUMENT_STATUS = {
  VALID: 'valid',
  EXPIRING: 'expiring',
  EXPIRED: 'expired',
} as const;

/** Типы проектной документации */
export const DOC_TYPE = { AR: 'ar', KR: 'kr', VK: 'vk', OTHER: 'other' } as const;

/** Типы исполнительной съемки */
export const SURVEY_TYPE = { EXECUTIVE: 'executive', MARKING: 'marking', CONTROL: 'control', OTHER: 'other' } as const;

/** Типы изменений проекта */
export const CHANGE_TYPE = { CONSTRUCTION: 'construction', VOLUME: 'volume', PLANNING: 'planning', MATERIAL: 'material' } as const;

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
    status: PROJECT_STATUS.ACTIVE,
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
    status: PROJECT_STATUS.ACTIVE,
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
    status: PROJECT_STATUS.ACTIVE,
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
    status: PROJECT_STATUS.ACTIVE,
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
    status: PROJECT_STATUS.COMPLETED,
    is_active: false,
    created_at: '2023-01-01T08:00:00Z',
    department_name: 'ПТО',
  },
];

/** Справочник проекта по id — единый источник названий для синхронизации разделов */
export function getProjectRef(id: number): { id: number; name: string } {
  const p = mockProjects.find((pr) => pr.id === id);
  return p ? { id: p.id, name: p.name } : { id, name: `Проект ${id}` };
}

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
    project: getProjectRef(1),
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
    project: getProjectRef(1),
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
    project: getProjectRef(2),
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
    status: APPLICATION_STATUS.APPROVED,
    description: 'Материалы для фундамента',
    total_amount: 2500000,
    approved_by: 'Петров П.П.',
    approval_date: '2024-02-02',
    warehouse: 'Основной склад',
    project: getProjectRef(1),
  },
  {
    id: 2,
    project_id: 1,
    application_type: 'equipment',
    number: 'ЗАЯВ-2024-002',
    date: '2024-02-05',
    requested_by: 'Сидоров С.С.',
    department: 'ПТО',
    status: APPLICATION_STATUS.IN_PROCESS,
    description: 'Спецтехника для земляных работ',
    total_amount: 500000,
    warehouse: 'Основной склад',
    project: getProjectRef(1),
  },
  {
    id: 3,
    project_id: 2,
    application_type: 'materials',
    number: 'ЗАЯВ-2024-003',
    date: '2024-03-10',
    requested_by: 'Козлов В.В.',
    department: 'ОГЭ',
    status: APPLICATION_STATUS.SUBMITTED,
    description: 'Электротехнические материалы',
    warehouse: 'Основной склад',
    project: getProjectRef(2),
  },
  {
    id: 4,
    project_id: 3,
    application_type: 'materials',
    number: 'ЗАЯВ-2024-004',
    date: '2024-03-01',
    requested_by: 'МостСтрой',
    department: 'ПТО',
    status: APPLICATION_STATUS.APPROVED,
    description: 'Материалы для опор моста',
    total_amount: 12000000,
    approved_by: 'Петров П.П.',
    approval_date: '2024-03-05',
    warehouse: 'Основной склад',
    project: getProjectRef(3),
  },
  {
    id: 5,
    project_id: 4,
    application_type: 'equipment',
    number: 'ЗАЯВ-2024-005',
    date: '2024-04-20',
    requested_by: 'РемСтрой',
    department: 'ПТО',
    status: APPLICATION_STATUS.IN_PROCESS,
    description: 'Оборудование для кровельных работ',
    total_amount: 800000,
    warehouse: 'Основной склад',
    project: getProjectRef(4),
  },
  {
    id: 6,
    project_id: 5,
    application_type: 'materials',
    number: 'ЗАЯВ-2024-006',
    date: '2024-06-01',
    requested_by: 'ООО "Ландшафт"',
    department: 'ПТО',
    status: APPLICATION_STATUS.APPROVED,
    description: 'Саженцы и материалы для озеленения',
    total_amount: 1500000,
    approved_by: 'Иванов И.И.',
    approval_date: '2024-06-05',
    warehouse: 'Основной склад',
    project: getProjectRef(5),
  },
  {
    id: 7,
    project_id: 6,
    application_type: 'materials',
    number: 'ЗАЯВ-2024-007',
    date: '2024-07-05',
    requested_by: 'Петров П.П.',
    department: 'ОГЭ',
    status: APPLICATION_STATUS.SUBMITTED,
    description: 'Трубы и фитинги для водопровода',
    total_amount: 3500000,
    warehouse: 'Основной склад',
    project: getProjectRef(6),
  },
  {
    id: 8,
    project_id: 7,
    application_type: 'equipment',
    number: 'ЗАЯВ-2024-008',
    date: '2024-08-01',
    requested_by: 'ООО "Образование Строй"',
    department: 'ПТО',
    status: APPLICATION_STATUS.REJECTED,
    description: 'Спецтехника для котлована',
    total_amount: 2000000,
    warehouse: 'Основной склад',
    project: getProjectRef(7),
  },
  {
    id: 9,
    project_id: 8,
    application_type: 'materials',
    number: 'ЗАЯВ-2023-009',
    date: '2023-02-15',
    requested_by: 'Иванов И.И.',
    department: 'ПТО',
    status: APPLICATION_STATUS.APPROVED,
    description: 'Материалы для завершения объекта',
    total_amount: 5000000,
    approved_by: 'Петров П.П.',
    approval_date: '2023-02-20',
    warehouse: 'Основной склад',
    project: getProjectRef(8),
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
    project: getProjectRef(1),
  },
  {
    id: 2,
    project_id: 2,
    contract_number: 'ДОГ-2024-002',
    contract_date: '2024-02-20',
    contractor: 'ООО "СтройГрупп"',
    contract_amount: 75000000,
    status: 'active',
    project: getProjectRef(2),
  },
  {
    id: 3,
    project_id: 3,
    contract_number: 'ДОГ-2024-003',
    contract_date: '2024-01-25',
    contractor: 'ООО "МостСтрой"',
    contract_amount: 120000000,
    status: 'active',
    project: getProjectRef(3),
  },
  {
    id: 4,
    project_id: 4,
    contract_number: 'ДОГ-2024-004',
    contract_date: '2024-03-20',
    contractor: 'ООО "РемСтрой"',
    contract_amount: 15000000,
    status: 'active',
    project: getProjectRef(4),
  },
  {
    id: 5,
    project_id: 5,
    contract_number: 'ДОГ-2024-005',
    contract_date: '2024-05-01',
    contractor: 'ООО "Ландшафт"',
    contract_amount: 8000000,
    status: 'active',
    project: getProjectRef(5),
  },
  {
    id: 6,
    project_id: 6,
    contract_number: 'ДОГ-2024-006',
    contract_date: '2024-06-01',
    contractor: 'ООО "СтройГрупп"',
    contract_amount: 25000000,
    status: 'active',
    project: getProjectRef(6),
  },
  {
    id: 7,
    project_id: 7,
    contract_number: 'ДОГ-2024-007',
    contract_date: '2024-07-01',
    contractor: 'ООО "Образование Строй"',
    contract_amount: 450000000,
    status: 'active',
    project: getProjectRef(7),
  },
  {
    id: 8,
    project_id: 8,
    contract_number: 'ДОГ-2023-008',
    contract_date: '2023-01-10',
    contractor: 'ООО "СтройГрупп"',
    contract_amount: 38000000,
    status: 'completed',
    project: getProjectRef(8),
  },
];

/** Проектная документация (чертежи, ПСД, согласование версий) — привязана к Строительному объекту (Проекту) */
export interface MockProjectDocumentation {
  id: number;
  project_id: number;
  doc_type: string;
  name: string;
  number?: string;
  version?: string;
  development_date?: string;
  developer?: string;
  approved_by?: string;
  approval_date?: string;
  file_path?: string;
  description?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
  project?: { id: number; name: string };
}

/** Исполнительная съемка — привязана к Строительному объекту (Проекту) */
export interface MockExecutiveSurvey {
  id: number;
  project_id: number;
  survey_type: string;
  number?: string;
  survey_date: string;
  surveyor?: string;
  department?: string;
  description?: string;
  coordinates?: string;
  file_path?: string;
  drawing_path?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  project?: { id: number; name: string };
}

/** Изменение проекта — привязано к Строительному объекту (Проекту) */
export interface MockProjectChange {
  id: number;
  project_id: number;
  change_type: string;
  change_number: string;
  title: string;
  description: string;
  justification?: string;
  impact_volume?: number;
  impact_cost?: number;
  impact_schedule?: number;
  initiator: string;
  initiator_date: string;
  status: string;
  approved_date?: string;
  implemented_date?: string;
  file_path?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  project?: { id: number; name: string };
}

export const mockProjectDocumentation: MockProjectDocumentation[] = [
  {
    id: 1,
    project_id: 1,
    doc_type: DOC_TYPE.AR,
    name: 'Архитектурные решения. Жилой комплекс "Солнечный"',
    number: 'АР-001',
    version: '1.0',
    development_date: '2024-01-15',
    developer: 'ООО "ПроектСтрой"',
    approved_by: 'Главный архитектор',
    approval_date: '2024-01-20',
    is_active: true,
    created_at: '2024-01-10T08:00:00Z',
    project: getProjectRef(1),
  },
  {
    id: 2,
    project_id: 1,
    doc_type: DOC_TYPE.KR,
    name: 'Конструктивные решения. Фундаменты',
    number: 'КР-001',
    version: '1.2',
    development_date: '2024-02-01',
    developer: 'ООО "ПроектСтрой"',
    is_active: true,
    created_at: '2024-01-25T10:00:00Z',
    project: getProjectRef(1),
  },
  {
    id: 3,
    project_id: 2,
    doc_type: DOC_TYPE.AR,
    name: 'Архитектурные решения. Офисный центр "Бизнес Парк"',
    number: 'АР-002',
    version: '1.0',
    development_date: '2024-03-01',
    developer: 'ООО "Девелопмент Проект"',
    approved_by: 'Главный архитектор',
    is_active: true,
    created_at: '2024-02-20T09:00:00Z',
    project: getProjectRef(2),
  },
  {
    id: 4,
    project_id: 3,
    doc_type: 'other',
    name: 'Проект реконструкции моста. ИИ',
    number: 'ПРМ-001',
    version: '2.0',
    development_date: '2024-02-10',
    developer: 'ООО "МостСтрой"',
    is_active: true,
    created_at: '2024-01-30T11:00:00Z',
    project: { id: 3, name: 'Реконструкция моста через р. Волга' },
  },
  {
    id: 5,
    project_id: 4,
    doc_type: DOC_TYPE.KR,
    name: 'Конструктивные решения. Ремонт цеха',
    number: 'КР-ЦЕХ-001',
    version: '1.0',
    development_date: '2024-04-01',
    developer: 'ООО "РемСтрой"',
    approved_by: 'Главный инженер',
    is_active: true,
    created_at: '2024-03-25T09:00:00Z',
    project: getProjectRef(4),
  },
  {
    id: 6,
    project_id: 5,
    doc_type: DOC_TYPE.AR,
    name: 'Архитектурные решения. Благоустройство парка',
    number: 'АР-ПАРК-001',
    version: '1.0',
    development_date: '2024-06-01',
    developer: 'ООО "Ландшафт"',
    approved_by: 'Главный архитектор',
    is_active: true,
    created_at: '2024-05-20T08:00:00Z',
    project: getProjectRef(5),
  },
  {
    id: 7,
    project_id: 6,
    doc_type: DOC_TYPE.VK,
    name: 'Водопровод и канализация. Наружные сети',
    number: 'ВК-СЕТИ-001',
    version: '1.0',
    development_date: '2024-07-15',
    developer: 'ООО "СтройГрупп"',
    is_active: true,
    created_at: '2024-06-25T10:00:00Z',
    project: getProjectRef(6),
  },
  {
    id: 8,
    project_id: 7,
    doc_type: DOC_TYPE.AR,
    name: 'Архитектурные решения. Школа на 800 мест',
    number: 'АР-ШК-001',
    version: '0.1',
    development_date: '2024-08-01',
    developer: 'ООО "Образование Строй"',
    is_active: true,
    created_at: '2024-07-15T09:00:00Z',
    project: getProjectRef(7),
  },
  {
    id: 9,
    project_id: 8,
    doc_type: DOC_TYPE.KR,
    name: 'Конструктивные решения. Завершенный объект',
    number: 'КР-ЗАВ-001',
    version: '2.0',
    development_date: '2023-06-01',
    developer: 'ООО "СтройГрупп"',
    approved_by: 'Главный инженер',
    approval_date: '2023-06-15',
    is_active: true,
    created_at: '2023-05-20T08:00:00Z',
    project: getProjectRef(8),
  },
];

export const mockExecutiveSurveys: MockExecutiveSurvey[] = [
  {
    id: 1,
    project_id: 1,
    survey_type: SURVEY_TYPE.EXECUTIVE,
    number: 'ИС-2024-001',
    survey_date: '2024-02-15',
    surveyor: 'Смирнов А.А.',
    department: 'Геодезия',
    description: 'Исполнительная съемка свайного поля, корпус 1',
    status: EXECUTION_STATUS.COMPLETED,
    created_at: '2024-02-15T10:00:00Z',
    project: getProjectRef(1),
  },
  {
    id: 2,
    project_id: 1,
    survey_type: 'marking',
    number: 'РС-2024-002',
    survey_date: '2024-02-20',
    surveyor: 'Смирнов А.А.',
    department: 'Геодезия',
    description: 'Разбивочная съемка осей здания',
    status: 'completed',
    created_at: '2024-02-20T14:00:00Z',
    project: getProjectRef(1),
  },
  {
    id: 3,
    project_id: 2,
    survey_type: SURVEY_TYPE.EXECUTIVE,
    number: 'ИС-2024-003',
    survey_date: '2024-04-05',
    surveyor: 'Козлов В.В.',
    department: 'Геодезия',
    description: 'Исполнительная съемка фундаментов',
    status: EXECUTION_STATUS.COMPLETED,
    created_at: '2024-04-05T12:00:00Z',
    project: getProjectRef(2),
  },
  {
    id: 4,
    project_id: 3,
    survey_type: 'control',
    number: 'КС-2024-001',
    survey_date: '2024-03-01',
    surveyor: 'Геодезист Г.Г.',
    department: 'Геодезия',
    description: 'Контрольная съемка опор моста',
    status: 'completed',
    created_at: '2024-03-01T09:00:00Z',
    project: { id: 3, name: 'Реконструкция моста через р. Волга' },
  },
  {
    id: 5,
    project_id: 4,
    survey_type: SURVEY_TYPE.EXECUTIVE,
    number: 'ИС-2024-005',
    survey_date: '2024-05-10',
    surveyor: 'Козлов В.В.',
    department: 'Геодезия',
    description: 'Исполнительная съемка перекрытий после ремонта',
    status: EXECUTION_STATUS.COMPLETED,
    created_at: '2024-05-10T12:00:00Z',
    project: getProjectRef(4),
  },
  {
    id: 6,
    project_id: 5,
    survey_type: SURVEY_TYPE.EXECUTIVE,
    number: 'ИС-2024-006',
    survey_date: '2024-06-15',
    surveyor: 'Смирнов А.А.',
    department: 'Геодезия',
    description: 'Исполнительная съемка территории парка',
    status: EXECUTION_STATUS.IN_PROGRESS,
    created_at: '2024-06-15T10:00:00Z',
    project: getProjectRef(5),
  },
  {
    id: 7,
    project_id: 6,
    survey_type: SURVEY_TYPE.MARKING,
    number: 'РС-2024-007',
    survey_date: '2024-07-01',
    surveyor: 'Козлов В.В.',
    department: 'Геодезия',
    description: 'Разбивочная съемка трассы водопровода',
    status: EXECUTION_STATUS.COMPLETED,
    created_at: '2024-07-01T09:00:00Z',
    project: getProjectRef(6),
  },
  {
    id: 8,
    project_id: 7,
    survey_type: SURVEY_TYPE.EXECUTIVE,
    number: 'ИС-2024-008',
    survey_date: '2024-08-01',
    surveyor: 'Геодезист Г.Г.',
    department: 'Геодезия',
    description: 'Исполнительная съемка котлована под школу',
    status: EXECUTION_STATUS.NOT_STARTED,
    created_at: '2024-07-25T11:00:00Z',
    project: getProjectRef(7),
  },
  {
    id: 9,
    project_id: 8,
    survey_type: SURVEY_TYPE.CONTROL,
    number: 'КС-2023-002',
    survey_date: '2023-10-15',
    surveyor: 'Смирнов А.А.',
    department: 'Геодезия',
    description: 'Контрольная съемка завершенного объекта',
    status: EXECUTION_STATUS.COMPLETED,
    created_at: '2023-10-15T14:00:00Z',
    project: getProjectRef(8),
  },
];

export const mockProjectChanges: MockProjectChange[] = [
  {
    id: 1,
    project_id: 1,
    change_type: 'construction',
    change_number: 'ИЗМ-2024-001',
    title: 'Изменение марки бетона ростверка',
    description: 'Замена бетона В25 на В30 по результатам экспертизы',
    justification: 'Повышение несущей способности',
    impact_cost: 150000,
    initiator: 'Иванов И.И.',
    initiator_date: '2024-02-10',
    status: 'approved',
    approved_date: '2024-02-15',
    created_at: '2024-02-10T08:00:00Z',
    project: getProjectRef(1),
  },
  {
    id: 2,
    project_id: 1,
    change_type: CHANGE_TYPE.VOLUME,
    change_number: 'ИЗМ-2024-002',
    title: 'Уточнение объемов земляных работ',
    description: 'Корректировка объемов по факту выемки',
    impact_volume: 50,
    initiator: 'Сидоров С.С.',
    initiator_date: '2024-03-01',
    status: CHANGE_STATUS.IMPLEMENTED,
    implemented_date: '2024-03-10',
    created_at: '2024-03-01T10:00:00Z',
    project: getProjectRef(1),
  },
  {
    id: 3,
    project_id: 2,
    change_type: CHANGE_TYPE.PLANNING,
    change_number: 'ИЗМ-2024-003',
    title: 'Перепланировка офисного блока 2 этажа',
    description: 'Объединение кабинетов 201-203 в конференц-зал',
    justification: 'Запрос заказчика',
    initiator: 'Козлов В.В.',
    initiator_date: '2024-04-01',
    status: CHANGE_STATUS.IN_APPROVAL,
    created_at: '2024-04-01T11:00:00Z',
    project: getProjectRef(2),
  },
  {
    id: 4,
    project_id: 3,
    change_type: CHANGE_TYPE.MATERIAL,
    change_number: 'ИЗМ-2024-004',
    title: 'Замена типа деформационного шва',
    description: 'Применение импортного профиля по согласованию с заказчиком',
    impact_cost: 280000,
    initiator: 'Петров П.П.',
    initiator_date: '2024-03-15',
    status: CHANGE_STATUS.SUBMITTED,
    created_at: '2024-03-15T09:00:00Z',
    project: { id: 3, name: 'Реконструкция моста через р. Волга' },
  },
  {
    id: 5,
    project_id: 4,
    change_type: CHANGE_TYPE.CONSTRUCTION,
    change_number: 'ИЗМ-2024-005',
    title: 'Уточнение объема работ по кровле',
    description: 'Дополнительные работы по гидроизоляции по результатам обследования',
    impact_cost: 85000,
    initiator: 'Иванов И.И.',
    initiator_date: '2024-04-15',
    status: CHANGE_STATUS.APPROVED,
    approved_date: '2024-04-20',
    created_at: '2024-04-15T10:00:00Z',
    project: getProjectRef(4),
  },
  {
    id: 6,
    project_id: 5,
    change_type: CHANGE_TYPE.PLANNING,
    change_number: 'ИЗМ-2024-006',
    title: 'Изменение схемы озеленения парка',
    description: 'Дополнительные деревья по периметру',
    justification: 'Запрос администрации',
    initiator: 'ООО "Ландшафт"',
    initiator_date: '2024-06-20',
    status: CHANGE_STATUS.SUBMITTED,
    created_at: '2024-06-20T09:00:00Z',
    project: getProjectRef(5),
  },
  {
    id: 7,
    project_id: 6,
    change_type: CHANGE_TYPE.CONSTRUCTION,
    change_number: 'ИЗМ-2024-007',
    title: 'Увеличение диаметра труб водопровода',
    description: 'Замена DN150 на DN200 на участке 50 м',
    impact_cost: 120000,
    initiator: 'Петров П.П.',
    initiator_date: '2024-07-10',
    status: CHANGE_STATUS.IN_APPROVAL,
    created_at: '2024-07-10T11:00:00Z',
    project: getProjectRef(6),
  },
  {
    id: 8,
    project_id: 7,
    change_type: CHANGE_TYPE.VOLUME,
    change_number: 'ИЗМ-2024-008',
    title: 'Уточнение объемов земляных работ под школу',
    description: 'Корректировка по результатам геологии',
    impact_volume: 200,
    initiator: 'Сидоров С.С.',
    initiator_date: '2024-08-01',
    status: CHANGE_STATUS.SUBMITTED,
    created_at: '2024-08-01T10:00:00Z',
    project: getProjectRef(7),
  },
  {
    id: 9,
    project_id: 8,
    change_type: CHANGE_TYPE.MATERIAL,
    change_number: 'ИЗМ-2023-001',
    title: 'Замена типа кровельного покрытия',
    description: 'Применение материала по согласованию с заказчиком',
    impact_cost: 350000,
    initiator: 'Иванов И.И.',
    initiator_date: '2023-03-01',
    status: CHANGE_STATUS.IMPLEMENTED,
    approved_date: '2023-03-10',
    implemented_date: '2023-04-01',
    created_at: '2023-03-01T08:00:00Z',
    project: getProjectRef(8),
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

export const getMockProjectDocumentation = (projectId?: number): MockProjectDocumentation[] =>
  projectId
    ? mockProjectDocumentation.filter((d) => d.project_id === projectId)
    : mockProjectDocumentation;

export const getMockExecutiveSurveys = (projectId?: number): MockExecutiveSurvey[] =>
  projectId
    ? mockExecutiveSurveys.filter((s) => s.project_id === projectId)
    : mockExecutiveSurveys;

export const getMockProjectChanges = (projectId?: number): MockProjectChange[] =>
  projectId
    ? mockProjectChanges.filter((c) => c.project_id === projectId)
    : mockProjectChanges;

// Мок-данные для дорожной карты документов
export interface MockDocumentStatus {
  id: number;
  project_id: number;
  section_code: string;
  request_date?: string;
  due_date?: string;
  valid_until_date?: string;
  executor_company?: string;
  executor_authority?: string;
  execution_status: string;
  document_status?: string;
  note?: string;
  files_count: number;
}

export const mockDocumentStatuses: MockDocumentStatus[] = [
  // Эскизный проект
  {
    id: 1,
    project_id: 1,
    section_code: 'sketch.itc.heat',
    request_date: '2024-01-15',
    due_date: '2024-02-15',
    valid_until_date: '2025-02-15',
    executor_company: 'Иванов И.И.',
    executor_authority: 'Петров П.П. (Теплосети)',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Документ получен, все условия выполнены',
    files_count: 2,
  },
  {
    id: 2,
    project_id: 1,
    section_code: 'sketch.itc.power',
    request_date: '2024-01-20',
    due_date: '2024-02-20',
    valid_until_date: '2025-01-20',
    executor_company: 'Сидоров С.С.',
    executor_authority: 'Козлов К.К. (Энергосбыт)',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Согласовано',
    files_count: 1,
  },
  {
    id: 3,
    project_id: 1,
    section_code: 'sketch.itc.water',
    request_date: '2024-02-01',
    due_date: '2024-03-01',
    valid_until_date: '2025-03-01',
    executor_company: 'Морозов М.М.',
    executor_authority: 'Водоканал',
    execution_status: EXECUTION_STATUS.IN_PROGRESS,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'В процессе согласования',
    files_count: 0,
  },
  {
    id: 4,
    project_id: 1,
    section_code: 'sketch.itc.gas',
    request_date: '2024-02-10',
    due_date: '2024-03-10',
    valid_until_date: '2025-03-10',
    executor_company: 'Волков В.В.',
    executor_authority: 'Газпром',
    execution_status: EXECUTION_STATUS.ON_APPROVAL,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'На согласовании у руководства',
    files_count: 1,
  },
  {
    id: 5,
    project_id: 1,
    section_code: 'sketch.itc.phone',
    request_date: '2024-02-15',
    due_date: '2024-03-15',
    valid_until_date: undefined,
    executor_company: 'Новиков Н.Н.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Ожидание начала работ',
    files_count: 0,
  },
  {
    id: 6,
    project_id: 1,
    section_code: 'sketch.geo',
    request_date: '2024-01-10',
    due_date: '2024-02-10',
    valid_until_date: '2025-02-10',
    executor_company: 'Геодезист Г.Г.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Геологические изыскания завершены',
    files_count: 3,
  },
  {
    id: 7,
    project_id: 1,
    section_code: 'sketch.urban',
    request_date: '2024-01-05',
    due_date: '2024-02-05',
    valid_until_date: '2025-01-05',
    executor_company: 'Архитектор А.А.',
    executor_authority: 'Бишкекглавархитектура',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.EXPIRING,
    note: 'Градостроительное заключение получено',
    files_count: 1,
  },
  // Рабочий проект
  {
    id: 8,
    project_id: 1,
    section_code: 'working.genplan',
    request_date: '2024-03-01',
    due_date: '2024-04-01',
    valid_until_date: '2025-04-01',
    executor_company: 'Проектировщик П.П.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Стройгенплан готов',
    files_count: 2,
  },
  {
    id: 9,
    project_id: 1,
    section_code: 'working.ppr',
    request_date: '2024-03-10',
    due_date: '2024-04-10',
    valid_until_date: '2025-04-10',
    executor_company: 'Инженер И.И.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.IN_PROGRESS,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Разработка ППР в процессе',
    files_count: 1,
  },
  {
    id: 10,
    project_id: 1,
    section_code: 'working.survey',
    request_date: '2024-03-15',
    due_date: '2024-04-15',
    valid_until_date: '2025-04-15',
    executor_company: 'Геодезист Г.Г.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Ожидание начала работ',
    files_count: 0,
  },
  {
    id: 11,
    project_id: 1,
    section_code: 'working.gp_ar.mchs',
    request_date: '2024-04-01',
    due_date: '2024-05-01',
    valid_until_date: '2025-05-01',
    executor_company: 'Пожарный инспектор П.И.',
    executor_authority: 'МЧС',
    execution_status: 'on_approval',
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Согласование с МЧС в процессе',
    files_count: 1,
  },
  {
    id: 12,
    project_id: 1,
    section_code: 'working.gp_ar.sanepid',
    request_date: '2024-04-05',
    due_date: '2024-05-05',
    valid_until_date: '2025-05-05',
    executor_company: 'Санитарный врач С.В.',
    executor_authority: 'Санэпид',
    execution_status: EXECUTION_STATUS.IN_PROGRESS,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Проверка санитарных норм',
    files_count: 0,
  },
  {
    id: 13,
    project_id: 1,
    section_code: 'working.gp_ar.mpret',
    request_date: '2024-04-10',
    due_date: '2024-05-10',
    valid_until_date: '2025-05-10',
    executor_company: 'Эколог Э.Э.',
    executor_authority: 'МПРЭТН',
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Ожидание начала экологической экспертизы',
    files_count: 0,
  },
  {
    id: 14,
    project_id: 1,
    section_code: 'working.expertise.stage1',
    request_date: '2024-05-01',
    due_date: '2024-07-01',
    valid_until_date: '2025-07-01',
    executor_company: 'Эксперт Э.Э.',
    executor_authority: 'Госэкспертиза',
    execution_status: EXECUTION_STATUS.IN_PROGRESS,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Первый этап госэкспертизы в процессе',
    files_count: 5,
  },
  {
    id: 15,
    project_id: 1,
    section_code: 'working.register',
    request_date: '2024-06-01',
    due_date: '2024-07-01',
    valid_until_date: '2025-07-01',
    executor_company: 'Регистратор Р.Р.',
    executor_authority: 'Реестр строящихся объектов',
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Ожидание завершения 1 этапа экспертизы',
    files_count: 0,
  },
  {
    id: 16,
    project_id: 1,
    section_code: 'working.expertise.stage2',
    request_date: '2024-07-01',
    due_date: '2024-09-01',
    valid_until_date: '2025-09-01',
    executor_company: 'Эксперт Э.Э.',
    executor_authority: 'Госэкспертиза',
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Ожидание начала 2 этапа',
    files_count: 0,
  },
  {
    id: 17,
    project_id: 1,
    section_code: 'working.networks.external.heat',
    request_date: '2024-07-10',
    due_date: '2024-08-10',
    valid_until_date: '2025-08-10',
    executor_company: 'Теплотехник Т.Т.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Проект наружных теплосетей',
    files_count: 0,
  },
  {
    id: 18,
    project_id: 1,
    section_code: 'working.networks.external.power',
    request_date: '2024-07-15',
    due_date: '2024-08-15',
    valid_until_date: '2025-08-15',
    executor_company: 'Электрик Э.Э.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Проект наружных электросетей',
    files_count: 0,
  },
  {
    id: 19,
    project_id: 1,
    section_code: 'working.networks.internal.hvac',
    request_date: '2024-07-20',
    due_date: '2024-09-20',
    valid_until_date: '2025-09-20',
    executor_company: 'Вентиляционщик В.В.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Проект отопления и вентиляции',
    files_count: 0,
  },
  {
    id: 20,
    project_id: 1,
    section_code: 'working.networks.internal.electrical',
    request_date: '2024-07-25',
    due_date: '2024-09-25',
    valid_until_date: '2025-09-25',
    executor_company: 'Электромонтажник Э.Э.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Проект внутренних электросетей',
    files_count: 0,
  },
  // Проект 2 — синхронизация с разделами (Офисный центр "Бизнес Парк")
  {
    id: 24,
    project_id: 2,
    section_code: 'sketch.itc.heat',
    request_date: '2024-03-01',
    due_date: '2024-04-01',
    valid_until_date: '2025-04-01',
    executor_company: 'Козлов В.В.',
    executor_authority: 'Теплосети',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'ТУ получены',
    files_count: 1,
  },
  {
    id: 25,
    project_id: 2,
    section_code: 'sketch.geo',
    request_date: '2024-02-15',
    due_date: '2024-03-15',
    valid_until_date: '2025-03-15',
    executor_company: 'Козлов В.В.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Геология выполнена',
    files_count: 2,
  },
  {
    id: 26,
    project_id: 2,
    section_code: 'working.genplan',
    request_date: '2024-04-01',
    due_date: '2024-05-01',
    valid_until_date: '2025-05-01',
    executor_company: 'ООО "Девелопмент Проект"',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.IN_PROGRESS,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Стройгенплан в разработке',
    files_count: 0,
  },
  {
    id: 27,
    project_id: 2,
    section_code: 'sketch.itc.power',
    request_date: '2024-03-10',
    due_date: '2024-04-10',
    valid_until_date: '2025-04-10',
    executor_company: 'Петров П.П.',
    executor_authority: 'Энергосбыт',
    execution_status: EXECUTION_STATUS.ON_APPROVAL,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'На согласовании',
    files_count: 0,
  },
  {
    id: 28,
    project_id: 2,
    section_code: 'sketch.urban',
    request_date: '2024-02-20',
    due_date: '2024-03-20',
    valid_until_date: '2025-03-20',
    executor_company: 'Архитектор А.А.',
    executor_authority: 'Бишкекглавархитектура',
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Ожидание подачи',
    files_count: 0,
  },
  {
    id: 29,
    project_id: 2,
    section_code: 'working.ppr',
    request_date: '2024-04-15',
    due_date: '2024-05-15',
    valid_until_date: '2025-05-15',
    executor_company: 'Сидоров С.С.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'ППР не начат',
    files_count: 0,
  },
  // Проект 3 — другая картина (Реконструкция моста): много выполнено, часть в работе
  {
    id: 30,
    project_id: 3,
    section_code: 'sketch.itc.heat',
    request_date: '2024-01-10',
    due_date: '2024-02-10',
    valid_until_date: '2025-02-10',
    executor_company: 'МостСтрой',
    executor_authority: 'Теплосети',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'ТУ получены',
    files_count: 2,
  },
  {
    id: 31,
    project_id: 3,
    section_code: 'sketch.geo',
    request_date: '2024-01-05',
    due_date: '2024-02-05',
    valid_until_date: '2025-02-05',
    executor_company: 'Геодезист Г.Г.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Геология выполнена',
    files_count: 3,
  },
  {
    id: 32,
    project_id: 3,
    section_code: 'sketch.urban',
    request_date: '2024-01-20',
    due_date: '2024-02-20',
    valid_until_date: '2025-02-20',
    executor_company: 'Архитектор А.А.',
    executor_authority: 'Бишкекглавархитектура',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Заключение получено',
    files_count: 1,
  },
  {
    id: 33,
    project_id: 3,
    section_code: 'working.genplan',
    request_date: '2024-02-15',
    due_date: '2024-03-15',
    valid_until_date: '2025-03-15',
    executor_company: 'МостСтрой',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.IN_PROGRESS,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Стройгенплан в разработке',
    files_count: 0,
  },
  {
    id: 34,
    project_id: 3,
    section_code: 'working.gp_ar',
    request_date: '2024-03-01',
    due_date: '2024-04-01',
    valid_until_date: '2025-04-01',
    executor_company: 'Архитектор А.А.',
    executor_authority: 'Бишкекглавархитектура',
    execution_status: EXECUTION_STATUS.ON_APPROVAL,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'ГП АР на согласовании',
    files_count: 1,
  },
  {
    id: 35,
    project_id: 3,
    section_code: 'working.expertise.stage1',
    request_date: '2024-04-01',
    due_date: '2024-06-01',
    valid_until_date: '2025-06-01',
    executor_company: 'Госэкспертиза',
    executor_authority: 'Госэкспертиза',
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Ожидание',
    files_count: 0,
  },
  // Проект 4 — в основном не начато / в работе
  {
    id: 36,
    project_id: 4,
    section_code: 'sketch.itc.heat',
    request_date: '2024-04-01',
    due_date: '2024-05-01',
    valid_until_date: '2025-05-01',
    executor_company: 'РемСтрой',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.IN_PROGRESS,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'В работе',
    files_count: 0,
  },
  {
    id: 37,
    project_id: 4,
    section_code: 'sketch.geo',
    request_date: '2024-04-05',
    due_date: '2024-05-05',
    valid_until_date: '2025-05-05',
    executor_company: 'Козлов В.В.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Не начато',
    files_count: 0,
  },
  {
    id: 38,
    project_id: 4,
    section_code: 'working.genplan',
    request_date: '2024-05-01',
    due_date: '2024-06-01',
    valid_until_date: '2025-06-01',
    executor_company: 'РемСтрой',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Ожидание',
    files_count: 0,
  },
  // Проект 5 — Благоустройство парка (часть выполнено, часть в работе)
  {
    id: 39,
    project_id: 5,
    section_code: 'sketch.itc.heat',
    request_date: '2024-05-10',
    due_date: '2024-06-10',
    valid_until_date: '2025-06-10',
    executor_company: 'Ландшафт Проект',
    executor_authority: 'Теплосети',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'ТУ получены',
    files_count: 1,
  },
  {
    id: 40,
    project_id: 5,
    section_code: 'sketch.geo',
    request_date: '2024-05-05',
    due_date: '2024-06-05',
    valid_until_date: '2025-06-05',
    executor_company: 'Геодезист Г.Г.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Изыскания выполнены',
    files_count: 2,
  },
  {
    id: 41,
    project_id: 5,
    section_code: 'sketch.urban',
    request_date: '2024-05-15',
    due_date: '2024-06-15',
    valid_until_date: '2025-06-15',
    executor_company: 'Архитектор А.А.',
    executor_authority: 'Бишкекглавархитектура',
    execution_status: EXECUTION_STATUS.IN_PROGRESS,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Градостроительное заключение в работе',
    files_count: 0,
  },
  {
    id: 42,
    project_id: 5,
    section_code: 'working.genplan',
    request_date: '2024-06-01',
    due_date: '2024-07-01',
    valid_until_date: '2025-07-01',
    executor_company: 'ООО "Ландшафт"',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.ON_APPROVAL,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Стройгенплан на согласовании',
    files_count: 1,
  },
  {
    id: 43,
    project_id: 5,
    section_code: 'working.gp_ar',
    request_date: '2024-06-10',
    due_date: '2024-07-10',
    valid_until_date: '2025-07-10',
    executor_company: 'Архитектор А.А.',
    executor_authority: 'Бишкекглавархитектура',
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Ожидание',
    files_count: 0,
  },
  // Проект 6 — Прокладка инженерных сетей (акцент на сетях)
  {
    id: 44,
    project_id: 6,
    section_code: 'sketch.itc.water',
    request_date: '2024-06-05',
    due_date: '2024-07-05',
    valid_until_date: '2025-07-05',
    executor_company: 'ООО "Коммунальщик"',
    executor_authority: 'Водоканал',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'ТУ получены',
    files_count: 2,
  },
  {
    id: 45,
    project_id: 6,
    section_code: 'sketch.geo',
    request_date: '2024-06-01',
    due_date: '2024-07-01',
    valid_until_date: '2025-07-01',
    executor_company: 'Геодезист Г.Г.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Геология выполнена',
    files_count: 3,
  },
  {
    id: 46,
    project_id: 6,
    section_code: 'sketch.urban',
    request_date: '2024-06-15',
    due_date: '2024-07-15',
    valid_until_date: '2025-07-15',
    executor_company: 'Архитектор А.А.',
    executor_authority: 'Бишкекглавархитектура',
    execution_status: EXECUTION_STATUS.IN_PROGRESS,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'В процессе',
    files_count: 0,
  },
  {
    id: 47,
    project_id: 6,
    section_code: 'working.networks.external.water',
    request_date: '2024-07-01',
    due_date: '2024-08-01',
    valid_until_date: '2025-08-01',
    executor_company: 'ООО "СтройГрупп"',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.IN_PROGRESS,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Проект наружных сетей в разработке',
    files_count: 1,
  },
  {
    id: 48,
    project_id: 6,
    section_code: 'working.networks.internal.water',
    request_date: '2024-07-10',
    due_date: '2024-08-10',
    valid_until_date: '2025-08-10',
    executor_company: 'Инженер ВК',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Ожидание',
    files_count: 0,
  },
  // Проект 7 — Строительство школы (черновик, в основном не начато)
  {
    id: 49,
    project_id: 7,
    section_code: 'sketch.itc.heat',
    request_date: '2024-07-01',
    due_date: '2024-08-01',
    valid_until_date: '2025-08-01',
    executor_company: 'ООО "Образование Строй"',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Не начато',
    files_count: 0,
  },
  {
    id: 50,
    project_id: 7,
    section_code: 'sketch.geo',
    request_date: '2024-07-05',
    due_date: '2024-08-05',
    valid_until_date: '2025-08-05',
    executor_company: 'Геодезист Г.Г.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Ожидание',
    files_count: 0,
  },
  {
    id: 51,
    project_id: 7,
    section_code: 'sketch.urban',
    request_date: '2024-07-10',
    due_date: '2024-08-10',
    valid_until_date: '2025-08-10',
    executor_company: 'Архитектор А.А.',
    executor_authority: 'Бишкекглавархитектура',
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Ожидание подачи',
    files_count: 0,
  },
  {
    id: 52,
    project_id: 7,
    section_code: 'working.genplan',
    request_date: '2024-08-01',
    due_date: '2024-09-01',
    valid_until_date: '2025-09-01',
    executor_company: 'Проектировщик П.П.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Не начато',
    files_count: 0,
  },
  {
    id: 53,
    project_id: 7,
    section_code: 'working.expertise.stage1',
    request_date: '2024-10-01',
    due_date: '2024-12-01',
    valid_until_date: '2025-12-01',
    executor_company: 'Госэкспертиза',
    executor_authority: 'Госэкспертиза',
    execution_status: EXECUTION_STATUS.NOT_STARTED,
    note: 'Ожидание',
    files_count: 0,
  },
  // Проект 8 — Завершенный проект (почти все выполнено)
  {
    id: 54,
    project_id: 8,
    section_code: 'sketch.itc',
    request_date: '2023-01-10',
    due_date: '2023-02-10',
    valid_until_date: '2024-02-10',
    executor_company: 'Координатор К.К.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Все условия получены',
    files_count: 4,
  },
  {
    id: 55,
    project_id: 8,
    section_code: 'sketch.itc.heat',
    request_date: '2023-01-15',
    due_date: '2023-02-15',
    valid_until_date: '2024-02-15',
    executor_company: 'Иванов И.И.',
    executor_authority: 'Теплосети',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Выполнено',
    files_count: 2,
  },
  {
    id: 56,
    project_id: 8,
    section_code: 'sketch.geo',
    request_date: '2023-01-05',
    due_date: '2023-02-05',
    valid_until_date: '2024-02-05',
    executor_company: 'Геодезист Г.Г.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Изыскания завершены',
    files_count: 3,
  },
  {
    id: 57,
    project_id: 8,
    section_code: 'sketch.urban',
    request_date: '2023-01-20',
    due_date: '2023-02-20',
    valid_until_date: '2024-02-20',
    executor_company: 'Архитектор А.А.',
    executor_authority: 'Бишкекглавархитектура',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Заключение получено',
    files_count: 1,
  },
  {
    id: 58,
    project_id: 8,
    section_code: 'working.genplan',
    request_date: '2023-03-01',
    due_date: '2023-04-01',
    valid_until_date: '2024-04-01',
    executor_company: 'Проектировщик П.П.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Стройгенплан готов',
    files_count: 2,
  },
  {
    id: 59,
    project_id: 8,
    section_code: 'working.gp_ar',
    request_date: '2023-04-01',
    due_date: '2023-05-01',
    valid_until_date: '2024-05-01',
    executor_company: 'Архитектор А.А.',
    executor_authority: 'Бишкекглавархитектура',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'ГП АР согласован',
    files_count: 2,
  },
  {
    id: 60,
    project_id: 8,
    section_code: 'working.expertise.stage1',
    request_date: '2023-05-01',
    due_date: '2023-07-01',
    valid_until_date: '2024-07-01',
    executor_company: 'Госэкспертиза',
    executor_authority: 'Госэкспертиза',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'Экспертиза пройдена',
    files_count: 5,
  },
  {
    id: 61,
    project_id: 8,
    section_code: 'working.register',
    request_date: '2023-07-15',
    due_date: '2023-08-01',
    valid_until_date: '2024-08-01',
    executor_company: 'Регистратор Р.Р.',
    executor_authority: 'Реестр строящихся объектов',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.VALID,
    note: 'В реестре',
    files_count: 1,
  },
  // Примеры с истекающими сроками
  {
    id: 21,
    project_id: 1,
    section_code: 'sketch.itc',
    request_date: '2023-12-01',
    due_date: '2024-01-01',
    valid_until_date: '2024-02-01',
    executor_company: 'Координатор К.К.',
    executor_authority: undefined,
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.EXPIRED,
    note: 'Все условия получены',
    files_count: 3,
  },
  {
    id: 22,
    project_id: 1,
    section_code: 'working.gp_ar',
    request_date: '2024-03-20',
    due_date: '2024-04-20',
    valid_until_date: '2025-02-05',
    executor_company: 'Архитектор А.А.',
    executor_authority: 'Бишкекглавархитектура',
    execution_status: EXECUTION_STATUS.COMPLETED,
    document_status: DOCUMENT_STATUS.EXPIRING,
    note: 'ГП АР согласован',
    files_count: 2,
  },
];

export const getMockDocumentStatuses = (projectId?: number): MockDocumentStatus[] =>
  projectId
    ? mockDocumentStatuses.filter((s) => s.project_id === projectId)
    : mockDocumentStatuses;

export const getMockDocumentStatus = (sectionCode: string, projectId?: number): MockDocumentStatus | undefined =>
  mockDocumentStatuses.find(
    (s) => s.section_code === sectionCode && (!projectId || s.project_id === projectId)
  );
