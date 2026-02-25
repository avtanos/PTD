import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';

interface Department {
  id: number;
  parent_id?: number | null;
  parent?: { id: number; code: string; name: string; short_name?: string } | null;
  code: string;
  name: string;
  short_name?: string;
  description?: string;
  head?: string;
  is_active: boolean;
}

interface PersonnelItem {
  id: number;
  full_name: string;
  position: string;
  department?: { id: number; name: string; code?: string } | null;
}

function buildTree(items: Department[], parentId: number | null = null): Department[] {
  return items
    .filter((d) => (d.parent_id ?? null) === parentId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => ({ ...d, children: buildTree(items, d.id) }));
}

type DeptWithChildren = Department & { children?: DeptWithChildren[] };

function filterTree(tree: DeptWithChildren[], search: string): DeptWithChildren[] {
  if (!search.trim()) return tree;
  const s = search.toLowerCase();
  const result: DeptWithChildren[] = [];
  for (const node of tree) {
    const match = node.code.toLowerCase().includes(s) || node.name.toLowerCase().includes(s);
    const filteredChildren = node.children ? filterTree(node.children, search) : [];
    if (match || filteredChildren.length > 0)
      result.push({ ...node, children: filteredChildren.length ? filteredChildren : node.children });
  }
  return result;
}

function flattenTree(nodes: DeptWithChildren[], level = 0): { dept: Department; level: number }[] {
  let out: { dept: Department; level: number }[] = [];
  for (const node of nodes) {
    out.push({ dept: node, level });
    if (node.children?.length) out = out.concat(flattenTree(node.children, level + 1));
  }
  return out;
}

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [personnel, setPersonnel] = useState<PersonnelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [filters, setFilters] = useState({ search: '' });
  const [formData, setFormData] = useState({
    parent_id: '' as number | '',
    code: '',
    name: '',
    short_name: '',
    description: '',
    head: '',
    is_active: true,
  });

  useEffect(() => {
    fetchDepartments();
    fetchPersonnel();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/departments/`);
      setDepartments(res.data);
    } catch (error) {
      console.error('Ошибка загрузки подразделений:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonnel = async () => {
    try {
      const res = await axios.get(`${API_URL}/personnel/`, {
        params: {
          status: 'employed',
          is_active: true,
          limit: 1000,
        },
      });
      setPersonnel(res.data);
    } catch (error) {
      console.error('Ошибка загрузки кадров для списка руководителей:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id === '' ? null : formData.parent_id,
      };
      if (editingDept) {
        await axios.put(`${API_URL}/departments/${editingDept.id}`, payload);
      } else {
        await axios.post(`${API_URL}/departments/`, payload);
      }
      setShowModal(false);
      setEditingDept(null);
      fetchDepartments();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const tree = useMemo(() => buildTree(departments), [departments]);
  const filteredTree = useMemo(() => filterTree(tree, filters.search), [tree, filters.search]);
  const flatRows = useMemo(() => flattenTree(filteredTree), [filteredTree]);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Подразделения</span></div>
          <div className="h1">Подразделения</div>
          <p className="h2">Справочник подразделений (ПТО, ОГЭ, ОГМ, геодезия, склады, бухгалтерия).</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#departments" onClick={(e) => { e.preventDefault(); setShowModal(true); setEditingDept(null); setFormData({ parent_id: '', code: '', name: '', short_name: '', description: '', head: '', is_active: true }); }}>+ Создать подразделение</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр подразделений</div>
              <div className="desc">Создание, редактирование, удаление подразделений</div>
            </div>
            <span className="chip info">Справочник</span>
          </div>
          <div className="cardBody">
            <input
              type="text"
              placeholder="Поиск по коду или наименованию..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              style={{ marginBottom: '12px', maxWidth: '320px' }}
            />
            <table>
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Код</th>
                  <th>Наименование</th>
                  <th style={{ width: '14%' }}>Краткое</th>
                  <th style={{ width: '16%' }}>Руководитель</th>
                  <th style={{ width: '10%' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {flatRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Подразделения не найдены</td>
                  </tr>
                ) : (
                  flatRows.map(({ dept: d, level }) => (
                    <tr key={d.id}>
                      <td>{d.code}</td>
                      <td style={{ paddingLeft: `${12 + level * 20}px` }}>
                        {level > 0 && <span style={{ color: 'var(--muted2)', marginRight: '6px' }}>└</span>}
                        {d.name}
                      </td>
                      <td>{d.short_name || '—'}</td>
                      <td>{d.head || '—'}</td>
                      <td><span className={`chip ${d.is_active ? 'ok' : 'danger'}`}>{d.is_active ? 'Активно' : 'Неактивно'}</span></td>
                      <td className="tRight">
                        <a className="btn small" href="#departments" onClick={(e) => { e.preventDefault(); setEditingDept(d); setFormData({ parent_id: d.parent_id ?? d.parent?.id ?? '', code: d.code, name: d.name, short_name: d.short_name || '', description: d.description || '', head: d.head || '', is_active: d.is_active }); setShowModal(true); }}>Ред.</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="card">
            <div className="cardHead">
              <div className="title">{editingDept ? 'Редактирование' : 'Создание'} подразделения</div>
            </div>
            <div className="cardBody">
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Родительское подразделение</label>
                  <select value={formData.parent_id === '' ? '' : formData.parent_id} onChange={(e) => setFormData({ ...formData, parent_id: e.target.value === '' ? '' : Number(e.target.value) })}>
                    <option value="">— Верхний уровень —</option>
                    {departments
                      .filter((d) => !editingDept || d.id !== editingDept.id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Код *</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Наименование *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Краткое наименование</label>
                  <input type="text" value={formData.short_name} onChange={(e) => setFormData({...formData, short_name: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Руководитель</label>
                  <select
                    value={formData.head}
                    onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                  >
                    <option value="">— Не указан —</option>
                    {formData.head &&
                      !personnel.some((p) => p.full_name === formData.head) && (
                        <option value={formData.head}>{formData.head}</option>
                      )}
                    {personnel.map((p) => (
                      <option key={p.id} value={p.full_name}>
                        {p.full_name}
                        {p.position ? ` — ${p.position}` : ''}
                        {p.department?.name ? ` (${p.department.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Описание</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>
                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} /> Активно
                  </label>
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => { setShowModal(false); setEditingDept(null); }}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Departments;
