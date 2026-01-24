import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatKGS, formatUSD, formatCurrencySimple } from '../utils/currency';
import './Pages.css';

interface EstimateItem {
  id?: number;
  item_type: string;
  line_number?: number;
  code?: string;
  work_name: string;
  unit?: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  materials_price?: number;
  labor_price?: number;
  equipment_price?: number;
  standard_rate_id?: number;
  notes?: string;
}

interface RelatedCost {
  id?: number;
  cost_type: string;
  description?: string;
  amount: number;
  percentage?: number;
  notes?: string;
}

interface Estimate {
  id: number;
  project_id: number;
  estimate_type: string;
  number: string;
  name: string;
  date: string;
  version?: string;
  total_amount?: number;
  materials_cost?: number;
  labor_cost?: number;
  equipment_cost?: number;
  overhead_cost?: number;
  related_costs?: number;
  status?: string;
  items?: EstimateItem[];
  related_cost_items?: RelatedCost[];
  project?: { id: number; name: string };
  notes?: string;
}

interface Project {
  id: number;
  name: string;
}

// Мок-данные для тестирования
const MOCK_ESTIMATES: Estimate[] = [
  {
    id: 1,
    project_id: 1,
    estimate_type: 'local',
    number: 'СМ-001/2024',
    name: 'Локальная смета на устройство фундамента',
    date: '2024-01-15',
    version: '1.0',
    total_amount: 2500000,
    materials_cost: 1200000,
    labor_cost: 800000,
    equipment_cost: 300000,
    overhead_cost: 200000,
    status: 'approved',
    items: [
      {
        id: 1,
        line_number: 1,
        item_type: 'work',
        work_name: 'Устройство монолитного фундамента',
        unit: 'м³',
        quantity: 50,
        unit_price: 15000,
        total_price: 750000,
        materials_price: 400000,
        labor_price: 300000,
        equipment_price: 50000,
      },
      {
        id: 2,
        line_number: 2,
        item_type: 'material',
        work_name: 'Бетон М300',
        unit: 'м³',
        quantity: 50,
        unit_price: 8000,
        total_price: 400000,
        materials_price: 400000,
      },
    ],
    related_cost_items: [
      {
        id: 1,
        cost_type: 'overhead',
        description: 'Накладные расходы',
        amount: 200000,
        percentage: 10,
      },
    ],
  },
  {
    id: 2,
    project_id: 1,
    estimate_type: 'object',
    number: 'СМ-002/2024',
    name: 'Объектная смета на строительство здания',
    date: '2024-02-01',
    version: '1.0',
    total_amount: 15000000,
    materials_cost: 7000000,
    labor_cost: 5000000,
    equipment_cost: 2000000,
    overhead_cost: 1000000,
    status: 'draft',
    items: [],
  },
  {
    id: 3,
    project_id: 2,
    estimate_type: 'summary',
    number: 'СМ-003/2024',
    name: 'Сводная смета по объекту',
    date: '2024-02-10',
    version: '1.0',
    total_amount: 50000000,
    status: 'in_review',
    items: [],
  },
];

const Estimates: React.FC = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const [viewingEstimate, setViewingEstimate] = useState<Estimate | null>(null);
  const [deletingEstimate, setDeletingEstimate] = useState<Estimate | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'relatedcosts' | 'summary'>('items');
  const [filters, setFilters] = useState({ estimate_type: '', search: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    estimate_type: 'local',
    number: '',
    name: '',
    date: new Date().toISOString().split('T')[0],
    version: '',
    developed_by: '',
    approved_by: '',
    notes: '',
    items: [] as EstimateItem[],
    related_cost_items: [] as RelatedCost[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEstimate) {
      fetchEstimateDetails(selectedEstimate.id);
    }
  }, [selectedEstimate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [estimatesRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/estimates/`, { params: { estimate_type: filters.estimate_type || undefined } }).catch(() => ({ data: MOCK_ESTIMATES })),
        axios.get(`${API_URL}/projects/`).catch(() => ({ data: [] })),
      ]);
      setEstimates(Array.isArray(estimatesRes.data) ? estimatesRes.data : MOCK_ESTIMATES);
      
      let projectsData: Project[] = [];
      if (projectsRes.data && projectsRes.data.data && Array.isArray(projectsRes.data.data)) {
        projectsData = projectsRes.data.data;
      } else if (Array.isArray(projectsRes.data)) {
        projectsData = projectsRes.data;
      }
      setProjects(projectsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setEstimates(MOCK_ESTIMATES);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstimateDetails = async (id: number) => {
    try {
      const res = await axios.get(`${API_URL}/estimates/${id}`).catch(() => {
        // Используем данные из списка при ошибке API
        const estimate = estimates.find(e => e.id === id);
        return { data: estimate || null };
      });
      if (res.data) {
        setSelectedEstimate(res.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки сметы:', error);
    }
  };

  const handleOpenModal = (estimate?: Estimate) => {
    if (estimate) {
      setEditingEstimate(estimate);
      setFormData({
        project_id: estimate.project_id,
        estimate_type: estimate.estimate_type,
        number: estimate.number,
        name: estimate.name,
        date: estimate.date ? estimate.date.split('T')[0] : new Date().toISOString().split('T')[0],
        version: estimate.version || '',
        developed_by: (estimate as any).developed_by || '',
        approved_by: (estimate as any).approved_by || '',
        notes: estimate.notes || '',
        items: estimate.items || [],
        related_cost_items: estimate.related_cost_items || [],
      });
    } else {
      setEditingEstimate(null);
      setFormData({
        project_id: '' as number | '',
        estimate_type: 'local',
        number: '',
        name: '',
        date: new Date().toISOString().split('T')[0],
        version: '',
        developed_by: '',
        approved_by: '',
        notes: '',
        items: [],
        related_cost_items: [],
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEstimate(null);
    setErrors({});
  };

  const handleViewEstimate = (estimate: Estimate) => {
    setViewingEstimate(estimate);
    setShowViewModal(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.project_id) {
      newErrors.project_id = 'Проект обязателен';
    }
    if (!formData.number.trim()) {
      newErrors.number = 'Номер сметы обязателен';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Наименование сметы обязательно';
    }
    if (!formData.date) {
      newErrors.date = 'Дата сметы обязательна';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submitData = {
        ...formData,
        project_id: Number(formData.project_id),
        items: formData.items.map((item, idx) => ({
          ...item,
          line_number: idx + 1,
          quantity: Number(item.quantity),
          unit_price: item.unit_price ? Number(item.unit_price) : undefined,
          total_price: item.total_price ? Number(item.total_price) : (item.unit_price && item.quantity ? Number(item.unit_price) * Number(item.quantity) : undefined),
          materials_price: item.materials_price ? Number(item.materials_price) : undefined,
          labor_price: item.labor_price ? Number(item.labor_price) : undefined,
          equipment_price: item.equipment_price ? Number(item.equipment_price) : undefined,
        })),
        related_cost_items: formData.related_cost_items.map(cost => ({
          ...cost,
          amount: Number(cost.amount),
          percentage: cost.percentage ? Number(cost.percentage) : undefined,
        })),
      };

      // Рассчитываем итоговые суммы
      const itemsTotal = submitData.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
      const materialsTotal = submitData.items.reduce((sum, item) => sum + (item.materials_price || 0), 0);
      const laborTotal = submitData.items.reduce((sum, item) => sum + (item.labor_price || 0), 0);
      const equipmentTotal = submitData.items.reduce((sum, item) => sum + (item.equipment_price || 0), 0);
      const relatedCostsTotal = submitData.related_cost_items.reduce((sum, cost) => sum + (cost.amount || 0), 0);
      const totalAmount = itemsTotal + relatedCostsTotal;

      const finalData = {
        ...submitData,
        total_amount: totalAmount,
        materials_cost: materialsTotal,
        labor_cost: laborTotal,
        equipment_cost: equipmentTotal,
        related_costs: relatedCostsTotal,
      };

      if (editingEstimate) {
        await axios.put(`${API_URL}/estimates/${editingEstimate.id}`, finalData).catch(() => {
          setEstimates(estimates.map(e => e.id === editingEstimate.id ? { ...editingEstimate, ...finalData } as Estimate : e));
        });
      } else {
        const newEstimate = await axios.post(`${API_URL}/estimates/`, finalData).catch(() => {
          const mockNew: Estimate = {
            id: Math.max(...estimates.map(e => e.id), 0) + 1,
            ...finalData,
            date: finalData.date,
            status: 'draft',
          };
          setEstimates([...estimates, mockNew]);
          return { data: mockNew };
        });
        if (newEstimate?.data) {
          setEstimates([...estimates, newEstimate.data]);
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
        alert('Ошибка сохранения сметы');
      }
    }
  };

  const handleDeleteClick = (estimate: Estimate) => {
    setDeletingEstimate(estimate);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEstimate) return;
    try {
      await axios.delete(`${API_URL}/estimates/${deletingEstimate.id}`).catch(() => {
        setEstimates(estimates.filter(e => e.id !== deletingEstimate.id));
      });
      setShowDeleteModal(false);
      setDeletingEstimate(null);
      if (selectedEstimate && selectedEstimate.id === deletingEstimate.id) {
        setSelectedEstimate(null);
      }
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        item_type: 'material',
        work_name: '',
        quantity: 1,
        unit: 'шт',
      }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: keyof EstimateItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? Number(value) : Number(newItems[index].quantity);
      const price = field === 'unit_price' ? Number(value) : Number(newItems[index].unit_price || 0);
      newItems[index].total_price = qty * price;
    }
    setFormData({ ...formData, items: newItems });
  };

  const addRelatedCost = () => {
    setFormData({
      ...formData,
      related_cost_items: [...formData.related_cost_items, {
        cost_type: 'overhead',
        description: '',
        amount: 0,
      }],
    });
  };

  const removeRelatedCost = (index: number) => {
    setFormData({
      ...formData,
      related_cost_items: formData.related_cost_items.filter((_, i) => i !== index),
    });
  };

  const updateRelatedCost = (index: number, field: keyof RelatedCost, value: any) => {
    const newCosts = [...formData.related_cost_items];
    newCosts[index] = { ...newCosts[index], [field]: value };
    setFormData({ ...formData, related_cost_items: newCosts });
  };

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const costsTotal = formData.related_cost_items.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    return itemsTotal + costsTotal;
  };

  const filteredEstimates = estimates.filter(e => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return e.number.toLowerCase().includes(search) || e.name.toLowerCase().includes(search);
    }
    return true;
  });

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Сметы</span></div>
          <div className="h1">Сметы</div>
          <p className="h2">Локальные, объектные, сводные сметы • позиции • сопутствующие затраты • расчет стоимости.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#estimates" onClick={(e) => { e.preventDefault(); handleOpenModal(); }}>+ Создать смету</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр смет</div>
              <div className="desc">Фильтрация • экспорт данных • поиск</div>
            </div>
            <span className="chip info">Типы: локальная, объектная, сводная</span>
          </div>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Тип</label>
                  <select value={filters.estimate_type} onChange={(e) => { setFilters({...filters, estimate_type: e.target.value}); fetchData(); }}>
                    <option value="">Все</option>
                    <option value="local">Локальная</option>
                    <option value="object">Объектная</option>
                    <option value="summary">Сводная</option>
                  </select>
                </div>
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
                  <th>Смета</th>
                  <th style={{ width: '16%' }}>Проект</th>
                  <th style={{ width: '12%' }}>Тип</th>
                  <th style={{ width: '12%' }} className="tRight">Сумма</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstimates.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Сметы не найдены</td>
                  </tr>
                ) : (
                  filteredEstimates.map((e) => (
                    <tr key={e.id}>
                      <td>{e.number}</td>
                      <td>{e.name || `№${e.number}`}</td>
                      <td>{e.project?.name || `ID: ${e.project_id}`}</td>
                      <td>{e.estimate_type}</td>
                      <td className="tRight">
                        <div>{formatCurrencySimple(e.total_amount, 'KGS')}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(e.total_amount ? e.total_amount / 89 : null, 'USD')}</div>
                      </td>
                      <td className="tRight">
                        <a className="btn small" href="#estimates" onClick={(ev) => { ev.preventDefault(); handleViewEstimate(e); }}>Просмотр</a>
                        <a className="btn small" href="#estimates" onClick={(ev) => { ev.preventDefault(); handleOpenModal(e); }} style={{marginLeft: '8px'}}>Ред.</a>
                        <a className="btn small danger" href="#estimates" onClick={(ev) => { ev.preventDefault(); handleDeleteClick(e); }} style={{marginLeft: '8px'}}>Уд.</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedEstimate && (
          <div className="card">
            <div className="cardHead">
              <div>
                <div className="title">Карточка сметы: {selectedEstimate.name}</div>
                <div className="desc">Позиции сметы • сопутствующие затраты • расчет стоимости</div>
              </div>
              <span className="chip info">
                {selectedEstimate.estimate_type === 'local' ? 'Локальная' :
                 selectedEstimate.estimate_type === 'object' ? 'Объектная' :
                 selectedEstimate.estimate_type === 'summary' ? 'Сводная' :
                 selectedEstimate.estimate_type}
              </span>
            </div>
            <div className="cardBody">
              <div className="tabs">
                <div className={`tab ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>Позиции ({selectedEstimate.items?.length || 0})</div>
                <div className={`tab ${activeTab === 'relatedcosts' ? 'active' : ''}`} onClick={() => setActiveTab('relatedcosts')}>Сопутствующие затраты ({selectedEstimate.related_cost_items?.length || 0})</div>
                <div className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Расчет</div>
              </div>

              {activeTab === 'items' && (
                <table style={{ marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>№</th>
                      <th>Наименование</th>
                      <th style={{ width: '8%' }}>Ед.</th>
                      <th style={{ width: '10%' }} className="tRight">Кол-во</th>
                      <th style={{ width: '12%' }} className="tRight">Цена</th>
                      <th style={{ width: '12%' }} className="tRight">Сумма</th>
                      <th style={{ width: '12%' }}>Тип</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEstimate.items?.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>Позиции не найдены</td></tr>
                    ) : (
                      selectedEstimate.items?.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>{item.line_number || idx + 1}</td>
                          <td>{item.work_name}</td>
                          <td>{item.unit || '—'}</td>
                          <td className="tRight">{item.quantity}</td>
                          <td className="tRight">{item.unit_price ? formatCurrencySimple(item.unit_price, 'KGS') : '—'}</td>
                          <td className="tRight">{item.total_price ? formatCurrencySimple(item.total_price, 'KGS') : '—'}</td>
                          <td>
                            {item.item_type === 'material' ? 'Материал' :
                             item.item_type === 'work' ? 'Работа' :
                             item.item_type === 'equipment' ? 'Оборудование' :
                             item.item_type}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'relatedcosts' && (
                <table style={{ marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th>Тип затрат</th>
                      <th>Описание</th>
                      <th style={{ width: '15%' }} className="tRight">Сумма</th>
                      <th style={{ width: '12%' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEstimate.related_cost_items?.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>Сопутствующие затраты не найдены</td></tr>
                    ) : (
                      selectedEstimate.related_cost_items?.map((cost, idx) => (
                        <tr key={cost.id || idx}>
                          <td>
                            {cost.cost_type === 'overhead' ? 'Накладные расходы' :
                             cost.cost_type === 'profit' ? 'Прибыль' :
                             cost.cost_type === 'other' ? 'Прочее' :
                             cost.cost_type}
                          </td>
                          <td>{cost.description || '—'}</td>
                          <td className="tRight">{cost.amount ? formatCurrencySimple(cost.amount, 'KGS') : '0'}</td>
                          <td>{cost.percentage ? `${cost.percentage}%` : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'summary' && (
                <div style={{ padding: '20px' }}>
                  <div className="kpi">
                    <div className="kpiItem">
                      <div className="k">Материалы</div>
                      <div className="v">
                        <div>{formatCurrencySimple(selectedEstimate.materials_cost, 'KGS')}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(selectedEstimate.materials_cost ? selectedEstimate.materials_cost / 89 : null, 'USD')}</div>
                      </div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Работы</div>
                      <div className="v">
                        <div>{formatCurrencySimple(selectedEstimate.labor_cost, 'KGS')}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(selectedEstimate.labor_cost ? selectedEstimate.labor_cost / 89 : null, 'USD')}</div>
                      </div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Механизмы</div>
                      <div className="v">
                        <div>{formatCurrencySimple(selectedEstimate.equipment_cost, 'KGS')}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(selectedEstimate.equipment_cost ? selectedEstimate.equipment_cost / 89 : null, 'USD')}</div>
                      </div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Сопутствующие</div>
                      <div className="v">
                        <div>{formatCurrencySimple(selectedEstimate.related_costs, 'KGS')}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(selectedEstimate.related_costs ? selectedEstimate.related_costs / 89 : null, 'USD')}</div>
                      </div>
                    </div>
                    <div className="kpiItem">
                      <div className="k">Итого</div>
                      <div className="v">
                        <div>{formatCurrencySimple(selectedEstimate.total_amount, 'KGS')}</div>
                        <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>{formatCurrencySimple(selectedEstimate.total_amount ? selectedEstimate.total_amount / 89 : null, 'USD')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно создания/редактирования сметы */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }} onClick={handleCloseModal}>
          <div className="card" style={{ maxWidth: '800px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">{editingEstimate ? 'Редактирование' : 'Создание'} сметы</div>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '24px' }}>×</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Проект *</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => {
                      setFormData({...formData, project_id: e.target.value ? parseInt(e.target.value) : ''});
                      if (errors.project_id) setErrors({...errors, project_id: ''});
                    }}
                    required
                  >
                    <option value="">Выберите проект</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Тип сметы *</label>
                  <select
                    value={formData.estimate_type}
                    onChange={(e) => setFormData({...formData, estimate_type: e.target.value})}
                    required
                  >
                    <option value="local">Локальная</option>
                    <option value="object">Объектная</option>
                    <option value="summary">Сводная</option>
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Номер сметы *</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => {
                      setFormData({...formData, number: e.target.value});
                      if (errors.number) setErrors({...errors, number: ''});
                    }}
                    required
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Название *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      if (errors.name) setErrors({...errors, name: ''});
                    }}
                    required
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({...formData, date: e.target.value});
                      if (errors.date) setErrors({...errors, date: ''});
                    }}
                    required
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Версия</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({...formData, version: e.target.value})}
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Разработал</label>
                  <input
                    type="text"
                    value={formData.developed_by}
                    onChange={(e) => setFormData({...formData, developed_by: e.target.value})}
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Утвердил</label>
                  <input
                    type="text"
                    value={formData.approved_by}
                    onChange={(e) => setFormData({...formData, approved_by: e.target.value})}
                  />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Примечания</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                <div style={{ height: '20px' }} />
                <div style={{ borderTop: '1px solid rgba(36,48,95,0.85)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label>Позиции сметы</label>
                    <button type="button" className="btn small" onClick={addItem}>+ Добавить позицию</button>
                  </div>
                  {formData.items.length > 0 && (
                    <div className="modal-table-wrapper">
                      <table style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '10%' }}>Тип</th>
                          <th>Наименование</th>
                          <th style={{ width: '8%' }}>Ед.</th>
                          <th style={{ width: '10%' }}>Кол-во</th>
                          <th style={{ width: '12%' }}>Цена</th>
                          <th style={{ width: '12%' }}>Сумма</th>
                          <th style={{ width: '5%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <select value={item.item_type} onChange={(e) => updateItem(idx, 'item_type', e.target.value)} style={{ width: '100%', padding: '4px 8px' }}>
                                <option value="material">Материал</option>
                                <option value="work">Работа</option>
                                <option value="equipment">Оборудование</option>
                              </select>
                            </td>
                            <td><input type="text" style={{ width: '100%', padding: '4px 8px' }} value={item.work_name} onChange={(e) => updateItem(idx, 'work_name', e.target.value)} placeholder="Наименование" required /></td>
                            <td><input type="text" style={{ width: '100%', padding: '4px 8px' }} value={item.unit || ''} onChange={(e) => updateItem(idx, 'unit', e.target.value)} placeholder="шт" /></td>
                            <td><input type="number" step="0.01" style={{ width: '100%', padding: '4px 8px', textAlign: 'right' }} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                            <td><input type="number" step="0.01" style={{ width: '100%', padding: '4px 8px', textAlign: 'right' }} value={item.unit_price || ''} onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} /></td>
                            <td className="tRight">{item.total_price ? item.total_price.toLocaleString('ru-RU') : '—'}</td>
                            <td><button type="button" className="btn small danger" onClick={() => removeItem(idx)}>×</button></td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ height: '20px' }} />
                <div style={{ borderTop: '1px solid rgba(36,48,95,0.85)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label>Сопутствующие затраты</label>
                    <button type="button" className="btn small" onClick={addRelatedCost}>+ Добавить затрату</button>
                  </div>
                  {formData.related_cost_items.length > 0 && (
                    <div className="modal-table-wrapper">
                      <table style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '20%' }}>Тип</th>
                          <th>Описание</th>
                          <th style={{ width: '12%' }}>Сумма</th>
                          <th style={{ width: '8%' }}>%</th>
                          <th style={{ width: '5%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.related_cost_items.map((cost, idx) => (
                          <tr key={idx}>
                            <td>
                              <select value={cost.cost_type} onChange={(e) => updateRelatedCost(idx, 'cost_type', e.target.value)} style={{ width: '100%', padding: '4px 8px' }}>
                                <option value="overhead">Накладные расходы</option>
                                <option value="profit">Прибыль</option>
                                <option value="other">Прочее</option>
                              </select>
                            </td>
                            <td><input type="text" style={{ width: '100%', padding: '4px 8px' }} value={cost.description || ''} onChange={(e) => updateRelatedCost(idx, 'description', e.target.value)} placeholder="Описание" /></td>
                            <td><input type="number" step="0.01" style={{ width: '100%', padding: '4px 8px', textAlign: 'right' }} value={cost.amount || ''} onChange={(e) => updateRelatedCost(idx, 'amount', parseFloat(e.target.value) || 0)} /></td>
                            <td><input type="number" step="0.01" style={{ width: '100%', padding: '4px 8px', textAlign: 'right' }} value={cost.percentage || ''} onChange={(e) => updateRelatedCost(idx, 'percentage', parseFloat(e.target.value) || 0)} /></td>
                            <td><button type="button" className="btn small danger" onClick={() => removeRelatedCost(idx)}>×</button></td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ height: '20px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={handleCloseModal}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

        {/* Модальное окно просмотра сметы */}
        {showViewModal && viewingEstimate && (
          <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Просмотр сметы: {viewingEstimate.number}</h2>
                <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="kpi">
                  <div className="kpiItem">
                    <div className="k">Проект</div>
                    <div className="v">{viewingEstimate.project?.name || `ID: ${viewingEstimate.project_id}`}</div>
                  </div>
                  <div className="kpiItem">
                    <div className="k">Тип</div>
                    <div className="v">
                      {viewingEstimate.estimate_type === 'local' ? 'Локальная' :
                       viewingEstimate.estimate_type === 'object' ? 'Объектная' :
                       viewingEstimate.estimate_type === 'summary' ? 'Сводная' :
                       viewingEstimate.estimate_type}
                    </div>
                  </div>
                  <div className="kpiItem">
                    <div className="k">Дата</div>
                    <div className="v">{new Date(viewingEstimate.date).toLocaleDateString('ru-RU')}</div>
                  </div>
                  <div className="kpiItem">
                    <div className="k">Версия</div>
                    <div className="v">{viewingEstimate.version || '—'}</div>
                  </div>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Наименование</h3>
                  <p style={{ color: 'var(--text)', marginBottom: '1rem' }}>{viewingEstimate.name}</p>
                  {viewingEstimate.notes && (
                    <>
                      <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Примечания</h3>
                      <p style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{viewingEstimate.notes}</p>
                    </>
                  )}
                </div>
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--panel)', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Материалы</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                        {formatCurrencySimple(viewingEstimate.materials_cost, 'KGS')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Работы</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                        {formatCurrencySimple(viewingEstimate.labor_cost, 'KGS')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Механизмы</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                        {formatCurrencySimple(viewingEstimate.equipment_cost, 'KGS')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Сопутствующие</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                        {formatCurrencySimple(viewingEstimate.related_costs, 'KGS')}
                      </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted2)', marginBottom: '0.25rem' }}>Итого</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                        {formatCurrencySimple(viewingEstimate.total_amount, 'KGS')}
                      </div>
                      <div style={{ fontSize: '0.85em', color: 'var(--muted2)' }}>
                        {formatCurrencySimple(viewingEstimate.total_amount ? viewingEstimate.total_amount / 89 : null, 'USD')}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Закрыть</button>
                  <button className="btn btn-primary" onClick={() => { setShowViewModal(false); handleOpenModal(viewingEstimate); }}>Редактировать</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно удаления */}
        {showDeleteModal && deletingEstimate && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Удаление сметы</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Вы уверены, что хотите удалить смету <strong>"{deletingEstimate.number}"</strong>?</p>
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

export default Estimates;
