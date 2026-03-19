import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrencySimple } from '../utils/currency';
import { normalizeToArray } from '../utils/normalizeData';
import './Pages.css';

interface ApplicationItem {
  id?: number;
  line_number?: number;
  material_name: string;
  specification?: string;
  unit?: string;
  quantity: number;
  price?: number;
  amount?: number;
  payment_type_id?: number | null;
  counterparty_id?: number | null;
  contractor_id?: number | null;
  delivery_date?: string;
  notes?: string;
}

interface Application {
  id: number;
  project_id: number;
  application_type: string;
  number: string;
  date: string;
  created_at?: string;
  initiator_counterparty_id?: number | null;
  department_id?: number | null;
  organization_id?: number | null;
  status: string;
  basis?: string;
  material_kind_id?: number | null;
  old_number?: string;
  description?: string;
  warehouse_id?: number | null;
  payment_type_id?: number | null;
  counterparty_id?: number | null;
  notes?: string;
  comment?: string;
  is_posted?: boolean;
  author_user_id?: number | null;
  responsible_personnel_id?: number | null;
  total_amount?: number;
  approved_by?: string;
  approval_date?: string;
  items?: ApplicationItem[];
  project?: { id: number; name: string };
}

interface ApplicationWorkflow {
  id: number;
  application_id: number;
  order_number: number;
  approver_role: string;
  approver_name?: string;
  status: string;
  comment?: string;
  approved_date?: string;
}

interface Project {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Organization {
  id: number;
  name: string;
}

interface Counterparty {
  id: number;
  name: string;
}

interface PaymentType {
  id: number;
  name: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface MaterialKind {
  id: number;
  name: string;
}

interface UserBrief {
  id: number;
  full_name?: string;
  username?: string;
}

interface PersonnelBrief {
  id: number;
  full_name: string;
}

interface PurchaseHistoryRow {
  id: number;
  delivery_date: string;
  supply_doc: string;
  supplier_counterparty_id: number;
  warehouse_id: number;
  price: number;
  quantity: number;
  amount: number;
}

interface ApplicationHistoryEvent {
  id: number;
  ts: string;
  actor: string;
  action: string;
  details?: string;
}

// Мок-данные для тестирования
const MOCK_COUNTERPARTIES: Counterparty[] = [
  { id: 1, name: 'ООО «СтройМатериалы»' },
  { id: 2, name: 'ЗАО «ТехСнаб»' },
  { id: 3, name: 'ООО «ПодрядСервис»' },
];

const MOCK_PAYMENT_TYPES: PaymentType[] = [
  { id: 1, name: 'Безналичная' },
  { id: 2, name: 'Наличная' },
  { id: 3, name: 'Аванс' },
];

const MOCK_WAREHOUSES: Warehouse[] = [
  { id: 1, name: 'Склад №1' },
  { id: 2, name: 'Склад №2' },
];

const MOCK_MATERIAL_KINDS: MaterialKind[] = [
  { id: 1, name: 'Строительные материалы' },
  { id: 2, name: 'Оборудование' },
  { id: 3, name: 'Инструменты' },
  { id: 4, name: 'Расходники' },
];

const MOCK_USERS: UserBrief[] = [
  { id: 1, full_name: 'Админ ПТО', username: 'admin' },
  { id: 2, full_name: 'Менеджер снабжения', username: 'supply' },
];

const MOCK_PERSONNEL: PersonnelBrief[] = [
  { id: 1, full_name: 'Петров Петр Петрович' },
  { id: 2, full_name: 'Иванов Иван Иванович' },
];

const MOCK_APPLICATIONS: Application[] = [
  {
    id: 1,
    project_id: 1,
    application_type: 'materials',
    number: 'З-001/2024',
    date: '2024-03-01',
    created_at: '2024-03-01T10:25:00',
    initiator_counterparty_id: 1,
    status: 'approved',
    basis: 'План закупок по объекту + заявка от прораба на неделю',
    old_number: 'З-458/2023',
    material_kind_id: 1,
    department_id: 1,
    organization_id: 1,
    warehouse_id: 1,
    payment_type_id: 1,
    counterparty_id: 2,
    author_user_id: 2,
    responsible_personnel_id: 1,
    comment: 'Просьба согласовать срочно. Поставка до 20.03.',
    is_posted: true,
    description: 'Заявка на поставку цемента и арматуры',
    total_amount: 500000,
    approved_by: 'Петров Петр Петрович',
    approval_date: '2024-03-02',
    items: [
      {
        id: 1,
        line_number: 1,
        material_name: 'Цемент М500',
        specification: 'Мешки по 50 кг',
        unit: 'т',
        quantity: 10,
        price: 5000,
        amount: 50000,
        delivery_date: '2024-03-15',
        payment_type_id: 1,
        counterparty_id: 2,
        contractor_id: 3,
        notes: 'Нужен сертификат качества',
      },
      {
        id: 2,
        line_number: 2,
        material_name: 'Арматура А500С',
        specification: 'Диаметр 12мм',
        unit: 'т',
        quantity: 5,
        price: 90000,
        amount: 450000,
        delivery_date: '2024-03-20',
        payment_type_id: 1,
        counterparty_id: 2,
        contractor_id: 3,
        notes: 'Упаковка на поддонах',
      },
    ],
  },
  {
    id: 2,
    project_id: 1,
    application_type: 'equipment',
    number: 'З-002/2024',
    date: '2024-03-05',
    initiator_counterparty_id: 2,
    status: 'in_process',
    description: 'Заявка на аренду строительной техники',
    total_amount: 200000,
    items: [
      {
        id: 3,
        line_number: 1,
        material_name: 'Экскаватор',
        unit: 'дн',
        quantity: 10,
        price: 20000,
        amount: 200000,
      },
    ],
  },
  {
    id: 3,
    project_id: 2,
    application_type: 'materials',
    number: 'З-003/2024',
    date: '2024-03-10',
    initiator_counterparty_id: 1,
    status: 'draft',
    description: 'Заявка на отделочные материалы',
    items: [],
  },
];

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [materialKinds, setMaterialKinds] = useState<MaterialKind[]>([]);
  const [users, setUsers] = useState<UserBrief[]>([]);
  const [personnelList, setPersonnelList] = useState<PersonnelBrief[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [workflow, setWorkflow] = useState<ApplicationWorkflow[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryRow[]>([]);
  const [appHistory, setAppHistory] = useState<ApplicationHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'params' | 'items' | 'meta' | 'workflow' | 'history'>('general');
  const [filters, setFilters] = useState({
    project_id: '',
    status: '',
    application_type: '',
    date_from: '',
    date_to: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    application_type: 'materials',
    number: '',
    date: new Date().toISOString().split('T')[0],
    initiator_counterparty_id: '' as number | '',
    department_id: '' as number | '',
    organization_id: '' as number | '',
    status: 'draft',
    basis: '',
    material_kind_id: '' as number | '',
    old_number: '',
    description: '',
    warehouse_id: '' as number | '',
    payment_type_id: '' as number | '',
    counterparty_id: '' as number | '',
    notes: '',
    comment: '',
    is_posted: false,
    author_user_id: '' as number | '',
    responsible_personnel_id: '' as number | '',
    items: [] as ApplicationItem[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Временная логика "текущего пользователя" без полноценной авторизации
    const raw = localStorage.getItem('current_user_id');
    const parsed = raw ? Number(raw) : NaN;
    if (!Number.isNaN(parsed) && parsed > 0) {
      setCurrentUserId(parsed);
    }
  }, []);

  useEffect(() => {
    if (selectedApp) {
      fetchWorkflow(selectedApp.id);
    }
  }, [selectedApp]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.project_id) params.project_id = parseInt(filters.project_id);
      if (filters.status) params.status = filters.status;
      if (filters.application_type) params.application_type = filters.application_type;
      if (filters.search) params.number = filters.search;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const [appsRes, projRes, depRes, orgRes, cpRes, payRes, usersRes, personnelRes, whRes, mkRes] = await Promise.all([
        axios.get(`${API_URL}/applications/`, { params }).catch(() => ({ data: MOCK_APPLICATIONS })),
        axios.get(`${API_URL}/projects/`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/departments/`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/organizations/`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/counterparties/`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/payment-types/`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/users/`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/personnel/`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/materials/warehouses/`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/material-kinds/`).catch(() => ({ data: [] })),
      ]);
      
      // Обработка заявок
      const appsData = normalizeToArray<Application>(appsRes.data);
      setApplications(Array.isArray(appsData) && appsData.length > 0 ? appsData : MOCK_APPLICATIONS);
      
      // Обработка проектов - новый формат с метаданными
      let projectsData: Project[] = [];
      if (projRes.data && projRes.data.data && Array.isArray(projRes.data.data)) {
        // Новый формат с метаданными
        projectsData = projRes.data.data;
      } else if (Array.isArray(projRes.data)) {
        // Старый формат (массив)
        projectsData = projRes.data;
      } else {
        // Попытка нормализовать
        projectsData = normalizeToArray<Project>(projRes.data);
      }
      
      // Фильтруем только валидные проекты с id
      projectsData = projectsData.filter(p => p && p.id !== undefined && p.id !== null);
      setProjects(projectsData);

      setDepartments(Array.isArray(depRes.data) ? depRes.data : []);
      setOrganizations(Array.isArray(orgRes.data) ? orgRes.data : []);
      const cpList = Array.isArray(cpRes.data) ? cpRes.data : [];
      const payList = Array.isArray(payRes.data) ? payRes.data : [];
      const whList = Array.isArray(whRes.data) ? whRes.data : [];
      const mkList = Array.isArray(mkRes.data) ? mkRes.data : [];
      const usersList = Array.isArray(usersRes.data) ? usersRes.data : normalizeToArray<UserBrief>(usersRes.data);
      const personnelListData = Array.isArray(personnelRes.data) ? personnelRes.data : normalizeToArray<PersonnelBrief>(personnelRes.data);

      setCounterparties(cpList.length ? cpList : MOCK_COUNTERPARTIES);
      setPaymentTypes(payList.length ? payList : MOCK_PAYMENT_TYPES);
      setWarehouses(whList.length ? whList : MOCK_WAREHOUSES);
      setMaterialKinds(mkList.length ? mkList : MOCK_MATERIAL_KINDS);

      setUsers(usersList.length ? usersList : MOCK_USERS);
      setPersonnelList(personnelListData.length ? personnelListData : MOCK_PERSONNEL);

      // если текущий пользователь не выбран — выставим первого доступного (для демо)
      if (!currentUserId && usersList && usersList.length > 0) {
        setCurrentUserId(usersList[0].id);
        localStorage.setItem('current_user_id', String(usersList[0].id));
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setApplications(MOCK_APPLICATIONS);
      setProjects([]);
      setDepartments([]);
      setOrganizations([]);
      setCounterparties([]);
      setPaymentTypes([]);
      setWarehouses([]);
      setMaterialKinds([]);
      setUsers([]);
      setPersonnelList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflow = async (applicationId: number) => {
    try {
      const res = await axios.get(`${API_URL}/application-workflow/applications/${applicationId}/workflow`).catch(() => ({ data: [] }));
      setWorkflow(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Ошибка загрузки workflow:', error);
      if (applicationId === 1) {
        setWorkflow([
          {
            id: 101,
            application_id: 1,
            order_number: 1,
            approver_role: 'Ответственный',
            approver_name: 'Петров Петр Петрович',
            status: 'approved',
            comment: 'Согласовано. Закупку можно проводить.',
            approved_date: '2024-03-02',
          },
          {
            id: 102,
            application_id: 1,
            order_number: 2,
            approver_role: 'Снабжение',
            approver_name: 'Менеджер снабжения',
            status: 'approved',
            comment: 'Поставщик выбран.',
            approved_date: '2024-03-03',
          },
        ]);
      } else {
        setWorkflow([]);
      }
    }
  };

  useEffect(() => {
    if (!selectedApp) return;
    if (selectedApp.id === 1) {
      setPurchaseHistory([
        {
          id: 1,
          delivery_date: '2024-02-10',
          supply_doc: 'Поставка №П-0145',
          supplier_counterparty_id: 2,
          warehouse_id: 1,
          price: 4800,
          quantity: 12,
          amount: 57600,
        },
        {
          id: 2,
          delivery_date: '2024-01-18',
          supply_doc: 'Поставка №П-0098',
          supplier_counterparty_id: 2,
          warehouse_id: 2,
          price: 5100,
          quantity: 8,
          amount: 40800,
        },
      ]);
      setAppHistory([
        { id: 1, ts: '2024-03-01T10:25:00', actor: 'Менеджер снабжения', action: 'Создание', details: 'Документ создан' },
        { id: 2, ts: '2024-03-01T11:10:00', actor: 'Менеджер снабжения', action: 'Запись', details: 'Добавлены позиции и параметры' },
        { id: 3, ts: '2024-03-02T09:05:00', actor: 'Петров Петр Петрович', action: 'Утверждение', details: 'Статус: Утверждена' },
        { id: 4, ts: '2024-03-03T16:40:00', actor: 'Менеджер снабжения', action: 'Проведение', details: 'Документ проведен' },
      ]);
    } else {
      setPurchaseHistory([]);
      setAppHistory([]);
    }
  }, [selectedApp]);

  const handleSelectApp = async (app: Application) => {
    setSelectedApp(app);
    try {
      const fullApp = await axios.get(`${API_URL}/applications/${app.id}`);
      setSelectedApp(fullApp.data);
    } catch (error) {
      console.warn('Ошибка загрузки детальной информации заявки, используем базовые данные:', error);
      // Используем существующие данные заявки, если API недоступен
      setSelectedApp(app);
    }
    setActiveTab('general');
  };

  const handleOpenModal = (app?: Application) => {
    if (app) {
      setEditingApp(app);
      setFormData({
        project_id: app.project_id,
        application_type: app.application_type,
        number: app.number,
        date: app.date ? app.date.split('T')[0] : new Date().toISOString().split('T')[0],
        initiator_counterparty_id: app.initiator_counterparty_id ?? '',
        department_id: app.department_id ?? '',
        organization_id: app.organization_id ?? '',
        status: app.status,
        basis: app.basis || '',
        material_kind_id: app.material_kind_id ?? '',
        old_number: app.old_number || '',
        description: app.description || '',
        warehouse_id: app.warehouse_id ?? '',
        payment_type_id: app.payment_type_id ?? '',
        counterparty_id: app.counterparty_id ?? '',
        notes: app.notes || '',
        comment: app.comment || '',
        is_posted: Boolean(app.is_posted),
        author_user_id: app.author_user_id ?? currentUserId ?? '',
        responsible_personnel_id: app.responsible_personnel_id ?? '',
        items: app.items || [],
      });
    } else {
      setEditingApp(null);
      setFormData({
        project_id: '',
        application_type: 'materials',
        number: '',
        date: new Date().toISOString().split('T')[0],
        initiator_counterparty_id: '',
        department_id: '',
        organization_id: '',
        status: 'draft',
        basis: '',
        material_kind_id: '',
        old_number: '',
        description: '',
        warehouse_id: '',
        payment_type_id: '',
        counterparty_id: '',
        notes: '',
        comment: '',
        is_posted: false,
        author_user_id: currentUserId ?? '',
        responsible_personnel_id: '',
        items: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingApp(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof ApplicationItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'price' || field === 'quantity') {
      const item = newItems[index];
      if (item.price && item.quantity) {
        item.amount = item.price * item.quantity;
      }
    }
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { material_name: '', quantity: 0 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        project_id: Number(formData.project_id),
        department_id: formData.department_id ? Number(formData.department_id) : null,
        organization_id: formData.organization_id ? Number(formData.organization_id) : null,
        date: formData.date,
        warehouse_id: formData.warehouse_id ? Number(formData.warehouse_id) : null,
        material_kind_id: (formData as any).material_kind_id ? Number((formData as any).material_kind_id) : null,
        payment_type_id: formData.payment_type_id ? Number(formData.payment_type_id) : null,
        counterparty_id: formData.counterparty_id ? Number(formData.counterparty_id) : null,
        initiator_counterparty_id: (formData as any).initiator_counterparty_id ? Number((formData as any).initiator_counterparty_id) : null,
        is_posted: Boolean(formData.is_posted),
        author_user_id: (formData as any).author_user_id ? Number((formData as any).author_user_id) : null,
        responsible_personnel_id: (formData as any).responsible_personnel_id ? Number((formData as any).responsible_personnel_id) : null,
        items: formData.items.map(item => ({
          id: item.id,
          line_number: item.line_number,
          material_name: item.material_name,
          specification: item.specification,
          unit: item.unit,
          quantity: parseFloat(item.quantity.toString()) || 0,
          price: item.price ? parseFloat(item.price.toString()) : undefined,
          amount: item.amount || undefined,
          payment_type_id: item.payment_type_id ? Number(item.payment_type_id) : null,
          counterparty_id: item.counterparty_id ? Number(item.counterparty_id) : null,
          contractor_id: item.contractor_id ? Number(item.contractor_id) : null,
          delivery_date: item.delivery_date,
          notes: item.notes,
        })),
      };

      if (editingApp) {
        await axios.put(`${API_URL}/applications/${editingApp.id}`, submitData, {
          headers: currentUserId ? { 'X-User-Id': String(currentUserId) } : undefined,
        }).catch(() => {
          // Обновляем локально при ошибке API
          const updatedApp: Application = {
            ...editingApp,
            project_id: submitData.project_id,
            application_type: submitData.application_type,
            number: submitData.number,
            date: submitData.date,
            department_id: submitData.department_id ?? undefined,
            organization_id: submitData.organization_id ?? undefined,
            status: submitData.status,
            basis: submitData.basis || undefined,
            material_kind_id: submitData.material_kind_id ?? undefined,
            old_number: submitData.old_number || undefined,
            description: submitData.description || undefined,
            warehouse_id: submitData.warehouse_id ?? undefined,
            payment_type_id: submitData.payment_type_id ?? undefined,
            counterparty_id: submitData.counterparty_id ?? undefined,
            initiator_counterparty_id: submitData.initiator_counterparty_id ?? undefined,
            notes: submitData.notes || undefined,
            comment: submitData.comment || undefined,
            is_posted: submitData.is_posted,
            items: submitData.items.map(item => ({
              ...item,
              price: item.price ?? undefined,
              amount: item.amount ?? undefined,
            })),
          };
          setApplications(applications.map(a => a.id === editingApp.id ? updatedApp : a));
        });
      } else {
        const submitWithAuthor = {
          ...submitData,
          author_user_id: currentUserId ?? submitData.author_user_id ?? null,
        };
        const newApp = await axios.post(`${API_URL}/applications/`, submitWithAuthor, {
          headers: currentUserId ? { 'X-User-Id': String(currentUserId) } : undefined,
        }).catch(() => {
          // Создаем локально при ошибке API
          const mockNew: Application = {
            id: Math.max(...applications.map(a => a.id), 0) + 1,
            project_id: submitWithAuthor.project_id,
            application_type: submitWithAuthor.application_type,
            number: submitWithAuthor.number,
            date: submitWithAuthor.date,
            department_id: submitData.department_id ?? undefined,
            organization_id: submitData.organization_id ?? undefined,
            status: submitData.status,
            basis: submitData.basis || undefined,
            material_kind_id: submitData.material_kind_id ?? undefined,
            old_number: submitData.old_number || undefined,
            description: submitData.description || undefined,
            warehouse_id: submitData.warehouse_id ?? undefined,
            payment_type_id: submitData.payment_type_id ?? undefined,
            counterparty_id: submitData.counterparty_id ?? undefined,
            initiator_counterparty_id: submitData.initiator_counterparty_id ?? undefined,
            notes: submitData.notes || undefined,
            comment: submitData.comment || undefined,
            is_posted: submitData.is_posted,
            author_user_id: submitWithAuthor.author_user_id ?? undefined,
            items: submitData.items.map(item => ({
              ...item,
              price: item.price ?? undefined,
              amount: item.amount ?? undefined,
            })),
          };
          setApplications([...applications, mockNew]);
          return { data: mockNew };
        });
        if (newApp?.data) {
          setApplications([...applications, newApp.data]);
        }
      }
      handleCloseModal();
      fetchData();
      if (selectedApp && editingApp && selectedApp.id === editingApp.id) {
        const updatedApp = { ...editingApp, ...submitData } as Application;
        setSelectedApp(updatedApp);
      }
    } catch (error: any) {
      console.error('Ошибка сохранения заявки:', error);
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          alert(error.response.data.detail);
        } else if (Array.isArray(error.response.data.detail)) {
          // Можно добавить обработку ошибок валидации
          alert('Ошибка валидации данных');
        }
      } else {
        alert('Ошибка сохранения заявки');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingApp) return;
    try {
      await axios.delete(`${API_URL}/applications/${deletingApp.id}`);
      setShowDeleteModal(false);
      setDeletingApp(null);
      if (selectedApp && selectedApp.id === deletingApp.id) {
        setSelectedApp(null);
      }
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления заявки:', error);
    }
  };

  const handlePostToggle = async (app: Application, makePosted: boolean) => {
    try {
      const url = makePosted ? `${API_URL}/applications/${app.id}/post` : `${API_URL}/applications/${app.id}/unpost`;
      const res = await axios.post(url);
      const updated = res.data as Application;
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, ...updated } : a));
      if (selectedApp?.id === app.id) setSelectedApp({ ...selectedApp, ...updated });
    } catch (e) {
      // fallback optimistic
      const updated = { ...app, is_posted: makePosted } as Application;
      setApplications(prev => prev.map(a => a.id === app.id ? updated : a));
      if (selectedApp?.id === app.id) setSelectedApp(updated);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (filters.project_id && String(app.project_id) !== filters.project_id) return false;
    if (filters.status && app.status !== filters.status) return false;
    if (filters.application_type && app.application_type !== filters.application_type) return false;
    if (filters.date_from) {
      const from = new Date(filters.date_from);
      const d = new Date(app.date);
      if (d < from) return false;
    }
    if (filters.date_to) {
      const to = new Date(filters.date_to);
      const d = new Date(app.date);
      if (d > to) return false;
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return app.number.toLowerCase().includes(search);
    }
    return true;
  });

  const paginatedApps = filteredApplications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredApplications.length / pageSize);

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      draft: 'info',
      submitted: 'warn',
      in_process: 'info',
      approved: 'ok',
      rejected: 'danger',
      completed: 'ok',
    };
    return chips[status] || 'info';
  };

  const getWorkflowStatus = () => {
    if (!selectedApp) return { currentStep: 0, steps: [] };
    const steps = [
      { status: 'draft', label: 'Черновик' },
      { status: 'submitted', label: 'Подано' },
      { status: 'in_process', label: 'В процессе' },
      { status: 'approved', label: 'Утверждено' },
    ];
    const currentStep = steps.findIndex(s => s.status === selectedApp.status);
    return { currentStep: currentStep >= 0 ? currentStep : 0, steps };
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  const { currentStep, steps } = getWorkflowStatus();

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Заявки</span></div>
          <div className="h1">Заявки</div>
          <p className="h2">Список • карточка • позиции заявки • визуализация workflow • история статусов.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#applications" onClick={(e) => { e.preventDefault(); handleOpenModal(); }}>+ Создать заявку</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр заявок</div>
              <div className="desc">Фильтрация • пагинация • поиск</div>
            </div>
            <span className="chip info">Маршрутизация согласования</span>
          </div>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Проект</label>
                  <select
                    value={filters.project_id}
                    onChange={(e) => { setFilters({ ...filters, project_id: e.target.value }); setCurrentPage(1); }}
                  >
                    <option value="">Все</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Статус</label>
                  <select
                    value={filters.status}
                    onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setCurrentPage(1); }}
                  >
                    <option value="">Все</option>
                    <option value="draft">Черновик</option>
                    <option value="submitted">Подано</option>
                    <option value="in_process">В процессе</option>
                    <option value="approved">Утверждено</option>
                    <option value="rejected">Отклонено</option>
                    <option value="completed">Завершено</option>
                  </select>
                </div>
                <div className="field">
                  <label>Тип</label>
                  <select
                    value={filters.application_type}
                    onChange={(e) => { setFilters({ ...filters, application_type: e.target.value }); setCurrentPage(1); }}
                  >
                    <option value="">Все</option>
                    <option value="materials">Материалы</option>
                    <option value="equipment">Оборудование</option>
                    <option value="services">Услуги</option>
                    <option value="other">Прочее</option>
                  </select>
                </div>
                <div className="field">
                  <label>Период</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => { setFilters({ ...filters, date_from: e.target.value }); setCurrentPage(1); }}
                    />
                    <input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => { setFilters({ ...filters, date_to: e.target.value }); setCurrentPage(1); }}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Номер заявки</label>
                  <input
                    type="text"
                    placeholder="Например: З-001/2024"
                    value={filters.search}
                    onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setCurrentPage(1); }}
                  />
                </div>
              </div>
              <div className="actions">
                <a
                  className="btn small"
                  href="#applications"
                  onClick={(e) => {
                    e.preventDefault();
                    setFilters({ project_id: '', status: '', application_type: '', date_from: '', date_to: '', search: '' });
                    setCurrentPage(1);
                  }}
                >
                  Сбросить
                </a>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>№</th>
                  <th>Проект</th>
                  <th style={{ width: '12%' }}>Тип</th>
                  <th style={{ width: '12%' }}>Склад</th>
                  <th style={{ width: '12%' }}>Инициатор</th>
                  <th style={{ width: '14%' }}>Сумма</th>
                  <th style={{ width: '12%' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApps.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Заявки не найдены</td>
                  </tr>
                ) : (
                  paginatedApps.map((app) => (
                    <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => handleSelectApp(app)}>
                      <td>{app.number}</td>
                      <td>{app.project?.name || `ID: ${app.project_id}`}</td>
                      <td>{app.application_type}</td>
                      <td>{warehouses.find(w => w.id === app.warehouse_id)?.name || '—'}</td>
                      <td>{counterparties.find(c => c.id === app.initiator_counterparty_id)?.name || '—'}</td>
                      <td className="tRight">{app.total_amount ? formatCurrencySimple(app.total_amount, 'KGS') : '—'}</td>
                      <td><span className={`chip ${getStatusChip(app.status)}`}>{app.status}</span></td>
                      <td className="tRight" onClick={(e) => e.stopPropagation()}>
                        <a className="btn small" href="#applications" onClick={(e) => { e.preventDefault(); handleOpenModal(app); }}>Ред.</a>
                        <a className="btn small danger" href="#applications" onClick={(e) => { e.preventDefault(); setDeletingApp(app); setShowDeleteModal(true); }}>Уд.</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="tableFooter">
              <span>Показано {paginatedApps.length} из {filteredApplications.length} • Страница {currentPage} из {totalPages}</span>
              <div className="pager">
                <button className="btn small" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>←</button>
                <button className="btn small" type="button">{currentPage}</button>
                <button className="btn small" type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>→</button>
              </div>
            </div>
          </div>
        </div>

        {selectedApp ? (
          <div className="card">
            <div className="cardHead">
              <div>
                <div className="title">Карточка заявки #{selectedApp.number}</div>
                <div className="desc">Позиции заявки • маршрутизация согласования • история изменений</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selectedApp.is_posted ? <span className="chip ok">Проведено</span> : <span className="chip warn">Не проведено</span>}
                <span className={`chip ${getStatusChip(selectedApp.status)}`}>{selectedApp.status}</span>
              </div>
            </div>
            <div className="cardBody">
              <div className="tabs">
                <div className={`tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>Общее</div>
                <div className={`tab ${activeTab === 'params' ? 'active' : ''}`} onClick={() => setActiveTab('params')}>Параметры</div>
                <div className={`tab ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>Позиции ({selectedApp.items?.length || 0})</div>
                <div className={`tab ${activeTab === 'meta' ? 'active' : ''}`} onClick={() => setActiveTab('meta')}>Метаданные</div>
                <div className={`tab ${activeTab === 'workflow' ? 'active' : ''}`} onClick={() => setActiveTab('workflow')}>Workflow</div>
                <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>История</div>
              </div>

              {activeTab === 'general' && (
                <div style={{ padding: '16px 0' }}>
                  <div className="actions" style={{ justifyContent: 'flex-start', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    <button className="btn small" type="button" onClick={() => fetchData()}>Обновить</button>
                    <button className="btn small primary" type="button" onClick={() => handleOpenModal(selectedApp)}>Записать</button>
                    <button className="btn small" type="button" onClick={() => handlePostToggle(selectedApp, !Boolean(selectedApp.is_posted))}>
                      {selectedApp.is_posted ? 'Отменить проведение' : 'Провести'}
                    </button>
                    <button
                      className="btn small"
                      type="button"
                      disabled={!selectedApp.responsible_personnel_id}
                      onClick={async () => {
                        const res = await axios.post(`${API_URL}/applications/${selectedApp.id}/approve`).catch(() => null);
                        if (res?.data) setSelectedApp(res.data);
                        fetchData();
                      }}
                    >
                      Утвердить
                    </button>
                    <button
                      className="btn small danger"
                      type="button"
                      disabled={!selectedApp.responsible_personnel_id}
                      onClick={async () => {
                        const res = await axios.post(`${API_URL}/applications/${selectedApp.id}/reject`).catch(() => null);
                        if (res?.data) setSelectedApp(res.data);
                        fetchData();
                      }}
                    >
                      Отклонить
                    </button>
                    <button className="btn small" type="button" onClick={() => setSelectedApp(null)}>Закрыть</button>
                    <button className="btn small" type="button" disabled>Заявки по объекту</button>
                    <button className="btn small" type="button" disabled>Потребности организации</button>
                    <button className="btn small" type="button" disabled>План‑факт поставок</button>
                    <button className="btn small" type="button" disabled>Печать</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Проект</div>
                      <div>{selectedApp.project?.name || `ID: ${selectedApp.project_id}`}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Тип</div>
                      <div>{selectedApp.application_type}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Дата</div>
                      <div>{new Date(selectedApp.date).toLocaleDateString('ru-RU')}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Дата и время создания</div>
                      <div>{selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleString('ru-RU') : '—'}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Результат утверждения</div>
                      <div>
                        {selectedApp.status === 'approved' ? 'Утверждена' : selectedApp.status === 'rejected' ? 'Отклонена' : '—'}
                        {selectedApp.approved_by ? ` • ${selectedApp.approved_by}` : ''}
                        {selectedApp.approval_date ? ` • ${new Date(selectedApp.approval_date).toLocaleDateString('ru-RU')}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Старый номер</div>
                      <div>{selectedApp.old_number || '—'}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Инициатор</div>
                      <div>{counterparties.find(c => c.id === selectedApp.initiator_counterparty_id)?.name || '—'}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Подразделение</div>
                      <div>{departments.find(d => d.id === selectedApp.department_id)?.name || '—'}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Склад</div>
                      <div>{warehouses.find(w => w.id === selectedApp.warehouse_id)?.name || '—'}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Вид материала</div>
                      <div>{materialKinds.find(m => m.id === selectedApp.material_kind_id)?.name || '—'}</div>
                    </div>
                  </div>
                  {selectedApp.description && (
                    <div style={{ marginBottom: '16px' }}>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Описание</div>
                      <div>{selectedApp.description}</div>
                    </div>
                  )}
                  {selectedApp.basis && (
                    <div style={{ marginBottom: '16px' }}>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Основание</div>
                      <div>{selectedApp.basis}</div>
                    </div>
                  )}
                  {selectedApp.total_amount && (
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Общая сумма</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                        <div>{formatCurrencySimple(selectedApp.total_amount, 'KGS')}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(selectedApp.total_amount ? selectedApp.total_amount / 89 : null, 'USD')}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'params' && (
                <div style={{ padding: '16px 0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Вид оплаты (по умолчанию)</div>
                      <div>{paymentTypes.find(p => p.id === selectedApp.payment_type_id)?.name || '—'}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Контрагент (по умолчанию)</div>
                      <div>{counterparties.find(c => c.id === selectedApp.counterparty_id)?.name || '—'}</div>
                    </div>
                  </div>
                  <div style={{ height: 12 }} />
                  <div className="muted mini">
                    Параметры задаются в форме записи заявки.
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div style={{ padding: '16px 0' }}>
                  {selectedApp.items && selectedApp.items.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>№</th>
                          <th>Наименование</th>
                          <th style={{ width: '10%' }}>Ед.</th>
                          <th style={{ width: '12%' }} className="tRight">Количество</th>
                          <th style={{ width: '12%' }} className="tRight">Цена</th>
                          <th style={{ width: '14%' }} className="tRight">Сумма</th>
                          <th style={{ width: '14%' }}>Вид оплаты</th>
                          <th>Примечание</th>
                          <th style={{ width: '16%' }}>Контрагент</th>
                          <th style={{ width: '16%' }}>Подрядчик</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedApp.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td>{item.line_number || idx + 1}</td>
                            <td>{item.material_name}</td>
                            <td>{item.unit || '—'}</td>
                            <td className="tRight">{item.quantity?.toLocaleString('ru-RU') || '0'}</td>
                            <td className="tRight">{item.price ? formatCurrencySimple(item.price, 'KGS') : '—'}</td>
                            <td className="tRight">{item.amount ? formatCurrencySimple(item.amount, 'KGS') : '—'}</td>
                            <td>{paymentTypes.find(p => p.id === item.payment_type_id)?.name || '—'}</td>
                            <td>{item.notes || '—'}</td>
                            <td>{counterparties.find(c => c.id === item.counterparty_id)?.name || '—'}</td>
                            <td>{counterparties.find(c => c.id === item.contractor_id)?.name || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="muted mini" style={{ padding: '20px', textAlign: 'center' }}>Позиции отсутствуют</div>
                  )}
                </div>
              )}

              {activeTab === 'meta' && (
                <div style={{ padding: '16px 0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Автор</div>
                      <div>{users.find(u => u.id === selectedApp.author_user_id)?.full_name || users.find(u => u.id === selectedApp.author_user_id)?.username || '—'}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Ответственный</div>
                      <div>{personnelList.find(p => p.id === selectedApp.responsible_personnel_id)?.full_name || '—'}</div>
                    </div>
                  </div>
                  <div>
                    <div className="mini" style={{ color: 'var(--muted)' }}>Комментарий</div>
                    <div>{selectedApp.comment || '—'}</div>
                  </div>
                </div>
              )}

              {activeTab === 'workflow' && (
                <div style={{ padding: '16px 0' }}>
                  <div className="stepper">
                    {steps.map((step, idx) => (
                      <div key={step.status} className={`step ${idx < currentStep ? 'done' : idx === currentStep ? 'current' : ''}`}>
                        <div className="n">{idx + 1}</div>
                        <div><b>{step.label}</b></div>
                      </div>
                    ))}
                  </div>
                  {workflow.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <div className="title" style={{ marginBottom: '12px' }}>Этапы согласования</div>
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '10%' }}>№</th>
                            <th>Роль согласующего</th>
                            <th style={{ width: '20%' }}>Имя</th>
                            <th style={{ width: '16%' }}>Статус</th>
                            <th>Комментарий</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workflow.map((wf) => (
                            <tr key={wf.id}>
                              <td>{wf.order_number}</td>
                              <td>{wf.approver_role}</td>
                              <td>{wf.approver_name || '—'}</td>
                              <td><span className={`chip ${getStatusChip(wf.status)}`}>{wf.status}</span></td>
                              <td>{wf.comment || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div style={{ padding: '16px 0' }}>
                  <div className="title" style={{ marginBottom: 12 }}>История изменений</div>
                  {appHistory.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 200 }}>Дата/время</th>
                          <th style={{ width: 220 }}>Пользователь</th>
                          <th style={{ width: 160 }}>Действие</th>
                          <th>Детали</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appHistory.map(h => (
                          <tr key={h.id}>
                            <td>{new Date(h.ts).toLocaleString('ru-RU')}</td>
                            <td>{h.actor}</td>
                            <td>{h.action}</td>
                            <td>{h.details || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="muted mini" style={{ padding: 20, textAlign: 'center' }}>Нет данных</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="cardHead">
              <div className="title">Карточка заявки</div>
            </div>
            <div className="cardBody">
              <div className="muted mini" style={{ padding: '20px', textAlign: 'center' }}>Выберите заявку из списка для просмотра деталей</div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: '800px', width: '100%', margin: '20px 0' }}>
            <div className="cardHead">
              <div className="title">{editingApp ? 'Редактирование' : 'Создание'} заявки</div>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '24px' }}>×</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleSubmit}>
                <div className="title" style={{ marginBottom: 12 }}>1. Общая информация</div>
                <div className="field">
                  <label>Проект *</label>
                  <select name="project_id" value={formData.project_id} onChange={handleInputChange} required>
                    <option value="">Выберите проект</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Организация</label>
                  <select name="organization_id" value={formData.organization_id} onChange={handleInputChange}>
                    <option value="">—</option>
                    {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Тип заявки *</label>
                  <select name="application_type" value={formData.application_type} onChange={handleInputChange} required>
                    <option value="materials">Материалы</option>
                    <option value="equipment">Оборудование</option>
                    <option value="services">Услуги</option>
                    <option value="other">Прочее</option>
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Номер *</label>
                  <input type="text" name="number" value={formData.number} onChange={handleInputChange} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Старый номер</label>
                  <input type="text" name="old_number" value={(formData as any).old_number} onChange={handleInputChange} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата *</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Инициатор (поставщик/подрядчик)</label>
                  <select name="initiator_counterparty_id" value={(formData as any).initiator_counterparty_id} onChange={handleInputChange}>
                    <option value="">—</option>
                    {counterparties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Подразделение (справочник)</label>
                  <select name="department_id" value={formData.department_id} onChange={handleInputChange}>
                    <option value="">—</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Склад</label>
                  <select name="warehouse_id" value={formData.warehouse_id} onChange={handleInputChange}>
                    <option value="">—</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Вид материала</label>
                  <select name="material_kind_id" value={(formData as any).material_kind_id} onChange={handleInputChange}>
                    <option value="">—</option>
                    {materialKinds.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Описание</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Основание</label>
                  <textarea name="basis" value={(formData as any).basis} onChange={handleInputChange} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Статус</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="draft">Черновик</option>
                    <option value="submitted">Подано</option>
                    <option value="in_process">В процессе</option>
                    <option value="approved">Утверждено</option>
                    <option value="rejected">Отклонено</option>
                    <option value="completed">Завершено</option>
                  </select>
                </div>

                <div style={{ height: '20px' }} />
                <div className="title" style={{ marginBottom: 12 }}>2. Параметры заявки</div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Вид оплаты (по умолчанию)</label>
                  <select name="payment_type_id" value={formData.payment_type_id} onChange={handleInputChange}>
                    <option value="">—</option>
                    {paymentTypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Контрагент (по умолчанию)</label>
                  <select name="counterparty_id" value={formData.counterparty_id} onChange={handleInputChange}>
                    <option value="">—</option>
                    {counterparties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div style={{ height: '20px' }} />
                <div className="title" style={{ marginBottom: 12 }}>3. Позиции заявки</div>
                <div style={{ borderTop: '1px solid rgba(36,48,95,0.85)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label>Позиции заявки</label>
                    <button type="button" className="btn small" onClick={handleAddItem}>+ Добавить позицию</button>
                  </div>
                  <div className="muted mini" style={{ marginBottom: 10 }}>
                    В параметрах заявки задайте вид оплаты и контрагента по умолчанию. Массовое применение к строкам убрано.
                  </div>
                  {formData.items.length > 0 && (
                    <table style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>№</th>
                          <th>Наименование</th>
                          <th style={{ width: '10%' }}>Ед.</th>
                          <th style={{ width: '12%' }}>Кол-во</th>
                          <th style={{ width: '12%' }}>Цена</th>
                          <th style={{ width: '12%' }}>Сумма</th>
                          <th style={{ width: '16%' }}>Вид оплаты</th>
                          <th style={{ width: '18%' }}>Примечание</th>
                          <th style={{ width: '18%' }}>Контрагент</th>
                          <th style={{ width: '18%' }}>Подрядчик</th>
                          <th style={{ width: '5%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td><input type="text" style={{ width: '100%', padding: '4px 8px' }} value={item.material_name} onChange={(e) => handleItemChange(idx, 'material_name', e.target.value)} placeholder="Наименование" /></td>
                            <td><input type="text" style={{ width: '100%', padding: '4px 8px' }} value={item.unit || ''} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} placeholder="шт" /></td>
                            <td><input type="number" step="0.001" style={{ width: '100%', padding: '4px 8px', textAlign: 'right' }} value={item.quantity || ''} onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                            <td><input type="number" step="0.01" style={{ width: '100%', padding: '4px 8px', textAlign: 'right' }} value={item.price || ''} onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)} /></td>
                            <td className="tRight">{item.amount ? item.amount.toLocaleString('ru-RU') : '—'}</td>
                            <td>
                              <select value={item.payment_type_id ?? ''} onChange={(e) => handleItemChange(idx, 'payment_type_id', e.target.value ? Number(e.target.value) : null)} style={{ width: '100%', padding: '4px 8px' }}>
                                <option value="">—</option>
                                {paymentTypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                style={{ width: '100%', padding: '4px 8px' }}
                                value={item.notes || ''}
                                onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                                placeholder="Примечание"
                              />
                            </td>
                            <td>
                              <select value={item.counterparty_id ?? ''} onChange={(e) => handleItemChange(idx, 'counterparty_id', e.target.value ? Number(e.target.value) : null)} style={{ width: '100%', padding: '4px 8px' }}>
                                <option value="">—</option>
                                {counterparties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </td>
                            <td>
                              <select value={item.contractor_id ?? ''} onChange={(e) => handleItemChange(idx, 'contractor_id', e.target.value ? Number(e.target.value) : null)} style={{ width: '100%', padding: '4px 8px' }}>
                                <option value="">—</option>
                                {counterparties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </td>
                            <td><button type="button" className="btn small danger" onClick={() => handleRemoveItem(idx)}>×</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ height: '20px' }} />
                <div className="title" style={{ marginBottom: 12 }}>5. Метаданные</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Автор</label>
                    <div style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                      {users.find(u => u.id === (currentUserId ?? (formData as any).author_user_id))?.full_name ||
                        users.find(u => u.id === (currentUserId ?? (formData as any).author_user_id))?.username ||
                        (currentUserId ? `ID: ${currentUserId}` : '—')}
                    </div>
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Ответственный</label>
                    <select name="responsible_personnel_id" value={(formData as any).responsible_personnel_id} onChange={handleInputChange}>
                      <option value="">—</option>
                      {personnelList.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Комментарий</label>
                  <textarea name="comment" value={(formData as any).comment} onChange={handleInputChange} />
                </div>

                <div style={{ height: '20px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  {editingApp && (
                    <button type="button" className="btn" onClick={() => handlePostToggle({ ...(editingApp as any), id: editingApp.id } as Application, true)}>Провести</button>
                  )}
                  <button type="button" className="btn" onClick={handleCloseModal}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deletingApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '400px', margin: '20px' }}>
            <div className="cardHead">
              <div className="title">Удаление заявки</div>
            </div>
            <div className="cardBody">
              <p>Вы уверены, что хотите удалить заявку "{deletingApp.number}"?</p>
              <div style={{ height: '12px' }} />
              <div className="actions">
                <button className="btn danger" onClick={handleDeleteConfirm}>Удалить</button>
                <button className="btn" onClick={() => { setShowDeleteModal(false); setDeletingApp(null); }}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Applications;
