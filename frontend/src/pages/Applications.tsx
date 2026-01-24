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
  delivery_date?: string;
  notes?: string;
}

interface Application {
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

// Мок-данные для тестирования
const MOCK_APPLICATIONS: Application[] = [
  {
    id: 1,
    project_id: 1,
    application_type: 'materials',
    number: 'З-001/2024',
    date: '2024-03-01',
    requested_by: 'Иванов И.И.',
    department: 'ПТО',
    status: 'approved',
    description: 'Заявка на поставку цемента и арматуры',
    warehouse: 'Склад №1',
    total_amount: 500000,
    approved_by: 'Петров П.П.',
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
      },
    ],
  },
  {
    id: 2,
    project_id: 1,
    application_type: 'equipment',
    number: 'З-002/2024',
    date: '2024-03-05',
    requested_by: 'Сидоров С.С.',
    department: 'Производство',
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
    requested_by: 'Козлов К.К.',
    department: 'ПТО',
    status: 'draft',
    description: 'Заявка на отделочные материалы',
    items: [],
  },
];

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [workflow, setWorkflow] = useState<ApplicationWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'items' | 'workflow' | 'history'>('general');
  const [filters, setFilters] = useState({
    project_id: '',
    status: '',
    application_type: '',
    warehouse: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    application_type: 'materials',
    number: '',
    date: new Date().toISOString().split('T')[0],
    requested_by: '',
    department: '',
    status: 'draft',
    description: '',
    warehouse: '',
    notes: '',
    items: [] as ApplicationItem[],
  });

  useEffect(() => {
    fetchData();
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
      const [appsRes, projRes] = await Promise.all([
        axios.get(`${API_URL}/applications/`, { params }).catch(() => ({ data: MOCK_APPLICATIONS })),
        axios.get(`${API_URL}/projects/`).catch(() => ({ data: [] })),
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
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setApplications(MOCK_APPLICATIONS);
      setProjects([]);
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
      setWorkflow([]);
    }
  };

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
        requested_by: app.requested_by || '',
        department: app.department || '',
        status: app.status,
        description: app.description || '',
        warehouse: app.warehouse || '',
        notes: app.notes || '',
        items: app.items || [],
      });
    } else {
      setEditingApp(null);
      setFormData({
        project_id: '',
        application_type: 'materials',
        number: '',
        date: new Date().toISOString().split('T')[0],
        requested_by: '',
        department: '',
        status: 'draft',
        description: '',
        warehouse: '',
        notes: '',
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
        date: formData.date,
        items: formData.items.map(item => ({
          id: item.id,
          line_number: item.line_number,
          material_name: item.material_name,
          specification: item.specification,
          unit: item.unit,
          quantity: parseFloat(item.quantity.toString()) || 0,
          price: item.price ? parseFloat(item.price.toString()) : undefined,
          amount: item.amount || undefined,
          delivery_date: item.delivery_date,
          notes: item.notes,
        })),
      };

      if (editingApp) {
        await axios.put(`${API_URL}/applications/${editingApp.id}`, submitData).catch(() => {
          // Обновляем локально при ошибке API
          const updatedApp: Application = {
            ...editingApp,
            project_id: submitData.project_id,
            application_type: submitData.application_type,
            number: submitData.number,
            date: submitData.date,
            requested_by: submitData.requested_by || undefined,
            department: submitData.department || undefined,
            status: submitData.status,
            description: submitData.description || undefined,
            warehouse: submitData.warehouse || undefined,
            notes: submitData.notes || undefined,
            items: submitData.items.map(item => ({
              ...item,
              price: item.price ?? undefined,
              amount: item.amount ?? undefined,
            })),
          };
          setApplications(applications.map(a => a.id === editingApp.id ? updatedApp : a));
        });
      } else {
        const newApp = await axios.post(`${API_URL}/applications/`, submitData).catch(() => {
          // Создаем локально при ошибке API
          const mockNew: Application = {
            id: Math.max(...applications.map(a => a.id), 0) + 1,
            project_id: submitData.project_id,
            application_type: submitData.application_type,
            number: submitData.number,
            date: submitData.date,
            requested_by: submitData.requested_by || undefined,
            department: submitData.department || undefined,
            status: submitData.status,
            description: submitData.description || undefined,
            warehouse: submitData.warehouse || undefined,
            notes: submitData.notes || undefined,
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

  const filteredApplications = applications.filter((app) => {
    if (filters.status && app.status !== filters.status) return false;
    if (filters.application_type && app.application_type !== filters.application_type) return false;
    if (filters.warehouse && app.warehouse !== filters.warehouse) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        app.number.toLowerCase().includes(search) ||
        app.description?.toLowerCase().includes(search) ||
        ''
      );
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
                  <select value={filters.project_id} onChange={(e) => { setFilters({...filters, project_id: e.target.value}); setCurrentPage(1); }}>
                    <option value="">Все</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Статус</label>
                  <select value={filters.status} onChange={(e) => { setFilters({...filters, status: e.target.value}); setCurrentPage(1); }}>
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
                  <select value={filters.application_type} onChange={(e) => { setFilters({...filters, application_type: e.target.value}); setCurrentPage(1); }}>
                    <option value="">Все</option>
                    <option value="materials">Материалы</option>
                    <option value="equipment">Оборудование</option>
                    <option value="services">Услуги</option>
                    <option value="other">Прочее</option>
                  </select>
                </div>
                <div className="field">
                  <label>Поиск</label>
                  <input type="text" placeholder="№, описание..." value={filters.search} onChange={(e) => { setFilters({...filters, search: e.target.value}); setCurrentPage(1); }} />
                </div>
              </div>
              <div className="actions">
                <a className="btn small" href="#applications" onClick={(e) => { e.preventDefault(); setFilters({project_id: '', status: '', application_type: '', warehouse: '', search: ''}); setCurrentPage(1); }}>Сбросить</a>
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
                      <td>{app.warehouse || '—'}</td>
                      <td>{app.requested_by || '—'}</td>
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
              <span className={`chip ${getStatusChip(selectedApp.status)}`}>{selectedApp.status}</span>
            </div>
            <div className="cardBody">
              <div className="tabs">
                <div className={`tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>Общее</div>
                <div className={`tab ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>Позиции ({selectedApp.items?.length || 0})</div>
                <div className={`tab ${activeTab === 'workflow' ? 'active' : ''}`} onClick={() => setActiveTab('workflow')}>Workflow</div>
                <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>История</div>
              </div>

              {activeTab === 'general' && (
                <div style={{ padding: '16px 0' }}>
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
                      <div className="mini" style={{ color: 'var(--muted)' }}>Инициатор</div>
                      <div>{selectedApp.requested_by || '—'}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Подразделение</div>
                      <div>{selectedApp.department || '—'}</div>
                    </div>
                    <div>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Склад</div>
                      <div>{selectedApp.warehouse || '—'}</div>
                    </div>
                  </div>
                  {selectedApp.description && (
                    <div style={{ marginBottom: '16px' }}>
                      <div className="mini" style={{ color: 'var(--muted)' }}>Описание</div>
                      <div>{selectedApp.description}</div>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="muted mini" style={{ padding: '20px', textAlign: 'center' }}>Позиции отсутствуют</div>
                  )}
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
                <div style={{ padding: '20px', textAlign: 'center' }} className="muted mini">История изменений будет реализована</div>
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
                <div className="field">
                  <label>Проект *</label>
                  <select name="project_id" value={formData.project_id} onChange={handleInputChange} required>
                    <option value="">Выберите проект</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                  <label>Дата *</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Инициатор</label>
                  <input type="text" name="requested_by" value={formData.requested_by} onChange={handleInputChange} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Подразделение</label>
                  <input type="text" name="department" value={formData.department} onChange={handleInputChange} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Склад</label>
                  <input type="text" name="warehouse" value={formData.warehouse} onChange={handleInputChange} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Описание</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} />
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
                <div style={{ borderTop: '1px solid rgba(36,48,95,0.85)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label>Позиции заявки</label>
                    <button type="button" className="btn small" onClick={handleAddItem}>+ Добавить позицию</button>
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
                            <td><button type="button" className="btn small danger" onClick={() => handleRemoveItem(idx)}>×</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ height: '20px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
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
