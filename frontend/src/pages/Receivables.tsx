import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrencySimple } from '../utils/currency';

interface ReceivablePayment {
  id: number;
  payment_date: string;
  payment_number?: string;
  amount: number;
  payment_method?: string;
  received_by?: string;
  notes?: string;
}

interface ReceivableNotification {
  id: number;
  notification_date: string;
  notification_type: string;
  sent_to: string;
  subject?: string;
  content?: string;
  status: string;
}

interface CollectionAction {
  id: number;
  action_date: string;
  action_type: string;
  description?: string;
  responsible: string;
  status: string;
  result?: string;
}

interface Receivable {
  id: number;
  project_id: number;
  customer_name: string;
  invoice_number?: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount?: number;
  days_overdue: number;
  status: string;
  payments?: ReceivablePayment[];
  notifications?: ReceivableNotification[];
  collection_actions?: CollectionAction[];
  project?: { id: number; name: string };
}

interface Project {
  id: number;
  name: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
}

const Receivables: React.FC = () => {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'payments' | 'notifications' | 'actions' | 'analytics'>('payments');
  const [filters, setFilters] = useState({ status: '', overdue_only: false, search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    customer_name: '',
    invoice_id: '' as number | '',
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    total_amount: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_number: '',
    amount: '',
    payment_method: '',
    bank_account: '',
    received_by: '',
    notes: '',
  });
  const [notificationForm, setNotificationForm] = useState({
    notification_date: new Date().toISOString().split('T')[0],
    notification_type: 'reminder',
    sent_to: '',
    subject: '',
    content: '',
  });
  const [actionForm, setActionForm] = useState({
    action_date: new Date().toISOString().split('T')[0],
    action_type: 'phone_call',
    description: '',
    responsible: '',
    result: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    if (selectedReceivable) {
      fetchReceivableDetails(selectedReceivable.id);
    }
  }, [selectedReceivable]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, overviewRes, projectsRes, invoicesRes] = await Promise.all([
        axios.get(`${API_URL}/receivables/`, { params: { overdue_only: filters.overdue_only, status: filters.status || undefined } }),
        axios.get(`${API_URL}/receivables/analytics/overview`),
        axios.get(`${API_URL}/projects/`),
        axios.get(`${API_URL}/invoices/`),
      ]);
      setReceivables(recRes.data);
      setOverview(overviewRes.data);
      setProjects(projectsRes.data);
      setInvoices(invoicesRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivableDetails = async (id: number) => {
    try {
      const [detailRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/receivables/${id}`),
        axios.get(`${API_URL}/receivables/${id}/analytics`),
      ]);
      setSelectedReceivable(detailRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        project_id: Number(formData.project_id),
        invoice_id: formData.invoice_id ? Number(formData.invoice_id) : undefined,
        total_amount: parseFloat(formData.total_amount),
        invoice_date: formData.invoice_date || null,
        due_date: formData.due_date || null,
      };
      await axios.post(`${API_URL}/receivables/`, data);
      setShowModal(false);
      setFormData({ project_id: '', customer_name: '', invoice_id: '', invoice_number: '', invoice_date: '', due_date: '', total_amount: '' });
      fetchData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения задолженности');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivable) return;
    try {
      const data = {
        ...paymentForm,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date || null,
      };
      await axios.post(`${API_URL}/receivables/${selectedReceivable.id}/payment`, data);
      setShowPaymentModal(false);
      setPaymentForm({ payment_date: new Date().toISOString().split('T')[0], payment_number: '', amount: '', payment_method: '', bank_account: '', received_by: '', notes: '' });
      fetchReceivableDetails(selectedReceivable.id);
      fetchData();
    } catch (error) {
      console.error('Ошибка сохранения платежа:', error);
      alert('Ошибка сохранения платежа');
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivable) return;
    try {
      await axios.post(`${API_URL}/receivables/${selectedReceivable.id}/notification`, notificationForm);
      setShowNotificationModal(false);
      setNotificationForm({ notification_date: new Date().toISOString().split('T')[0], notification_type: 'reminder', sent_to: '', subject: '', content: '' });
      fetchReceivableDetails(selectedReceivable.id);
    } catch (error) {
      console.error('Ошибка сохранения уведомления:', error);
      alert('Ошибка сохранения уведомления');
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivable) return;
    try {
      await axios.post(`${API_URL}/receivables/${selectedReceivable.id}/collection-action`, actionForm);
      setShowActionModal(false);
      setActionForm({ action_date: new Date().toISOString().split('T')[0], action_type: 'phone_call', description: '', responsible: '', result: '' });
      fetchReceivableDetails(selectedReceivable.id);
      fetchData();
    } catch (error) {
      console.error('Ошибка сохранения меры взыскания:', error);
      alert('Ошибка сохранения меры взыскания');
    }
  };

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      pending: 'info',
      partially_paid: 'warn',
      paid: 'ok',
      overdue: 'danger',
      in_collection: 'danger',
      written_off: 'danger',
    };
    return chips[status] || 'info';
  };

  const filteredReceivables = receivables.filter(r => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!r.customer_name.toLowerCase().includes(search) && !(r.invoice_number?.toLowerCase().includes(search))) return false;
    }
    return true;
  });

  const paginatedReceivables = filteredReceivables.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredReceivables.length / pageSize);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Дебиторская задолженность</span></div>
          <div className="h1">Дебиторская задолженность</div>
          <p className="h2">Список • фильтрация • ввод платежей • уведомления • меры взыскания • аналитика.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#receivables" onClick={(e) => { e.preventDefault(); setShowModal(true); }}>+ Добавить</a>
        </div>
      </div>

      {overview && (
        <div className="card" style={{ marginBottom: '14px' }}>
          <div className="cardHead">
            <div className="title">Общая аналитика</div>
          </div>
          <div className="cardBody">
            <div className="kpi">
              <div className="kpiItem">
                <div className="k">Всего задолженности</div>
                <div className="v">
                  <div>{formatCurrencySimple(parseFloat(overview.total_amount || 0), 'KGS')}</div>
                  <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(parseFloat(overview.total_amount || 0) / 89, 'USD')}</div>
                </div>
              </div>
              <div className="kpiItem">
                <div className="k">Остаток</div>
                <div className="v">
                  <div>{formatCurrencySimple(parseFloat(overview.total_remaining || 0), 'KGS')}</div>
                  <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(parseFloat(overview.total_remaining || 0) / 89, 'USD')}</div>
                </div>
              </div>
              <div className="kpiItem">
                <div className="k">Просрочено</div>
                <div className="v"><span className="chip danger">{overview.overdue_count}</span></div>
                <div className="s">
                  <div>{formatCurrencySimple(parseFloat(overview.overdue_amount || 0), 'KGS')}</div>
                  <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(parseFloat(overview.overdue_amount || 0) / 89, 'USD')}</div>
                </div>
              </div>
              <div className="kpiItem">
                <div className="k">Оплачено</div>
                <div className="v">
                  <div>{formatCurrencySimple(parseFloat(overview.total_paid || 0), 'KGS')}</div>
                  <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(parseFloat(overview.total_paid || 0) / 89, 'USD')}</div>
                </div>
                <div className="s">{parseFloat(overview.payment_percentage || 0).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр задолженности</div>
              <div className="desc">GET /api/v1/receivables • фильтрация • платежи</div>
            </div>
            <span className="chip info">Связь: project_id • invoice_id</span>
          </div>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Статус</label>
                  <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                    <option value="">Все</option>
                    <option value="pending">Ожидает оплаты</option>
                    <option value="partially_paid">Частично оплачено</option>
                    <option value="paid">Оплачено</option>
                    <option value="overdue">Просрочено</option>
                  </select>
                </div>
                <div className="field">
                  <label>Поиск</label>
                  <input type="text" placeholder="Клиент или № счета..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                </div>
                <div className="field">
                  <label>
                    <input type="checkbox" checked={filters.overdue_only} onChange={(e) => setFilters({...filters, overdue_only: e.target.checked})} /> Только просроченные
                  </label>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>№ счета</th>
                  <th>Дебитор</th>
                  <th style={{ width: '12%' }} className="tRight">Сумма</th>
                  <th style={{ width: '12%' }} className="tRight">Оплачено</th>
                  <th style={{ width: '12%' }} className="tRight">Остаток</th>
                  <th style={{ width: '10%' }}>Дней проср.</th>
                  <th style={{ width: '12%' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReceivables.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Задолженность не найдена</td>
                  </tr>
                ) : (
                  paginatedReceivables.map((r) => (
                    <tr key={r.id}>
                      <td>{r.invoice_number || '—'}</td>
                      <td>{r.customer_name}</td>
                      <td className="tRight">{r.total_amount ? formatCurrencySimple(r.total_amount, 'KGS') : '0'}</td>
                      <td className="tRight">{r.paid_amount ? formatCurrencySimple(r.paid_amount, 'KGS') : '0'}</td>
                      <td className="tRight">{r.remaining_amount ? formatCurrencySimple(r.remaining_amount, 'KGS') : '0'}</td>
                      <td>{r.days_overdue > 0 ? <span className="chip danger">{r.days_overdue}</span> : '0'}</td>
                      <td><span className={`chip ${getStatusChip(r.status)}`}>{r.status}</span></td>
                      <td className="tRight">
                        <a className="btn small" href="#receivables" onClick={(e) => { e.preventDefault(); fetchReceivableDetails(r.id); setSelectedReceivable(r); }}>Открыть</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="tableFooter">
                <div className="pager">
                  <button className="btn small" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                  <span>Стр. {currentPage} из {totalPages}</span>
                  <button className="btn small" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedReceivable && (
          <div className="card">
            <div className="cardHead">
              <div>
                <div className="title">Задолженность: {selectedReceivable.customer_name}</div>
                <div className="desc">Платежи • уведомления • меры взыскания • аналитика</div>
              </div>
              <button className="btn ghost small" onClick={() => setSelectedReceivable(null)}>✕</button>
            </div>
            <div className="cardBody">
              <div className="tabs">
                <div className={`tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>Платежи ({selectedReceivable.payments?.length || 0})</div>
                <div className={`tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>Уведомления ({selectedReceivable.notifications?.length || 0})</div>
                <div className={`tab ${activeTab === 'actions' ? 'active' : ''}`} onClick={() => setActiveTab('actions')}>Меры взыскания ({selectedReceivable.collection_actions?.length || 0})</div>
                <div className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Аналитика</div>
              </div>

              {activeTab === 'payments' && (
                <>
                  <div className="toolbar" style={{ marginTop: '10px' }}>
                    <a className="btn primary small" href="#receivables" onClick={(e) => { e.preventDefault(); setShowPaymentModal(true); }}>+ Добавить платеж</a>
                  </div>
                  <table style={{ marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '12%' }}>Дата</th>
                        <th style={{ width: '12%' }}>№</th>
                        <th style={{ width: '15%' }} className="tRight">Сумма</th>
                        <th>Способ</th>
                        <th>Принял</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReceivable.payments?.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Платежи не найдены</td>
                        </tr>
                      ) : (
                        selectedReceivable.payments?.map((p) => (
                          <tr key={p.id}>
                            <td>{new Date(p.payment_date).toLocaleDateString('ru-RU')}</td>
                            <td>{p.payment_number || '—'}</td>
                            <td className="tRight">{p.amount ? formatCurrencySimple(p.amount, 'KGS') : '0'}</td>
                            <td>{p.payment_method || '—'}</td>
                            <td>{p.received_by || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {activeTab === 'notifications' && (
                <>
                  <div className="toolbar" style={{ marginTop: '10px' }}>
                    <a className="btn primary small" href="#receivables" onClick={(e) => { e.preventDefault(); setShowNotificationModal(true); }}>+ Создать уведомление</a>
                  </div>
                  <table style={{ marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '12%' }}>Дата</th>
                        <th>Тип</th>
                        <th>Кому</th>
                        <th>Тема</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReceivable.notifications?.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Уведомления не найдены</td>
                        </tr>
                      ) : (
                        selectedReceivable.notifications?.map((n) => (
                          <tr key={n.id}>
                            <td>{new Date(n.notification_date).toLocaleDateString('ru-RU')}</td>
                            <td>{n.notification_type}</td>
                            <td>{n.sent_to}</td>
                            <td>{n.subject || '—'}</td>
                            <td><span className="chip info">{n.status}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {activeTab === 'actions' && (
                <>
                  <div className="toolbar" style={{ marginTop: '10px' }}>
                    <a className="btn primary small" href="#receivables" onClick={(e) => { e.preventDefault(); setShowActionModal(true); }}>+ Добавить меру взыскания</a>
                  </div>
                  <table style={{ marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '12%' }}>Дата</th>
                        <th>Тип</th>
                        <th>Ответственный</th>
                        <th>Описание</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReceivable.collection_actions?.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Меры взыскания не найдены</td>
                        </tr>
                      ) : (
                        selectedReceivable.collection_actions?.map((a) => (
                          <tr key={a.id}>
                            <td>{new Date(a.action_date).toLocaleDateString('ru-RU')}</td>
                            <td>{a.action_type}</td>
                            <td>{a.responsible}</td>
                            <td>{a.description || '—'}</td>
                            <td><span className="chip info">{a.status}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {activeTab === 'analytics' && analytics && (
                <div style={{ padding: '20px' }}>
                  <div className="kpi">
                    <div className="kpiItem">
                      <div className="k">Общая сумма</div>
                      <div className="v">
                        <div>{formatCurrencySimple(parseFloat(analytics.total_amount || 0), 'KGS')}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(parseFloat(analytics.total_amount || 0) / 89, 'USD')}</div>
                      </div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Оплачено</div>
                      <div className="v">
                        <div>{formatCurrencySimple(parseFloat(analytics.paid_amount || 0), 'KGS')}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(parseFloat(analytics.paid_amount || 0) / 89, 'USD')}</div>
                      </div>
                      <div className="s">{parseFloat(analytics.payment_percentage || 0).toFixed(1)}%</div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Остаток</div>
                      <div className="v">
                        <div>{formatCurrencySimple(parseFloat(analytics.remaining_amount || 0), 'KGS')}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(parseFloat(analytics.remaining_amount || 0) / 89, 'USD')}</div>
                      </div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Дней просрочки</div>
                      <div className="v"><span className="chip danger">{analytics.days_overdue || 0}</span></div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Платежей</div>
                      <div className="v">{analytics.total_payments || 0}</div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Уведомлений</div>
                      <div className="v">{analytics.total_notifications || 0}</div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Мер взыскания</div>
                      <div className="v">{analytics.total_collection_actions || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">Создание задолженности</div>
              <button className="btn ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Проект *</label>
                  <select value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value ? parseInt(e.target.value) : ''})} required>
                    <option value="">Выберите проект</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Счет на оплату</label>
                  <select value={formData.invoice_id} onChange={(e) => {
                    const invId = e.target.value ? parseInt(e.target.value) : '';
                    const invoice = invoices.find(inv => inv.id === invId);
                    setFormData({...formData, invoice_id: invId, invoice_number: invoice?.invoice_number || ''});
                  }}>
                    <option value="">Не выбран</option>
                    {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoice_number}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дебитор *</label>
                  <input type="text" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>№ счета</label>
                  <input type="text" value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата счета</label>
                  <input type="date" value={formData.invoice_date} onChange={(e) => setFormData({...formData, invoice_date: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Срок оплаты *</label>
                  <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Сумма *</label>
                  <input type="number" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} required />
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedReceivable && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">Добавление платежа</div>
              <button className="btn ghost" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handlePaymentSubmit}>
                <div className="field">
                  <label>Дата платежа *</label>
                  <input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Номер платежа</label>
                  <input type="text" value={paymentForm.payment_number} onChange={(e) => setPaymentForm({...paymentForm, payment_number: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Сумма *</label>
                  <input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Способ оплаты</label>
                  <input type="text" value={paymentForm.payment_method} onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Принял</label>
                  <input type="text" value={paymentForm.received_by} onChange={(e) => setPaymentForm({...paymentForm, received_by: e.target.value})} />
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowPaymentModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showNotificationModal && selectedReceivable && (
        <div className="modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">Создание уведомления</div>
              <button className="btn ghost" onClick={() => setShowNotificationModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleNotificationSubmit}>
                <div className="field">
                  <label>Дата *</label>
                  <input type="date" value={notificationForm.notification_date} onChange={(e) => setNotificationForm({...notificationForm, notification_date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Тип *</label>
                  <select value={notificationForm.notification_type} onChange={(e) => setNotificationForm({...notificationForm, notification_type: e.target.value})} required>
                    <option value="reminder">Напоминание</option>
                    <option value="warning">Предупреждение</option>
                    <option value="final_notice">Финальное уведомление</option>
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Кому *</label>
                  <input type="text" value={notificationForm.sent_to} onChange={(e) => setNotificationForm({...notificationForm, sent_to: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Тема</label>
                  <input type="text" value={notificationForm.subject} onChange={(e) => setNotificationForm({...notificationForm, subject: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Содержание</label>
                  <textarea value={notificationForm.content} onChange={(e) => setNotificationForm({...notificationForm, content: e.target.value})} />
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowNotificationModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showActionModal && selectedReceivable && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">Добавление меры взыскания</div>
              <button className="btn ghost" onClick={() => setShowActionModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleActionSubmit}>
                <div className="field">
                  <label>Дата *</label>
                  <input type="date" value={actionForm.action_date} onChange={(e) => setActionForm({...actionForm, action_date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Тип меры *</label>
                  <select value={actionForm.action_type} onChange={(e) => setActionForm({...actionForm, action_type: e.target.value})} required>
                    <option value="phone_call">Телефонный звонок</option>
                    <option value="email">Email</option>
                    <option value="letter">Письмо</option>
                    <option value="legal_action">Правовые действия</option>
                    <option value="lawsuit">Иск в суд</option>
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Ответственный *</label>
                  <input type="text" value={actionForm.responsible} onChange={(e) => setActionForm({...actionForm, responsible: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Описание</label>
                  <textarea value={actionForm.description} onChange={(e) => setActionForm({...actionForm, description: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Результат</label>
                  <textarea value={actionForm.result} onChange={(e) => setActionForm({...actionForm, result: e.target.value})} />
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowActionModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Receivables;
