import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import './Pages.css';

interface Project {
  id: number;
  name: string;
  code?: string;
}

interface Tender {
  id: number;
  project_id: number;
  tender_number: string;
  tender_date: string;
  subject: string;
  status: string;
  description?: string | null;
  closing_date?: string | null;
  project?: { id: number; name: string };
}

interface Contractor {
  id: number;
  name: string;
  inn?: string | null;
  kpp?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  contact_person?: string | null;
  specialization?: string | null;
  rating?: number;
  is_active?: boolean;
  notes?: string | null;
}

// Мок-данные для тестирования
const MOCK_TENDERS: Tender[] = [
  {
    id: 1,
    project_id: 1,
    tender_number: 'Т-001/2024',
    tender_date: '2024-01-15',
    subject: 'Выполнение работ по устройству фундамента',
    status: 'active',
    description: 'Тендер на выполнение работ по устройству монолитного железобетонного фундамента',
    closing_date: '2024-02-15',
  },
  {
    id: 2,
    project_id: 1,
    tender_number: 'Т-002/2024',
    tender_date: '2024-01-20',
    subject: 'Поставка строительных материалов',
    status: 'closed',
    description: 'Тендер на поставку цемента, арматуры и других строительных материалов',
    closing_date: '2024-02-20',
  },
  {
    id: 3,
    project_id: 2,
    tender_number: 'Т-003/2024',
    tender_date: '2024-02-01',
    subject: 'Выполнение отделочных работ',
    status: 'draft',
    description: 'Тендер на выполнение внутренних отделочных работ',
  },
];

const MOCK_CONTRACTORS: Contractor[] = [
  {
    id: 1,
    name: 'ООО "СтройКомплекс"',
    inn: '1234567890',
    kpp: '123456789',
    address: 'г. Бишкек, ул. Строительная, 15',
    phone: '+996 (555) 123-456',
    email: 'info@stroykomplex.kg',
    contact_person: 'Иванов Иван Иванович',
    specialization: 'Общестроительные работы',
    rating: 5,
    is_active: true,
  },
  {
    id: 2,
    name: 'ИП "Материалы Плюс"',
    inn: '0987654321',
    address: 'г. Бишкек, ул. Торговая, 42',
    phone: '+996 (555) 234-567',
    email: 'sales@materials.kg',
    contact_person: 'Петрова Мария Сергеевна',
    specialization: 'Поставка материалов',
    rating: 4,
    is_active: true,
  },
  {
    id: 3,
    name: 'ООО "Отделка Про"',
    inn: '1122334455',
    address: 'г. Бишкек, ул. Ремонтная, 8',
    phone: '+996 (555) 345-678',
    email: 'office@otdelka.kg',
    contact_person: 'Сидоров Петр Александрович',
    specialization: 'Отделочные работы',
    rating: 4,
    is_active: true,
  },
];

const Tenders: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tenders' | 'contractors'>('tenders');
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [contractorPage, setContractorPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Модальные окна
  const [showTenderModal, setShowTenderModal] = useState(false);
  const [showContractorModal, setShowContractorModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [viewingTender, setViewingTender] = useState<Tender | null>(null);
  const [deletingTender, setDeletingTender] = useState<Tender | null>(null);
  
  // Формы
  const [tenderFormData, setTenderFormData] = useState({
    project_id: '' as number | '',
    tender_number: '',
    tender_date: new Date().toISOString().split('T')[0],
    subject: '',
    description: '',
    status: 'draft',
    closing_date: '',
  });
  
  const [contractorFormData, setContractorFormData] = useState({
    name: '',
    inn: '',
    kpp: '',
    address: '',
    phone: '',
    email: '',
    contact_person: '',
    specialization: '',
    rating: 0,
    is_active: true,
    notes: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contractorErrors, setContractorErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tendersRes, contractorsRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/tenders/`).catch(() => ({ data: MOCK_TENDERS })),
        axios.get(`${API_URL}/tenders/contractors/`).catch(() => ({ data: MOCK_CONTRACTORS })),
        axios.get(`${API_URL}/projects/`).catch(() => ({ data: [] })),
      ]);
      setTenders(Array.isArray(tendersRes.data) ? tendersRes.data : MOCK_TENDERS);
      setContractors(Array.isArray(contractorsRes.data) ? contractorsRes.data : MOCK_CONTRACTORS);
      
      let projectsData: Project[] = [];
      if (projectsRes.data && projectsRes.data.data && Array.isArray(projectsRes.data.data)) {
        projectsData = projectsRes.data.data;
      } else if (Array.isArray(projectsRes.data)) {
        projectsData = projectsRes.data;
      }
      setProjects(projectsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // Используем мок-данные при ошибке
      setTenders(MOCK_TENDERS);
      setContractors(MOCK_CONTRACTORS);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTenderModal = (tender?: Tender) => {
    if (tender) {
      setEditingTender(tender);
      setTenderFormData({
        project_id: tender.project_id,
        tender_number: tender.tender_number,
        tender_date: tender.tender_date ? tender.tender_date.split('T')[0] : new Date().toISOString().split('T')[0],
        subject: tender.subject,
        description: tender.description || '',
        status: tender.status,
        closing_date: tender.closing_date ? tender.closing_date.split('T')[0] : '',
      });
    } else {
      setEditingTender(null);
      setTenderFormData({
        project_id: '',
        tender_number: '',
        tender_date: new Date().toISOString().split('T')[0],
        subject: '',
        description: '',
        status: 'draft',
        closing_date: '',
      });
    }
    setErrors({});
    setShowTenderModal(true);
  };

  const handleCloseTenderModal = () => {
    setShowTenderModal(false);
    setEditingTender(null);
    setErrors({});
  };

  const handleOpenContractorModal = (contractor?: Contractor) => {
    if (contractor) {
      setEditingContractor(contractor);
      setContractorFormData({
        name: contractor.name,
        inn: contractor.inn || '',
        kpp: contractor.kpp || '',
        address: contractor.address || '',
        phone: contractor.phone || '',
        email: contractor.email || '',
        contact_person: contractor.contact_person || '',
        specialization: contractor.specialization || '',
        rating: contractor.rating || 0,
        is_active: contractor.is_active !== undefined ? contractor.is_active : true,
        notes: contractor.notes || '',
      });
    } else {
      setEditingContractor(null);
      setContractorFormData({
        name: '',
        inn: '',
        kpp: '',
        address: '',
        phone: '',
        email: '',
        contact_person: '',
        specialization: '',
        rating: 0,
        is_active: true,
        notes: '',
      });
    }
    setContractorErrors({});
    setShowContractorModal(true);
  };

  const handleCloseContractorModal = () => {
    setShowContractorModal(false);
    setEditingContractor(null);
    setContractorErrors({});
  };

  const handleViewTender = (tender: Tender) => {
    setViewingTender(tender);
    setShowViewModal(true);
  };

  const validateTenderForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!tenderFormData.project_id) {
      newErrors.project_id = 'Проект обязателен';
    }
    if (!tenderFormData.tender_number.trim()) {
      newErrors.tender_number = 'Номер тендера обязателен';
    }
    if (!tenderFormData.subject.trim()) {
      newErrors.subject = 'Предмет тендера обязателен';
    }
    if (!tenderFormData.tender_date) {
      newErrors.tender_date = 'Дата тендера обязательна';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateContractorForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!contractorFormData.name.trim()) {
      newErrors.name = 'Название подрядчика обязательно';
    }
    setContractorErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTenderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTenderForm()) return;

    try {
      const submitData = {
        project_id: Number(tenderFormData.project_id),
        tender_number: tenderFormData.tender_number,
        tender_date: tenderFormData.tender_date,
        subject: tenderFormData.subject,
        description: tenderFormData.description || null,
        status: tenderFormData.status,
        closing_date: tenderFormData.closing_date || null,
      };

      if (editingTender) {
        await axios.put(`${API_URL}/tenders/${editingTender.id}`, submitData).catch(() => {
          // Обновляем локально при ошибке API
          setTenders(tenders.map(t => t.id === editingTender.id ? { ...editingTender, ...submitData } as Tender : t));
        });
      } else {
        const newTender = await axios.post(`${API_URL}/tenders/`, submitData).catch(() => {
          // Создаем локально при ошибке API
          const mockNew: Tender = {
            id: Math.max(...tenders.map(t => t.id), 0) + 1,
            project_id: submitData.project_id,
            tender_number: submitData.tender_number,
            tender_date: submitData.tender_date,
            subject: submitData.subject,
            status: submitData.status,
            description: submitData.description || undefined,
            closing_date: submitData.closing_date || undefined,
          };
          setTenders([...tenders, mockNew]);
          return { data: mockNew };
        });
        if (newTender?.data) {
          setTenders([...tenders, newTender.data]);
        }
      }
      handleCloseTenderModal();
      fetchData();
    } catch (error: any) {
      console.error('Ошибка сохранения тендера:', error);
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
      }
    }
  };

  const handleContractorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContractorForm()) return;

    try {
      const submitData = {
        name: contractorFormData.name,
        inn: contractorFormData.inn || null,
        kpp: contractorFormData.kpp || null,
        address: contractorFormData.address || null,
        phone: contractorFormData.phone || null,
        email: contractorFormData.email || null,
        contact_person: contractorFormData.contact_person || null,
        specialization: contractorFormData.specialization || null,
        rating: contractorFormData.rating,
        is_active: contractorFormData.is_active,
        notes: contractorFormData.notes || null,
      };

      if (editingContractor) {
        await axios.put(`${API_URL}/tenders/contractors/${editingContractor.id}`, submitData).catch(() => {
          setContractors(contractors.map(c => c.id === editingContractor.id ? { ...editingContractor, ...submitData } as Contractor : c));
        });
      } else {
        const newContractor = await axios.post(`${API_URL}/tenders/contractors/`, submitData).catch(() => {
          const mockNew: Contractor = {
            id: Math.max(...contractors.map(c => c.id), 0) + 1,
            name: submitData.name,
            inn: submitData.inn || undefined,
            kpp: submitData.kpp || undefined,
            address: submitData.address || undefined,
            phone: submitData.phone || undefined,
            email: submitData.email || undefined,
            contact_person: submitData.contact_person || undefined,
            specialization: submitData.specialization || undefined,
            rating: submitData.rating,
            is_active: submitData.is_active,
            notes: submitData.notes || undefined,
          };
          setContractors([...contractors, mockNew]);
          return { data: mockNew };
        });
        if (newContractor?.data) {
          setContractors([...contractors, newContractor.data]);
        }
      }
      handleCloseContractorModal();
      fetchData();
    } catch (error: any) {
      console.error('Ошибка сохранения подрядчика:', error);
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
          setContractorErrors(validationErrors);
        }
      }
    }
  };

  const handleDeleteTender = (tender: Tender) => {
    setDeletingTender(tender);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTender) return;
    try {
      await axios.delete(`${API_URL}/tenders/${deletingTender.id}`).catch(() => {
        setTenders(tenders.filter(t => t.id !== deletingTender.id));
      });
      setShowDeleteModal(false);
      setDeletingTender(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления тендера:', error);
    }
  };

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      draft: 'info',
      active: 'warn',
      closed: 'ok',
      cancelled: 'danger',
    };
    return chips[status] || 'info';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Черновик',
      active: 'Активен',
      closed: 'Закрыт',
      cancelled: 'Отменен',
    };
    return labels[status] || status;
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Проект #${projectId}`;
  };

  // Фильтрация и пагинация тендеров
  const filteredTenders = tenders.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        t.tender_number.toLowerCase().includes(search) ||
        t.subject.toLowerCase().includes(search) ||
        getProjectName(t.project_id).toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalTenderPages = Math.ceil(filteredTenders.length / pageSize);
  const paginatedTenders = filteredTenders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Фильтрация и пагинация подрядчиков
  const filteredContractors = contractors.filter((c) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        c.name.toLowerCase().includes(search) ||
        (c.inn && c.inn.toLowerCase().includes(search)) ||
        (c.contact_person && c.contact_person.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const totalContractorPages = Math.ceil(filteredContractors.length / pageSize);
  const paginatedContractors = filteredContractors.slice((contractorPage - 1) * pageSize, contractorPage * pageSize);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Тендеры</span></div>
          <div className="h1">Тендеры</div>
          <p className="h2">Реестр тендеров • реестр подрядчиков • коммерческие предложения • выбор победителя • связь с договорами.</p>
        </div>
        <div className="actions" style={{ display: 'flex', flexDirection: 'row', gap: '10px', flexWrap: 'nowrap' }}>
          <a className="btn primary" href="#tenders" onClick={(e) => { e.preventDefault(); handleOpenTenderModal(); }}>+ Создать тендер</a>
          <a className="btn" href="#tenders" onClick={(e) => { e.preventDefault(); handleOpenContractorModal(); }}>+ Добавить подрядчика</a>
        </div>
      </div>

      <div className="card">
        <div className="cardHead">
          <div>
            <div className="title">Управление тендерами</div>
            <div className="desc">Тендеры • подрядчики • коммерческие предложения</div>
          </div>
        </div>
        <div className="cardBody">
          <div className="tabs">
            <div className={`tab ${activeTab === 'tenders' ? 'active' : ''}`} onClick={() => setActiveTab('tenders')}>Тендеры</div>
            <div className={`tab ${activeTab === 'contractors' ? 'active' : ''}`} onClick={() => setActiveTab('contractors')}>Реестр подрядчиков</div>
          </div>

          {activeTab === 'tenders' && (
            <>
              {/* Фильтры */}
              <div className="toolbar" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--card)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div className="filters" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Поиск по номеру, названию, проекту..."
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
                    <option value="active">Активен</option>
                    <option value="closed">Закрыт</option>
                    <option value="cancelled">Отменен</option>
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
                    <th style={{ width: '12%' }}>№</th>
                    <th>Тендер</th>
                    <th style={{ width: '18%' }}>Проект</th>
                    <th style={{ width: '12%' }}>Дата</th>
                    <th style={{ width: '12%' }}>Статус</th>
                    <th className="tRight" style={{ width: '14%' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTenders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Тендеры не найдены</td>
                    </tr>
                  ) : (
                    paginatedTenders.map((t) => (
                      <tr key={t.id}>
                        <td>{t.tender_number}</td>
                        <td>{t.subject || '—'}</td>
                        <td>{getProjectName(t.project_id)}</td>
                        <td>{new Date(t.tender_date).toLocaleDateString('ru-RU')}</td>
                        <td>
                          <span className={`chip ${getStatusChip(t.status)}`}>
                            {getStatusLabel(t.status)}
                          </span>
                        </td>
                        <td className="tRight" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn icon small" onClick={() => handleViewTender(t)} title="Просмотр">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button className="btn icon small" onClick={() => handleOpenTenderModal(t)} title="Редактировать">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="btn icon small danger" onClick={() => handleDeleteTender(t)} title="Удалить">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {totalTenderPages > 1 && (
                <div className="tableFooter">
                  <div style={{ color: 'var(--muted2)', fontSize: '0.875rem' }}>
                    Показано {paginatedTenders.length} из {filteredTenders.length} {filteredTenders.length !== tenders.length && `(всего: ${tenders.length})`}
                  </div>
                  <div className="pager">
                    <button className="btn small" onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                    <span>Стр. {currentPage} из {totalTenderPages}</span>
                    <button className="btn small" onClick={() => setCurrentPage((p: number) => Math.min(totalTenderPages, p + 1))} disabled={currentPage === totalTenderPages}>›</button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'contractors' && (
            <>
              {/* Фильтры */}
              <div className="toolbar" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--card)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div className="filters" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Поиск по названию, ИНН, контактному лицу..."
                    value={filters.search}
                    onChange={(e) => {
                      setFilters({ ...filters, search: e.target.value });
                      setContractorPage(1);
                    }}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--text)', minWidth: '250px' }}
                  />
                  {filters.search && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setFilters({ ...filters, search: '' });
                        setContractorPage(1);
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
                    <th style={{ width: '10%' }}>ID</th>
                    <th>Подрядчик</th>
                    <th style={{ width: '14%' }}>ИНН</th>
                    <th style={{ width: '16%' }}>Контактное лицо</th>
                    <th style={{ width: '14%' }}>Телефон</th>
                    <th className="tRight" style={{ width: '14%' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContractors.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Подрядчики не найдены</td>
                    </tr>
                  ) : (
                    paginatedContractors.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.name}</td>
                        <td>{c.inn || '—'}</td>
                        <td>{c.contact_person || '—'}</td>
                        <td>{c.phone || '—'}</td>
                        <td className="tRight" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn icon small" onClick={() => handleOpenContractorModal(c)} title="Редактировать">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {totalContractorPages > 1 && (
                <div className="tableFooter">
                  <div style={{ color: 'var(--muted2)', fontSize: '0.875rem' }}>
                    Показано {paginatedContractors.length} из {filteredContractors.length} {filteredContractors.length !== contractors.length && `(всего: ${contractors.length})`}
                  </div>
                  <div className="pager">
                    <button className="btn small" onClick={() => setContractorPage((p: number) => Math.max(1, p - 1))} disabled={contractorPage === 1}>‹</button>
                    <span>Стр. {contractorPage} из {totalContractorPages}</span>
                    <button className="btn small" onClick={() => setContractorPage((p: number) => Math.min(totalContractorPages, p + 1))} disabled={contractorPage === totalContractorPages}>›</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Модальное окно создания/редактирования тендера */}
      {showTenderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }} onClick={handleCloseTenderModal}>
          <div className="card" style={{ maxWidth: '800px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">{editingTender ? 'Редактирование' : 'Создание'} тендера</div>
              <button onClick={handleCloseTenderModal} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '24px' }}>×</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleTenderSubmit}>
                <div className="field">
                  <label>Проект *</label>
                  <select
                    value={tenderFormData.project_id}
                    onChange={(e) => {
                      setTenderFormData({ ...tenderFormData, project_id: e.target.value ? parseInt(e.target.value) : '' });
                      if (errors.project_id) setErrors({ ...errors, project_id: '' });
                    }}
                    required
                  >
                    <option value="">Выберите проект</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Номер тендера *</label>
                  <input
                    type="text"
                    value={tenderFormData.tender_number}
                    onChange={(e) => {
                      setTenderFormData({ ...tenderFormData, tender_number: e.target.value });
                      if (errors.tender_number) setErrors({ ...errors, tender_number: '' });
                    }}
                    placeholder="Т-001/2024"
                    required
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата тендера *</label>
                  <input
                    type="date"
                    value={tenderFormData.tender_date}
                    onChange={(e) => {
                      setTenderFormData({ ...tenderFormData, tender_date: e.target.value });
                      if (errors.tender_date) setErrors({ ...errors, tender_date: '' });
                    }}
                    required
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Предмет тендера *</label>
                  <input
                    type="text"
                    value={tenderFormData.subject}
                    onChange={(e) => {
                      setTenderFormData({ ...tenderFormData, subject: e.target.value });
                      if (errors.subject) setErrors({ ...errors, subject: '' });
                    }}
                    placeholder="Краткое описание предмета тендера"
                    required
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата закрытия</label>
                  <input
                    type="date"
                    value={tenderFormData.closing_date}
                    onChange={(e) => setTenderFormData({ ...tenderFormData, closing_date: e.target.value })}
                    min={tenderFormData.tender_date || undefined}
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Статус</label>
                  <select
                    value={tenderFormData.status}
                    onChange={(e) => setTenderFormData({ ...tenderFormData, status: e.target.value })}
                  >
                    <option value="draft">Черновик</option>
                    <option value="active">Активен</option>
                    <option value="closed">Закрыт</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Описание</label>
                  <textarea
                    value={tenderFormData.description}
                    onChange={(e) => setTenderFormData({ ...tenderFormData, description: e.target.value })}
                    rows={4}
                    placeholder="Подробное описание тендера, требования, условия..."
                  />
                </div>
                <div style={{ height: '20px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">{editingTender ? 'Сохранить' : 'Создать'}</button>
                  <button type="button" className="btn" onClick={handleCloseTenderModal}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания/редактирования подрядчика */}
      {showContractorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }} onClick={handleCloseContractorModal}>
          <div className="card" style={{ maxWidth: '800px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">{editingContractor ? 'Редактирование' : 'Добавление'} подрядчика</div>
              <button onClick={handleCloseContractorModal} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '24px' }}>×</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleContractorSubmit}>
                <div className="field">
                  <label>Название *</label>
                  <input
                    type="text"
                    value={contractorFormData.name}
                    onChange={(e) => {
                      setContractorFormData({ ...contractorFormData, name: e.target.value });
                      if (contractorErrors.name) setContractorErrors({ ...contractorErrors, name: '' });
                    }}
                    placeholder="ООО или ИП название"
                    required
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>ИНН</label>
                  <input
                    type="text"
                    value={contractorFormData.inn}
                    onChange={(e) => setContractorFormData({ ...contractorFormData, inn: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>КПП</label>
                  <input
                    type="text"
                    value={contractorFormData.kpp}
                    onChange={(e) => setContractorFormData({ ...contractorFormData, kpp: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Адрес</label>
                  <input
                    type="text"
                    value={contractorFormData.address}
                    onChange={(e) => setContractorFormData({ ...contractorFormData, address: e.target.value })}
                    placeholder="Полный адрес организации"
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    value={contractorFormData.phone}
                    onChange={(e) => setContractorFormData({ ...contractorFormData, phone: e.target.value })}
                    placeholder="+996 (555) 123-456"
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={contractorFormData.email}
                    onChange={(e) => setContractorFormData({ ...contractorFormData, email: e.target.value })}
                    placeholder="info@example.kg"
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Контактное лицо</label>
                  <input
                    type="text"
                    value={contractorFormData.contact_person}
                    onChange={(e) => setContractorFormData({ ...contractorFormData, contact_person: e.target.value })}
                    placeholder="ФИО контактного лица"
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Специализация</label>
                  <input
                    type="text"
                    value={contractorFormData.specialization}
                    onChange={(e) => setContractorFormData({ ...contractorFormData, specialization: e.target.value })}
                    placeholder="Вид выполняемых работ"
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Рейтинг</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={contractorFormData.rating}
                    onChange={(e) => setContractorFormData({ ...contractorFormData, rating: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Статус</label>
                  <select
                    value={contractorFormData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setContractorFormData({ ...contractorFormData, is_active: e.target.value === 'active' })}
                  >
                    <option value="active">Активен</option>
                    <option value="inactive">Неактивен</option>
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Примечания</label>
                  <textarea
                    value={contractorFormData.notes}
                    onChange={(e) => setContractorFormData({ ...contractorFormData, notes: e.target.value })}
                    rows={3}
                    placeholder="Дополнительная информация о подрядчике"
                  />
                </div>
                <div style={{ height: '20px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">{editingContractor ? 'Сохранить' : 'Создать'}</button>
                  <button type="button" className="btn" onClick={handleCloseContractorModal}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра тендера */}
      {showViewModal && viewingTender && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Просмотр тендера: {viewingTender.tender_number}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div className="kpi">
                <div className="kpiItem">
                  <div className="k">Проект</div>
                  <div className="v">{getProjectName(viewingTender.project_id)}</div>
                </div>
                <div className="kpiItem">
                  <div className="k">Дата тендера</div>
                  <div className="v">{new Date(viewingTender.tender_date).toLocaleDateString('ru-RU')}</div>
                </div>
                <div className="kpiItem">
                  <div className="k">Дата закрытия</div>
                  <div className="v">{viewingTender.closing_date ? new Date(viewingTender.closing_date).toLocaleDateString('ru-RU') : '—'}</div>
                </div>
                <div className="kpiItem">
                  <div className="k">Статус</div>
                  <div className="v">
                    <span className={`chip ${getStatusChip(viewingTender.status)}`}>
                      {getStatusLabel(viewingTender.status)}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Предмет тендера</h3>
                <p style={{ color: 'var(--text)', marginBottom: '1rem' }}>{viewingTender.subject}</p>
                {viewingTender.description && (
                  <>
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Описание</h3>
                    <p style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{viewingTender.description}</p>
                  </>
                )}
              </div>
              <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Закрыть</button>
                <button className="btn btn-primary" onClick={() => { setShowViewModal(false); handleOpenTenderModal(viewingTender); }}>Редактировать</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно удаления */}
      {showDeleteModal && deletingTender && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Удаление тендера</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Вы уверены, что хотите удалить тендер <strong>"{deletingTender.tender_number}"</strong>?</p>
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

export default Tenders;
