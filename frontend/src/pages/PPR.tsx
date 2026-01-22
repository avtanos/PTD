import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pprRes, projRes] = await Promise.all([
        axios.get(`${API_URL}/ppr/`),
        axios.get(`${API_URL}/projects/`),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      alert(error.response?.data?.detail || 'Ошибка сохранения ППР');
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

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр ППР</div>
              <div className="desc">GET /api/v1/ppr • CRUD • разделы</div>
            </div>
            <span className="chip info">Связь: project_id</span>
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
                {pprs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>ППР не найдены</td>
                  </tr>
                ) : (
                  pprs.map((ppr) => (
                    <tr key={ppr.id}>
                      <td>{ppr.id}</td>
                      <td>{ppr.name}</td>
                      <td>{getProjectName(ppr.project_id)}</td>
                      <td>{ppr.number || '-'}</td>
                      <td>{ppr.version || '-'}</td>
                      <td><span className="chip info">{getStatusLabel(ppr.status)}</span></td>
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
        </div>

        {showModal && (
          <div className="card">
            <div className="cardHead">
              <div className="title">{editingPpr ? 'Редактирование ППР' : 'Создание ППР'}</div>
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
                  <label>Наименование *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Номер</label>
                  <input type="text" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Версия</label>
                  <input type="text" value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата разработки</label>
                  <input type="date" value={formData.development_date} onChange={(e) => setFormData({...formData, development_date: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Разработчик</label>
                  <input type="text" value={formData.developer} onChange={(e) => setFormData({...formData, developer: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Утвердил</label>
                  <input type="text" value={formData.approved_by} onChange={(e) => setFormData({...formData, approved_by: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Статус</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="draft">Черновик</option>
                    <option value="approved">Утвержден</option>
                    <option value="active">Активен</option>
                  </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Описание</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
                </div>
                <div style={{ height: '16px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">{editingPpr ? 'Сохранить' : 'Создать'}</button>
                  <button type="button" className="btn" onClick={handleCloseModal}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && deletingPpr && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Удаление ППР</h3>
              </div>
              <div className="modal-body">
                <p>Вы уверены, что хотите удалить ППР "{deletingPpr.name}"?</p>
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
