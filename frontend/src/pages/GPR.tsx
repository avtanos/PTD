import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';

interface GPR {
  id: number;
  project_id: number;
  name: string;
  number?: string;
  version?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  project?: { id: number; name: string };
  tasks?: any[];
}

interface Project {
  id: number;
  name: string;
}

const GPR: React.FC = () => {
  const [gprs, setGprs] = useState<GPR[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingGpr, setEditingGpr] = useState<GPR | null>(null);
  const [deletingGpr, setDeletingGpr] = useState<GPR | null>(null);
  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    name: '',
    version: '',
    start_date: '',
    end_date: '',
    created_by: '',
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
      const [gprRes, projRes] = await Promise.all([
        axios.get(`${API_URL}/gpr/`),
        axios.get(`${API_URL}/projects/`),
      ]);
      const gprsData = Array.isArray(gprRes.data) ? gprRes.data : [];
      setGprs(gprsData);
      
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

  const handleOpenModal = (gpr?: GPR) => {
    if (gpr) {
      setEditingGpr(gpr);
      setFormData({
        project_id: gpr.project_id,
        name: gpr.name,
        version: gpr.version || '',
        start_date: gpr.start_date ? gpr.start_date.split('T')[0] : '',
        end_date: gpr.end_date ? gpr.end_date.split('T')[0] : '',
        created_by: (gpr as any).created_by || '',
        approved_by: (gpr as any).approved_by || '',
        status: gpr.status,
        description: (gpr as any).description || '',
      });
    } else {
      setEditingGpr(null);
      setFormData({
        project_id: '',
        name: '',
        version: '',
        start_date: '',
        end_date: '',
        created_by: '',
        approved_by: '',
        status: 'draft',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGpr(null);
    setFormData({
      project_id: '',
      name: '',
      version: '',
      start_date: '',
      end_date: '',
      created_by: '',
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
        version: formData.version || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        created_by: formData.created_by || null,
        approved_by: formData.approved_by || null,
        status: formData.status,
        description: formData.description || null,
        tasks: [],
      };
      
      if (editingGpr) {
        await axios.put(`${API_URL}/gpr/${editingGpr.id}`, submitData);
      } else {
        await axios.post(`${API_URL}/gpr/`, submitData);
      }
      
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('Ошибка сохранения:', error);
      alert(error.response?.data?.detail || 'Ошибка сохранения ГПР');
    }
  };

  const handleDeleteClick = (gpr: GPR) => {
    setDeletingGpr(gpr);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGpr) return;
    
    try {
      await axios.delete(`${API_URL}/gpr/${deletingGpr.id}`);
      setShowDeleteModal(false);
      setDeletingGpr(null);
      fetchData();
    } catch (error: any) {
      console.error('Ошибка удаления ГПР:', error);
      alert(error.response?.data?.detail || 'Ошибка удаления ГПР');
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
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>ГПР</span></div>
          <div className="h1">Графики производства работ (ГПР)</div>
          <p className="h2">Реестр ГПР • создание/редактирование • управление задачами графика • отображение зависимостей.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#gpr" onClick={(e) => { e.preventDefault(); handleOpenModal(); }}>+ Создать ГПР</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр ГПР</div>
              <div className="desc">GET /api/v1/gpr • CRUD • задачи графика</div>
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
                  <th style={{ width: '12%' }}>Версия</th>
                  <th style={{ width: '18%' }}>Период</th>
                  <th style={{ width: '12%' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {gprs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>ГПР не найдены</td>
                  </tr>
                ) : (
                  gprs.map((gpr) => (
                    <tr key={gpr.id}>
                      <td>{gpr.id}</td>
                      <td>{gpr.name}</td>
                      <td>{getProjectName(gpr.project_id)}</td>
                      <td>{gpr.version || '-'}</td>
                      <td>
                        {gpr.start_date && gpr.end_date
                          ? `${new Date(gpr.start_date).toLocaleDateString('ru-RU')} - ${new Date(gpr.end_date).toLocaleDateString('ru-RU')}`
                          : '-'}
                      </td>
                      <td><span className="chip info">{getStatusLabel(gpr.status)}</span></td>
                      <td className="tRight">
                        <a className="btn small" href="#gpr" onClick={(e) => { e.preventDefault(); handleOpenModal(gpr); }}>Редактировать</a>
                        <a className="btn small" href="#gpr" onClick={(e) => { e.preventDefault(); handleDeleteClick(gpr); }} style={{ marginLeft: '8px', background: 'var(--danger)' }}>Удалить</a>
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
              <div className="title">{editingGpr ? 'Редактирование ГПР' : 'Создание ГПР'}</div>
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
                  <label>Версия</label>
                  <input type="text" value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата начала *</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Дата окончания *</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Создал</label>
                  <input type="text" value={formData.created_by} onChange={(e) => setFormData({...formData, created_by: e.target.value})} />
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
                  <button type="submit" className="btn primary">{editingGpr ? 'Сохранить' : 'Создать'}</button>
                  <button type="button" className="btn" onClick={handleCloseModal}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && deletingGpr && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Удаление ГПР</h3>
              </div>
              <div className="modal-body">
                <p>Вы уверены, что хотите удалить ГПР "{deletingGpr.name}"?</p>
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

export default GPR;
