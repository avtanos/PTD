import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { normalizeToArray } from '../utils/normalizeData';
import { mockProjects, getMockExecutiveSurveys } from '../mocks/data';

interface ExecutiveSurvey {
  id: number;
  project_id: number;
  survey_type: string;
  number?: string;
  survey_date: string;
  surveyor?: string;
  department?: string;
  description?: string;
  coordinates?: string;
  file_path?: string;
  drawing_path?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  project?: { id: number; name: string };
}

interface Project {
  id: number;
  name: string;
  code?: string;
}

const ExecutiveSurveys: React.FC = () => {
  const [surveys, setSurveys] = useState<ExecutiveSurvey[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<ExecutiveSurvey | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState<ExecutiveSurvey | null>(null);
  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    survey_type: '',
    number: '',
    survey_date: '',
    surveyor: '',
    department: '',
    description: '',
    coordinates: '',
    file_path: '',
    drawing_path: '',
    status: 'completed',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    project_id: '',
    survey_type: '',
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
      const [surveysRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/executive-surveys/`),
        axios.get(`${API_URL}/projects/`),
      ]);
      
      const surveysData = normalizeToArray<ExecutiveSurvey>(surveysRes.data);
      
      // Обработка проектов - новый формат с метаданными
      let projectsData: Project[] = [];
      if (projectsRes.data && projectsRes.data.data && Array.isArray(projectsRes.data.data)) {
        projectsData = projectsRes.data.data;
      } else if (Array.isArray(projectsRes.data)) {
        projectsData = projectsRes.data;
      } else {
        projectsData = normalizeToArray<Project>(projectsRes.data);
      }
      projectsData = projectsData.filter(p => p && p.id !== undefined && p.id !== null);
      
      setSurveys(surveysData);
      setProjects(projectsData);
    } catch (error: any) {
      console.error('Ошибка загрузки данных:', error);
      setError(error.response?.data?.detail || error.message || 'Ошибка загрузки данных');
      setSurveys(getMockExecutiveSurveys());
      setProjects(mockProjects.map((p) => ({ id: p.id, name: p.name, code: p.code })));
    } finally {
      setLoading(false);
    }
  };

  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      if (filters.project_id && s.project_id?.toString() !== filters.project_id) return false;
      if (filters.survey_type && s.survey_type !== filters.survey_type) return false;
      if (filters.status && s.status !== filters.status) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          (s.number && s.number.toLowerCase().includes(search)) ||
          (s.description && s.description.toLowerCase().includes(search)) ||
          (s.surveyor && s.surveyor.toLowerCase().includes(search))
        );
      }
      return true;
    });
  }, [surveys, filters]);

  const paginatedSurveys = useMemo(() => {
    return filteredSurveys.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredSurveys, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredSurveys.length / pageSize);

  const handleOpenModal = (survey?: ExecutiveSurvey) => {
    if (survey) {
      setEditingSurvey(survey);
      setFormData({
        project_id: survey.project_id || '',
        survey_type: survey.survey_type || '',
        number: survey.number || '',
        survey_date: survey.survey_date ? survey.survey_date.split('T')[0] : '',
        surveyor: survey.surveyor || '',
        department: survey.department || '',
        description: survey.description || '',
        coordinates: survey.coordinates || '',
        file_path: survey.file_path || '',
        drawing_path: survey.drawing_path || '',
        status: survey.status || 'completed',
        notes: survey.notes || '',
      });
    } else {
      setEditingSurvey(null);
      setFormData({
        project_id: '',
        survey_type: '',
        number: '',
        survey_date: '',
        surveyor: '',
        department: '',
        description: '',
        coordinates: '',
        file_path: '',
        drawing_path: '',
        status: 'completed',
        notes: '',
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSurvey(null);
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'project_id' ? (value ? parseInt(value) : '') : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.project_id) newErrors.project_id = 'Проект обязателен';
    if (!formData.survey_type) newErrors.survey_type = 'Тип съемки обязателен';
    if (!formData.survey_date) newErrors.survey_date = 'Дата съемки обязательна';
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
        number: formData.number || null,
        surveyor: formData.surveyor || null,
        department: formData.department || null,
        description: formData.description || null,
        coordinates: formData.coordinates || null,
        file_path: formData.file_path || null,
        drawing_path: formData.drawing_path || null,
        notes: formData.notes || null,
      };

      if (editingSurvey) {
        await axios.put(`${API_URL}/executive-surveys/${editingSurvey.id}`, submitData);
      } else {
        await axios.post(`${API_URL}/executive-surveys/`, submitData);
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('Ошибка сохранения съемки:', error);
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
    if (!deletingSurvey) return;
    try {
      await axios.delete(`${API_URL}/executive-surveys/${deletingSurvey.id}`);
      setShowDeleteModal(false);
      setDeletingSurvey(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления съемки:', error);
      alert('Ошибка удаления съемки');
    }
  };

  const getSurveyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'topographic': 'Топографическая',
      'geodetic': 'Геодезическая',
      'as_built': 'Исполнительная',
      'control': 'Контрольная',
      'other': 'Прочее',
    };
    return types[type] || type;
  };

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      completed: 'ok',
      in_progress: 'warn',
      draft: 'info',
    };
    return chips[status] || 'info';
  };

  if (loading) return <div className="loading">Загрузка...</div>;

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
            <span>Исполнительные съемки</span>
          </div>
          <div className="h1">Исполнительные съемки</div>
          <p className="h2">Реестр исполнительных съемок • типы съемок • статусы • связи с проектами.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#surveys" onClick={(e) => { e.preventDefault(); handleOpenModal(); }}>+ Создать съемку</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр исполнительных съемок</div>
              <div className="desc">Поиск, фильтры, сортировка, экспорт</div>
            </div>
            <span className="chip info">Исполнительные съемки</span>
          </div>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Проект</label>
                  <select value={filters.project_id} onChange={(e) => setFilters({...filters, project_id: e.target.value})}>
                    <option value="">Все</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Тип съемки</label>
                  <select value={filters.survey_type} onChange={(e) => setFilters({...filters, survey_type: e.target.value})}>
                    <option value="">Все</option>
                    <option value="topographic">Топографическая</option>
                    <option value="geodetic">Геодезическая</option>
                    <option value="as_built">Исполнительная</option>
                    <option value="control">Контрольная</option>
                    <option value="other">Прочее</option>
                  </select>
                </div>
                <div className="field">
                  <label>Статус</label>
                  <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                    <option value="">Все</option>
                    <option value="completed">Завершена</option>
                    <option value="in_progress">В работе</option>
                    <option value="draft">Черновик</option>
                  </select>
                </div>
                <div className="field">
                  <label>Поиск</label>
                  <input type="text" placeholder="Номер, описание..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                </div>
              </div>
              <div className="actions">
                <a className="btn small" href="#surveys" onClick={(e) => { e.preventDefault(); setFilters({project_id: '', survey_type: '', status: '', search: ''}); setCurrentPage(1); }}>Сбросить</a>
                <a className="btn small" href="#surveys">Экспорт Excel</a>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Номер</th>
                  <th>Проект</th>
                  <th style={{ width: '14%' }}>Тип съемки</th>
                  <th style={{ width: '12%' }}>Дата</th>
                  <th style={{ width: '14%' }}>Исполнитель</th>
                  <th style={{ width: '12%' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSurveys.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      {surveys.length === 0 
                        ? 'Съемки не загружены' 
                        : filteredSurveys.length === 0
                        ? 'Съемки не найдены по заданным фильтрам'
                        : 'Съемки не найдены на текущей странице'}
                    </td>
                  </tr>
                ) : (
                  paginatedSurveys.map((s) => (
                    <tr key={s.id}>
                      <td>{s.number || '-'}</td>
                      <td>
                        {projects.find(p => p.id === s.project_id)?.name || '-'}
                        <div className="mini">ID: {s.id}</div>
                      </td>
                      <td>{getSurveyTypeLabel(s.survey_type)}</td>
                      <td>{s.survey_date ? new Date(s.survey_date).toLocaleDateString('ru-RU') : '-'}</td>
                      <td>{s.surveyor || '-'}</td>
                      <td><span className={`chip ${getStatusChip(s.status)}`}>{s.status}</span></td>
                      <td className="tRight">
                        <a className="btn small" href={`#surveys?id=${s.id}`} onClick={(e) => { e.preventDefault(); handleOpenModal(s); }}>Открыть</a>
                        <a className="btn small danger" href="#surveys" onClick={(e) => { e.preventDefault(); setDeletingSurvey(s); setShowDeleteModal(true); }}>Уд.</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 0 && (
              <div className="tableFooter">
                <span>Показано {paginatedSurveys.length} из {filteredSurveys.length} • Страница {currentPage} из {totalPages}</span>
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
          <div className="card" style={{ maxWidth: '700px', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div>
                <div className="title">{editingSurvey ? 'Редактирование съемки' : 'Создание съемки'}</div>
                <div className="desc">Заполните форму для {editingSurvey ? 'редактирования' : 'создания'} исполнительной съемки</div>
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
                  <label>Тип съемки *</label>
                  <select name="survey_type" value={formData.survey_type} onChange={handleInputChange} required>
                    <option value="">Выберите тип</option>
                    <option value="topographic">Топографическая</option>
                    <option value="geodetic">Геодезическая</option>
                    <option value="as_built">Исполнительная</option>
                    <option value="control">Контрольная</option>
                    <option value="other">Прочее</option>
                  </select>
                  {errors.survey_type && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.survey_type}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Дата съемки *</label>
                  <input type="date" name="survey_date" value={formData.survey_date} onChange={handleInputChange} required />
                  {errors.survey_date && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.survey_date}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Номер</label>
                  <input type="text" name="number" value={formData.number} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Исполнитель</label>
                  <input type="text" name="surveyor" value={formData.surveyor} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Подразделение</label>
                  <input type="text" name="department" value={formData.department} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Координаты</label>
                  <input type="text" name="coordinates" value={formData.coordinates} onChange={handleInputChange} placeholder="Широта, долгота" />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Путь к файлу</label>
                  <input type="text" name="file_path" value={formData.file_path} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Путь к чертежу</label>
                  <input type="text" name="drawing_path" value={formData.drawing_path} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Статус</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="completed">Завершена</option>
                    <option value="in_progress">В работе</option>
                    <option value="draft">Черновик</option>
                  </select>
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Описание</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Примечания</label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} />
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

      {showDeleteModal && deletingSurvey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '400px', margin: '20px' }}>
            <div className="cardHead">
              <div className="title">Удаление съемки</div>
            </div>
            <div className="cardBody">
              <p>Вы уверены, что хотите удалить съемку "{deletingSurvey.number || deletingSurvey.id}"?</p>
              <div style={{ height: '12px' }} />
              <div className="actions">
                <button className="btn danger" onClick={handleDeleteConfirm}>Удалить</button>
                <button className="btn" onClick={() => { setShowDeleteModal(false); setDeletingSurvey(null); }}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExecutiveSurveys;
