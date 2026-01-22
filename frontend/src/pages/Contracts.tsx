import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrencySimple } from '../utils/currency';

interface Contract {
  id: number;
  project_id: number;
  contractor_name: string;
  contract_number: string;
  contract_date: string;
  start_date?: string;
  end_date?: string;
  total_amount: number;
  status: string;
  tender_id?: number;
  project?: { id: number; name: string };
}

interface Project {
  id: number;
  name: string;
}

interface Tender {
  id: number;
  number: string;
  name: string;
  project_id: number;
}

interface KS2 {
  id: number;
  number: string;
  date: string;
  contract_id?: number;
  project_id: number;
}

const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [ks2Forms, setKs2Forms] = useState<KS2[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'tenders' | 'ks2'>('general');
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    contractor_name: '',
    contract_number: '',
    contract_date: '',
    start_date: '',
    end_date: '',
    total_amount: '',
    status: 'draft',
    tender_id: '' as number | '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedContract) {
      fetchRelatedData(selectedContract.id);
    }
  }, [selectedContract]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractsRes, projectsRes, tendersRes] = await Promise.all([
        axios.get(`${API_URL}/contracts/`, { params: { status: filters.status || undefined } }),
        axios.get(`${API_URL}/projects/`),
        axios.get(`${API_URL}/tenders/`),
      ]);
      setContracts(contractsRes.data);
      setProjects(projectsRes.data);
      setTenders(tendersRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async (contractId: number) => {
    try {
      const contract = contracts.find(c => c.id === contractId);
      if (contract) {
        const ks2Res = await axios.get(`${API_URL}/ks2/`, { params: { project_id: contract.project_id } });
        // Фильтруем по contract_id на фронтенде, так как в API нет такого параметра
        const filtered = ks2Res.data.filter((ks2: KS2) => (ks2 as any).contract_id === contractId);
        setKs2Forms(filtered);
      }
    } catch (error) {
      console.error('Ошибка загрузки связанных данных:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        project_id: Number(formData.project_id),
        total_amount: parseFloat(formData.total_amount || '0'),
        contract_date: formData.contract_date || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        tender_id: formData.tender_id ? Number(formData.tender_id) : undefined,
      } as any;

      if (editingContract) {
        await axios.put(`${API_URL}/contracts/${editingContract.id}`, submitData);
      } else {
        await axios.post(`${API_URL}/contracts/`, submitData);
      }
      setShowModal(false);
      setEditingContract(null);
      setSelectedContract(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      draft: 'info',
      signed: 'ok',
      active: 'ok',
      suspended: 'warn',
      completed: 'ok',
      terminated: 'danger',
    };
    return chips[status] || 'info';
  };

  // Фильтрация и пагинация
  const filteredContracts = contracts.filter((c) => {
    if (filters.status && c.status !== filters.status) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        c.contract_number.toLowerCase().includes(search) ||
        c.contractor_name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredContracts.length / pageSize);
  const paginatedContracts = filteredContracts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Договора</span></div>
          <div className="h1">Договора</div>
          <p className="h2">Реестр договоров • статусы • контроль выполнения • связь с проектом/тендером/КС-2.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#contracts" onClick={(e) => { e.preventDefault(); setShowModal(true); setEditingContract(null); setFormData({project_id: '', contractor_name: '', contract_number: '', contract_date: '', start_date: '', end_date: '', total_amount: '', status: 'draft', tender_id: ''}); }}>+ Создать договор</a>
          <a className="btn" href="#tenders">К тендерам</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Список договоров</div>
              <div className="desc">GET /api/v1/contracts • фильтры • экспорт</div>
            </div>
            <span className="chip info">Связь: project_id • tender_id</span>
          </div>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Статус</label>
                  <select value={filters.status} onChange={(e) => { setFilters({...filters, status: e.target.value}); fetchData(); }}>
                    <option value="">Все</option>
                    <option value="draft">Черновик</option>
                    <option value="signed">Подписан</option>
                    <option value="active">Активный</option>
                    <option value="suspended">Приостановлен</option>
                    <option value="completed">Завершен</option>
                    <option value="terminated">Расторгнут</option>
                  </select>
                </div>
                <div className="field">
                  <label>Поиск</label>
                  <input type="text" placeholder="№ или подрядчик..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '14%' }}>№</th>
                  <th>Договор</th>
                  <th style={{ width: '16%' }}>Проект</th>
                  <th style={{ width: '16%' }}>Подрядчик</th>
                  <th style={{ width: '12%' }}>Статус</th>
                  <th style={{ width: '12%' }} className="tRight">Сумма</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Договора не найдены</td>
                  </tr>
                ) : (
                  paginatedContracts.map((c) => (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedContract(c); setActiveTab('general'); fetchRelatedData(c.id); }}>
                      <td>{c.contract_number}</td>
                      <td>№{c.contract_number} от {new Date(c.contract_date).toLocaleDateString('ru-RU')}</td>
                      <td>{c.project?.name || `ID: ${c.project_id}`}</td>
                      <td>{c.contractor_name}</td>
                      <td><span className={`chip ${getStatusChip(c.status)}`}>{c.status}</span></td>
                      <td className="tRight">{c.total_amount ? formatCurrencySimple(c.total_amount, 'KGS') : '0'}</td>
                      <td className="tRight" onClick={(e) => e.stopPropagation()}>
                        <a className="btn small" href="#contracts" onClick={(e) => { e.preventDefault(); setEditingContract(c); setFormData({project_id: c.project_id, contractor_name: c.contractor_name, contract_number: c.contract_number, contract_date: c.contract_date ? new Date(c.contract_date).toISOString().split('T')[0] : '', start_date: c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '', end_date: c.end_date ? new Date(c.end_date).toISOString().split('T')[0] : '', total_amount: c.total_amount?.toString() || '', status: c.status, tender_id: c.tender_id || ''}); setShowModal(true); }}>Ред.</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="tableFooter">
                <div className="pager">
                  <button className="btn small" onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                  <span>Стр. {currentPage} из {totalPages}</span>
                  <button className="btn small" onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedContract && (
          <div className="card">
            <div className="cardHead">
              <div>
                <div className="title">Договор: {selectedContract.contract_number}</div>
                <div className="desc">Связи • тендеры • КС-2</div>
              </div>
              <button className="btn ghost small" onClick={() => setSelectedContract(null)}>✕</button>
            </div>
            <div className="cardBody">
              <div className="tabs">
                <div className={`tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>Общая информация</div>
                <div className={`tab ${activeTab === 'tenders' ? 'active' : ''}`} onClick={() => setActiveTab('tenders')}>Тендеры</div>
                <div className={`tab ${activeTab === 'ks2' ? 'active' : ''}`} onClick={() => setActiveTab('ks2')}>КС-2 формы ({ks2Forms.length})</div>
              </div>

              {activeTab === 'general' && (
                <div style={{ padding: '20px' }}>
                  <div className="kpi">
                    <div className="kpiItem">
                      <div className="k">Подрядчик</div>
                      <div className="v">{selectedContract.contractor_name}</div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Проект</div>
                      <div className="v">{selectedContract.project?.name || `ID: ${selectedContract.project_id}`}</div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Сумма</div>
                      <div className="v">
                        <div>{formatCurrencySimple(selectedContract.total_amount, 'KGS')}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(selectedContract.total_amount ? selectedContract.total_amount / 89 : null, 'USD')}</div>
                      </div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Статус</div>
                      <div className="v"><span className={`chip ${getStatusChip(selectedContract.status)}`}>{selectedContract.status}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tenders' && (
                <div style={{ padding: '20px' }}>
                  {selectedContract.tender_id ? (
                    <div>
                      <p>Связанный тендер: ID {selectedContract.tender_id}</p>
                      {tenders.find(t => t.id === selectedContract.tender_id) && (
                        <div className="card" style={{ marginTop: '10px' }}>
                          <div className="cardBody">
                            <p><strong>{tenders.find(t => t.id === selectedContract.tender_id)?.name}</strong></p>
                            <p className="mini">№ {tenders.find(t => t.id === selectedContract.tender_id)?.number}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="muted mini" style={{ padding: '20px', textAlign: 'center' }}>Тендер не связан с договором</div>
                  )}
                </div>
              )}

              {activeTab === 'ks2' && (
                <table style={{ marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '14%' }}>№</th>
                      <th>Дата</th>
                      <th style={{ width: '20%' }}>Проект</th>
                      <th className="tRight" style={{ width: '14%' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ks2Forms.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>КС-2 формы не найдены</td>
                      </tr>
                    ) : (
                      ks2Forms.map((ks2) => (
                        <tr key={ks2.id}>
                          <td>{ks2.number}</td>
                          <td>{new Date(ks2.date).toLocaleDateString('ru-RU')}</td>
                          <td>{`ID: ${ks2.project_id}`}</td>
                          <td className="tRight"><a className="btn small" href={`#ks2?id=${ks2.id}`}>Открыть</a></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">{editingContract ? 'Редактирование' : 'Создание'} договора</div>
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
                  <label>Подрядчик *</label>
                  <input type="text" value={formData.contractor_name} onChange={(e) => setFormData({...formData, contractor_name: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Номер договора *</label>
                  <input type="text" value={formData.contract_number} onChange={(e) => setFormData({...formData, contract_number: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата договора *</label>
                  <input type="date" value={formData.contract_date} onChange={(e) => setFormData({...formData, contract_date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата начала</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата окончания</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Сумма договора</label>
                  <input type="number" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Тендер</label>
                  <select value={formData.tender_id} onChange={(e) => setFormData({...formData, tender_id: e.target.value ? parseInt(e.target.value) : ''})}>
                    <option value="">Не выбран</option>
                    {tenders.filter(t => !formData.project_id || t.project_id === formData.project_id).map(t => (
                      <option key={t.id} value={t.id}>{t.number} - {t.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Статус</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="draft">Черновик</option>
                    <option value="signed">Подписан</option>
                    <option value="active">Активный</option>
                    <option value="suspended">Приостановлен</option>
                    <option value="completed">Завершен</option>
                    <option value="terminated">Расторгнут</option>
                  </select>
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => { setShowModal(false); setEditingContract(null); }}>Отмена</button>
                </div>
              </form>
            </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Contracts;
