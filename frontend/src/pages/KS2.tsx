import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrency, formatKGS, formatUSD } from '../utils/currency';
import './Pages.css';

interface Project {
  id: number;
  name: string;
  code?: string;
}

interface KS2Item {
  id?: number;
  line_number?: number;
  work_name: string;
  unit?: string;
  volume_estimated?: number;
  volume_completed: number;
  volume_total?: number;
  price?: number;
  amount?: number;
  notes?: string;
}

interface KS2 {
  id: number;
  project_id: number;
  number: string;
  date: string;
  period_from?: string;
  period_to?: string;
  customer?: string;
  contractor?: string;
  object_name?: string;
  total_amount?: number;
  status: string;
  notes?: string;
  items: KS2Item[];
}

interface KS2FormData {
  project_id: number | '';
  number: string;
  date: string;
  period_from: string;
  period_to: string;
  customer: string;
  contractor: string;
  object_name: string;
  status: string;
  notes: string;
  items: KS2Item[];
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Черновик' },
  { value: 'signed', label: 'Подписан' },
  { value: 'approved', label: 'Утвержден' },
];

// Мок-данные
const MOCK_KS2: KS2[] = [
  {
    id: 1,
    project_id: 1,
    number: 'КС2-001',
    date: '2024-02-28',
    period_from: '2024-02-01',
    period_to: '2024-02-28',
    customer: 'ООО "Заказчик"',
    contractor: 'АО "Подрядчик"',
    object_name: 'Жилой дом №1',
    total_amount: 1500000,
    status: 'signed',
    items: [],
  },
  {
    id: 2,
    project_id: 1,
    number: 'КС2-002',
    date: '2024-03-31',
    period_from: '2024-03-01',
    period_to: '2024-03-31',
    customer: 'ООО "Заказчик"',
    contractor: 'АО "Подрядчик"',
    object_name: 'Жилой дом №1',
    total_amount: 2300000,
    status: 'draft',
    items: [],
  }
];

const KS2: React.FC = () => {
  const [forms, setForms] = useState<KS2[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingForm, setEditingForm] = useState<KS2 | null>(null);
  const [deletingForm, setDeletingForm] = useState<KS2 | null>(null);
  const [formData, setFormData] = useState<KS2FormData>({
    project_id: '',
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
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [formsResponse, projectsResponse] = await Promise.all([
        axios.get(`${API_URL}/ks2/`).catch(err => {
          console.warn('Ошибка загрузки КС-2:', err);
          return { data: [] };
        }),
        axios.get(`${API_URL}/projects/`).catch(err => {
          console.warn('Ошибка загрузки проектов:', err);
          return { data: [] };
        }),
      ]);
      const formsData = Array.isArray(formsResponse.data) ? formsResponse.data : [];
      setForms(formsData);
      
      // Обработка проектов - новый формат с метаданными
      let projectsData: Project[] = [];
      if (projectsResponse.data && projectsResponse.data.data && Array.isArray(projectsResponse.data.data)) {
        projectsData = projectsResponse.data.data;
      } else if (Array.isArray(projectsResponse.data)) {
        projectsData = projectsResponse.data;
      }
      projectsData = projectsData.filter(p => p && p.id !== undefined && p.id !== null);
      setProjects(projectsData);
    } catch (error) {
      console.error('Критическая ошибка загрузки данных:', error);
      // Fallback to mock data
      setForms(MOCK_KS2);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (form?: KS2) => {
    if (form) {
      setEditingForm(form);
      setFormData({
        project_id: form.project_id,
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

  const handleItemChange = (index: number, field: keyof KS2Item, value: any) => {
    const newItems = [...formData.items];
    if (!newItems[index]) {
      newItems[index] = { work_name: '', volume_completed: 0 };
    }
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Автоматический расчет суммы
    if (field === 'price' || field === 'volume_completed') {
      const item = newItems[index];
      if (item.price && item.volume_completed) {
        item.amount = Number((item.price * item.volume_completed).toFixed(2));
      } else {
        item.amount = 0;
      }
    }
    
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, {
        work_name: '',
        volume_completed: 0,
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
      newErrors.number = 'Номер акта обязателен';
    }
    if (!formData.date) {
      newErrors.date = 'Дата акта обязательна';
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
      // Рассчитываем общую сумму из позиций
      const totalAmount = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);

      const submitData = {
        project_id: Number(formData.project_id),
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
        items: formData.items.map((item, idx) => ({
          ...item,
          line_number: idx + 1,
          volume_estimated: item.volume_estimated || null,
          volume_total: item.volume_total || null,
          price: item.price || null,
          amount: item.amount || null,
        })),
      };

      if (editingForm) {
        await axios.put(`${API_URL}/ks2/${editingForm.id}`, submitData);
      } else {
        await axios.post(`${API_URL}/ks2/`, submitData);
      }

      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('Ошибка сохранения формы КС-2:', error);
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Ошибка сохранения формы КС-2');
      }
    }
  };

  const handleDeleteClick = (form: KS2) => {
    setDeletingForm(form);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingForm) return;

    try {
      await axios.delete(`${API_URL}/ks2/${deletingForm.id}`);
      setShowDeleteModal(false);
      setDeletingForm(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления формы КС-2:', error);
      alert('Ошибка удаления формы КС-2');
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

  // Вычисляем пагинацию
  const filteredForms = forms.filter((form) => {
    if (filters.status && form.status !== filters.status) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        form.number.toLowerCase().includes(search) ||
        form.contractor?.toLowerCase().includes(search) ||
        form.customer?.toLowerCase().includes(search) ||
        form.object_name?.toLowerCase().includes(search) ||
        getProjectName(form.project_id).toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredForms.length / pageSize);
  const paginatedForms = filteredForms.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  console.log('KS2 Render: forms.length =', forms.length, 'loading =', loading, 'paginatedForms.length =', paginatedForms.length);

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
        <h1>Формы КС-2 (Акт о приемке выполненных работ)</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Создать КС-2
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
              </div>
              {(filters.search || filters.status) && (
                <div className="actions">
                  <a className="btn small" href="#ks2" onClick={(e) => { e.preventDefault(); setFilters({ status: '', search: '' }); setCurrentPage(1); }}>Сбросить</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {forms.length === 0 ? (
        <div className="empty-state">
          <p>Формы КС-2 не найдены</p>
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
                <th>Период</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th className="actions-column">Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedForms.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Нет данных для отображения</td>
                </tr>
              ) : (
                paginatedForms.map((form) => (
                <tr key={form.id}>
                  <td>{form.id}</td>
                  <td className="project-name">{form.number}</td>
                  <td>{formatDate(form.date)}</td>
                  <td>{getProjectName(form.project_id)}</td>
                  <td>
                    {form.period_from && form.period_to
                      ? `${formatDate(form.period_from)} - ${formatDate(form.period_to)}`
                      : '-'}
                  </td>
                  <td className="tRight">
                    <div>{formatKGS(form.total_amount)}</div>
                    <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatUSD(form.total_amount ? form.total_amount / 89 : null)}</div>
                  </td>
                  <td><span className={`chip ${getStatusChip(form.status)}`}>{getStatusLabel(form.status)}</span></td>
                  <td className="tRight">
                    <a className="btn small" href="#ks2" onClick={(e) => { e.preventDefault(); handleOpenModal(form); }}>Открыть</a>
                    <a className="btn small danger" href="#ks2" onClick={(e) => { e.preventDefault(); handleDeleteClick(form); }} style={{ marginLeft: '8px' }}>Уд.</a>
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
              <div className="title">{editingForm ? 'Редактирование' : 'Создание'} формы КС-2</div>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '24px' }}>×</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Проект *</label>
                  <select 
                    name="project_id" 
                    value={formData.project_id} 
                    onChange={handleInputChange} 
                    required
                  >
                    <option value="">Выберите проект</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label htmlFor="number">Номер акта *</label>
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
                  <label htmlFor="date">Дата акта *</label>
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
                          <th style={{ padding: '0.5rem', textAlign: 'left', width: '80px', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>Ед.</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '100px', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>Объем</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '100px', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>Цена</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '100px', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>Сумма</th>
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
                                value={item.volume_completed || ''}
                                onChange={(e) => handleItemChange(index, 'volume_completed', parseFloat(e.target.value) || 0)}
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

              {/* Итоговая сумма */}
              {formData.items.length > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--panel)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--text)' }}>Итого:</strong>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)' }}>
                        {formatKGS(formData.items.reduce((sum, item) => sum + (item.amount || 0), 0))}
                      </div>
                      <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>
                        {formatUSD(formData.items.reduce((sum, item) => sum + (item.amount || 0), 0) / 89)}
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
              <h2>Удаление формы КС-2</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Вы уверены, что хотите удалить форму КС-2 <strong>"{deletingForm.number}"</strong>?
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

export default KS2;