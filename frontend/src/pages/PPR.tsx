import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import './Pages.css';

interface PPR {
  id: number;
  project_id: number;
  name: string;
  number?: string;
  version?: string;
  status: string;
  project?: { id: number; name: string };
  sections?: any[];
}

interface Project {
  id: number;
  name: string;
}

const PPR: React.FC = () => {
  const [pprs, setPprs] = useState<PPR[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPpr, setEditingPpr] = useState<PPR | null>(null);
  const [deletingPpr, setDeletingPpr] = useState<PPR | null>(null);
  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    name: '',
    number: '',
    version: '',
    development_date: '',
    developer: '',
    approved_by: '',
    status: 'draft',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({ status: '', search: '', project_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pprRes, projRes] = await Promise.all([
        axios.get(`${API_URL}/ppr/`).catch(err => {
          console.warn('Ошибка загрузки ППР:', err);
          return { data: [] };
        }),
        axios.get(`${API_URL}/projects/`).catch(err => {
          console.warn('Ошибка загрузки проектов:', err);
          return { data: [] };
        }),
      ]);
      const pprsData = Array.isArray(pprRes.data) ? pprRes.data : [];
      setPprs(pprsData);
      
      // Обработка проектов - новый формат с метаданными
      let projectsData: Project[] = [];
      if (projRes.data && projRes.data.data && Array.isArray(projRes.data.data)) {
        projectsData = projRes.data.data;
      } else if (Array.isArray(projRes.data)) {
        projectsData = projRes.data;
      }
      projectsData = projectsData.filter(p => p && p.id !== undefined && p.id !== null);
      setProjects(projectsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ppr?: PPR) => {
    if (ppr) {
      setEditingPpr(ppr);
      setFormData({
        project_id: ppr.project_id,
        name: ppr.name,
        number: ppr.number || '',
        version: ppr.version || '',
        development_date: (ppr as any).development_date ? (ppr as any).development_date.split('T')[0] : '',
        developer: (ppr as any).developer || '',
        approved_by: (ppr as any).approved_by || '',
        status: ppr.status,
        description: (ppr as any).description || '',
      });
    } else {
      setEditingPpr(null);
      setFormData({
        project_id: '',
        name: '',
        number: '',
        version: '',
        development_date: '',
        developer: '',
        approved_by: '',
        status: 'draft',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPpr(null);
    setErrors({});
    setFormData({
      project_id: '',
      name: '',
      number: '',
      version: '',
      development_date: '',
      developer: '',
      approved_by: '',
      status: 'draft',
      description: '',
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.project_id) {
      newErrors.project_id = 'Проект обязателен';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Наименование обязательно';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submitData = {
        project_id: Number(formData.project_id),
        name: formData.name,
        number: formData.number || null,
        version: formData.version || null,
        development_date: formData.development_date || null,
        developer: formData.developer || null,
        approved_by: formData.approved_by || null,
        status: formData.status,
        description: formData.description || null,
        sections: [],
      };
      
      if (editingPpr) {
        await axios.put(`${API_URL}/ppr/${editingPpr.id}`, submitData);
      } else {
        await axios.post(`${API_URL}/ppr/`, submitData);
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
        alert('Ошибка сохранения ППР');
      }
    }
  };

  const handleDeleteClick = (ppr: PPR) => {
    setDeletingPpr(ppr);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPpr) return;
    
    try {
      await axios.delete(`${API_URL}/ppr/${deletingPpr.id}`);
      setShowDeleteModal(false);
      setDeletingPpr(null);
      fetchData();
    } catch (error: any) {
      console.error('Ошибка удаления ППР:', error);
      alert(error.response?.data?.detail || 'Ошибка удаления ППР');
    }
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Проект #${projectId}`;
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      draft: 'Черновик',
      active: 'Активен',
      completed: 'Завершен',
      suspended: 'Приостановлен',
      archived: 'Архивирован',
    };
    return statusLabels[status] || status;
  };

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      draft: 'info',
      active: 'ok',
      completed: 'ok',
      suspended: 'warn',
      archived: 'info',
    };
    return chips[status] || 'info';
  };

  // Фильтрация ППР
  const filteredPprs = pprs.filter((ppr) => {
    if (filters.status && ppr.status !== filters.status) return false;
    if (filters.project_id && ppr.project_id.toString() !== filters.project_id) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        ppr.name.toLowerCase().includes(search) ||
        getProjectName(ppr.project_id).toLowerCase().includes(search) ||
        (ppr.number && ppr.number.toLowerCase().includes(search)) ||
        (ppr.version && ppr.version.toLowerCase().includes(search))
      );
    }
    return true;
  });

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>ППР</span></div>
          <div className="h1">Проекты производства работ (ППР)</div>
          <p className="h2">Реестр ППР • создание/редактирование • управление разделами документации • разработчик и утверждение.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#ppr" onClick={(e) => { e.preventDefault(); handleOpenModal(); }}>+ Создать ППР</a>
        </div>
      </div>

      {/* Фильтры */}
      {pprs.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Поиск</label>
                  <input
                    type="text"
                    placeholder="По наименованию, проекту, номеру, версии..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Статус</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">Все</option>
                    <option value="draft">Черновик</option>
                    <option value="active">Активен</option>
                    <option value="completed">Завершен</option>
                    <option value="suspended">Приостановлен</option>
                    <option value="archived">Архивирован</option>
                  </select>
                </div>
                <div className="field">
                  <label>Проект</label>
                  <select
                    value={filters.project_id}
                    onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
                  >
                    <option value="">Все</option>
                    {projects.map(p => <option key={p.id} value={p.id.toString()}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              {(filters.search || filters.status || filters.project_id) && (
                <div className="actions">
                  <a className="btn small" href="#ppr" onClick={(e) => { e.preventDefault(); setFilters({ status: '', search: '', project_id: '' }); }}>Сбросить</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр ППР</div>
              <div className="desc">Создание, редактирование, удаление • управление разделами</div>
            </div>
            <span className="chip info">Связано с: Проекты</span>
          </div>
          <div className="cardBody">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>ID</th>
                  <th>Наименование</th>
                  <th style={{ width: '16%' }}>Проект</th>
                  <th style={{ width: '12%' }}>Номер</th>
                  <th style={{ width: '12%' }}>Версия</th>
                  <th style={{ width: '12%' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredPprs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>ППР не найдены</td>
                  </tr>
                ) : (
                  filteredPprs.map((ppr) => (
                    <tr key={ppr.id}>
                      <td>{ppr.id}</td>
                      <td>{ppr.name}</td>
                      <td>{getProjectName(ppr.project_id)}</td>
                      <td>{ppr.number || '-'}</td>
                      <td>{ppr.version || '-'}</td>
                      <td>
                        <span className={`chip ${getStatusChip(ppr.status)}`}>
                          {getStatusLabel(ppr.status)}
                        </span>
                      </td>
                      <td className="tRight">
                        <a className="btn small" href="#ppr" onClick={(e) => { e.preventDefault(); handleOpenModal(ppr); }}>Редактировать</a>
                        <a className="btn small" href="#ppr" onClick={(e) => { e.preventDefault(); handleDeleteClick(ppr); }} style={{ marginLeft: '8px', background: 'var(--danger)' }}>Удалить</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredPprs.length > 0 && (
            <div className="tableFooter">
              <div style={{ color: 'var(--muted2)', fontSize: '0.875rem' }}>
                Найдено: {filteredPprs.length} {filteredPprs.length !== pprs.length && `(всего: ${pprs.length})`}
              </div>
            </div>
          )}
        </div>

        {/* Модальное окно формы */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }} onClick={handleCloseModal}>
            <div className="card" style={{ maxWidth: '800px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
              <div className="cardHead">
                <div className="title">{editingPpr ? 'Редактирование' : 'Создание'} ППР</div>
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
                    <label>Наименование *</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => {
                        setFormData({...formData, name: e.target.value});
                        if (errors.name) setErrors({...errors, name: ''});
                      }}
                      placeholder="Например: ППР на выполнение работ по объекту..."
                      required
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Номер</label>
                    <input 
                      type="text" 
                      value={formData.number} 
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                      placeholder="ППР-001"
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Версия</label>
                    <input 
                      type="text" 
                      value={formData.version} 
                      onChange={(e) => setFormData({...formData, version: e.target.value})}
                      placeholder="1.0"
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Дата разработки</label>
                    <input 
                      type="date" 
                      value={formData.development_date} 
                      onChange={(e) => setFormData({...formData, development_date: e.target.value})}
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Статус</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                      <option value="draft">Черновик</option>
                      <option value="active">Активен</option>
                      <option value="completed">Завершен</option>
                      <option value="suspended">Приостановлен</option>
                      <option value="archived">Архивирован</option>
                    </select>
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Разработчик</label>
                    <input 
                      type="text" 
                      value={formData.developer} 
                      onChange={(e) => setFormData({...formData, developer: e.target.value})}
                      placeholder="ФИО разработчика"
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Утвердил</label>
                    <input 
                      type="text" 
                      value={formData.approved_by} 
                      onChange={(e) => setFormData({...formData, approved_by: e.target.value})}
                      placeholder="ФИО утверждающего"
                    />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Описание</label>
                    <textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      rows={4}
                      placeholder="Дополнительная информация о проекте производства работ..."
                    />
                  </div>
                  <div style={{ height: '20px' }} />
                  <div className="actions">
                    <button type="submit" className="btn primary">
                      {editingPpr ? 'Сохранить' : 'Создать'}
                    </button>
                    <button type="button" className="btn" onClick={handleCloseModal}>
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно удаления */}
        {showDeleteModal && deletingPpr && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Удаление ППР</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Вы уверены, что хотите удалить ППР <strong>"{deletingPpr.name}"</strong>?</p>
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
      </div>
    </>
  );
};

export default PPR;
