import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrencySimple } from '../utils/currency';
import './Pages.css';

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
  sales_manager?: string;
  changes_requested?: string;
  notes?: string;
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

// Мок-данные для тестирования
const MOCK_PROPOSALS: SalesProposal[] = [
  {
    id: 1,
    project_id: 1,
    proposal_number: 'КП-001/2024',
    proposal_date: '2024-03-01',
    customer_name: 'ООО "Заказчик Строй"',
    customer_phone: '+996 (555) 111-222',
    customer_email: 'info@zakazchik.kg',
    total_amount: 5000000,
    discount_percentage: 5,
    discount_amount: 250000,
    final_amount: 4750000,
    status: 'sent',
    sent_date: '2024-03-02',
    items: [
      {
        id: 1,
        line_number: 1,
        work_name: 'Строительство здания',
        unit: 'м²',
        quantity: 1000,
        unit_price: 5000,
        amount: 5000000,
      },
    ],
  },
  {
    id: 2,
    project_id: 1,
    proposal_number: 'КП-002/2024',
    proposal_date: '2024-03-05',
    customer_name: 'ИП "Клиент Плюс"',
    customer_phone: '+996 (555) 333-444',
    total_amount: 3000000,
    discount_percentage: 0,
    discount_amount: 0,
    final_amount: 3000000,
    status: 'draft',
    items: [],
  },
  {
    id: 3,
    project_id: 2,
    proposal_number: 'КП-003/2024',
    proposal_date: '2024-03-10',
    customer_name: 'ООО "Партнер Строй"',
    total_amount: 1800000,
    discount_percentage: 10,
    discount_amount: 180000,
    final_amount: 1620000,
    status: 'approved',
    items: [],
  },
];

const MOCK_AGREEMENTS: CustomerAgreement[] = [
  {
    id: 1,
    project_id: 1,
    proposal_id: 1,
    estimate_id: 1,
    agreement_date: '2024-03-15',
    customer_name: 'ООО "Заказчик Строй"',
    agreed_amount: 4750000,
    agreement_status: 'approved',
    agreed_by: 'Иванов И.И.',
    sales_manager: 'Петров П.П.',
  },
  {
    id: 2,
    project_id: 2,
    proposal_id: 3,
    agreement_date: '2024-03-20',
    customer_name: 'ООО "Партнер Строй"',
    agreed_amount: 1600000,
    agreement_status: 'pending',
    sales_manager: 'Сидоров С.С.',
  },
];

const Sales: React.FC = () => {
  const [proposals, setProposals] = useState<SalesProposal[]>([]);
  const [agreements, setAgreements] = useState<CustomerAgreement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<SalesProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState<SalesProposal | null>(null);
  const [viewingProposal, setViewingProposal] = useState<SalesProposal | null>(null);
  const [deletingProposal, setDeletingProposal] = useState<SalesProposal | null>(null);
  const [activeTab, setActiveTab] = useState<'proposals' | 'agreements'>('proposals');
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreementErrors, setAgreementErrors] = useState<Record<string, string>>({});
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
        axios.get(`${API_URL}/sales/proposals/`, { params: { status: filters.status || undefined } }).catch(() => ({ data: MOCK_PROPOSALS })),
        axios.get(`${API_URL}/sales/agreements/`).catch(() => ({ data: MOCK_AGREEMENTS })),
        axios.get(`${API_URL}/projects/`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/estimates/`).catch(() => ({ data: [] })),
      ]);
      setProposals(Array.isArray(propRes.data) ? propRes.data : MOCK_PROPOSALS);
      setAgreements(Array.isArray(agreeRes.data) ? agreeRes.data : MOCK_AGREEMENTS);
      
      let projectsData: Project[] = [];
      if (projectsRes.data && projectsRes.data.data && Array.isArray(projectsRes.data.data)) {
        projectsData = projectsRes.data.data;
      } else if (Array.isArray(projectsRes.data)) {
        projectsData = projectsRes.data;
      }
      setProjects(projectsData);
      setEstimates(Array.isArray(estimatesRes.data) ? estimatesRes.data : []);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setProposals(MOCK_PROPOSALS);
      setAgreements(MOCK_AGREEMENTS);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposalDetails = async (id: number) => {
    try {
      const res = await axios.get(`${API_URL}/sales/proposals/${id}`).catch(() => {
        const proposal = proposals.find(p => p.id === id);
        return { data: proposal || null };
      });
      if (res.data) {
        setSelectedProposal(res.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки КП:', error);
    }
  };

  const handleOpenProposalModal = (proposal?: SalesProposal) => {
    if (proposal) {
      setEditingProposal(proposal);
      setProposalForm({
        project_id: proposal.project_id,
        proposal_number: proposal.proposal_number,
        proposal_date: proposal.proposal_date ? proposal.proposal_date.split('T')[0] : new Date().toISOString().split('T')[0],
        customer_name: proposal.customer_name,
        customer_phone: proposal.customer_phone || '',
        customer_email: proposal.customer_email || '',
        total_amount: proposal.total_amount?.toString() || '',
        discount_percentage: proposal.discount_percentage?.toString() || '0',
        validity_period: (proposal as any).validity_period || '',
        payment_terms: (proposal as any).payment_terms || '',
        delivery_terms: (proposal as any).delivery_terms || '',
        prepared_by: (proposal as any).prepared_by || '',
        notes: (proposal as any).notes || '',
        items: proposal.items || [],
      });
    } else {
      setEditingProposal(null);
      setProposalForm({
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
        items: [],
      });
    }
    setErrors({});
    setShowProposalModal(true);
  };

  const handleCloseProposalModal = () => {
    setShowProposalModal(false);
    setEditingProposal(null);
    setErrors({});
  };

  const handleViewProposal = (proposal: SalesProposal) => {
    setViewingProposal(proposal);
    setShowViewModal(true);
  };

  const handleDeleteClick = (proposal: SalesProposal) => {
    setDeletingProposal(proposal);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProposal) return;
    try {
      await axios.delete(`${API_URL}/sales/proposals/${deletingProposal.id}`).catch(() => {
        setProposals(proposals.filter(p => p.id !== deletingProposal.id));
      });
      setShowDeleteModal(false);
      setDeletingProposal(null);
      if (selectedProposal && selectedProposal.id === deletingProposal.id) {
        setSelectedProposal(null);
      }
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const validateProposalForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!proposalForm.project_id) {
      newErrors.project_id = 'Проект обязателен';
    }
    if (!proposalForm.proposal_number.trim()) {
      newErrors.proposal_number = 'Номер КП обязателен';
    }
    if (!proposalForm.customer_name.trim()) {
      newErrors.customer_name = 'Название клиента обязательно';
    }
    if (!proposalForm.total_amount || parseFloat(proposalForm.total_amount) <= 0) {
      newErrors.total_amount = 'Сумма должна быть больше 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAgreementForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!agreementForm.project_id) {
      newErrors.project_id = 'Проект обязателен';
    }
    if (!agreementForm.customer_name.trim()) {
      newErrors.customer_name = 'Название клиента обязательно';
    }
    if (!agreementForm.agreed_amount || parseFloat(agreementForm.agreed_amount) <= 0) {
      newErrors.agreed_amount = 'Согласованная сумма должна быть больше 0';
    }
    setAgreementErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProposalForm()) return;

    try {
      const itemsTotal = proposalForm.items.reduce((sum, item) => sum + (item.amount || item.unit_price * (item.quantity || 1)), 0);
      const totalAmount = itemsTotal || parseFloat(proposalForm.total_amount || '0');
      const discountPct = parseFloat(proposalForm.discount_percentage || '0');
      const discountAmt = (totalAmount * discountPct) / 100;
      const finalAmount = totalAmount - discountAmt;

      const data = {
        ...proposalForm,
        project_id: Number(proposalForm.project_id),
        total_amount: totalAmount,
        discount_percentage: discountPct,
        discount_amount: discountAmt,
        final_amount: finalAmount,
        validity_period: proposalForm.validity_period || null,
        payment_terms: proposalForm.payment_terms || null,
        delivery_terms: proposalForm.delivery_terms || null,
        prepared_by: proposalForm.prepared_by || null,
        notes: proposalForm.notes || null,
        items: proposalForm.items.map((item, idx) => ({
          ...item,
          line_number: idx + 1,
          quantity: item.quantity ? Number(item.quantity) : undefined,
          unit_price: Number(item.unit_price),
          amount: item.amount || (item.unit_price * (item.quantity || 1)),
        })),
      };

      if (editingProposal) {
        await axios.put(`${API_URL}/sales/proposals/${editingProposal.id}`, data).catch(() => {
          setProposals(proposals.map(p => p.id === editingProposal.id ? { ...editingProposal, ...data } as SalesProposal : p));
        });
      } else {
        const newProposal = await axios.post(`${API_URL}/sales/proposals/`, data).catch(() => {
          const mockNew: SalesProposal = {
            id: Math.max(...proposals.map(p => p.id), 0) + 1,
            ...data,
            proposal_date: data.proposal_date,
            status: 'draft',
          };
          setProposals([...proposals, mockNew]);
          return { data: mockNew };
        });
        if (newProposal?.data) {
          setProposals([...proposals, newProposal.data]);
        }
      }
      handleCloseProposalModal();
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
        alert('Ошибка сохранения КП');
      }
    }
  };

  const handleAgreementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAgreementForm()) return;

    try {
      const data = {
        ...agreementForm,
        project_id: Number(agreementForm.project_id),
        proposal_id: agreementForm.proposal_id ? Number(agreementForm.proposal_id) : null,
        estimate_id: agreementForm.estimate_id ? Number(agreementForm.estimate_id) : null,
        agreed_amount: parseFloat(agreementForm.agreed_amount || '0'),
        agreement_date: agreementForm.agreement_date || null,
        agreed_by: agreementForm.agreed_by || null,
        sales_manager: agreementForm.sales_manager || null,
        changes_requested: agreementForm.changes_requested || null,
        notes: agreementForm.notes || null,
      };
      await axios.post(`${API_URL}/sales/agreements/`, data).catch(() => {
        const mockNew: CustomerAgreement = {
          id: Math.max(...agreements.map(a => a.id), 0) + 1,
          project_id: data.project_id,
          proposal_id: data.proposal_id || undefined,
          estimate_id: data.estimate_id || undefined,
          agreement_date: data.agreement_date || new Date().toISOString().split('T')[0],
          customer_name: data.customer_name,
          agreed_amount: data.agreed_amount,
          agreement_status: data.agreement_status,
          agreed_by: data.agreed_by || undefined,
          sales_manager: data.sales_manager || undefined,
          changes_requested: data.changes_requested || undefined,
          notes: data.notes || undefined,
        };
        setAgreements([...agreements, mockNew]);
      });
      setShowAgreementModal(false);
      setAgreementForm({ project_id: '', proposal_id: '', estimate_id: '', agreement_date: new Date().toISOString().split('T')[0], customer_name: '', agreed_amount: '', agreement_status: 'pending', agreed_by: '', sales_manager: '', changes_requested: '', notes: '' });
      setAgreementErrors({});
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
          setAgreementErrors(validationErrors);
        }
      } else {
        alert('Ошибка сохранения согласования');
      }
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
          <a className="btn primary" href="#sales" onClick={(e) => { e.preventDefault(); handleOpenProposalModal(); }}>+ Создать КП</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Управление продажами</div>
              <div className="desc">Коммерческие предложения • согласования с клиентами</div>
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
                            <a className="btn small" href="#sales" onClick={(e) => { e.preventDefault(); handleViewProposal(p); }}>Просмотр</a>
                            <a className="btn small" href="#sales" onClick={(e) => { e.preventDefault(); handleOpenProposalModal(p); }} style={{ marginLeft: '8px' }}>Ред.</a>
                            <a className="btn small danger" href="#sales" onClick={(e) => { e.preventDefault(); handleDeleteClick(p); }} style={{ marginLeft: '8px' }}>Уд.</a>
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
                <div className="desc">Позиции предложения • скидки • статус согласования</div>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }} onClick={() => setShowProposalModal(false)}>
          <div className="card" style={{ maxWidth: '800px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">Создание коммерческого предложения</div>
              <button onClick={() => setShowProposalModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '24px' }}>×</button>
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
                  <div className="modal-table-wrapper">
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
                          <td><input type="text" value={item.work_name} onChange={(e) => updateProposalItem(idx, 'work_name', e.target.value)} required /></td>
                          <td><input type="text" value={item.unit || ''} onChange={(e) => updateProposalItem(idx, 'unit', e.target.value)} /></td>
                          <td><input type="number" step="0.01" value={item.quantity || ''} onChange={(e) => updateProposalItem(idx, 'quantity', e.target.value)} /></td>
                          <td><input type="number" step="0.01" value={item.unit_price || ''} onChange={(e) => updateProposalItem(idx, 'unit_price', e.target.value)} required /></td>
                          <td className="tRight">{item.amount ? formatCurrencySimple(item.amount, 'KGS') : '0'}</td>
                          <td><button type="button" className="btn small danger" onClick={() => removeProposalItem(idx)}>Уд.</button></td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
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
              <button onClick={() => setShowAgreementModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '24px' }}>×</button>
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

      {/* Модальное окно просмотра КП */}
      {showViewModal && viewingProposal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Просмотр КП: {viewingProposal.proposal_number}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div className="kpi">
                <div className="kpiItem">
                  <div className="k">Клиент</div>
                  <div className="v">{viewingProposal.customer_name}</div>
                </div>
                <div className="kpiItem">
                  <div className="k">Дата</div>
                  <div className="v">{new Date(viewingProposal.proposal_date).toLocaleDateString('ru-RU')}</div>
                </div>
                <div className="kpiItem">
                  <div className="k">Статус</div>
                  <div className="v">
                    <span className={`chip ${getStatusChip(viewingProposal.status)}`}>
                      {viewingProposal.status}
                    </span>
                  </div>
                </div>
                {viewingProposal.sent_date && (
                  <div className="kpiItem">
                    <div className="k">Отправлено</div>
                    <div className="v">{new Date(viewingProposal.sent_date).toLocaleDateString('ru-RU')}</div>
                  </div>
                )}
              </div>
              {viewingProposal.customer_phone && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="mini" style={{ color: 'var(--muted)' }}>Телефон</div>
                  <div style={{ color: 'var(--text)' }}>{viewingProposal.customer_phone}</div>
                </div>
              )}
              {viewingProposal.customer_email && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div className="mini" style={{ color: 'var(--muted)' }}>Email</div>
                  <div style={{ color: 'var(--text)' }}>{viewingProposal.customer_email}</div>
                </div>
              )}
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--panel)', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Сумма</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                      {formatCurrencySimple(viewingProposal.total_amount, 'KGS')}
                    </div>
                  </div>
                  {viewingProposal.discount_percentage > 0 && (
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Скидка ({viewingProposal.discount_percentage}%)</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                        {formatCurrencySimple(viewingProposal.discount_amount || 0, 'KGS')}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Итого</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {formatCurrencySimple(viewingProposal.final_amount, 'KGS')}
                    </div>
                  </div>
                </div>
              </div>
              {viewingProposal.items && viewingProposal.items.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Позиции КП</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Наименование</th>
                        <th>Ед.</th>
                        <th className="tRight">Кол-во</th>
                        <th className="tRight">Цена</th>
                        <th className="tRight">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingProposal.items.map((item: SalesProposalItem, idx: number) => (
                        <tr key={idx}>
                          <td>{item.work_name}</td>
                          <td>{item.unit || '—'}</td>
                          <td className="tRight">{item.quantity || '—'}</td>
                          <td className="tRight">{formatCurrencySimple(item.unit_price, 'KGS')}</td>
                          <td className="tRight">{formatCurrencySimple(item.amount || 0, 'KGS')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Закрыть</button>
                <button className="btn btn-primary" onClick={() => { setShowViewModal(false); handleOpenProposalModal(viewingProposal); }}>Редактировать</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно удаления КП */}
      {showDeleteModal && deletingProposal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Удаление КП</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Вы уверены, что хотите удалить КП <strong>"{deletingProposal.proposal_number}"</strong>?</p>
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
    </>
  );
};

export default Sales;
