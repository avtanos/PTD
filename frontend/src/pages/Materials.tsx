import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrencySimple } from '../utils/currency';

interface Material {
  id: number;
  code: string;
  name: string;
  material_type: string;
  unit: string;
  specification?: string;
  standard_price?: number;
  is_active: boolean;
}

interface Warehouse {
  id: number;
  code: string;
  name: string;
  location?: string;
  responsible?: string;
  is_active: boolean;
}

interface WarehouseStock {
  id: number;
  warehouse_id: number;
  material_id: number;
  quantity: number;
  reserved_quantity: number;
  material?: Material;
  warehouse?: Warehouse;
}

interface MaterialMovement {
  id: number;
  movement_type: string;
  movement_number: string;
  movement_date: string;
  material_id: number;
  quantity: number;
  price?: number;
  amount?: number;
  from_warehouse_id?: number;
  to_warehouse_id?: number;
  project_id?: number;
  material?: Material;
  supplier?: string;
  responsible?: string;
}

interface MaterialWriteOffItem {
  id?: number;
  material_id: number;
  quantity: number;
  price?: number;
  amount?: number;
  batch_number?: string;
  notes?: string;
  material?: Material;
}

interface MaterialWriteOff {
  id: number;
  write_off_number: string;
  write_off_date: string;
  project_id: number;
  warehouse_id?: number;
  reason: string;
  description?: string;
  responsible: string;
  total_amount: number;
  status: string;
  items?: MaterialWriteOffItem[];
}

interface Project {
  id: number;
  name: string;
}

// MOCK DATA
const MOCK_MATERIALS: Material[] = [
  { id: 1, code: 'MAT-001', name: 'Цемент М500', material_type: 'material', unit: 'кг', standard_price: 8.50, is_active: true },
  { id: 2, code: 'MAT-002', name: 'Арматура А500С d12', material_type: 'material', unit: 'т', standard_price: 45000.00, is_active: true },
  { id: 3, code: 'MAT-003', name: 'Кирпич красный', material_type: 'material', unit: 'шт', standard_price: 15.00, is_active: true },
  { id: 4, code: 'TOOL-001', name: 'Перфоратор Bosch', material_type: 'tool', unit: 'шт', standard_price: 12000.00, is_active: true },
  { id: 5, code: 'EQP-001', name: 'Бетономешалка 180л', material_type: 'equipment', unit: 'шт', standard_price: 25000.00, is_active: true },
];

const MOCK_WAREHOUSES: Warehouse[] = [
  { id: 1, code: 'WH-01', name: 'Центральный склад', location: 'ул. Промзона, 1', responsible: 'Иванов И.И.', is_active: true },
  { id: 2, code: 'WH-02', name: 'Склад "Объект А"', location: 'ул. Ленина, 42', responsible: 'Петров П.П.', is_active: true },
];

const MOCK_STOCKS: WarehouseStock[] = [
  { id: 1, warehouse_id: 1, material_id: 1, quantity: 5000, reserved_quantity: 1000, material: MOCK_MATERIALS[0], warehouse: MOCK_WAREHOUSES[0] },
  { id: 2, warehouse_id: 1, material_id: 2, quantity: 10, reserved_quantity: 2, material: MOCK_MATERIALS[1], warehouse: MOCK_WAREHOUSES[0] },
  { id: 3, warehouse_id: 2, material_id: 3, quantity: 10000, reserved_quantity: 0, material: MOCK_MATERIALS[2], warehouse: MOCK_WAREHOUSES[1] },
];

const MOCK_MOVEMENTS: MaterialMovement[] = [
  { id: 1, movement_type: 'receipt', movement_number: 'PRIH-001', movement_date: '2023-10-01', material_id: 1, quantity: 6000, price: 8.00, amount: 48000, to_warehouse_id: 1, supplier: 'ОсОО "СтройСнаб"', responsible: 'Иванов И.И.', material: MOCK_MATERIALS[0] },
  { id: 2, movement_type: 'expense', movement_number: 'RASH-001', movement_date: '2023-10-05', material_id: 1, quantity: 1000, from_warehouse_id: 1, project_id: 1, responsible: 'Петров П.П.', material: MOCK_MATERIALS[0] },
  { id: 3, movement_type: 'transfer', movement_number: 'PER-001', movement_date: '2023-10-10', material_id: 2, quantity: 2, from_warehouse_id: 1, to_warehouse_id: 2, responsible: 'Сидоров С.С.', material: MOCK_MATERIALS[1] },
];

const MOCK_WRITEOFFS: MaterialWriteOff[] = [
  { id: 1, write_off_number: 'AKT-001', write_off_date: '2023-10-15', project_id: 1, warehouse_id: 1, reason: 'Бой при транспортировке', total_amount: 1500, status: 'approved', responsible: 'Иванов И.И.', items: [] },
  { id: 2, write_off_number: 'AKT-002', write_off_date: '2023-10-20', project_id: 1, warehouse_id: 2, reason: 'Истечение срока годности', total_amount: 500, status: 'pending', responsible: 'Петров П.П.', items: [] },
];

const Materials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [movements, setMovements] = useState<MaterialMovement[]>([]);
  const [writeOffs, setWriteOffs] = useState<MaterialWriteOff[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'materials' | 'warehouses' | 'stock' | 'movements' | 'writeoffs'>('materials');
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | ''>('');
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [materialForm, setMaterialForm] = useState({ code: '', name: '', material_type: 'material', unit: 'шт', specification: '', standard_price: '', notes: '', is_active: true });
  const [warehouseForm, setWarehouseForm] = useState({ code: '', name: '', location: '', responsible: '', notes: '', is_active: true });
  const [movementForm, setMovementForm] = useState({ movement_type: 'receipt', movement_number: '', movement_date: new Date().toISOString().split('T')[0], material_id: '' as number | '', quantity: '', price: '', from_warehouse_id: '' as number | '', to_warehouse_id: '' as number | '', project_id: '' as number | '', supplier: '', batch_number: '', responsible: '', notes: '' });
  const [writeOffForm, setWriteOffForm] = useState({ write_off_number: '', write_off_date: new Date().toISOString().split('T')[0], project_id: '' as number | '', warehouse_id: '' as number | '', reason: '', description: '', responsible: '', approved_by: '', notes: '', items: [] as MaterialWriteOffItem[] });
  const [filters, setFilters] = useState({ search: '', material_type: '', warehouse_id: '' as number | '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedWarehouse]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Параллельная загрузка базовых справочников
      const [matRes, whRes, projRes] = await Promise.all([
        axios.get(`${API_URL}/materials/materials/`).catch(() => ({ data: MOCK_MATERIALS })),
        axios.get(`${API_URL}/materials/warehouses/`).catch(() => ({ data: MOCK_WAREHOUSES })),
        axios.get(`${API_URL}/projects/`).catch(() => ({ data: [] })),
      ]);

      const materialsData = Array.isArray(matRes.data) && matRes.data.length > 0 ? matRes.data : MOCK_MATERIALS;
      const warehousesData = Array.isArray(whRes.data) && whRes.data.length > 0 ? whRes.data : MOCK_WAREHOUSES;
      
      setMaterials(materialsData);
      setWarehouses(warehousesData);
      
      // Обработка данных проектов (может быть пагинация)
      let projectsData: Project[] = [];
      if (projRes.data && projRes.data.data && Array.isArray(projRes.data.data)) {
        projectsData = projRes.data.data;
      } else if (Array.isArray(projRes.data)) {
        projectsData = projRes.data;
      }
      setProjects(projectsData);

      // Загрузка данных для активной вкладки
      if (activeTab === 'stock') {
        if (selectedWarehouse) {
          try {
            const stocksRes = await axios.get(`${API_URL}/materials/warehouses/${selectedWarehouse}/stocks`);
            setStocks(stocksRes.data);
          } catch (e) {
             // Фильтруем мок-данные по складу
             setStocks(MOCK_STOCKS.filter(s => s.warehouse_id === selectedWarehouse));
          }
        } else {
            setStocks([]);
        }
      }
      
      if (activeTab === 'movements') {
        try {
            const params: any = {};
            if (selectedWarehouse) params.warehouse_id = selectedWarehouse;
            const res = await axios.get(`${API_URL}/materials/movements/`, { params });
            setMovements(res.data);
        } catch (e) {
            let filteredMovements = MOCK_MOVEMENTS;
            if (selectedWarehouse) {
                filteredMovements = filteredMovements.filter(m => m.from_warehouse_id === selectedWarehouse || m.to_warehouse_id === selectedWarehouse);
            }
            setMovements(filteredMovements);
        }
      }
      
      if (activeTab === 'writeoffs') {
        try {
            const writeOffsRes = await axios.get(`${API_URL}/materials/write-offs/`);
            setWriteOffs(writeOffsRes.data);
        } catch (e) {
            setWriteOffs(MOCK_WRITEOFFS);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // Fallback to full mocks on critical error
      setMaterials(MOCK_MATERIALS);
      setWarehouses(MOCK_WAREHOUSES);
      setStocks(MOCK_STOCKS);
      setMovements(MOCK_MOVEMENTS);
      setWriteOffs(MOCK_WRITEOFFS);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...materialForm, standard_price: materialForm.standard_price ? parseFloat(materialForm.standard_price) : undefined };
      if (editingMaterial) {
        await axios.put(`${API_URL}/materials/materials/${editingMaterial.id}`, data);
      } else {
        await axios.post(`${API_URL}/materials/materials/`, data);
      }
      setShowMaterialModal(false);
      setEditingMaterial(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения материала');
    }
  };

  const handleWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await axios.put(`${API_URL}/materials/warehouses/${editingWarehouse.id}`, warehouseForm);
      } else {
        await axios.post(`${API_URL}/materials/warehouses/`, warehouseForm);
      }
      setShowWarehouseModal(false);
      setEditingWarehouse(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения склада');
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...movementForm,
        material_id: Number(movementForm.material_id),
        quantity: parseFloat(movementForm.quantity),
        price: movementForm.price ? parseFloat(movementForm.price) : undefined,
        from_warehouse_id: movementForm.from_warehouse_id ? Number(movementForm.from_warehouse_id) : undefined,
        to_warehouse_id: movementForm.to_warehouse_id ? Number(movementForm.to_warehouse_id) : undefined,
        project_id: movementForm.project_id ? Number(movementForm.project_id) : undefined,
      };
      await axios.post(`${API_URL}/materials/movements/`, data);
      setShowMovementModal(false);
      setMovementForm({ movement_type: 'receipt', movement_number: '', movement_date: new Date().toISOString().split('T')[0], material_id: '', quantity: '', price: '', from_warehouse_id: '', to_warehouse_id: '', project_id: '', supplier: '', batch_number: '', responsible: '', notes: '' });
      if (activeTab === 'stock' && selectedWarehouse) {
        fetchData();
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения движения');
    }
  };

  const handleWriteOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...writeOffForm,
        project_id: Number(writeOffForm.project_id),
        warehouse_id: writeOffForm.warehouse_id ? Number(writeOffForm.warehouse_id) : undefined,
        items: writeOffForm.items.map(item => ({
          ...item,
          material_id: Number(item.material_id),
          quantity: Number(item.quantity),
          price: item.price ? Number(item.price) : undefined,
        })),
      };
      await axios.post(`${API_URL}/materials/write-offs/`, data);
      setShowWriteOffModal(false);
      setWriteOffForm({ write_off_number: '', write_off_date: new Date().toISOString().split('T')[0], project_id: '', warehouse_id: '', reason: '', description: '', responsible: '', approved_by: '', notes: '', items: [] });
      fetchData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения списания');
    }
  };

  const addWriteOffItem = () => {
    setWriteOffForm({
      ...writeOffForm,
      items: [...writeOffForm.items, { material_id: 0, quantity: 1, price: 0 }],
    });
  };

  const removeWriteOffItem = (index: number) => {
    setWriteOffForm({
      ...writeOffForm,
      items: writeOffForm.items.filter((_, i) => i !== index),
    });
  };

  const updateWriteOffItem = (index: number, field: keyof MaterialWriteOffItem, value: any) => {
    const newItems = [...writeOffForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'price') {
      const qty = field === 'quantity' ? Number(value) : Number(newItems[index].quantity || 0);
      const price = field === 'price' ? Number(value) : Number(newItems[index].price || 0);
      newItems[index].amount = qty * price;
    }
    setWriteOffForm({ ...writeOffForm, items: newItems });
  };

  const filteredMaterials = materials.filter(m => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!m.code.toLowerCase().includes(search) && !m.name.toLowerCase().includes(search)) return false;
    }
    if (filters.material_type && m.material_type !== filters.material_type) return false;
    return true;
  });

  const paginatedMaterials = filteredMaterials.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredMaterials.length / pageSize);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Материалы и склады</span></div>
          <div className="h1">Материалы и склады</div>
          <p className="h2">Справочник материалов • склады • остатки • движение • списание • связь с проектами/заявками.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#materials" onClick={(e) => { e.preventDefault(); setShowMaterialModal(true); setEditingMaterial(null); setMaterialForm({ code: '', name: '', material_type: 'material', unit: 'шт', specification: '', standard_price: '', notes: '', is_active: true }); }}>+ Материал</a>
          <a className="btn" href="#materials" onClick={(e) => { e.preventDefault(); setShowWarehouseModal(true); setEditingWarehouse(null); setWarehouseForm({ code: '', name: '', location: '', responsible: '', notes: '', is_active: true }); }}>+ Склад</a>
        </div>
      </div>

      <div className="card">
        <div className="cardHead">
          <div>
            <div className="title">Управление материалами и складами</div>
            <div className="desc">Материалы • склады • остатки • движение • списание</div>
          </div>
        </div>
        <div className="cardBody">
          <div className="tabs">
            <div className={`tab ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>Материалы</div>
            <div className={`tab ${activeTab === 'warehouses' ? 'active' : ''}`} onClick={() => setActiveTab('warehouses')}>Склады</div>
            <div className={`tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>Остатки</div>
            <div className={`tab ${activeTab === 'movements' ? 'active' : ''}`} onClick={() => setActiveTab('movements')}>Движение</div>
            <div className={`tab ${activeTab === 'writeoffs' ? 'active' : ''}`} onClick={() => setActiveTab('writeoffs')}>Списание</div>
          </div>

          {activeTab === 'materials' && (
            <>
              <div className="toolbar" style={{ marginTop: '10px' }}>
                <div className="filters">
                  <div className="field">
                    <label>Поиск</label>
                    <input type="text" placeholder="Код или название..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Тип</label>
                    <select value={filters.material_type} onChange={(e) => setFilters({...filters, material_type: e.target.value})}>
                      <option value="">Все</option>
                      <option value="material">material</option>
                      <option value="equipment">equipment</option>
                      <option value="tool">tool</option>
                    </select>
                  </div>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Код</th>
                    <th>Наименование</th>
                    <th style={{ width: '12%' }}>Тип</th>
                    <th style={{ width: '10%' }}>Ед. изм.</th>
                    <th style={{ width: '12%' }} className="tRight">Цена</th>
                    <th className="tRight" style={{ width: '14%' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Материалы не найдены</td>
                    </tr>
                  ) : (
                    paginatedMaterials.map((m) => (
                      <tr key={m.id}>
                        <td>{m.code}</td>
                        <td>{m.name}</td>
                        <td>{m.material_type}</td>
                        <td>{m.unit}</td>
                        <td className="tRight">{m.standard_price ? formatCurrencySimple(m.standard_price, 'KGS') : '—'}</td>
                        <td className="tRight">
                          <a className="btn small" href="#materials" onClick={(e) => { e.preventDefault(); setEditingMaterial(m); setMaterialForm({ code: m.code, name: m.name, material_type: m.material_type, unit: m.unit, specification: m.specification || '', standard_price: m.standard_price?.toString() || '', notes: '', is_active: m.is_active }); setShowMaterialModal(true); }}>Ред.</a>
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

          {activeTab === 'warehouses' && (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Код</th>
                  <th>Название</th>
                  <th>Местоположение</th>
                  <th>Ответственный</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Склады не найдены</td>
                  </tr>
                ) : (
                  warehouses.map((w) => (
                    <tr key={w.id}>
                      <td>{w.code}</td>
                      <td>{w.name}</td>
                      <td>{w.location || '—'}</td>
                      <td>{w.responsible || '—'}</td>
                      <td className="tRight">
                        <a className="btn small" href="#materials" onClick={(e) => { e.preventDefault(); setEditingWarehouse(w); setWarehouseForm({ code: w.code, name: w.name, location: w.location || '', responsible: w.responsible || '', notes: '', is_active: w.is_active }); setShowWarehouseModal(true); }}>Ред.</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'stock' && (
            <>
              <div className="toolbar" style={{ marginTop: '10px' }}>
                <div className="field">
                  <label>Склад</label>
                  <select value={selectedWarehouse} onChange={(e) => { setSelectedWarehouse(e.target.value ? parseInt(e.target.value) : ''); fetchData(); }}>
                    <option value="">Выберите склад</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              {selectedWarehouse ? (
                <table>
                  <thead>
                    <tr>
                      <th>Материал</th>
                      <th style={{ width: '10%' }}>Ед. изм.</th>
                      <th style={{ width: '15%' }} className="tRight">Остаток</th>
                      <th style={{ width: '15%' }} className="tRight">Зарезервировано</th>
                      <th style={{ width: '15%' }} className="tRight">Доступно</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Остатки не найдены</td>
                      </tr>
                    ) : (
                      stocks.map((s) => (
                        <tr key={s.id}>
                          <td>{s.material?.name || `ID: ${s.material_id}`}</td>
                          <td>{s.material?.unit || '—'}</td>
                          <td className="tRight">{s.quantity}</td>
                          <td className="tRight">{s.reserved_quantity}</td>
                          <td className="tRight">{s.quantity - s.reserved_quantity}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="muted mini" style={{ padding: '40px', textAlign: 'center' }}>Выберите склад для просмотра остатков</div>
              )}
            </>
          )}

          {activeTab === 'movements' && (
            <>
              <div className="toolbar" style={{ marginTop: '10px' }}>
                <div className="filters">
                   <div className="field">
                    <label>Склад</label>
                    <select value={selectedWarehouse} onChange={(e) => { setSelectedWarehouse(e.target.value ? parseInt(e.target.value) : ''); fetchData(); }}>
                      <option value="">Все склады</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="actions">
                    <a className="btn primary" href="#materials" onClick={(e) => { e.preventDefault(); setShowMovementModal(true); }}>+ Создать движение</a>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Дата</th>
                    <th style={{ width: '12%' }}>№ Док.</th>
                    <th style={{ width: '10%' }}>Тип</th>
                    <th>Материал</th>
                    <th style={{ width: '10%' }} className="tRight">Кол-во</th>
                    <th>Откуда / Куда</th>
                    <th style={{ width: '15%' }}>Ответственный</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Движений не найдено</td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id}>
                        <td>{new Date(m.movement_date).toLocaleDateString('ru-RU')}</td>
                        <td>{m.movement_number}</td>
                        <td>
                          <span className={`chip ${m.movement_type === 'receipt' ? 'ok' : m.movement_type === 'expense' ? 'warn' : 'info'}`}>
                            {m.movement_type === 'receipt' ? 'Приход' : m.movement_type === 'expense' ? 'Расход' : 'Перемещение'}
                          </span>
                        </td>
                        <td>
                            <div>{m.material?.name || `ID: ${m.material_id}`}</div>
                            <div className="mini muted">{m.material?.code}</div>
                        </td>
                        <td className="tRight">{m.quantity} {m.material?.unit}</td>
                        <td>
                          {m.movement_type === 'receipt' && (
                             <div>
                               <div className="mini muted">Поставщик:</div>
                               <div>{m.supplier || '—'}</div>
                               <div className="mini muted">На склад: {warehouses.find(w => w.id === m.to_warehouse_id)?.name}</div>
                             </div>
                          )}
                          {m.movement_type === 'expense' && (
                             <div>
                               <div className="mini muted">С проекта: {projects.find(p => p.id === m.project_id)?.name || '—'}</div>
                               <div className="mini muted">Со склада: {warehouses.find(w => w.id === m.from_warehouse_id)?.name}</div>
                             </div>
                          )}
                          {m.movement_type === 'transfer' && (
                             <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                               <span>{warehouses.find(w => w.id === m.from_warehouse_id)?.name}</span>
                               <span>→</span>
                               <span>{warehouses.find(w => w.id === m.to_warehouse_id)?.name}</span>
                             </div>
                          )}
                        </td>
                        <td>{m.responsible}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}

          {activeTab === 'writeoffs' && (
            <>
              <div className="toolbar" style={{ marginTop: '10px' }}>
                <a className="btn primary" href="#materials" onClick={(e) => { e.preventDefault(); setShowWriteOffModal(true); }}>+ Создать списание</a>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>№ акта</th>
                    <th>Проект</th>
                    <th style={{ width: '12%' }}>Дата</th>
                    <th style={{ width: '15%' }}>Причина</th>
                    <th style={{ width: '12%' }} className="tRight">Сумма</th>
                    <th style={{ width: '12%' }}>Статус</th>
                    <th className="tRight" style={{ width: '14%' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {writeOffs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Списания не найдены</td>
                    </tr>
                  ) : (
                    writeOffs.map((wo) => (
                      <tr key={wo.id}>
                        <td>{wo.write_off_number}</td>
                        <td>{`ID: ${wo.project_id}`}</td>
                        <td>{new Date(wo.write_off_date).toLocaleDateString('ru-RU')}</td>
                        <td>{wo.reason}</td>
                        <td className="tRight">{wo.total_amount ? formatCurrencySimple(wo.total_amount, 'KGS') : '0'}</td>
                        <td><span className="chip info">{wo.status}</span></td>
                        <td className="tRight"><a className="btn small" href={`#materials?writeoff=${wo.id}`}>Открыть</a></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {showMaterialModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">{editingMaterial ? 'Редактирование' : 'Создание'} материала</div>
              <button className="btn ghost" onClick={() => setShowMaterialModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleMaterialSubmit}>
                <div className="field">
                  <label>Код *</label>
                  <input type="text" value={materialForm.code} onChange={(e) => setMaterialForm({...materialForm, code: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Наименование *</label>
                  <input type="text" value={materialForm.name} onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Тип *</label>
                  <select value={materialForm.material_type} onChange={(e) => setMaterialForm({...materialForm, material_type: e.target.value})} required>
                    <option value="material">material</option>
                    <option value="equipment">equipment</option>
                    <option value="tool">tool</option>
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Единица измерения *</label>
                  <input type="text" value={materialForm.unit} onChange={(e) => setMaterialForm({...materialForm, unit: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Цена</label>
                  <input type="number" step="0.01" value={materialForm.standard_price} onChange={(e) => setMaterialForm({...materialForm, standard_price: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Спецификация</label>
                  <textarea value={materialForm.specification} onChange={(e) => setMaterialForm({...materialForm, specification: e.target.value})} />
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowMaterialModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showWarehouseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">{editingWarehouse ? 'Редактирование' : 'Создание'} склада</div>
              <button className="btn ghost" onClick={() => setShowWarehouseModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleWarehouseSubmit}>
                <div className="field">
                  <label>Код *</label>
                  <input type="text" value={warehouseForm.code} onChange={(e) => setWarehouseForm({...warehouseForm, code: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Название *</label>
                  <input type="text" value={warehouseForm.name} onChange={(e) => setWarehouseForm({...warehouseForm, name: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Местоположение</label>
                  <input type="text" value={warehouseForm.location} onChange={(e) => setWarehouseForm({...warehouseForm, location: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Ответственный</label>
                  <input type="text" value={warehouseForm.responsible} onChange={(e) => setWarehouseForm({...warehouseForm, responsible: e.target.value})} />
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowWarehouseModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showMovementModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">Создание движения материалов</div>
              <button className="btn ghost" onClick={() => setShowMovementModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleMovementSubmit}>
                <div className="field">
                  <label>Тип движения *</label>
                  <select value={movementForm.movement_type} onChange={(e) => setMovementForm({...movementForm, movement_type: e.target.value})} required>
                    <option value="receipt">Приход</option>
                    <option value="expense">Расход</option>
                    <option value="transfer">Перемещение</option>
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Номер документа *</label>
                  <input type="text" value={movementForm.movement_number} onChange={(e) => setMovementForm({...movementForm, movement_number: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата *</label>
                  <input type="date" value={movementForm.movement_date} onChange={(e) => setMovementForm({...movementForm, movement_date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Материал *</label>
                  <select value={movementForm.material_id} onChange={(e) => setMovementForm({...movementForm, material_id: e.target.value ? parseInt(e.target.value) : ''})} required>
                    <option value="">Выберите материал</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Количество *</label>
                  <input type="number" step="0.01" value={movementForm.quantity} onChange={(e) => setMovementForm({...movementForm, quantity: e.target.value})} required />
                </div>
                {movementForm.movement_type === 'transfer' && (
                  <>
                    <div style={{ height: '10px' }} />
                    <div className="field">
                      <label>Со склада</label>
                      <select value={movementForm.from_warehouse_id} onChange={(e) => setMovementForm({...movementForm, from_warehouse_id: e.target.value ? parseInt(e.target.value) : ''})}>
                        <option value="">Выберите склад</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                  </>
                )}
                {(movementForm.movement_type === 'receipt' || movementForm.movement_type === 'transfer') && (
                  <>
                    <div style={{ height: '10px' }} />
                    <div className="field">
                      <label>На склад *</label>
                      <select value={movementForm.to_warehouse_id} onChange={(e) => setMovementForm({...movementForm, to_warehouse_id: e.target.value ? parseInt(e.target.value) : ''})} required>
                        <option value="">Выберите склад</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                  </>
                )}
                {movementForm.movement_type === 'expense' && (
                  <>
                    <div style={{ height: '10px' }} />
                    <div className="field">
                      <label>Со склада *</label>
                      <select value={movementForm.from_warehouse_id} onChange={(e) => setMovementForm({...movementForm, from_warehouse_id: e.target.value ? parseInt(e.target.value) : ''})} required>
                        <option value="">Выберите склад</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Цена</label>
                  <input type="number" step="0.01" value={movementForm.price} onChange={(e) => setMovementForm({...movementForm, price: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Проект</label>
                  <select value={movementForm.project_id} onChange={(e) => setMovementForm({...movementForm, project_id: e.target.value ? parseInt(e.target.value) : ''})}>
                    <option value="">Выберите проект</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Ответственный</label>
                  <input type="text" value={movementForm.responsible} onChange={(e) => setMovementForm({...movementForm, responsible: e.target.value})} />
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowMovementModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showWriteOffModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: '900px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">Создание списания материалов</div>
              <button className="btn ghost" onClick={() => setShowWriteOffModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleWriteOffSubmit}>
                <div className="field">
                  <label>Номер акта *</label>
                  <input type="text" value={writeOffForm.write_off_number} onChange={(e) => setWriteOffForm({...writeOffForm, write_off_number: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата *</label>
                  <input type="date" value={writeOffForm.write_off_date} onChange={(e) => setWriteOffForm({...writeOffForm, write_off_date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Проект *</label>
                  <select value={writeOffForm.project_id} onChange={(e) => setWriteOffForm({...writeOffForm, project_id: e.target.value ? parseInt(e.target.value) : ''})} required>
                    <option value="">Выберите проект</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Склад</label>
                  <select value={writeOffForm.warehouse_id} onChange={(e) => setWriteOffForm({...writeOffForm, warehouse_id: e.target.value ? parseInt(e.target.value) : ''})}>
                    <option value="">Выберите склад</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Причина *</label>
                  <input type="text" value={writeOffForm.reason} onChange={(e) => setWriteOffForm({...writeOffForm, reason: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Ответственный *</label>
                  <input type="text" value={writeOffForm.responsible} onChange={(e) => setWriteOffForm({...writeOffForm, responsible: e.target.value})} required />
                </div>

                <div style={{ height: '20px', borderTop: '1px solid var(--line)', margin: '20px 0', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div className="title">Позиции списания</div>
                    <button type="button" className="btn small" onClick={addWriteOffItem}>+ Добавить позицию</button>
                  </div>
                  <div className="write-off-items">
                    {writeOffForm.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: '1 1 250px' }}>
                          <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Материал *</label>
                          <select 
                            value={item.material_id} 
                            onChange={(e) => updateWriteOffItem(idx, 'material_id', parseInt(e.target.value))} 
                            style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '4px' }} 
                            required
                          >
                            <option value={0}>Выберите материал</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: '0 1 120px' }}>
                          <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Кол-во *</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={item.quantity} 
                            onChange={(e) => updateWriteOffItem(idx, 'quantity', e.target.value)} 
                            style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', textAlign: 'right' }} 
                            required 
                          />
                        </div>
                        <div style={{ flex: '0 1 120px' }}>
                          <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Цена</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={item.price || ''} 
                            onChange={(e) => updateWriteOffItem(idx, 'price', e.target.value)} 
                            style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', textAlign: 'right' }} 
                          />
                        </div>
                        <div style={{ flex: '0 1 120px', textAlign: 'right', paddingBottom: '10px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Сумма</div>
                          <div style={{ fontWeight: 500 }}>{item.amount ? formatCurrencySimple(item.amount, 'KGS') : '0'}</div>
                        </div>
                        <div style={{ paddingBottom: '2px' }}>
                          <button type="button" className="btn icon danger" onClick={() => removeWriteOffItem(idx)} title="Удалить" style={{ padding: '8px' }}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {writeOffForm.items.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                        Нет позиций. Добавьте материалы для списания.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowWriteOffModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Materials;
