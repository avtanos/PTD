import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrencySimple } from '../utils/currency';

interface SalesProposalItem {
  id?: number;
  line_number?: number;
  work_name: string;
  unit?: string;
  quantity?: number;
  unit_price: number;
  amount?: number;
  notes?: string;
}

interface SalesProposal {
  id: number;
  project_id: number;
  proposal_number: string;
  proposal_date: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  total_amount: number;
  discount_percentage: number;
  discount_amount: number;
  final_amount: number;
  status: string;
  sent_date?: string;
  items?: SalesProposalItem[];
  project?: { id: number; name: string };
}

interface CustomerAgreement {
  id: number;
  project_id: number;
  proposal_id?: number;
  estimate_id?: number;
  agreement_date: string;
  customer_name: string;
  agreed_amount: number;
  agreement_status: string;
  agreed_by?: string;
  sales_manager: string;
  project?: { id: number; name: string };
}

interface Project {
  id: number;
  name: string;
}

interface Estimate {
  id: number;
  project_id: number;
  name: string;
  number: string;
  total_amount: number;
}

const Sales: React.FC = () => {
  const [proposals, setProposals] = useState<SalesProposal[]>([]);
  const [agreements, setAgreements] = useState<CustomerAgreement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<SalesProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'proposals' | 'agreements'>('proposals');
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [proposalForm, setProposalForm] = useState({
    project_id: '' as number | '',
    proposal_number: '',
    proposal_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    total_amount: '',
    discount_percentage: '0',
    validity_period: '',
    payment_terms: '',
    delivery_terms: '',
    prepared_by: '',
    notes: '',
    items: [] as SalesProposalItem[],
  });
  const [agreementForm, setAgreementForm] = useState({
    project_id: '' as number | '',
    proposal_id: '' as number | '',
    estimate_id: '' as number | '',
    agreement_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    agreed_amount: '',
    agreement_status: 'pending',
    agreed_by: '',
    sales_manager: '',
    changes_requested: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (selectedProposal) {
      fetchProposalDetails(selectedProposal.id);
    }
  }, [selectedProposal]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [propRes, agreeRes, projectsRes, estimatesRes] = await Promise.all([
        axios.get(`${API_URL}/sales/proposals/`, { params: { status: filters.status || undefined } }),
        axios.get(`${API_URL}/sales/agreements/`),
        axios.get(`${API_URL}/projects/`),
        axios.get(`${API_URL}/estimates/`),
      ]);
      setProposals(propRes.data);
      setAgreements(agreeRes.data);
      setProjects(projectsRes.data);
      setEstimates(estimatesRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposalDetails = async (id: number) => {
    try {
      const res = await axios.get(`${API_URL}/sales/proposals/${id}`);
      setSelectedProposal(res.data);
    } catch (error) {
      console.error('Ошибка загрузки КП:', error);
    }
  };

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...proposalForm,
        project_id: Number(proposalForm.project_id),
        total_amount: parseFloat(proposalForm.total_amount || '0'),
        discount_percentage: parseFloat(proposalForm.discount_percentage || '0'),
        validity_period: proposalForm.validity_period || undefined,
        items: proposalForm.items.map(item => ({
          ...item,
          quantity: item.quantity ? Number(item.quantity) : undefined,
          unit_price: Number(item.unit_price),
          amount: item.amount || (item.unit_price * (item.quantity || 1)),
        })),
      };
      await axios.post(`${API_URL}/sales/proposals/`, data);
      setShowProposalModal(false);
      setProposalForm({ project_id: '', proposal_number: '', proposal_date: new Date().toISOString().split('T')[0], customer_name: '', customer_phone: '', customer_email: '', total_amount: '', discount_percentage: '0', validity_period: '', payment_terms: '', delivery_terms: '', prepared_by: '', notes: '', items: [] });
      fetchData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения КП');
    }
  };

  const handleAgreementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...agreementForm,
        project_id: Number(agreementForm.project_id),
        proposal_id: agreementForm.proposal_id ? Number(agreementForm.proposal_id) : undefined,
        estimate_id: agreementForm.estimate_id ? Number(agreementForm.estimate_id) : undefined,
        agreed_amount: parseFloat(agreementForm.agreed_amount || '0'),
        agreement_date: agreementForm.agreement_date || null,
      };
      await axios.post(`${API_URL}/sales/agreements/`, data);
      setShowAgreementModal(false);
      setAgreementForm({ project_id: '', proposal_id: '', estimate_id: '', agreement_date: new Date().toISOString().split('T')[0], customer_name: '', agreed_amount: '', agreement_status: 'pending', agreed_by: '', sales_manager: '', changes_requested: '', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения согласования');
    }
  };

  const handleSendProposal = async (id: number) => {
    if (!window.confirm('Отправить КП клиенту?')) return;
    try {
      await axios.put(`${API_URL}/sales/proposals/${id}/send`);
      fetchData();
      if (selectedProposal?.id === id) {
        fetchProposalDetails(id);
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
    }
  };

  const createFromEstimate = async () => {
    if (!agreementForm.estimate_id) {
      alert('Выберите смету');
      return;
    }
    try {
      const estimate = estimates.find(e => e.id === agreementForm.estimate_id);
      if (estimate) {
        setProposalForm(prev => ({
          ...prev,
          project_id: agreementForm.project_id,
          total_amount: estimate.total_amount?.toString() || '0',
          items: [],
        }));
        setShowAgreementModal(false);
        setShowProposalModal(true);
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const addProposalItem = () => {
    setProposalForm({
      ...proposalForm,
      items: [...proposalForm.items, { work_name: '', unit_price: 0, quantity: 1 }],
    });
  };

  const removeProposalItem = (index: number) => {
    setProposalForm({
      ...proposalForm,
      items: proposalForm.items.filter((_, i) => i !== index),
    });
  };

  const updateProposalItem = (index: number, field: keyof SalesProposalItem, value: any) => {
    const newItems = [...proposalForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? Number(value) : Number(newItems[index].quantity || 1);
      const price = field === 'unit_price' ? Number(value) : Number(newItems[index].unit_price || 0);
      newItems[index].amount = qty * price;
    }
    setProposalForm({ ...proposalForm, items: newItems });
  };

  const calculateProposalTotal = () => {
    const itemsTotal = proposalForm.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const discount = (itemsTotal * parseFloat(proposalForm.discount_percentage || '0')) / 100;
    return itemsTotal - discount;
  };

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      draft: 'info',
      sent: 'warn',
      under_review: 'info',
      approved: 'ok',
      rejected: 'danger',
      expired: 'danger',
    };
    return chips[status] || 'info';
  };

  const filteredProposals = proposals.filter(p => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!p.proposal_number.toLowerCase().includes(search) && !p.customer_name.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  const paginatedProposals = filteredProposals.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredProposals.length / pageSize);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Отдел продаж</span></div>
          <div className="h1">Отдел продаж</div>
          <p className="h2">Коммерческие предложения • создание КП из сметы • отправка клиенту • согласования с клиентами.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#sales" onClick={(e) => { e.preventDefault(); setShowProposalModal(true); }}>+ Создать КП</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Управление продажами</div>
              <div className="desc">GET /api/v1/sales/* • КП, согласования</div>
            </div>
          </div>
          <div className="cardBody">
            <div className="tabs">
              <div className={`tab ${activeTab === 'proposals' ? 'active' : ''}`} onClick={() => setActiveTab('proposals')}>Коммерческие предложения</div>
              <div className={`tab ${activeTab === 'agreements' ? 'active' : ''}`} onClick={() => setActiveTab('agreements')}>Согласования</div>
            </div>

            {activeTab === 'proposals' && (
              <>
                <div className="toolbar" style={{ marginTop: '10px' }}>
                  <div className="filters">
                    <div className="field">
                      <label>Статус</label>
                      <select value={filters.status} onChange={(e) => { setFilters({...filters, status: e.target.value}); fetchData(); }}>
                        <option value="">Все</option>
                        <option value="draft">draft</option>
                        <option value="sent">sent</option>
                        <option value="approved">approved</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Поиск</label>
                      <input type="text" placeholder="№ или клиент..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                    </div>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '12%' }}>№ КП</th>
                      <th>Клиент</th>
                      <th style={{ width: '16%' }}>Проект</th>
                      <th style={{ width: '12%' }} className="tRight">Сумма</th>
                      <th style={{ width: '12%' }}>Дата</th>
                      <th style={{ width: '12%' }}>Статус</th>
                      <th className="tRight" style={{ width: '14%' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProposals.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>КП не найдены</td>
                      </tr>
                    ) : (
                      paginatedProposals.map((p) => (
                        <tr key={p.id}>
                          <td>{p.proposal_number}</td>
                          <td>{p.customer_name}</td>
                          <td>{p.project?.name || `ID: ${p.project_id}`}</td>
                          <td className="tRight">{p.final_amount ? formatCurrencySimple(p.final_amount, 'KGS') : '0'}</td>
                          <td>{new Date(p.proposal_date).toLocaleDateString('ru-RU')}</td>
                          <td><span className={`chip ${getStatusChip(p.status)}`}>{p.status}</span></td>
                          <td className="tRight">
                            <a className="btn small" href="#sales" onClick={(e) => { e.preventDefault(); fetchProposalDetails(p.id); setSelectedProposal(p); }}>Открыть</a>
                            {p.status === 'draft' && (
                              <a className="btn small" href="#sales" onClick={(e) => { e.preventDefault(); handleSendProposal(p.id); }} style={{marginLeft: '6px'}}>Отправить</a>
                            )}
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
              </>
            )}

            {activeTab === 'agreements' && (
              <>
                <div className="toolbar" style={{ marginTop: '10px' }}>
                  <a className="btn primary" href="#sales" onClick={(e) => { e.preventDefault(); setShowAgreementModal(true); }}>+ Создать согласование</a>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '8%' }}>ID</th>
                      <th>Клиент</th>
                      <th style={{ width: '16%' }}>Проект</th>
                      <th style={{ width: '14%' }} className="tRight">Согласованная сумма</th>
                      <th style={{ width: '12%' }}>Дата</th>
                      <th style={{ width: '12%' }}>Статус</th>
                      <th className="tRight" style={{ width: '14%' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Согласования не найдены</td>
                      </tr>
                    ) : (
                      agreements.map((a) => (
                        <tr key={a.id}>
                          <td>{a.id}</td>
                          <td>{a.customer_name}</td>
                          <td>{a.project?.name || `ID: ${a.project_id}`}</td>
                          <td className="tRight">{a.agreed_amount ? formatCurrencySimple(a.agreed_amount, 'KGS') : '0'}</td>
                          <td>{new Date(a.agreement_date).toLocaleDateString('ru-RU')}</td>
                          <td><span className="chip info">{a.agreement_status}</span></td>
                          <td className="tRight"><a className="btn small" href={`#sales?agreement=${a.id}`}>Открыть</a></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        {selectedProposal && activeTab === 'proposals' && (
          <div className="card">
            <div className="cardHead">
              <div>
                <div className="title">КП: {selectedProposal.proposal_number}</div>
                <div className="desc">Позиции • скидки • статус</div>
              </div>
              <button className="btn ghost small" onClick={() => setSelectedProposal(null)}>✕</button>
            </div>
            <div className="cardBody">
              <div className="kpi" style={{ marginBottom: '20px' }}>
                <div className="kpiItem">
                  <div className="k">Общая сумма</div>
                  <div className="v">
                    <div>{formatCurrencySimple(selectedProposal.total_amount, 'KGS')}</div>
                    <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(selectedProposal.total_amount ? selectedProposal.total_amount / 89 : null, 'USD')}</div>
                  </div>
                </div>
                <div className="kpiItem">
                  <div className="k">Скидка</div>
                  <div className="v">{selectedProposal.discount_percentage}%</div>
                  <div className="s">
                    <div>{formatCurrencySimple(selectedProposal.discount_amount, 'KGS')}</div>
                    <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(selectedProposal.discount_amount ? selectedProposal.discount_amount / 89 : null, 'USD')}</div>
                  </div>
                </div>
                <div className="kpiItem">
                  <div className="k">Итоговая сумма</div>
                  <div className="v">
                    <div>{formatCurrencySimple(selectedProposal.final_amount, 'KGS')}</div>
                    <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(selectedProposal.final_amount ? selectedProposal.final_amount / 89 : null, 'USD')}</div>
                  </div>
                </div>
                <div className="kpiItem">
                  <div className="k">Статус</div>
                  <div className="v"><span className={`chip ${getStatusChip(selectedProposal.status)}`}>{selectedProposal.status}</span></div>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Позиция</th>
                    <th>Ед.</th>
                    <th className="tRight">Кол-во</th>
                    <th className="tRight">Цена</th>
                    <th className="tRight">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProposal.items?.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Позиции не найдены</td>
                    </tr>
                  ) : (
                    selectedProposal.items?.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td>{item.work_name}</td>
                        <td>{item.unit || '—'}</td>
                        <td className="tRight">{item.quantity || '—'}</td>
                        <td className="tRight">{item.unit_price ? formatCurrencySimple(item.unit_price, 'KGS') : '—'}</td>
                        <td className="tRight">{item.amount ? formatCurrencySimple(item.amount, 'KGS') : '0'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showProposalModal && (
        <div className="modal-overlay" onClick={() => setShowProposalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="cardHead">
              <div className="title">Создание коммерческого предложения</div>
              <button className="btn ghost" onClick={() => setShowProposalModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleProposalSubmit}>
                <div className="field">
                  <label>Проект *</label>
                  <select value={proposalForm.project_id} onChange={(e) => setProposalForm({...proposalForm, project_id: e.target.value ? parseInt(e.target.value) : ''})} required>
                    <option value="">Выберите проект</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Номер КП *</label>
                  <input type="text" value={proposalForm.proposal_number} onChange={(e) => setProposalForm({...proposalForm, proposal_number: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата *</label>
                  <input type="date" value={proposalForm.proposal_date} onChange={(e) => setProposalForm({...proposalForm, proposal_date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Клиент *</label>
                  <input type="text" value={proposalForm.customer_name} onChange={(e) => setProposalForm({...proposalForm, customer_name: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Телефон</label>
                  <input type="text" value={proposalForm.customer_phone} onChange={(e) => setProposalForm({...proposalForm, customer_phone: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={proposalForm.customer_email} onChange={(e) => setProposalForm({...proposalForm, customer_email: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Общая сумма *</label>
                  <input type="number" step="0.01" value={proposalForm.total_amount} onChange={(e) => setProposalForm({...proposalForm, total_amount: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Скидка (%)</label>
                  <input type="number" step="0.01" value={proposalForm.discount_percentage} onChange={(e) => setProposalForm({...proposalForm, discount_percentage: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Подготовил *</label>
                  <input type="text" value={proposalForm.prepared_by} onChange={(e) => setProposalForm({...proposalForm, prepared_by: e.target.value})} required />
                </div>

                <div style={{ height: '20px', borderTop: '1px solid var(--line)', margin: '20px 0', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div className="title">Позиции КП</div>
                    <button type="button" className="btn small" onClick={addProposalItem}>+ Добавить позицию</button>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Наименование *</th>
                        <th>Ед.</th>
                        <th className="tRight">Кол-во</th>
                        <th className="tRight">Цена *</th>
                        <th className="tRight">Сумма</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposalForm.items.map((item, idx) => (
                        <tr key={idx}>
                          <td><input type="text" value={item.work_name} onChange={(e) => updateProposalItem(idx, 'work_name', e.target.value)} style={{ width: '100%' }} required /></td>
                          <td><input type="text" value={item.unit || ''} onChange={(e) => updateProposalItem(idx, 'unit', e.target.value)} style={{ width: '60px' }} /></td>
                          <td><input type="number" step="0.01" value={item.quantity || ''} onChange={(e) => updateProposalItem(idx, 'quantity', e.target.value)} style={{ width: '80px', textAlign: 'right' }} /></td>
                          <td><input type="number" step="0.01" value={item.unit_price || ''} onChange={(e) => updateProposalItem(idx, 'unit_price', e.target.value)} style={{ width: '100px', textAlign: 'right' }} required /></td>
                          <td className="tRight">{item.amount ? formatCurrencySimple(item.amount, 'KGS') : '0'}</td>
                          <td><button type="button" className="btn small danger" onClick={() => removeProposalItem(idx)}>Уд.</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: '10px', background: 'var(--card)', borderRadius: '12px', marginTop: '20px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'right' }}>
                    Итого: {formatCurrencySimple(calculateProposalTotal(), 'KGS')} / {formatCurrencySimple(calculateProposalTotal() / 89, 'USD')}
                  </div>
                </div>

                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowProposalModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAgreementModal && (
        <div className="modal-overlay" onClick={() => setShowAgreementModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">Создание согласования</div>
              <button className="btn ghost" onClick={() => setShowAgreementModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleAgreementSubmit}>
                <div className="field">
                  <label>Проект *</label>
                  <select value={agreementForm.project_id} onChange={(e) => setAgreementForm({...agreementForm, project_id: e.target.value ? parseInt(e.target.value) : ''})} required>
                    <option value="">Выберите проект</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>КП (опционально)</label>
                  <select value={agreementForm.proposal_id} onChange={(e) => setAgreementForm({...agreementForm, proposal_id: e.target.value ? parseInt(e.target.value) : ''})}>
                    <option value="">Не выбрано</option>
                    {proposals.filter(p => !agreementForm.project_id || p.project_id === agreementForm.project_id).map(p => (
                      <option key={p.id} value={p.id}>{p.proposal_number} - {p.customer_name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Смета (для создания КП)</label>
                  <select value={agreementForm.estimate_id} onChange={(e) => setAgreementForm({...agreementForm, estimate_id: e.target.value ? parseInt(e.target.value) : ''})}>
                    <option value="">Не выбрано</option>
                    {estimates.filter(e => !agreementForm.project_id || e.project_id === agreementForm.project_id).map(e => (
                      <option key={e.id} value={e.id}>{e.number} - {e.name}</option>
                    ))}
                  </select>
                </div>
                {agreementForm.estimate_id && (
                  <div style={{ marginTop: '10px' }}>
                    <a className="btn small" href="#sales" onClick={(e) => { e.preventDefault(); createFromEstimate(); }}>Создать КП из сметы</a>
                  </div>
                )}
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата согласования *</label>
                  <input type="date" value={agreementForm.agreement_date} onChange={(e) => setAgreementForm({...agreementForm, agreement_date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Клиент *</label>
                  <input type="text" value={agreementForm.customer_name} onChange={(e) => setAgreementForm({...agreementForm, customer_name: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Согласованная сумма *</label>
                  <input type="number" step="0.01" value={agreementForm.agreed_amount} onChange={(e) => setAgreementForm({...agreementForm, agreed_amount: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Статус согласования *</label>
                  <select value={agreementForm.agreement_status} onChange={(e) => setAgreementForm({...agreementForm, agreement_status: e.target.value})} required>
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Менеджер по продажам *</label>
                  <input type="text" value={agreementForm.sales_manager} onChange={(e) => setAgreementForm({...agreementForm, sales_manager: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Согласовал</label>
                  <input type="text" value={agreementForm.agreed_by} onChange={(e) => setAgreementForm({...agreementForm, agreed_by: e.target.value})} />
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowAgreementModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sales;
