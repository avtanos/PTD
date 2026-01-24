import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrencySimple } from '../utils/currency';
import './Pages.css';

interface Project {
  id: number;
  name: string;
}

interface KS3 {
  id: number;
  number: string;
  project_id: number;
}

interface Invoice {
  id: number;
  project_id: number;
  ks3_id?: number;
  invoice_number: string;
  invoice_date: string;
  contractor?: string;
  total_amount: number;
  vat_amount: number;
  total_with_vat?: number;
  status: string;
  due_date?: string;
  paid_date?: string;
  project?: { id: number; name: string };
  ks3?: { id: number; number: string };
}

// Мок-данные для тестирования
const MOCK_INVOICES: Invoice[] = [
  {
    id: 1,
    project_id: 1,
    ks3_id: 1,
    invoice_number: 'СЧ-001/2024',
    invoice_date: '2024-03-01',
    contractor: 'ООО "СтройКомплекс"',
    total_amount: 500000,
    vat_amount: 100000,
    total_with_vat: 600000,
    status: 'approved',
    due_date: '2024-03-31',
  },
  {
    id: 2,
    project_id: 1,
    ks3_id: 2,
    invoice_number: 'СЧ-002/2024',
    invoice_date: '2024-03-05',
    contractor: 'ИП "Материалы Плюс"',
    total_amount: 250000,
    vat_amount: 50000,
    total_with_vat: 300000,
    status: 'paid',
    due_date: '2024-03-25',
    paid_date: '2024-03-20',
  },
  {
    id: 3,
    project_id: 2,
    invoice_number: 'СЧ-003/2024',
    invoice_date: '2024-03-10',
    contractor: 'ООО "Отделка Про"',
    total_amount: 150000,
    vat_amount: 30000,
    total_with_vat: 180000,
    status: 'draft',
  },
];

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ks3Forms, setKs3Forms] = useState<KS3[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    ks3_id: '' as number | '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    contractor: '',
    total_amount: '',
    vat_amount: '',
    total_with_vat: '',
    status: 'draft',
    due_date: '',
    paid_date: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, projectsRes, ks3Res] = await Promise.all([
        axios.get(`${API_URL}/invoices/`).catch(() => ({ data: MOCK_INVOICES })),
        axios.get(`${API_URL}/projects/`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/ks3/`).catch(() => ({ data: [] })),
      ]);
      setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : MOCK_INVOICES);
      
      let projectsData: Project[] = [];
      if (projectsRes.data && projectsRes.data.data && Array.isArray(projectsRes.data.data)) {
        projectsData = projectsRes.data.data;
      } else if (Array.isArray(projectsRes.data)) {
        projectsData = projectsRes.data;
      }
      setProjects(projectsData);
      setKs3Forms(Array.isArray(ks3Res.data) ? ks3Res.data : []);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setInvoices(MOCK_INVOICES);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        project_id: invoice.project_id,
        ks3_id: invoice.ks3_id || '' as number | '',
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date ? invoice.invoice_date.split('T')[0] : new Date().toISOString().split('T')[0],
        contractor: invoice.contractor || '',
        total_amount: invoice.total_amount?.toString() || '',
        vat_amount: invoice.vat_amount?.toString() || '',
        total_with_vat: invoice.total_with_vat?.toString() || '',
        status: invoice.status,
        due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
        paid_date: invoice.paid_date ? invoice.paid_date.split('T')[0] : '',
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        project_id: '' as number | '',
        ks3_id: '' as number | '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        contractor: '',
        total_amount: '',
        vat_amount: '',
        total_with_vat: '',
        status: 'draft',
        due_date: '',
        paid_date: '',
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInvoice(null);
    setErrors({});
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setShowViewModal(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.project_id) {
      newErrors.project_id = 'Проект обязателен';
    }
    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = 'Номер счета обязателен';
    }
    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Дата счета обязательна';
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = 'Сумма должна быть больше 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const totalAmount = parseFloat(formData.total_amount || '0');
      const vatAmount = formData.vat_amount ? parseFloat(formData.vat_amount) : (totalAmount * 0.2);
      const totalWithVat = formData.total_with_vat ? parseFloat(formData.total_with_vat) : (totalAmount + vatAmount);

      const submitData = {
        project_id: Number(formData.project_id),
        ks3_id: formData.ks3_id ? Number(formData.ks3_id) : null,
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        contractor: formData.contractor || null,
        total_amount: totalAmount,
        vat_amount: vatAmount,
        total_with_vat: totalWithVat,
        status: formData.status,
        due_date: formData.due_date || null,
        paid_date: formData.paid_date || null,
      };

      if (editingInvoice) {
        await axios.put(`${API_URL}/invoices/${editingInvoice.id}`, submitData).catch(() => {
          setInvoices(invoices.map(inv => inv.id === editingInvoice.id ? { ...editingInvoice, ...submitData } as Invoice : inv));
        });
      } else {
        const newInvoice = await axios.post(`${API_URL}/invoices/`, submitData).catch(() => {
          const mockNew: Invoice = {
            id: Math.max(...invoices.map(inv => inv.id), 0) + 1,
            project_id: submitData.project_id,
            ks3_id: submitData.ks3_id || undefined,
            invoice_number: submitData.invoice_number,
            invoice_date: submitData.invoice_date,
            contractor: submitData.contractor || undefined,
            total_amount: submitData.total_amount,
            vat_amount: submitData.vat_amount,
            total_with_vat: submitData.total_with_vat,
            status: submitData.status,
            due_date: submitData.due_date || undefined,
            paid_date: submitData.paid_date || undefined,
          };
          setInvoices([...invoices, mockNew]);
          return { data: mockNew };
        });
        if (newInvoice?.data) {
          setInvoices([...invoices, newInvoice.data]);
        }
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('Ошибка сохранения:', error);
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          alert(error.response.data.detail);
        } else if (Array.isArray(error.response.data.detail)) {
          const validationErrors: Record<string, string> = {};
          error.response.data.detail.forEach((err: any) => {
            if (err.loc && err.loc.length > 1) {
              validationErrors[err.loc[1]] = err.msg;
            }
          });
          setErrors(validationErrors);
        }
      } else {
        alert('Ошибка сохранения счета');
      }
    }
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setDeletingInvoice(invoice);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingInvoice) return;
    try {
      await axios.delete(`${API_URL}/invoices/${deletingInvoice.id}`).catch(() => {
        setInvoices(invoices.filter(inv => inv.id !== deletingInvoice.id));
      });
      setShowDeleteModal(false);
      setDeletingInvoice(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      draft: 'info',
      submitted: 'warn',
      verified: 'info',
      approved: 'ok',
      paid: 'ok',
      cancelled: 'danger',
    };
    return chips[status] || 'info';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Черновик',
      submitted: 'Подано',
      verified: 'Проверено',
      approved: 'Утверждено',
      paid: 'Оплачено',
      cancelled: 'Отменено',
    };
    return labels[status] || status;
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Проект #${projectId}`;
  };

  const getKS3Number = (ks3Id?: number) => {
    if (!ks3Id) return '-';
    const ks3 = ks3Forms.find(k => k.id === ks3Id);
    return ks3 ? ks3.number : `КС-3 #${ks3Id}`;
  };

  const filteredInvoices = invoices.filter(inv => {
    if (filters.status && inv.status !== filters.status) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        inv.invoice_number.toLowerCase().includes(search) ||
        (inv.contractor && inv.contractor.toLowerCase().includes(search)) ||
        getProjectName(inv.project_id).toLowerCase().includes(search)
      );
    }
    return true;
  });

  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredInvoices.length / pageSize);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Счета на оплату</span></div>
          <div className="h1">Счета на оплату</div>
          <p className="h2">Реестр счетов • создание из КС-3 • проверка и утверждение • отслеживание оплаты • связь с КС-3 и проектами.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#invoices" onClick={(e) => { e.preventDefault(); handleOpenModal(); }}>+ Создать счет</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр счетов</div>
              <div className="desc">Фильтрация • экспорт данных • поиск</div>
            </div>
            <span className="chip info">Связано с: Проекты, КС-3</span>
          </div>
          <div className="cardBody">
            {/* Фильтры */}
            <div className="toolbar" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--card)', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div className="filters" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Поиск по номеру, подрядчику, проекту..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setCurrentPage(1);
                  }}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--text)', minWidth: '250px' }}
                />
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value });
                    setCurrentPage(1);
                  }}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--text)' }}
                >
                  <option value="">Все статусы</option>
                  <option value="draft">Черновик</option>
                  <option value="submitted">Подано</option>
                  <option value="verified">Проверено</option>
                  <option value="approved">Утверждено</option>
                  <option value="paid">Оплачено</option>
                  <option value="cancelled">Отменено</option>
                </select>
                {(filters.search || filters.status) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setFilters({ status: '', search: '' });
                      setCurrentPage(1);
                    }}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '14%' }}>№ счета</th>
                  <th>Счет</th>
                  <th style={{ width: '16%' }}>Проект</th>
                  <th style={{ width: '12%' }} className="tRight">Сумма</th>
                  <th style={{ width: '12%' }} className="tRight">НДС</th>
                  <th style={{ width: '12%' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Счета не найдены</td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.invoice_number}</td>
                      <td>№{inv.invoice_number} от {new Date(inv.invoice_date).toLocaleDateString('ru-RU')}</td>
                      <td>{getProjectName(inv.project_id)}</td>
                      <td className="tRight">{inv.total_amount ? formatCurrencySimple(inv.total_amount, 'KGS') : '0'}</td>
                      <td className="tRight">{inv.vat_amount ? formatCurrencySimple(inv.vat_amount, 'KGS') : '0'}</td>
                      <td>
                        <span className={`chip ${getStatusChip(inv.status)}`}>
                          {getStatusLabel(inv.status)}
                        </span>
                      </td>
                      <td className="tRight">
                        <a className="btn small" href="#invoices" onClick={(e) => { e.preventDefault(); handleViewInvoice(inv); }}>Просмотр</a>
                        <a className="btn small" href="#invoices" onClick={(e) => { e.preventDefault(); handleOpenModal(inv); }} style={{ marginLeft: '8px' }}>Ред.</a>
                        <a className="btn small danger" href="#invoices" onClick={(e) => { e.preventDefault(); handleDeleteClick(inv); }} style={{ marginLeft: '8px' }}>Уд.</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="tableFooter">
              <div style={{ color: 'var(--muted2)', fontSize: '0.875rem' }}>
                Показано {paginatedInvoices.length} из {filteredInvoices.length} {filteredInvoices.length !== invoices.length && `(всего: ${invoices.length})`}
              </div>
              {totalPages > 1 && (
                <div className="pager">
                  <button className="btn small" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                  <span>Стр. {currentPage} из {totalPages}</span>
                  <button className="btn small" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Модальное окно создания/редактирования счета */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }} onClick={handleCloseModal}>
            <div className="card" style={{ maxWidth: '800px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
              <div className="cardHead">
                <div className="title">{editingInvoice ? 'Редактирование' : 'Создание'} счета</div>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '24px' }}>×</button>
              </div>
              <div className="cardBody">
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <label>Проект *</label>
                    <select
                      value={formData.project_id}
                      onChange={(e) => {
                        setFormData({ ...formData, project_id: e.target.value ? parseInt(e.target.value) : '' });
                        if (errors.project_id) setErrors({ ...errors, project_id: '' });
                      }}
                      required
                    >
                      <option value="">Выберите проект</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>КС-3</label>
                    <select
                      value={formData.ks3_id}
                      onChange={(e) => setFormData({ ...formData, ks3_id: e.target.value ? parseInt(e.target.value) : '' })}
                    >
                      <option value="">Не выбрано</option>
                      {ks3Forms.filter(k => !formData.project_id || k.project_id === formData.project_id).map(k => (
                        <option key={k.id} value={k.id}>{k.number}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Номер счета *</label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={(e) => {
                        setFormData({ ...formData, invoice_number: e.target.value });
                        if (errors.invoice_number) setErrors({ ...errors, invoice_number: '' });
                      }}
                      placeholder="СЧ-001/2024"
                      required
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Дата счета *</label>
                    <input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => {
                        setFormData({ ...formData, invoice_date: e.target.value });
                        if (errors.invoice_date) setErrors({ ...errors, invoice_date: '' });
                      }}
                      required
                    />
                  </div>

                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Подрядчик</label>
                    <input
                      type="text"
                      value={formData.contractor}
                      onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                      placeholder="Название организации подрядчика"
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Сумма без НДС *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, total_amount: value });
                        if (value) {
                          const total = parseFloat(value);
                          const vat = total * 0.2;
                          setFormData(prev => ({ ...prev, vat_amount: vat.toFixed(2), total_with_vat: (total + vat).toFixed(2) }));
                        }
                        if (errors.total_amount) setErrors({ ...errors, total_amount: '' });
                      }}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>НДС</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.vat_amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, vat_amount: value });
                        if (value && formData.total_amount) {
                          const total = parseFloat(formData.total_amount);
                          const vat = parseFloat(value);
                          setFormData(prev => ({ ...prev, total_with_vat: (total + vat).toFixed(2) }));
                        }
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Сумма с НДС</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_with_vat}
                      onChange={(e) => setFormData({ ...formData, total_with_vat: e.target.value })}
                      placeholder="0.00"
                      readOnly
                      style={{ background: 'var(--panel)' }}
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Срок оплаты</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      min={formData.invoice_date || undefined}
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Дата оплаты</label>
                    <input
                      type="date"
                      value={formData.paid_date}
                      onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
                      min={formData.invoice_date || undefined}
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Статус</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="draft">Черновик</option>
                      <option value="submitted">Подано</option>
                      <option value="verified">Проверено</option>
                      <option value="approved">Утверждено</option>
                    <option value="paid">Оплачено</option>
                    <option value="cancelled">Отменено</option>
                  </select>
                </div>

                  <div style={{ height: '20px' }} />
                  <div className="actions">
                    <button type="submit" className="btn primary">{editingInvoice ? 'Сохранить' : 'Создать'}</button>
                    <button type="button" className="btn" onClick={handleCloseModal}>Отмена</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно просмотра счета */}
        {showViewModal && viewingInvoice && (
          <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Просмотр счета: {viewingInvoice.invoice_number}</h2>
                <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="kpi">
                  <div className="kpiItem">
                    <div className="k">Проект</div>
                    <div className="v">{getProjectName(viewingInvoice.project_id)}</div>
                  </div>
                  <div className="kpiItem">
                    <div className="k">КС-3</div>
                    <div className="v">{getKS3Number(viewingInvoice.ks3_id)}</div>
                  </div>
                  <div className="kpiItem">
                    <div className="k">Дата счета</div>
                    <div className="v">{new Date(viewingInvoice.invoice_date).toLocaleDateString('ru-RU')}</div>
                  </div>
                  <div className="kpiItem">
                    <div className="k">Статус</div>
                    <div className="v">
                      <span className={`chip ${getStatusChip(viewingInvoice.status)}`}>
                        {getStatusLabel(viewingInvoice.status)}
                      </span>
                    </div>
                  </div>
                </div>
                {viewingInvoice.contractor && (
                  <div style={{ marginTop: '1rem' }}>
                    <div className="mini" style={{ color: 'var(--muted)' }}>Подрядчик</div>
                    <div style={{ color: 'var(--text)' }}>{viewingInvoice.contractor}</div>
                  </div>
                )}
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--panel)', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Сумма без НДС</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                        {formatCurrencySimple(viewingInvoice.total_amount, 'KGS')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>НДС</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                        {formatCurrencySimple(viewingInvoice.vat_amount, 'KGS')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Итого с НДС</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                        {formatCurrencySimple(viewingInvoice.total_with_vat, 'KGS')}
                      </div>
                    </div>
                  </div>
                </div>
                {(viewingInvoice.due_date || viewingInvoice.paid_date) && (
                  <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {viewingInvoice.due_date && (
                      <div>
                        <div className="mini" style={{ color: 'var(--muted)' }}>Срок оплаты</div>
                        <div style={{ color: 'var(--text)' }}>{new Date(viewingInvoice.due_date).toLocaleDateString('ru-RU')}</div>
                      </div>
                    )}
                    {viewingInvoice.paid_date && (
                      <div>
                        <div className="mini" style={{ color: 'var(--muted)' }}>Дата оплаты</div>
                        <div style={{ color: 'var(--text)' }}>{new Date(viewingInvoice.paid_date).toLocaleDateString('ru-RU')}</div>
                      </div>
                    )}
                  </div>
                )}
                <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Закрыть</button>
                  <button className="btn btn-primary" onClick={() => { setShowViewModal(false); handleOpenModal(viewingInvoice); }}>Редактировать</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно удаления */}
        {showDeleteModal && deletingInvoice && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Удаление счета</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Вы уверены, что хотите удалить счет <strong>"{deletingInvoice.invoice_number}"</strong>?</p>
                <p className="mini" style={{ marginTop: '0.5rem', color: 'var(--muted2)' }}>
                  Это действие нельзя отменить.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={() => setShowDeleteModal(false)}>Отмена</button>
                <button className="btn" style={{ background: 'var(--danger)' }} onClick={handleDeleteConfirm}>Удалить</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Invoices;
