import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { normalizeToArray } from '../utils/normalizeData';
import { mockProjects, getMockProjectChanges } from '../mocks/data';

interface ChangeApproval {
  id: number;
  project_change_id: number;
  order_number: number;
  approver_role: string;
  approver_name?: string;
  is_parallel: boolean;
  is_required: boolean;
  status: string;
  comment?: string;
  approved_date?: string;
  created_at: string;
}

interface ProjectChange {
  id: number;
  project_id: number;
  change_type: string;
  change_number: string;
  title: string;
  description: string;
  justification?: string;
  impact_volume?: number;
  impact_cost?: number;
  impact_schedule?: number;
  related_document_id?: number;
  related_construct_id?: number;
  initiator: string;
  initiator_date: string;
  status: string;
  approved_date?: string;
  implemented_date?: string;
  file_path?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  approvals?: ChangeApproval[];
  project?: { id: number; name: string };
}

interface Project {
  id: number;
  name: string;
  code?: string;
}

const ProjectChanges: React.FC = () => {
  const [changes, setChanges] = useState<ProjectChange[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingChange, setEditingChange] = useState<ProjectChange | null>(null);
  const [deletingChange, setDeletingChange] = useState<ProjectChange | null>(null);
  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    change_type: '',
    change_number: '',
    title: '',
    description: '',
    justification: '',
    impact_volume: '',
    impact_cost: '',
    impact_schedule: '',
    initiator: '',
    initiator_date: '',
    file_path: '',
    notes: '',
  });
  const [approvals, setApprovals] = useState<Array<{
    order_number: number;
    approver_role: string;
    approver_name: string;
    is_parallel: boolean;
    is_required: boolean;
  }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    project_id: '',
    change_type: '',
    status: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [changesRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/project-changes/`),
        axios.get(`${API_URL}/projects/`),
      ]);
      
      // Обработка изменений проекта
      const changesData = normalizeToArray<ProjectChange>(changesRes.data);
      setChanges(changesData);
      
      // Обработка проектов - новый формат с метаданными
      let projectsData: Project[] = [];
      if (projectsRes.data && projectsRes.data.data && Array.isArray(projectsRes.data.data)) {
        // Новый формат с метаданными
        projectsData = projectsRes.data.data;
      } else if (Array.isArray(projectsRes.data)) {
        // Старый формат (массив)
        projectsData = projectsRes.data;
      } else {
        // Попытка нормализовать
        projectsData = normalizeToArray<Project>(projectsRes.data);
      }
      
      // Фильтруем только валидные проекты с id
      projectsData = projectsData.filter(p => p && p.id !== undefined && p.id !== null);
      setProjects(projectsData);
      
      console.log('ProjectChanges: Данные загружены', {
        changesCount: changesData.length,
        projectsCount: projectsData.length,
        firstChange: changesData[0],
        firstProject: projectsData[0]
      });
    } catch (error: any) {
      console.error('Ошибка загрузки данных:', error);
      setError(error.response?.data?.detail || error.message || 'Ошибка загрузки данных');
      setChanges(getMockProjectChanges());
      setProjects(mockProjects.map((p) => ({ id: p.id, name: p.name, code: p.code })));
    } finally {
      setLoading(false);
    }
  };

  const filteredChanges = useMemo(() => {
    if (!changes || changes.length === 0) return [];
    
    const filtered = changes.filter((c) => {
      if (!c || !c.id) return false;
      if (filters.project_id && c.project_id?.toString() !== filters.project_id) return false;
      if (filters.change_type && c.change_type !== filters.change_type) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          (c.change_number && c.change_number.toLowerCase().includes(search)) ||
          (c.title && c.title.toLowerCase().includes(search)) ||
          (c.description && c.description.toLowerCase().includes(search))
        );
      }
      return true;
    });
    
    console.log('ProjectChanges: Фильтрация', {
      totalChanges: changes.length,
      filteredCount: filtered.length,
      filters
    });
    
    return filtered;
  }, [changes, filters]);

  const paginatedChanges = useMemo(() => {
    return filteredChanges.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredChanges, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredChanges.length / pageSize);

  const handleOpenModal = (change?: ProjectChange) => {
    if (change) {
      setEditingChange(change);
      setFormData({
        project_id: change.project_id || '',
        change_type: change.change_type || '',
        change_number: change.change_number || '',
        title: change.title || '',
        description: change.description || '',
        justification: change.justification || '',
        impact_volume: change.impact_volume?.toString() || '',
        impact_cost: change.impact_cost?.toString() || '',
        impact_schedule: change.impact_schedule?.toString() || '',
        initiator: change.initiator || '',
        initiator_date: change.initiator_date ? change.initiator_date.split('T')[0] : '',
        file_path: change.file_path || '',
        notes: change.notes || '',
      });
      setApprovals(change.approvals?.map(a => ({
        order_number: a.order_number,
        approver_role: a.approver_role,
        approver_name: a.approver_name || '',
        is_parallel: a.is_parallel,
        is_required: a.is_required,
      })) || []);
    } else {
      setEditingChange(null);
      setFormData({
        project_id: '',
        change_type: '',
        change_number: '',
        title: '',
        description: '',
        justification: '',
        impact_volume: '',
        impact_cost: '',
        impact_schedule: '',
        initiator: '',
        initiator_date: '',
        file_path: '',
        notes: '',
      });
      setApprovals([]);
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingChange(null);
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'project_id' || name.startsWith('impact_') ? (value ? parseFloat(value) : '') : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const addApproval = () => {
    setApprovals([...approvals, {
      order_number: approvals.length + 1,
      approver_role: '',
      approver_name: '',
      is_parallel: false,
      is_required: true,
    }]);
  };

  const removeApproval = (index: number) => {
    setApprovals(approvals.filter((_, i) => i !== index).map((a, i) => ({ ...a, order_number: i + 1 })));
  };

  const updateApproval = (index: number, field: string, value: any) => {
    const updated = [...approvals];
    updated[index] = { ...updated[index], [field]: value };
    setApprovals(updated);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.project_id) newErrors.project_id = 'Проект обязателен';
    if (!formData.change_type) newErrors.change_type = 'Тип изменения обязателен';
    if (!formData.change_number) newErrors.change_number = 'Номер изменения обязателен';
    if (!formData.title) newErrors.title = 'Название обязательно';
    if (!formData.description) newErrors.description = 'Описание обязательно';
    if (!formData.initiator) newErrors.initiator = 'Инициатор обязателен';
    if (!formData.initiator_date) newErrors.initiator_date = 'Дата инициации обязательна';
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
        change_number: formData.change_number,
        impact_volume: formData.impact_volume ? parseFloat(formData.impact_volume) : null,
        impact_cost: formData.impact_cost ? parseFloat(formData.impact_cost) : null,
        impact_schedule: formData.impact_schedule ? parseInt(formData.impact_schedule) : null,
        justification: formData.justification || null,
        file_path: formData.file_path || null,
        notes: formData.notes || null,
        approvals: approvals.filter(a => a.approver_role),
      };

      if (editingChange) {
        await axios.put(`${API_URL}/project-changes/${editingChange.id}`, submitData);
      } else {
        await axios.post(`${API_URL}/project-changes/`, submitData);
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('Ошибка сохранения изменения:', error);
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
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingChange) return;
    try {
      await axios.delete(`${API_URL}/project-changes/${deletingChange.id}`);
      setShowDeleteModal(false);
      setDeletingChange(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления изменения:', error);
      alert('Ошибка удаления изменения');
    }
  };

  const getChangeTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'design': 'Проектное',
      'volume': 'Объемное',
      'cost': 'Стоимостное',
      'schedule': 'Календарное',
      'other': 'Прочее',
    };
    return types[type] || type;
  };

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      draft: 'info',
      pending: 'warn',
      approved: 'ok',
      rejected: 'danger',
      implemented: 'ok',
    };
    return chips[status] || 'info';
  };

  if (loading && changes.length === 0 && projects.length === 0) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <>
      {error && (
        <div style={{ padding: '16px', margin: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c00' }}>
          <strong>Ошибка:</strong> {error}
          <button onClick={fetchData} style={{ marginLeft: '12px', padding: '4px 12px' }}>Повторить</button>
        </div>
      )}
      <div className="pageHead">
        <div>
          <div className="crumbs">
            <a href="#dashboard">Главная</a> <span className="sep">/</span>
            <span>Изменения проекта</span>
          </div>
          <div className="h1">Изменения проекта</div>
          <p className="h2">Реестр изменений проекта • типы изменений • согласования • статусы.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#changes" onClick={(e) => { e.preventDefault(); handleOpenModal(); }}>+ Создать изменение</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр изменений проекта</div>
              <div className="desc">Поиск, фильтры, сортировка, экспорт</div>
            </div>
            <span className="chip info">Изменения проекта</span>
          </div>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Проект</label>
                  <select value={filters.project_id} onChange={(e) => setFilters({...filters, project_id: e.target.value})}>
                    <option value="">Все</option>
                    {projects.filter(p => p && p.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Тип изменения</label>
                  <select value={filters.change_type} onChange={(e) => setFilters({...filters, change_type: e.target.value})}>
                    <option value="">Все</option>
                    <option value="design">Проектное</option>
                    <option value="volume">Объемное</option>
                    <option value="cost">Стоимостное</option>
                    <option value="schedule">Календарное</option>
                    <option value="other">Прочее</option>
                  </select>
                </div>
                <div className="field">
                  <label>Статус</label>
                  <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                    <option value="">Все</option>
                    <option value="draft">Черновик</option>
                    <option value="pending">На согласовании</option>
                    <option value="approved">Согласовано</option>
                    <option value="rejected">Отклонено</option>
                    <option value="implemented">Реализовано</option>
                  </select>
                </div>
                <div className="field">
                  <label>Поиск</label>
                  <input type="text" placeholder="Номер, название..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                </div>
              </div>
              <div className="actions">
                <a className="btn small" href="#changes" onClick={(e) => { e.preventDefault(); setFilters({project_id: '', change_type: '', status: '', search: ''}); setCurrentPage(1); }}>Сбросить</a>
                <a className="btn small" href="#changes">Экспорт Excel</a>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Номер</th>
                  <th>Изменение</th>
                  <th style={{ width: '18%' }}>Проект</th>
                  <th style={{ width: '12%' }}>Тип</th>
                  <th style={{ width: '12%' }}>Инициатор</th>
                  <th style={{ width: '12%' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedChanges.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      {changes.length === 0 
                        ? 'Изменения не загружены' 
                        : filteredChanges.length === 0
                        ? 'Изменения не найдены по заданным фильтрам'
                        : 'Изменения не найдены на текущей странице'}
                    </td>
                  </tr>
                ) : (
                  paginatedChanges.map((c) => (
                    <tr key={c.id}>
                      <td>{c.change_number}</td>
                      <td>
                        {c.title}
                        <div className="mini">ID: {c.id}</div>
                      </td>
                      <td>{projects.find(p => p.id === c.project_id)?.name || '-'}</td>
                      <td>{getChangeTypeLabel(c.change_type)}</td>
                      <td>{c.initiator}</td>
                      <td><span className={`chip ${getStatusChip(c.status)}`}>{c.status}</span></td>
                      <td className="tRight">
                        <a className="btn small" href={`#changes?id=${c.id}`} onClick={(e) => { e.preventDefault(); handleOpenModal(c); }}>Открыть</a>
                        <a className="btn small danger" href="#changes" onClick={(e) => { e.preventDefault(); setDeletingChange(c); setShowDeleteModal(true); }}>Уд.</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 0 && (
              <div className="tableFooter">
                <span>Показано {paginatedChanges.length} из {filteredChanges.length} • Страница {currentPage} из {totalPages}</span>
                <div className="pager">
                  <button className="btn small" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}>←</button>
                  <button className="btn small" type="button">{currentPage}</button>
                  <button className="btn small" type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}>→</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={handleCloseModal}>
          <div className="card" style={{ maxWidth: '800px', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div>
                <div className="title">{editingChange ? 'Редактирование изменения' : 'Создание изменения'}</div>
                <div className="desc">Заполните форму для {editingChange ? 'редактирования' : 'создания'} изменения проекта</div>
              </div>
              <button className="btn ghost small" onClick={handleCloseModal}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Проект *</label>
                  <select name="project_id" value={formData.project_id} onChange={handleInputChange} required>
                    <option value="">Выберите проект</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {errors.project_id && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.project_id}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Тип изменения *</label>
                  <select name="change_type" value={formData.change_type} onChange={handleInputChange} required>
                    <option value="">Выберите тип</option>
                    <option value="design">Проектное</option>
                    <option value="volume">Объемное</option>
                    <option value="cost">Стоимостное</option>
                    <option value="schedule">Календарное</option>
                    <option value="other">Прочее</option>
                  </select>
                  {errors.change_type && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.change_type}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Номер изменения *</label>
                  <input type="text" name="change_number" value={formData.change_number} onChange={handleInputChange} required />
                  {errors.change_number && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.change_number}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Название *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                  {errors.title && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.title}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Описание *</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} required />
                  {errors.description && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.description}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Обоснование</label>
                  <textarea name="justification" value={formData.justification} onChange={handleInputChange} rows={3} />
                </div>

                <div style={{ height: '10px' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="field">
                    <label>Влияние на объем</label>
                    <input type="number" name="impact_volume" value={formData.impact_volume} onChange={handleInputChange} step="0.01" />
                  </div>
                  <div className="field">
                    <label>Влияние на стоимость</label>
                    <input type="number" name="impact_cost" value={formData.impact_cost} onChange={handleInputChange} step="0.01" />
                  </div>
                  <div className="field">
                    <label>Влияние на сроки (дни)</label>
                    <input type="number" name="impact_schedule" value={formData.impact_schedule} onChange={handleInputChange} />
                  </div>
                </div>

                <div style={{ height: '10px' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="field">
                    <label>Инициатор *</label>
                    <input type="text" name="initiator" value={formData.initiator} onChange={handleInputChange} required />
                    {errors.initiator && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.initiator}</span>}
                  </div>
                  <div className="field">
                    <label>Дата инициации *</label>
                    <input type="date" name="initiator_date" value={formData.initiator_date} onChange={handleInputChange} required />
                    {errors.initiator_date && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.initiator_date}</span>}
                  </div>
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Путь к файлу</label>
                  <input type="text" name="file_path" value={formData.file_path} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Примечания</label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} />
                </div>

                <div style={{ height: '16px' }} />

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong>Согласования</strong>
                    <button type="button" className="btn small" onClick={addApproval}>+ Добавить согласование</button>
                  </div>
                  {approvals.map((approval, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'end' }}>
                      <div className="field">
                        <label>Роль согласующего</label>
                        <input type="text" value={approval.approver_role} onChange={(e) => updateApproval(index, 'approver_role', e.target.value)} placeholder="Например: Главный инженер" />
                      </div>
                      <div className="field">
                        <label>ФИО</label>
                        <input type="text" value={approval.approver_name} onChange={(e) => updateApproval(index, 'approver_name', e.target.value)} />
                      </div>
                      <div className="field">
                        <label>
                          <input type="checkbox" checked={approval.is_required} onChange={(e) => updateApproval(index, 'is_required', e.target.checked)} /> Обязательное
                        </label>
                      </div>
                      <button type="button" className="btn small danger" onClick={() => removeApproval(index)}>Уд.</button>
                    </div>
                  ))}
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

      {showDeleteModal && deletingChange && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '400px', margin: '20px' }}>
            <div className="cardHead">
              <div className="title">Удаление изменения</div>
            </div>
            <div className="cardBody">
              <p>Вы уверены, что хотите удалить изменение "{deletingChange.change_number}"?</p>
              <div style={{ height: '12px' }} />
              <div className="actions">
                <button className="btn danger" onClick={handleDeleteConfirm}>Удалить</button>
                <button className="btn" onClick={() => { setShowDeleteModal(false); setDeletingChange(null); }}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectChanges;
