import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatKGS, formatUSD, formatCurrencySimple } from '../utils/currency';

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
}

interface Project {
  id: number;
  name: string;
}

const Estimates: React.FC = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'relatedcosts' | 'summary'>('items');
  const [filters, setFilters] = useState({ estimate_type: '', search: '' });
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
        axios.get(`${API_URL}/estimates/`, { params: { estimate_type: filters.estimate_type || undefined } }),
        axios.get(`${API_URL}/projects/`),
      ]);
      setEstimates(estimatesRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstimateDetails = async (id: number) => {
    try {
      const res = await axios.get(`${API_URL}/estimates/${id}`);
      setSelectedEstimate(res.data);
    } catch (error) {
      console.error('Ошибка загрузки сметы:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        project_id: Number(formData.project_id),
        items: formData.items.map(item => ({
          ...item,
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

      if (editingEstimate) {
        await axios.put(`${API_URL}/estimates/${editingEstimate.id}`, submitData);
      } else {
        await axios.post(`${API_URL}/estimates/`, submitData);
      }
      setShowModal(false);
      setEditingEstimate(null);
      setSelectedEstimate(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения сметы');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить смету?')) return;
    try {
      await axios.delete(`${API_URL}/estimates/${id}`);
      fetchData();
      if (selectedEstimate?.id === id) {
        setSelectedEstimate(null);
      }
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
          <a className="btn primary" href="#estimates" onClick={(e) => { e.preventDefault(); setShowModal(true); setEditingEstimate(null); setFormData({project_id: '', estimate_type: 'local', number: '', name: '', date: new Date().toISOString().split('T')[0], version: '', developed_by: '', approved_by: '', notes: '', items: [], related_cost_items: []}); }}>+ Создать смету</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр смет</div>
              <div className="desc">GET /api/v1/estimates • фильтры • экспорт</div>
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
                        <a className="btn small" href="#estimates" onClick={(ev) => { ev.preventDefault(); fetchEstimateDetails(e.id); setSelectedEstimate(e); }}>Открыть</a>
                        <a className="btn small" href="#estimates" onClick={(ev) => { ev.preventDefault(); setEditingEstimate(e); setFormData({project_id: e.project_id, estimate_type: e.estimate_type, number: e.number, name: e.name, date: e.date ? new Date(e.date).toISOString().split('T')[0] : '', version: e.version || '', developed_by: '', approved_by: '', notes: '', items: e.items || [], related_cost_items: e.related_cost_items || []}); setShowModal(true); }} style={{marginLeft: '6px'}}>Ред.</a>
                        <a className="btn small danger" href="#estimates" onClick={(ev) => { ev.preventDefault(); handleDelete(e.id); }} style={{marginLeft: '6px'}}>Уд.</a>
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
                <div className="desc">Позиции • сопутствующие затраты • расчет</div>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="cardHead">
              <div className="title">{editingEstimate ? 'Редактирование' : 'Создание'} сметы</div>
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
                  <label>Тип сметы *</label>
                  <select value={formData.estimate_type} onChange={(e) => setFormData({...formData, estimate_type: e.target.value})} required>
                    <option value="local">Локальная</option>
                    <option value="object">Объектная</option>
                    <option value="summary">Сводная</option>
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Номер сметы *</label>
                  <input type="text" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Название *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата *</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Версия</label>
                  <input type="text" value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Разработал</label>
                  <input type="text" value={formData.developed_by} onChange={(e) => setFormData({...formData, developed_by: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Утвердил</label>
                  <input type="text" value={formData.approved_by} onChange={(e) => setFormData({...formData, approved_by: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Примечания</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>

                <div style={{ height: '20px', borderTop: '1px solid var(--line)', margin: '20px 0', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div className="title">Позиции сметы</div>
                    <button type="button" className="btn small" onClick={addItem}>+ Добавить позицию</button>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Тип</th>
                        <th>Наименование *</th>
                        <th>Ед.</th>
                        <th className="tRight">Кол-во</th>
                        <th className="tRight">Цена</th>
                        <th className="tRight">Сумма</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <select value={item.item_type} onChange={(e) => updateItem(idx, 'item_type', e.target.value)} style={{ width: '100px' }}>
                              <option value="material">Материал</option>
                              <option value="work">Работа</option>
                              <option value="equipment">Оборудование</option>
                            </select>
                          </td>
                          <td><input type="text" value={item.work_name} onChange={(e) => updateItem(idx, 'work_name', e.target.value)} style={{ width: '100%' }} required /></td>
                          <td><input type="text" value={item.unit || ''} onChange={(e) => updateItem(idx, 'unit', e.target.value)} style={{ width: '60px' }} /></td>
                          <td><input type="number" step="0.01" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} style={{ width: '80px', textAlign: 'right' }} /></td>
                          <td><input type="number" step="0.01" value={item.unit_price || ''} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} style={{ width: '100px', textAlign: 'right' }} /></td>
                          <td className="tRight">{item.total_price ? formatCurrencySimple(item.total_price, 'KGS') : '0'}</td>
                          <td><button type="button" className="btn small danger" onClick={() => removeItem(idx)}>Уд.</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ height: '20px', borderTop: '1px solid var(--line)', margin: '20px 0', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div className="title">Сопутствующие затраты</div>
                    <button type="button" className="btn small" onClick={addRelatedCost}>+ Добавить затрату</button>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Тип</th>
                        <th>Описание</th>
                        <th className="tRight">Сумма</th>
                        <th>%</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.related_cost_items.map((cost, idx) => (
                        <tr key={idx}>
                          <td>
                            <select value={cost.cost_type} onChange={(e) => updateRelatedCost(idx, 'cost_type', e.target.value)} style={{ width: '120px' }}>
                              <option value="overhead">Накладные расходы</option>
                              <option value="profit">Прибыль</option>
                              <option value="other">Прочее</option>
                            </select>
                          </td>
                          <td><input type="text" value={cost.description || ''} onChange={(e) => updateRelatedCost(idx, 'description', e.target.value)} style={{ width: '100%' }} /></td>
                          <td><input type="number" step="0.01" value={cost.amount || ''} onChange={(e) => updateRelatedCost(idx, 'amount', e.target.value)} style={{ width: '100px', textAlign: 'right' }} /></td>
                          <td><input type="number" step="0.01" value={cost.percentage || ''} onChange={(e) => updateRelatedCost(idx, 'percentage', e.target.value)} style={{ width: '80px' }} /></td>
                          <td><button type="button" className="btn small danger" onClick={() => removeRelatedCost(idx)}>Уд.</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: '10px', background: 'var(--card)', borderRadius: '12px', marginTop: '20px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'right' }}>
                    Итого: {formatCurrencySimple(calculateTotal(), 'KGS')} / {formatCurrencySimple(calculateTotal() / 89, 'USD')}
                  </div>
                </div>

                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => { setShowModal(false); setEditingEstimate(null); }}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Estimates;
