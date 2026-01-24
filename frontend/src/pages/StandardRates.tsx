import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrencySimple } from '../utils/currency';
import './Pages.css';

interface StandardRate {
  id: number;
  code: string;
  name: string;
  unit: string;
  materials_cost: number;
  labor_cost: number;
  equipment_cost: number;
  total_cost: number;
  collection?: string;
  section?: string;
  notes?: string;
  is_active: boolean;
}

const MOCK_RATES: StandardRate[] = [
  {
    id: 1,
    code: 'FER-01-01-001-01',
    name: 'Разработка грунта в отвал экскаваторами',
    unit: '1000 м3',
    materials_cost: 0,
    labor_cost: 5000,
    equipment_cost: 15000,
    total_cost: 20000,
    collection: 'ФЕР-2001',
    section: 'Земляные работы',
    is_active: true,
  },
  {
    id: 2,
    code: 'FER-06-01-001-01',
    name: 'Устройство бетонной подготовки',
    unit: 'м3',
    materials_cost: 3500,
    labor_cost: 1200,
    equipment_cost: 300,
    total_cost: 5000,
    collection: 'ФЕР-2001',
    section: 'Бетонные работы',
    is_active: true,
  },
];

const StandardRates: React.FC = () => {
  const [rates, setRates] = useState<StandardRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRate, setEditingRate] = useState<StandardRate | null>(null);
  const [deletingRate, setDeletingRate] = useState<StandardRate | null>(null);
  const [filters, setFilters] = useState({ search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    unit: '',
    materials_cost: '',
    labor_cost: '',
    equipment_cost: '',
    collection: '',
    section: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/standard-rates/`).catch(() => ({ data: MOCK_RATES }));
      setRates(Array.isArray(res.data) ? res.data : MOCK_RATES);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setRates(MOCK_RATES);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (rate?: StandardRate) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        code: rate.code,
        name: rate.name,
        unit: rate.unit || '',
        materials_cost: rate.materials_cost.toString(),
        labor_cost: rate.labor_cost.toString(),
        equipment_cost: rate.equipment_cost.toString(),
        collection: rate.collection || '',
        section: rate.section || '',
        notes: rate.notes || '',
      });
    } else {
      setEditingRate(null);
      setFormData({
        code: '',
        name: '',
        unit: '',
        materials_cost: '',
        labor_cost: '',
        equipment_cost: '',
        collection: '',
        section: '',
        notes: '',
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRate(null);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.code.trim()) newErrors.code = 'Код обязателен';
    if (!formData.name.trim()) newErrors.name = 'Наименование обязательно';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const data = {
        ...formData,
        materials_cost: parseFloat(formData.materials_cost || '0'),
        labor_cost: parseFloat(formData.labor_cost || '0'),
        equipment_cost: parseFloat(formData.equipment_cost || '0'),
      };

      if (editingRate) {
        await axios.put(`${API_URL}/standard-rates/${editingRate.id}`, data).catch(() => {
          setRates(rates.map(r => r.id === editingRate.id ? { ...editingRate, ...data, total_cost: data.materials_cost + data.labor_cost + data.equipment_cost } : r));
        });
      } else {
        await axios.post(`${API_URL}/standard-rates/`, data).catch(() => {
          const newRate: StandardRate = {
            id: Math.max(...rates.map(r => r.id), 0) + 1,
            ...data,
            total_cost: data.materials_cost + data.labor_cost + data.equipment_cost,
            is_active: true,
          };
          setRates([...rates, newRate]);
        });
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения');
    }
  };

  const handleDeleteClick = (rate: StandardRate) => {
    setDeletingRate(rate);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRate) return;
    try {
      await axios.delete(`${API_URL}/standard-rates/${deletingRate.id}`).catch(() => {
        setRates(rates.filter(r => r.id !== deletingRate.id));
      });
      setShowDeleteModal(false);
      setDeletingRate(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const filteredRates = rates.filter(r => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return r.code.toLowerCase().includes(search) || r.name.toLowerCase().includes(search);
    }
    return true;
  });

  const paginatedRates = filteredRates.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredRates.length / pageSize);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Нормативные расценки</span></div>
          <div className="h1">Нормативные расценки</div>
          <p className="h2">Справочник расценок • ФЕР/ТЕР/ГЭСН • стоимость работ и материалов.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#rates" onClick={(e) => { e.preventDefault(); handleOpenModal(); }}>+ Добавить расценку</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Справочник расценок</div>
              <div className="desc">Поиск по коду или наименованию</div>
            </div>
          </div>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Поиск</label>
                  <input type="text" placeholder="Код или наименование..." value={filters.search} onChange={(e) => { setFilters({ search: e.target.value }); setCurrentPage(1); }} />
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Код</th>
                  <th>Наименование</th>
                  <th style={{ width: '8%' }}>Ед.</th>
                  <th style={{ width: '12%' }} className="tRight">Материалы</th>
                  <th style={{ width: '12%' }} className="tRight">Работа</th>
                  <th style={{ width: '12%' }} className="tRight">Механизмы</th>
                  <th style={{ width: '12%' }} className="tRight">Итого</th>
                  <th className="tRight" style={{ width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedRates.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Расценки не найдены</td></tr>
                ) : (
                  paginatedRates.map((r) => (
                    <tr key={r.id}>
                      <td>{r.code}</td>
                      <td>
                        <div>{r.name}</div>
                        {r.collection && <div className="mini" style={{ color: 'var(--muted2)' }}>{r.collection}</div>}
                      </td>
                      <td>{r.unit}</td>
                      <td className="tRight">{formatCurrencySimple(r.materials_cost, 'KGS')}</td>
                      <td className="tRight">{formatCurrencySimple(r.labor_cost, 'KGS')}</td>
                      <td className="tRight">{formatCurrencySimple(r.equipment_cost, 'KGS')}</td>
                      <td className="tRight"><strong>{formatCurrencySimple(r.total_cost, 'KGS')}</strong></td>
                      <td className="tRight">
                        <button className="btn small" onClick={() => handleOpenModal(r)}>✎</button>
                        <button className="btn small danger" onClick={() => handleDeleteClick(r)} style={{ marginLeft: '5px' }}>×</button>
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
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">{editingRate ? 'Редактирование' : 'Создание'} расценки</div>
              <button className="btn ghost" onClick={handleCloseModal}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Код расценки *</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Наименование *</label>
                  <textarea value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Ед. измерения</label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="field">
                    <label>Материалы</label>
                    <input type="number" step="0.01" value={formData.materials_cost} onChange={(e) => setFormData({...formData, materials_cost: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Работа</label>
                    <input type="number" step="0.01" value={formData.labor_cost} onChange={(e) => setFormData({...formData, labor_cost: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Механизмы</label>
                    <input type="number" step="0.01" value={formData.equipment_cost} onChange={(e) => setFormData({...formData, equipment_cost: e.target.value})} />
                  </div>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Сборник</label>
                  <input type="text" value={formData.collection} onChange={(e) => setFormData({...formData, collection: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Раздел</label>
                  <input type="text" value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} />
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={handleCloseModal}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deletingRate && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Удаление расценки</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Вы уверены, что хотите удалить расценку <strong>"{deletingRate.code}"</strong>?</p>
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

export default StandardRates;
