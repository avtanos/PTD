import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatKGS, formatUSD } from '../utils/currency';
import './Pages.css';

interface Project {
  id: number;
  name: string;
  code?: string;
}

interface KS2 {
  id: number;
  number: string;
}

interface KS3Item {
  id?: number;
  line_number?: number;
  work_name: string;
  unit?: string;
  volume: number;
  price?: number;
  amount?: number;
  vat_rate?: number;
  vat_amount?: number;
  amount_with_vat?: number;
  notes?: string;
}

interface KS3 {
  id: number;
  project_id: number;
  ks2_id?: number;
  number: string;
  date: string;
  period_from?: string;
  period_to?: string;
  customer?: string;
  contractor?: string;
  object_name?: string;
  total_amount?: number;
  total_vat?: number;
  total_with_vat?: number;
  status: string;
  notes?: string;
  items: KS3Item[];
}

interface KS3FormData {
  project_id: number | '';
  ks2_id: number | '';
  number: string;
  date: string;
  period_from: string;
  period_to: string;
  customer: string;
  contractor: string;
  object_name: string;
  status: string;
  notes: string;
  items: KS3Item[];
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Черновик' },
  { value: 'signed', label: 'Подписан' },
  { value: 'approved', label: 'Утвержден' },
];

const KS3: React.FC = () => {
  const [forms, setForms] = useState<KS3[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ks2Forms, setKS2Forms] = useState<KS2[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingForm, setEditingForm] = useState<KS3 | null>(null);
  const [deletingForm, setDeletingForm] = useState<KS3 | null>(null);
  const [formData, setFormData] = useState<KS3FormData>({
    project_id: '',
    ks2_id: '',
    number: '',
    date: '',
    period_from: '',
    period_to: '',
    customer: '',
    contractor: '',
    object_name: '',
    status: 'draft',
    notes: '',
    items: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({ status: '', search: '', project_id: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [formsResponse, projectsResponse, ks2Response] = await Promise.all([
        axios.get(`${API_URL}/ks3/`).catch(err => {
          console.warn('Ошибка загрузки КС-3:', err);
          return { data: [] };
        }),
        axios.get(`${API_URL}/projects/`).catch(err => {
          console.warn('Ошибка загрузки проектов:', err);
          return { data: [] };
        }),
        axios.get(`${API_URL}/ks2/`).catch(err => {
          console.warn('Ошибка загрузки КС-2:', err);
          return { data: [] };
        }),
      ]);
      const formsData = Array.isArray(formsResponse.data) ? formsResponse.data : [];
      console.log('KS3: Загружено форм:', formsData.length, formsData);
      setForms(formsData);
      
      const ks2Data = Array.isArray(ks2Response.data) ? ks2Response.data : [];
      console.log('KS3: Загружено КС-2:', ks2Data.length);
      setKS2Forms(ks2Data);
      
      // Обработка проектов - новый формат с метаданными
      let projectsData: Project[] = [];
      if (projectsResponse.data && projectsResponse.data.data && Array.isArray(projectsResponse.data.data)) {
        projectsData = projectsResponse.data.data;
      } else if (Array.isArray(projectsResponse.data)) {
        projectsData = projectsResponse.data;
      }
      projectsData = projectsData.filter(p => p && p.id !== undefined && p.id !== null);
      console.log('KS3: Загружено проектов:', projectsData.length);
      setProjects(projectsData);
    } catch (error) {
      console.error('Критическая ошибка загрузки данных:', error);
      // Не показываем alert, чтобы не блокировать интерфейс
      setForms([]);
      setProjects([]);
      setKS2Forms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (form?: KS3) => {
    if (form) {
      setEditingForm(form);
      setFormData({
        project_id: form.project_id,
        ks2_id: form.ks2_id || '',
        number: form.number,
        date: form.date ? form.date.split('T')[0] : '',
        period_from: form.period_from ? form.period_from.split('T')[0] : '',
        period_to: form.period_to ? form.period_to.split('T')[0] : '',
        customer: form.customer || '',
        contractor: form.contractor || '',
        object_name: form.object_name || '',
        status: form.status || 'draft',
        notes: form.notes || '',
        items: form.items || [],
      });
    } else {
      setEditingForm(null);
      setFormData({
        project_id: '',
        ks2_id: '',
        number: '',
        date: '',
        period_from: '',
        period_to: '',
        customer: '',
        contractor: '',
        object_name: '',
        status: 'draft',
        notes: '',
        items: [],
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingForm(null);
    setFormData({
      project_id: '',
      ks2_id: '',
      number: '',
      date: '',
      period_from: '',
      period_to: '',
      customer: '',
      contractor: '',
      object_name: '',
      status: 'draft',
      notes: '',
      items: [],
    });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleItemChange = (index: number, field: keyof KS3Item, value: any) => {
    const newItems = [...formData.items];
    if (!newItems[index]) {
      newItems[index] = { work_name: '', volume: 0, vat_rate: 20 };
    }
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Автоматический расчет суммы и НДС
    if (field === 'price' || field === 'volume') {
      const item = newItems[index];
      if (item.price && item.volume) {
        item.amount = Number((item.price * item.volume).toFixed(2));
        const vatRate = item.vat_rate || 20;
        if (item.amount) {
          item.vat_amount = Number(((item.amount * vatRate) / (100 + vatRate)).toFixed(2));
          item.amount_with_vat = item.amount;
        } else {
          item.vat_amount = 0;
          item.amount_with_vat = 0;
        }
      } else {
        item.amount = 0;
        item.vat_amount = 0;
        item.amount_with_vat = 0;
      }
    } else if (field === 'vat_rate') {
      const item = newItems[index];
      if (item.amount) {
        const vatRate = Number(value) || 20;
        item.vat_amount = Number(((item.amount * vatRate) / (100 + vatRate)).toFixed(2));
        item.amount_with_vat = item.amount;
      }
    }
    
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, {
        work_name: '',
        volume: 0,
        vat_rate: 20,
      }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.project_id) {
      newErrors.project_id = 'Проект обязателен';
    }
    if (!formData.number.trim()) {
      newErrors.number = 'Номер справки обязателен';
    }
    if (!formData.date) {
      newErrors.date = 'Дата справки обязательна';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Рассчитываем итоговые суммы
      const totalAmount = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalVat = formData.items.reduce((sum, item) => sum + (item.vat_amount || 0), 0);
      const totalWithVat = formData.items.reduce((sum, item) => sum + (item.amount_with_vat || 0), 0);

      const submitData = {
        project_id: Number(formData.project_id),
        ks2_id: formData.ks2_id ? Number(formData.ks2_id) : null,
        number: formData.number,
        date: formData.date,
        period_from: formData.period_from || null,
        period_to: formData.period_to || null,
        customer: formData.customer || null,
        contractor: formData.contractor || null,
        object_name: formData.object_name || null,
        status: formData.status,
        notes: formData.notes || null,
        total_amount: totalAmount > 0 ? totalAmount : null,
        total_vat: totalVat > 0 ? totalVat : null,
        total_with_vat: totalWithVat > 0 ? totalWithVat : null,
        items: formData.items.map((item, idx) => ({
          ...item,
          line_number: idx + 1,
          price: item.price || null,
          amount: item.amount || null,
          vat_rate: item.vat_rate || 20,
          vat_amount: item.vat_amount || null,
          amount_with_vat: item.amount_with_vat || null,
        })),
      };

      if (editingForm) {
        await axios.put(`${API_URL}/ks3/${editingForm.id}`, submitData);
      } else {
        await axios.post(`${API_URL}/ks3/`, submitData);
      }

      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('Ошибка сохранения формы КС-3:', error);
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Ошибка сохранения формы КС-3');
      }
    }
  };

  const handleDeleteClick = (form: KS3) => {
    setDeletingForm(form);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingForm) return;

    try {
      await axios.delete(`${API_URL}/ks3/${deletingForm.id}`);
      setShowDeleteModal(false);
      setDeletingForm(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления формы КС-3:', error);
      alert('Ошибка удаления формы КС-3');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  // Используем утилиту formatCurrency из utils/currency.ts

  const getStatusLabel = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      draft: 'info',
      signed: 'ok',
      approved: 'ok',
      in_review: 'warn',
      rejected: 'danger',
    };
    return chips[status] || 'info';
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Проект #${projectId}`;
  };

  const getKS2Number = (ks2Id?: number) => {
    if (!ks2Id) return '-';
    const ks2 = ks2Forms.find(k => k.id === ks2Id);
    return ks2 ? ks2.number : `КС-2 #${ks2Id}`;
  };

  // Фильтрация форм
  const filteredForms = forms.filter((form) => {
    if (filters.status && form.status !== filters.status) return false;
    if (filters.project_id && form.project_id.toString() !== filters.project_id) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        form.number.toLowerCase().includes(search) ||
        form.contractor?.toLowerCase().includes(search) ||
        form.customer?.toLowerCase().includes(search) ||
        form.object_name?.toLowerCase().includes(search) ||
        getProjectName(form.project_id).toLowerCase().includes(search) ||
        getKS2Number(form.ks2_id).toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredForms.length / pageSize);
  const paginatedForms = filteredForms.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  console.log('KS3 Render: forms.length =', forms.length, 'loading =', loading);

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Формы КС-3 (Справка о стоимости выполненных работ)</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Создать КС-3
        </button>
      </div>

      {/* Фильтры и поиск */}
      {forms.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Поиск</label>
                  <input
                    type="text"
                    placeholder="По номеру, подрядчику, проекту..."
                    value={filters.search}
                    onChange={(e) => {
                      setFilters({ ...filters, search: e.target.value });
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="field">
                  <label>Статус</label>
                  <select
                    value={filters.status}
                    onChange={(e) => {
                      setFilters({ ...filters, status: e.target.value });
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Все</option>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Проект</label>
                  <select
                    value={filters.project_id}
                    onChange={(e) => {
                      setFilters({ ...filters, project_id: e.target.value });
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Все</option>
                    {projects.map(p => <option key={p.id} value={p.id.toString()}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              {(filters.search || filters.status || filters.project_id) && (
                <div className="actions">
                  <a className="btn small" href="#ks3" onClick={(e) => { e.preventDefault(); setFilters({ status: '', search: '', project_id: '' }); setCurrentPage(1); }}>Сбросить</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {forms.length === 0 ? (
        <div className="empty-state">
          <p>Формы КС-3 не найдены</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            Создать первую форму
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table" style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              minWidth: '800px'
            }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Номер</th>
                  <th>Дата</th>
                  <th>Проект</th>
                  <th>КС-2</th>
                  <th>Период</th>
                  <th>Сумма с НДС</th>
                  <th>Статус</th>
                  <th className="actions-column">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedForms.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>Нет данных для отображения</td>
                  </tr>
                ) : (
                  paginatedForms.map((form) => (
                    <tr key={form.id}>
                      <td>{form.id}</td>
                      <td className="project-name">{form.number}</td>
                      <td>{formatDate(form.date)}</td>
                      <td>{getProjectName(form.project_id)}</td>
                      <td>{getKS2Number(form.ks2_id)}</td>
                      <td>
                        {form.period_from && form.period_to
                          ? `${formatDate(form.period_from)} - ${formatDate(form.period_to)}`
                          : '-'}
                      </td>
                      <td className="tRight">
                        <div>{formatKGS(form.total_with_vat)}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatUSD(form.total_with_vat ? form.total_with_vat / 89 : null)}</div>
                      </td>
                      <td>
                        <span className={`chip ${getStatusChip(form.status)}`}>
                          {getStatusLabel(form.status)}
                        </span>
                      </td>
                      <td className="tRight">
                        <a className="btn small" href="#ks3" onClick={(e) => { e.preventDefault(); handleOpenModal(form); }}>Открыть</a>
                        <a className="btn small danger" href="#ks3" onClick={(e) => { e.preventDefault(); handleDeleteClick(form); }} style={{ marginLeft: '8px' }}>Уд.</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="tableFooter">
            <div style={{ color: 'var(--muted2)', fontSize: '0.875rem' }}>
              Показано {paginatedForms.length} из {filteredForms.length} {filteredForms.length !== forms.length && `(всего: ${forms.length})`}
            </div>
            {totalPages > 1 && (
              <div className="pager">
                <button className="btn small" onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                <span>Стр. {currentPage} из {totalPages}</span>
                <button className="btn small" onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Модальное окно формы */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }} onClick={handleCloseModal}>
          <div className="card" style={{ maxWidth: '800px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">{editingForm ? 'Редактирование' : 'Создание'} формы КС-3</div>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '24px' }}>×</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="project_id">Проект *</label>
                  <select
                    id="project_id"
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите проект</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} {project.code ? `(${project.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label htmlFor="ks2_id">Связанный КС-2</label>
                  <select
                    id="ks2_id"
                    name="ks2_id"
                    value={formData.ks2_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Не выбран</option>
                    {ks2Forms.map((ks2) => (
                      <option key={ks2.id} value={ks2.id}>
                        {ks2.number}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label htmlFor="number">Номер справки *</label>
                  <input
                    type="text"
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label htmlFor="date">Дата справки *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div style={{ height: '10px' }} />
                <div className="field">
                  <label htmlFor="period_from">Период с</label>
                  <input
                    type="date"
                    id="period_from"
                    name="period_from"
                    value={formData.period_from}
                    onChange={handleInputChange}
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label htmlFor="period_to">Период по</label>
                  <input
                    type="date"
                    id="period_to"
                    name="period_to"
                    value={formData.period_to}
                    onChange={handleInputChange}
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label htmlFor="customer">Заказчик</label>
                  <input
                    type="text"
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label htmlFor="contractor">Подрядчик</label>
                  <input
                    type="text"
                    id="contractor"
                    name="contractor"
                    value={formData.contractor}
                    onChange={handleInputChange}
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label htmlFor="object_name">Наименование объекта</label>
                  <input
                    type="text"
                    id="object_name"
                    name="object_name"
                    value={formData.object_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label htmlFor="status">Статус</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label htmlFor="notes">Примечания</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                <div style={{ height: '20px' }} />
                <div style={{ borderTop: '1px solid rgba(36,48,95,0.85)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label>Позиции работ</label>
                    <button type="button" className="btn small" onClick={handleAddItem}>
                      + Добавить позицию
                    </button>
                  </div>
                {formData.items.length > 0 && (
                  <div className="items-table">
                    <div className="modal-table-wrapper">
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--panel)' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>Наименование работ</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', width: '70px', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>Ед.</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '90px', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>Объем</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '90px', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>Цена</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '90px', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>Сумма</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '70px', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>НДС %</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '90px', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>НДС</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '90px', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>С НДС</th>
                          <th style={{ padding: '0.5rem', width: '40px', borderBottom: '1px solid var(--line)' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="text"
                                value={item.work_name}
                                onChange={(e) => handleItemChange(index, 'work_name', e.target.value)}
                                style={{ padding: '0.5rem', border: '1px solid var(--line)', borderRadius: '4px', background: 'var(--card)', color: 'var(--text)' }}
                                placeholder="Наименование работ"
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="text"
                                value={item.unit || ''}
                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                style={{ padding: '0.5rem', border: '1px solid var(--line)', borderRadius: '4px', background: 'var(--card)', color: 'var(--text)' }}
                                placeholder="м²"
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="number"
                                step="0.001"
                                value={item.volume || ''}
                                onChange={(e) => handleItemChange(index, 'volume', parseFloat(e.target.value) || 0)}
                                style={{ padding: '0.5rem', border: '1px solid var(--line)', borderRadius: '4px', textAlign: 'right', background: 'var(--card)', color: 'var(--text)' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={item.price || ''}
                                onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                                style={{ padding: '0.5rem', border: '1px solid var(--line)', borderRadius: '4px', textAlign: 'right', background: 'var(--card)', color: 'var(--text)' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text)' }}>
                              {formatKGS(item.amount)}
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={item.vat_rate || 20}
                                onChange={(e) => handleItemChange(index, 'vat_rate', parseFloat(e.target.value) || 20)}
                                style={{ padding: '0.5rem', border: '1px solid var(--line)', borderRadius: '4px', textAlign: 'right', background: 'var(--card)', color: 'var(--text)' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text)' }}>
                              {formatKGS(item.vat_amount)}
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text)' }}>
                              {formatKGS(item.amount_with_vat)}
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveItem(index)} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1.2rem', padding: '0.25rem 0.5rem' }}
                                title="Удалить позицию"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Итоговые суммы */}
              {formData.items.length > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--panel)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Сумма без НДС:</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                        {formatKGS(formData.items.reduce((sum, item) => sum + (item.amount || 0), 0))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>НДС:</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                        {formatKGS(formData.items.reduce((sum, item) => sum + (item.vat_amount || 0), 0))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Итого с НДС:</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent)' }}>
                        {formatKGS(formData.items.reduce((sum, item) => sum + (item.amount_with_vat || 0), 0))}
                      </div>
                      <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>
                        {formatUSD(formData.items.reduce((sum, item) => sum + (item.amount_with_vat || 0), 0) / 89)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

                <div style={{ height: '20px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">
                    {editingForm ? 'Сохранить' : 'Создать'}
                  </button>
                  <button type="button" className="btn" onClick={handleCloseModal}>
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {showDeleteModal && deletingForm && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Удаление формы КС-3</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Вы уверены, что хотите удалить форму КС-3 <strong>"{deletingForm.number}"</strong>?
              </p>
              <p className="warning-text">Это действие нельзя отменить.</p>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Отмена
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KS3;