import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrencySimple } from '../utils/currency';

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
}

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/invoices/`);
      setInvoices(res.data);
    } catch (error) {
      console.error('Ошибка загрузки счетов:', error);
    } finally {
      setLoading(false);
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

  const filteredInvoices = invoices.filter(inv => {
    if (filters.status && inv.status !== filters.status) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!inv.invoice_number.toLowerCase().includes(search)) return false;
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
          <a className="btn primary" href="#invoices">+ Создать счет</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр счетов</div>
              <div className="desc">GET /api/v1/invoices • фильтры • экспорт</div>
            </div>
            <span className="chip info">Связь: project_id • ks3_id</span>
          </div>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Статус</label>
                  <select>
                    <option>Все</option>
                    <option>draft</option>
                    <option>submitted</option>
                    <option>paid</option>
                  </select>
                </div>
              </div>
              <div className="actions">
                <a className="btn small" href="#invoices">Экспорт Excel</a>
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
                      <td>{inv.project?.name || `ID: ${inv.project_id}`}</td>
                      <td className="tRight">{inv.total_amount ? formatCurrencySimple(inv.total_amount, 'KGS') : '0'}</td>
                      <td className="tRight">{inv.vat_amount ? formatCurrencySimple(inv.vat_amount, 'KGS') : '0'}</td>
                      <td><span className={`chip ${getStatusChip(inv.status)}`}>{inv.status}</span></td>
                      <td className="tRight"><a className="btn small" href={`#invoices?id=${inv.id}`}>Открыть</a></td>
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

        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Карточка счета</div>
              <div className="desc">Детали • связь с КС-3 и проектом</div>
            </div>
          </div>
          <div className="cardBody">
            <div className="muted mini" style={{ padding: '20px', textAlign: 'center' }}>
              Выберите счет из списка
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Invoices;
