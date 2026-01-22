import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';

interface Department {
  id: number;
  code: string;
  name: string;
  short_name?: string;
  description?: string;
  head?: string;
  is_active: boolean;
}

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [filters, setFilters] = useState({ search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    short_name: '',
    description: '',
    head: '',
    is_active: true,
  });

  useEffect(() => {
    fetchDepartments();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await axios.put(`${API_URL}/departments/${editingDept.id}`, formData);
      } else {
        await axios.post(`${API_URL}/departments/`, formData);
      }
      setShowModal(false);
      setEditingDept(null);
      fetchDepartments();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const filteredDepartments = departments.filter(d => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!d.code.toLowerCase().includes(search) && !d.name.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  const paginatedDepartments = filteredDepartments.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredDepartments.length / pageSize);

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
          <a className="btn primary" href="#departments" onClick={(e) => { e.preventDefault(); setShowModal(true); setEditingDept(null); setFormData({code: '', name: '', short_name: '', description: '', head: '', is_active: true}); }}>+ Создать подразделение</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр подразделений</div>
              <div className="desc">GET /api/v1/departments • CRUD операции</div>
            </div>
            <span className="chip info">Справочник</span>
          </div>
          <div className="cardBody">
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
                {paginatedDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Подразделения не найдены</td>
                  </tr>
                ) : (
                  paginatedDepartments.map((d) => (
                    <tr key={d.id}>
                      <td>{d.code}</td>
                      <td>{d.name}</td>
                      <td>{d.short_name || '—'}</td>
                      <td>{d.head || '—'}</td>
                      <td><span className={`chip ${d.is_active ? 'ok' : 'danger'}`}>{d.is_active ? 'Активно' : 'Неактивно'}</span></td>
                      <td className="tRight">
                        <a className="btn small" href="#departments" onClick={(e) => { e.preventDefault(); setEditingDept(d); setFormData({code: d.code, name: d.name, short_name: d.short_name || '', description: d.description || '', head: d.head || '', is_active: d.is_active}); setShowModal(true); }}>Ред.</a>
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

        {showModal && (
          <div className="card">
            <div className="cardHead">
              <div className="title">{editingDept ? 'Редактирование' : 'Создание'} подразделения</div>
            </div>
            <div className="cardBody">
              <form onSubmit={handleSubmit}>
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
                  <input type="text" value={formData.head} onChange={(e) => setFormData({...formData, head: e.target.value})} />
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
