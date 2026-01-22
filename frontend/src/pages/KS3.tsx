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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [formsResponse, projectsResponse, ks2Response] = await Promise.all([
        axios.get(`${API_URL}/ks3/`),
        axios.get(`${API_URL}/projects/`),
        axios.get(`${API_URL}/ks2/`),
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
      console.error('Ошибка загрузки данных:', error);
      alert('Ошибка загрузки данных');
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
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Автоматический расчет суммы и НДС
    if (field === 'price' || field === 'volume') {
      const item = newItems[index];
      if (item.price && item.volume) {
        item.amount = item.price * item.volume;
        const vatRate = item.vat_rate || 20;
        if (item.amount) {
          item.vat_amount = (item.amount * vatRate) / (100 + vatRate);
          item.amount_with_vat = item.amount;
        }
      }
    } else if (field === 'vat_rate') {
      const item = newItems[index];
      if (item.amount) {
        const vatRate = value || 20;
        item.vat_amount = (item.amount * vatRate) / (100 + vatRate);
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
        items: formData.items.map(item => ({
          ...item,
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

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Проект #${projectId}`;
  };

  const getKS2Number = (ks2Id?: number) => {
    if (!ks2Id) return '-';
    const ks2 = ks2Forms.find(k => k.id === ks2Id);
    return ks2 ? ks2.number : `КС-2 #${ks2Id}`;
  };

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

      {forms.length === 0 ? (
        <div className="empty-state">
          <p>Формы КС-3 не найдены</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            Создать первую форму
          </button>
        </div>
      ) : (
        <div className="table-container" style={{ 
          display: 'block', 
          visibility: 'visible', 
          opacity: 1,
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          overflow: 'auto'
        }}>
          <table className="data-table" style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            display: 'table',
            visibility: 'visible',
            opacity: 1,
            minWidth: '800px'
          }}>
            <thead style={{ display: 'table-header-group', visibility: 'visible', background: 'var(--panel)' }}>
              <tr style={{ display: 'table-row' }}>
                <th style={{ display: 'table-cell', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, borderBottom: '2px solid var(--line)' }}>ID</th>
                <th style={{ display: 'table-cell', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, borderBottom: '2px solid var(--line)' }}>Номер</th>
                <th style={{ display: 'table-cell', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, borderBottom: '2px solid var(--line)' }}>Дата</th>
                <th style={{ display: 'table-cell', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, borderBottom: '2px solid var(--line)' }}>Проект</th>
                <th style={{ display: 'table-cell', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, borderBottom: '2px solid var(--line)' }}>КС-2</th>
                <th style={{ display: 'table-cell', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, borderBottom: '2px solid var(--line)' }}>Период</th>
                <th style={{ display: 'table-cell', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, borderBottom: '2px solid var(--line)' }}>Сумма с НДС</th>
                <th style={{ display: 'table-cell', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, borderBottom: '2px solid var(--line)' }}>Статус</th>
                <th className="actions-column" style={{ display: 'table-cell', padding: '12px', textAlign: 'center', color: 'var(--text)', fontWeight: 600, borderBottom: '2px solid var(--line)' }}>Действия</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', visibility: 'visible' }}>
              {forms.length === 0 ? (
                <tr style={{ display: 'table-row' }}>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', display: 'table-cell', color: 'var(--text)' }}>Нет данных для отображения</td>
                </tr>
              ) : (
                forms.map((form) => (
                <tr key={form.id} style={{ display: 'table-row' }}>
                  <td style={{ display: 'table-cell', padding: '12px', borderBottom: '1px solid var(--line)', color: 'var(--text)' }}>{form.id}</td>
                  <td className="project-name" style={{ display: 'table-cell', padding: '12px', borderBottom: '1px solid var(--line)', color: 'var(--text)', fontWeight: 500 }}>{form.number}</td>
                  <td style={{ display: 'table-cell', padding: '12px', borderBottom: '1px solid var(--line)', color: 'var(--text)' }}>{formatDate(form.date)}</td>
                  <td style={{ display: 'table-cell', padding: '12px', borderBottom: '1px solid var(--line)', color: 'var(--text)' }}>{getProjectName(form.project_id)}</td>
                  <td style={{ display: 'table-cell', padding: '12px', borderBottom: '1px solid var(--line)', color: 'var(--text)' }}>{getKS2Number(form.ks2_id)}</td>
                  <td style={{ display: 'table-cell', padding: '12px', borderBottom: '1px solid var(--line)', color: 'var(--text)' }}>
                    {form.period_from && form.period_to
                      ? `${formatDate(form.period_from)} - ${formatDate(form.period_to)}`
                      : '-'}
                  </td>
                  <td style={{ display: 'table-cell', padding: '12px', borderBottom: '1px solid var(--line)', color: 'var(--text)' }}>
                    <div>{formatKGS(form.total_with_vat)}</div>
                    <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatUSD(form.total_with_vat ? form.total_with_vat / 89 : null)}</div>
                  </td>
                  <td style={{ display: 'table-cell', padding: '12px', borderBottom: '1px solid var(--line)' }}>
                    <span className={`status-badge status-${form.status}`}>
                      {getStatusLabel(form.status)}
                    </span>
                  </td>
                  <td className="actions-cell" style={{ display: 'table-cell', padding: '12px', borderBottom: '1px solid var(--line)' }}>
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleOpenModal(form)}
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDeleteClick(form)}
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно формы */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingForm ? 'Редактировать форму КС-3' : 'Создать форму КС-3'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="project-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="project_id">
                    Проект <span className="required">*</span>
                  </label>
                  <select
                    id="project_id"
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleInputChange}
                    className={errors.project_id ? 'input-error' : ''}
                  >
                    <option value="">Выберите проект</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} {project.code ? `(${project.code})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.project_id && <span className="error-message">{errors.project_id}</span>}
                </div>

                <div className="form-group">
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
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="number">
                    Номер справки <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    className={errors.number ? 'input-error' : ''}
                  />
                  {errors.number && <span className="error-message">{errors.number}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="date">
                    Дата справки <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={errors.date ? 'input-error' : ''}
                  />
                  {errors.date && <span className="error-message">{errors.date}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="period_from">Период с</label>
                  <input
                    type="date"
                    id="period_from"
                    name="period_from"
                    value={formData.period_from}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="period_to">Период по</label>
                  <input
                    type="date"
                    id="period_to"
                    name="period_to"
                    value={formData.period_to}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="customer">Заказчик</label>
                  <input
                    type="text"
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contractor">Подрядчик</label>
                  <input
                    type="text"
                    id="contractor"
                    name="contractor"
                    value={formData.contractor}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="object_name">Наименование объекта</label>
                <input
                  type="text"
                  id="object_name"
                  name="object_name"
                  value={formData.object_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
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

              <div className="form-group">
                <label htmlFor="notes">Примечания</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              {/* Позиции */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label>Позиции работ</label>
                  <button type="button" className="btn btn-primary" onClick={handleAddItem} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    + Добавить позицию
                  </button>
                </div>
                {formData.items.length > 0 && (
                  <div className="items-table">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Наименование работ</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', width: '70px' }}>Ед.</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '90px' }}>Объем</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '90px' }}>Цена</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '90px' }}>Сумма</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '70px' }}>НДС %</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '90px' }}>НДС</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right', width: '90px' }}>С НДС</th>
                          <th style={{ padding: '0.5rem', width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index}>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="text"
                                value={item.work_name}
                                onChange={(e) => handleItemChange(index, 'work_name', e.target.value)}
                                style={{ width: '100%', padding: '0.25rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                                placeholder="Наименование работ"
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="text"
                                value={item.unit || ''}
                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                style={{ width: '100%', padding: '0.25rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                                placeholder="м²"
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="number"
                                step="0.001"
                                value={item.volume || ''}
                                onChange={(e) => handleItemChange(index, 'volume', parseFloat(e.target.value) || 0)}
                                style={{ width: '100%', padding: '0.25rem', border: '1px solid #ced4da', borderRadius: '4px', textAlign: 'right' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={item.price || ''}
                                onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                                style={{ width: '100%', padding: '0.25rem', border: '1px solid #ced4da', borderRadius: '4px', textAlign: 'right' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                              {formatKGS(item.amount)}
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={item.vat_rate || 20}
                                onChange={(e) => handleItemChange(index, 'vat_rate', parseFloat(e.target.value) || 20)}
                                style={{ width: '100%', padding: '0.25rem', border: '1px solid #ced4da', borderRadius: '4px', textAlign: 'right' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                              {formatKGS(item.vat_amount)}
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                              {formatKGS(item.amount_with_vat)}
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <button type="button" onClick={() => handleRemoveItem(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}>
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingForm ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
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