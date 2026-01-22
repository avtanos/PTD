import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { handleApiError, showError } from '../utils/errorHandler';
import { validateForm, projectValidationRules } from '../utils/validation';

interface Project {
  id: number;
  name: string;
  code?: string | null;
  address?: string | null;
  customer?: string | null;
  contractor?: string | null;
  description?: string | null;
  work_type?: string | null;
  department_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
  department?: { id: number; name: string; code?: string | null } | null;
}

interface Department {
  id: number;
  name: string;
  code?: string;
}

interface ApiResponse<T> {
  data: T[];
  meta: {
    total: number;
    skip: number;
    limit: number;
    page: number;
    total_pages: number;
  };
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    customer: '',
    contractor: '',
    description: '',
    work_type: '',
    department_id: '' as number | '',
    start_date: '',
    end_date: '',
    status: 'active',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    status: '',
    department_id: '',
    work_type: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Загрузка подразделений (один раз при монтировании)
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await axios.get(`${API_URL}/departments/`);
        const depts = Array.isArray(res.data) ? res.data : [];
        setDepartments(depts);
      } catch (err) {
        console.error('Ошибка загрузки подразделений:', err);
      }
    };
    loadDepartments();
  }, []);

  // Загрузка проектов с фильтрами и пагинацией
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Формируем query параметры
      const params = new URLSearchParams();
      params.append('skip', String((currentPage - 1) * pageSize));
      params.append('limit', String(pageSize));
      
      if (filters.status) params.append('status', filters.status);
      if (filters.department_id) params.append('department_id', filters.department_id);
      if (filters.work_type) params.append('work_type', filters.work_type);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_URL}/projects/?${params.toString()}`);
      
      // Обрабатываем новый формат ответа с метаданными
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Новый формат с метаданными
        const projectsData = response.data.data;
        setProjects(projectsData);
        if (response.data.meta) {
          setTotal(response.data.meta.total);
          setTotalPages(response.data.meta.total_pages);
        }
      } else if (Array.isArray(response.data)) {
        // Fallback для старого формата
        setProjects(response.data);
        setTotal(response.data.length);
        setTotalPages(Math.ceil(response.data.length / pageSize));
      } else {
        console.warn('Projects: Неожиданный формат ответа', response.data);
        setProjects([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      console.error('Ошибка загрузки данных:', err);
      const errorState = handleApiError(err);
      setError(errorState.message);
      setProjects([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Перезагрузка при изменении фильтров или страницы
  useEffect(() => {
    // Сбрасываем на первую страницу при изменении фильтров
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.status, filters.department_id, filters.work_type, filters.search]);

  // Загрузка данных при изменении страницы или фильтров
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters.status, filters.department_id, filters.work_type, filters.search, pageSize]);

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name || '',
        code: project.code || '',
        address: project.address || '',
        customer: project.customer || '',
        contractor: project.contractor || '',
        description: project.description || '',
        work_type: project.work_type || '',
        department_id: project.department_id || '',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        status: project.status || 'active',
        is_active: project.is_active !== undefined ? project.is_active : true,
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        customer: '',
        contractor: '',
        description: '',
        work_type: '',
        department_id: '',
        start_date: '',
        end_date: '',
        status: 'active',
        is_active: true,
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' && name === 'department_id' ? (value ? parseInt(value) : '') : value,
    }));
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация на фронтенде
    const validationErrors = validateForm(formData, projectValidationRules);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const submitData = {
        ...formData,
        department_id: formData.department_id || null,
        code: formData.code || null,
        address: formData.address || null,
        customer: formData.customer || null,
        contractor: formData.contractor || null,
        description: formData.description || null,
        work_type: formData.work_type || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      let response;
      if (editingProject) {
        // Оптимистичное обновление
        const updatedProject: Project = {
          ...editingProject,
          ...submitData,
          department: editingProject.department || null,
        };
        setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p));
        
        response = await axios.put(`${API_URL}/projects/${editingProject.id}`, submitData);
      } else {
        response = await axios.post(`${API_URL}/projects/`, submitData);
        // Оптимистичное добавление
        if (response.data) {
          const newProject: Project = Array.isArray(response.data) ? response.data[0] : response.data;
          setProjects(prev => [newProject, ...prev]);
        }
      }

      handleCloseModal();
      // Перезагружаем данные для синхронизации
      await fetchData();
    } catch (err: any) {
      console.error('Ошибка сохранения проекта:', err);
      const errorState = handleApiError(err);
      
      // Если есть ошибки валидации, показываем их в форме
      if (Object.keys(errorState.validationErrors).length > 0) {
        setErrors(errorState.validationErrors);
      } else {
        showError(errorState);
        // Откатываем оптимистичное обновление
        await fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;

    setDeleting(true);
    const projectId = deletingProject.id;
    
    // Оптимистичное удаление
    setProjects(prev => prev.filter(p => p.id !== projectId));

    try {
      await axios.delete(`${API_URL}/projects/${projectId}`);
      setShowDeleteModal(false);
      setDeletingProject(null);
      // Перезагружаем для синхронизации
      await fetchData();
    } catch (err: any) {
      console.error('Ошибка удаления проекта:', err);
      const errorState = handleApiError(err);
      showError(errorState);
      // Откатываем оптимистичное удаление
      await fetchData();
    } finally {
      setDeleting(false);
    }
  };

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      active: 'ok',
      suspended: 'warn',
      completed: 'info',
      draft: 'info',
    };
    return chips[status] || 'info';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Активный',
      suspended: 'Приостановлен',
      completed: 'Завершен',
      draft: 'Черновик',
    };
    return labels[status] || status;
  };

  const handleExportExcel = () => {
    // Заглушка для экспорта в Excel
    alert('Экспорт в Excel будет реализован в следующей версии');
  };

  if (loading && projects.length === 0) {
    return (
      <div>
        <div className="loading">Загрузка...</div>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Загрузка проектов...</p>
          <p>Проверьте консоль браузера для отладки</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div style={{ padding: '16px', margin: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c00' }}>
          <strong>Ошибка:</strong> {error}
          <button onClick={fetchData} style={{ marginLeft: '12px', padding: '4px 12px' }}>Повторить</button>
        </div>
      )}
      {!loading && !error && projects.length === 0 && (
        <div style={{ padding: '16px', margin: '16px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', color: '#856404' }}>
          <strong>Внимание:</strong> Проекты не найдены. {total > 0 ? `Всего в базе: ${total}` : 'Проверьте подключение к API.'}
        </div>
      )}
      <div className="pageHead">
        <div>
          <div className="crumbs">
            <a href="#dashboard">Главная</a> <span className="sep">/</span>
            <span>Проекты</span>
          </div>
          <div className="h1">Проекты</div>
          <p className="h2">CRUD • Связи: подразделения, виды работ, конструктивы, дебиторка, продажи.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#projects" onClick={(e) => { e.preventDefault(); handleOpenModal(); }}>+ Создать проект</a>
        </div>
      </div>

      <div className="grid" style={{ display: 'block', width: '100%' }}>
        <div className="card" style={{ display: 'block', width: '100%', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div className="cardHead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid var(--line)' }}>
            <div>
              <div className="title" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>Реестр проектов</div>
              <div className="desc" style={{ fontSize: '13px', color: 'var(--muted)' }}>Поиск, фильтры, сортировка, экспорт</div>
            </div>
            <span className="chip info">Проекты</span>
          </div>
          <div className="cardBody" style={{ display: 'block', width: '100%' }}>
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Статус</label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="">Все</option>
                    <option value="active">Активный</option>
                    <option value="suspended">Приостановлен</option>
                    <option value="completed">Завершен</option>
                    <option value="draft">Черновик</option>
                  </select>
                </div>
                <div className="field">
                  <label>Подразделение</label>
                  <select 
                    value={filters.department_id} 
                    onChange={(e) => setFilters({...filters, department_id: e.target.value})}
                  >
                    <option value="">Все</option>
                    {departments.filter(d => d && d.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Вид работ</label>
                  <select 
                    value={filters.work_type} 
                    onChange={(e) => setFilters({...filters, work_type: e.target.value})}
                  >
                    <option value="">Все</option>
                    <option value="Бетонные">Бетонные</option>
                    <option value="Земляные">Земляные</option>
                    <option value="Кладка">Кладка</option>
                    <option value="Металл">Металл</option>
                    <option value="Кровля">Кровля</option>
                    <option value="Отделка">Отделка</option>
                    <option value="Благоустройство">Благоустройство</option>
                    <option value="Сети">Сети</option>
                  </select>
                </div>
                <div className="field">
                  <label>Поиск</label>
                  <input 
                    type="text" 
                    placeholder="Название, код, заказчик..." 
                    value={filters.search} 
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                  />
                </div>
              </div>
              <div className="actions">
                <a className="btn small" href="#projects" onClick={(e) => { e.preventDefault(); setFilters({status: '', department_id: '', work_type: '', search: ''}); setCurrentPage(1); }}>Сбросить</a>
                <a className="btn small" href="#projects" onClick={(e) => { e.preventDefault(); handleExportExcel(); }}>Экспорт Excel</a>
              </div>
            </div>

            {loading && projects.length > 0 && (
              <div style={{ padding: '10px', textAlign: 'center', color: 'var(--muted)' }}>Обновление данных...</div>
            )}

            {projects.length > 0 && (
              <div style={{ 
                padding: '12px 16px', 
                marginBottom: '15px', 
                background: 'var(--card)', 
                borderRadius: '8px', 
                color: 'var(--muted)', 
                fontSize: '13px', 
                border: '2px solid var(--accent)',
                display: 'block',
                visibility: 'visible',
                opacity: 1
              }}>
                ✓ <strong style={{ color: 'var(--text)', fontSize: '14px' }}>Найдено проектов: {projects.length} из {total}</strong>
              </div>
            )}

            <div style={{ 
              overflowX: 'auto', 
              background: 'var(--card)', 
              borderRadius: '12px', 
              border: '2px solid var(--line)', 
              padding: '0',
              display: 'block',
              visibility: 'visible',
              opacity: 1,
              minHeight: '200px'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                minWidth: '800px',
                display: 'table',
                visibility: 'visible',
                opacity: 1
              }}>
              <thead style={{ display: 'table-header-group', visibility: 'visible' }}>
                <tr style={{ display: 'table-row' }}>
                  <th style={{ width: '10%', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, background: 'var(--panel)', borderBottom: '2px solid var(--line)', display: 'table-cell' }}>Код</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, background: 'var(--panel)', borderBottom: '2px solid var(--line)', display: 'table-cell' }}>Проект</th>
                  <th style={{ width: '18%', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, background: 'var(--panel)', borderBottom: '2px solid var(--line)', display: 'table-cell' }}>Заказчик</th>
                  <th style={{ width: '14%', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, background: 'var(--panel)', borderBottom: '2px solid var(--line)', display: 'table-cell' }}>Подразделение</th>
                  <th style={{ width: '12%', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, background: 'var(--panel)', borderBottom: '2px solid var(--line)', display: 'table-cell' }}>Вид работ</th>
                  <th style={{ width: '12%', padding: '12px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, background: 'var(--panel)', borderBottom: '2px solid var(--line)', display: 'table-cell' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%', padding: '12px', textAlign: 'right', color: 'var(--text)', fontWeight: 600, background: 'var(--panel)', borderBottom: '2px solid var(--line)', display: 'table-cell' }}>Действия</th>
                </tr>
              </thead>
              <tbody style={{ display: 'table-row-group', visibility: 'visible' }}>
                {projects.length === 0 ? (
                  <tr style={{ display: 'table-row' }}>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text)', fontSize: '14px', display: 'table-cell' }}>
                      {loading ? 'Загрузка...' : total > 0 ? 'Проекты не найдены на текущей странице' : 'Проекты не найдены'}
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => {
                    if (!p || !p.id) {
                      return null;
                    }
                    return (
                      <tr 
                        key={p.id} 
                        style={{ 
                          display: 'table-row',
                          borderBottom: '1px solid var(--line)',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <td style={{ padding: '12px', color: 'var(--text)', display: 'table-cell' }}>{p.code || '-'}</td>
                        <td style={{ padding: '12px', color: 'var(--text)', display: 'table-cell' }}>
                          <strong style={{ color: 'var(--text)', fontSize: '14px' }}>{p.name || '-'}</strong>
                          <div className="mini" style={{ color: 'var(--muted2)', fontSize: '11px', marginTop: '4px' }}>ID: {p.id}</div>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text)', display: 'table-cell' }}>{p.customer || '-'}</td>
                        <td style={{ padding: '12px', color: 'var(--text)', display: 'table-cell' }}>{p.department?.name || departments.find(d => d.id === p.department_id)?.name || '-'}</td>
                        <td style={{ padding: '12px', color: 'var(--text)', display: 'table-cell' }}>{p.work_type || '-'}</td>
                        <td style={{ padding: '12px', display: 'table-cell' }}>
                          <span className={`chip ${getStatusChip(p.status)}`}>{getStatusLabel(p.status || 'draft')}</span>
                        </td>
                        <td className="tRight" style={{ padding: '12px', display: 'table-cell', textAlign: 'right' }}>
                          <a className="btn small" href={`#projects?id=${p.id}`} onClick={(e) => { e.preventDefault(); handleOpenModal(p); }}>Открыть</a>
                          <a className="btn small danger" href="#projects" onClick={(e) => { e.preventDefault(); setDeletingProject(p); setShowDeleteModal(true); }}>Уд.</a>
                        </td>
                      </tr>
                    );
                  }).filter(Boolean)
                )}
              </tbody>
              </table>
            </div>

            {totalPages > 0 && (
              <div className="tableFooter">
                <span>Показано {projects.length} из {total} • Страница {currentPage} из {totalPages}</span>
                <div className="pager">
                  <button 
                    className="btn small" 
                    type="button" 
                    disabled={currentPage === 1 || loading} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    ←
                  </button>
                  <button className="btn small" type="button" disabled>{currentPage}</button>
                  <button 
                    className="btn small" 
                    type="button" 
                    disabled={currentPage >= totalPages || loading} 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={handleCloseModal}>
          <div className="card" style={{ maxWidth: '600px', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div>
                <div className="title">{editingProject ? 'Редактирование проекта' : 'Создание проекта'}</div>
                <div className="desc">Заполните форму для {editingProject ? 'редактирования' : 'создания'} проекта</div>
              </div>
              <button className="btn ghost small" onClick={handleCloseModal} disabled={saving}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Название *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} disabled={saving} />
                  {errors.name && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.name}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Код</label>
                  <input type="text" name="code" value={formData.code} onChange={handleInputChange} disabled={saving} />
                  {errors.code && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.code}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Подразделение</label>
                  <select name="department_id" value={formData.department_id} onChange={handleInputChange} disabled={saving}>
                    <option value="">Не выбрано</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Вид работ</label>
                  <select name="work_type" value={formData.work_type} onChange={handleInputChange} disabled={saving}>
                    <option value="">Не выбрано</option>
                    <option value="Бетонные">Бетонные</option>
                    <option value="Земляные">Земляные</option>
                    <option value="Кладка">Кладка</option>
                    <option value="Металл">Металл</option>
                    <option value="Кровля">Кровля</option>
                    <option value="Отделка">Отделка</option>
                    <option value="Благоустройство">Благоустройство</option>
                    <option value="Сети">Сети</option>
                  </select>
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Заказчик</label>
                  <input type="text" name="customer" value={formData.customer} onChange={handleInputChange} disabled={saving} />
                  {errors.customer && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.customer}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Подрядчик</label>
                  <input type="text" name="contractor" value={formData.contractor} onChange={handleInputChange} disabled={saving} />
                  {errors.contractor && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.contractor}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Адрес</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} disabled={saving} />
                  {errors.address && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.address}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Описание</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} disabled={saving} />
                  {errors.description && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.description}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Дата начала</label>
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} disabled={saving} />
                  {errors.start_date && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.start_date}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Дата окончания</label>
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} disabled={saving} />
                  {errors.end_date && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.end_date}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Статус</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} disabled={saving}>
                    <option value="active">Активный</option>
                    <option value="suspended">Приостановлен</option>
                    <option value="completed">Завершен</option>
                    <option value="draft">Черновик</option>
                  </select>
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} disabled={saving} /> Активен
                  </label>
                </div>

                <div style={{ height: '16px' }} />

                <div className="actions">
                  <button type="submit" className="btn primary" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button type="button" className="btn" onClick={handleCloseModal} disabled={saving}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deletingProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '400px', margin: '20px' }}>
            <div className="cardHead">
              <div className="title">Удаление проекта</div>
            </div>
            <div className="cardBody">
              <p>Вы уверены, что хотите удалить проект "{deletingProject.name}"?</p>
              <div style={{ height: '12px' }} />
              <div className="actions">
                <button className="btn danger" onClick={handleDeleteConfirm} disabled={deleting}>
                  {deleting ? 'Удаление...' : 'Удалить'}
                </button>
                <button className="btn" onClick={() => { setShowDeleteModal(false); setDeletingProject(null); }} disabled={deleting}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Projects;
