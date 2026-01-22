import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';

interface Tender {
  id: number;
  project_id: number;
  tender_number: string;
  tender_date: string;
  subject: string;
  status: string;
  project?: { id: number; name: string };
}

interface Contractor {
  id: number;
  name: string;
  inn?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
}

const Tenders: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tenders' | 'contractors'>('tenders');
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [contractorPage, setContractorPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tendersRes, contractorsRes] = await Promise.all([
        axios.get(`${API_URL}/tenders/`),
        axios.get(`${API_URL}/tenders/contractors/`),
      ]);
      setTenders(tendersRes.data);
      setContractors(contractorsRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация и пагинация тендеров
  const filteredTenders = tenders.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        t.tender_number.toLowerCase().includes(search) ||
        t.subject.toLowerCase().includes(search)
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
        (c.inn && c.inn.toLowerCase().includes(search))
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
        <div className="actions">
          <a className="btn primary" href="#tenders">+ Создать тендер</a>
          <a className="btn" href="#tenders">+ Добавить подрядчика</a>
        </div>
      </div>

      <div className="card">
        <div className="cardHead">
          <div>
            <div className="title">Управление тендерами</div>
            <div className="desc">GET /api/v1/tenders/* • тендеры, подрядчики, коммерческие предложения</div>
          </div>
        </div>
        <div className="cardBody">
            <div className="tabs">
              <div className={`tab ${activeTab === 'tenders' ? 'active' : ''}`} onClick={() => setActiveTab('tenders')}>Тендеры</div>
              <div className={`tab ${activeTab === 'contractors' ? 'active' : ''}`} onClick={() => setActiveTab('contractors')}>Реестр подрядчиков</div>
            </div>

          {activeTab === 'tenders' && (
            <>
              <div className="toolbar" style={{ marginTop: '10px' }}>
                <div className="filters">
                  <div className="field">
                    <label>Поиск</label>
                    <input type="text" placeholder="№ или название..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                  </div>
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
                      <td>{t.subject}</td>
                      <td>{t.project?.name || `ID: ${t.project_id}`}</td>
                      <td>{new Date(t.tender_date).toLocaleDateString('ru-RU')}</td>
                      <td><span className="chip info">{t.status}</span></td>
                      <td className="tRight"><a className="btn small" href={`#tenders?id=${t.id}`}>Открыть</a></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalTenderPages > 1 && (
              <div className="tableFooter">
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
              <div className="toolbar" style={{ marginTop: '10px' }}>
                <div className="filters">
                  <div className="field">
                    <label>Поиск</label>
                    <input type="text" placeholder="Название или ИНН..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                  </div>
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
                      <td className="tRight"><a className="btn small" href={`#tenders?contractor=${c.id}`}>Открыть</a></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalContractorPages > 1 && (
              <div className="tableFooter">
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
    </>
  );
};

export default Tenders;
