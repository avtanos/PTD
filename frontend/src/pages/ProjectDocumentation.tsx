import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { normalizeToArray } from '../utils/normalizeData';

interface ProjectDocumentation {
  id: number;
  project_id: number;
  doc_type: string;
  name: string;
  number?: string;
  version?: string;
  development_date?: string;
  developer?: string;
  approved_by?: string;
  approval_date?: string;
  file_path?: string;
  description?: string;
  is_active: boolean;
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

const ProjectDocumentation: React.FC = () => {
  const [docs, setDocs] = useState<ProjectDocumentation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ProjectDocumentation | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<ProjectDocumentation | null>(null);
  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    doc_type: '',
    name: '',
    number: '',
    version: '',
    development_date: '',
    developer: '',
    approved_by: '',
    approval_date: '',
    file_path: '',
    description: '',
    is_active: true,
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    project_id: '',
    doc_type: '',
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
      const [docsRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/project-documentation/`),
        axios.get(`${API_URL}/projects/`),
      ]);
      
      const docsData = normalizeToArray<ProjectDocumentation>(docsRes.data);
      
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
      
      setDocs(docsData);
      setProjects(projectsData);
    } catch (error: any) {
      console.error('Ошибка загрузки данных:', error);
      setError(error.response?.data?.detail || error.message || 'Ошибка загрузки данных');
      setDocs([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      if (filters.project_id && d.project_id?.toString() !== filters.project_id) return false;
      if (filters.doc_type && d.doc_type !== filters.doc_type) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          d.name.toLowerCase().includes(search) ||
          (d.number && d.number.toLowerCase().includes(search)) ||
          (d.description && d.description.toLowerCase().includes(search))
        );
      }
      return true;
    });
  }, [docs, filters]);

  const paginatedDocs = useMemo(() => {
    return filteredDocs.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredDocs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredDocs.length / pageSize);

  const handleOpenModal = (doc?: ProjectDocumentation) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        project_id: doc.project_id || '',
        doc_type: doc.doc_type || '',
        name: doc.name || '',
        number: doc.number || '',
        version: doc.version || '',
        development_date: doc.development_date ? doc.development_date.split('T')[0] : '',
        developer: doc.developer || '',
        approved_by: doc.approved_by || '',
        approval_date: doc.approval_date ? doc.approval_date.split('T')[0] : '',
        file_path: doc.file_path || '',
        description: doc.description || '',
        is_active: doc.is_active !== undefined ? doc.is_active : true,
        notes: doc.notes || '',
      });
    } else {
      setEditingDoc(null);
      setFormData({
        project_id: '',
        doc_type: '',
        name: '',
        number: '',
        version: '',
        development_date: '',
        developer: '',
        approved_by: '',
        approval_date: '',
        file_path: '',
        description: '',
        is_active: true,
        notes: '',
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDoc(null);
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' && name === 'project_id' ? (value ? parseInt(value) : '') : value,
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
    if (!formData.name.trim()) newErrors.name = 'Наименование документа обязательно';
    if (!formData.project_id) newErrors.project_id = 'Проект обязателен';
    if (!formData.doc_type) newErrors.doc_type = 'Тип документа обязателен';
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
        development_date: formData.development_date || null,
        approval_date: formData.approval_date || null,
        number: formData.number || null,
        version: formData.version || null,
        developer: formData.developer || null,
        approved_by: formData.approved_by || null,
        file_path: formData.file_path || null,
        description: formData.description || null,
        notes: formData.notes || null,
      };

      if (editingDoc) {
        await axios.put(`${API_URL}/project-documentation/${editingDoc.id}`, submitData);
      } else {
        await axios.post(`${API_URL}/project-documentation/`, submitData);
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('Ошибка сохранения документа:', error);
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
    if (!deletingDoc) return;
    try {
      await axios.delete(`${API_URL}/project-documentation/${deletingDoc.id}`);
      setShowDeleteModal(false);
      setDeletingDoc(null);
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления документа:', error);
      alert('Ошибка удаления документа');
    }
  };

  const getDocTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'working_drawings': 'Рабочие чертежи',
      'specifications': 'Спецификации',
      'calculations': 'Расчеты',
      'schemes': 'Схемы',
      'other': 'Прочее',
    };
    return types[type] || type;
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
            <span>Проектная документация</span>
          </div>
          <div className="h1">Проектная документация</div>
          <p className="h2">Реестр проектной документации • типы документов • статусы • связи с проектами.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#projdocs" onClick={(e) => { e.preventDefault(); handleOpenModal(); }}>+ Создать документ</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр проектной документации</div>
              <div className="desc">Поиск, фильтры, сортировка, экспорт</div>
            </div>
            <span className="chip info">Проектная документация</span>
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
                  <label>Тип документа</label>
                  <select value={filters.doc_type} onChange={(e) => setFilters({...filters, doc_type: e.target.value})}>
                    <option value="">Все</option>
                    <option value="working_drawings">Рабочие чертежи</option>
                    <option value="specifications">Спецификации</option>
                    <option value="calculations">Расчеты</option>
                    <option value="schemes">Схемы</option>
                    <option value="other">Прочее</option>
                  </select>
                </div>
                <div className="field">
                  <label>Поиск</label>
                  <input type="text" placeholder="Название, номер..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                </div>
              </div>
              <div className="actions">
                <a className="btn small" href="#projdocs" onClick={(e) => { e.preventDefault(); setFilters({project_id: '', doc_type: '', search: ''}); setCurrentPage(1); }}>Сбросить</a>
                <a className="btn small" href="#projdocs">Экспорт Excel</a>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Номер</th>
                  <th>Документ</th>
                  <th style={{ width: '18%' }}>Проект</th>
                  <th style={{ width: '14%' }}>Тип</th>
                  <th style={{ width: '12%' }}>Разработчик</th>
                  <th style={{ width: '12%' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      {docs.length === 0 
                        ? 'Документы не загружены' 
                        : filteredDocs.length === 0
                        ? 'Документы не найдены по заданным фильтрам'
                        : 'Документы не найдены на текущей странице'}
                    </td>
                  </tr>
                ) : (
                  paginatedDocs.map((d) => (
                    <tr key={d.id}>
                      <td>{d.number || '-'}</td>
                      <td>
                        {d.name}
                        {d.version && <div className="mini">Версия: {d.version}</div>}
                        <div className="mini">ID: {d.id}</div>
                      </td>
                      <td>{projects.find(p => p.id === d.project_id)?.name || '-'}</td>
                      <td>{getDocTypeLabel(d.doc_type)}</td>
                      <td>{d.developer || '-'}</td>
                      <td><span className={`chip ${d.is_active ? 'ok' : 'info'}`}>{d.is_active ? 'Активен' : 'Неактивен'}</span></td>
                      <td className="tRight">
                        <a className="btn small" href={`#projdocs?id=${d.id}`} onClick={(e) => { e.preventDefault(); handleOpenModal(d); }}>Открыть</a>
                        <a className="btn small danger" href="#projdocs" onClick={(e) => { e.preventDefault(); setDeletingDoc(d); setShowDeleteModal(true); }}>Уд.</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 0 && (
              <div className="tableFooter">
                <span>Показано {paginatedDocs.length} из {filteredDocs.length} • Страница {currentPage} из {totalPages}</span>
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
                <div className="title">{editingDoc ? 'Редактирование документа' : 'Создание документа'}</div>
                <div className="desc">Заполните форму для {editingDoc ? 'редактирования' : 'создания'} проектной документации</div>
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
                  <label>Тип документа *</label>
                  <select name="doc_type" value={formData.doc_type} onChange={handleInputChange} required>
                    <option value="">Выберите тип</option>
                    <option value="working_drawings">Рабочие чертежи</option>
                    <option value="specifications">Спецификации</option>
                    <option value="calculations">Расчеты</option>
                    <option value="schemes">Схемы</option>
                    <option value="other">Прочее</option>
                  </select>
                  {errors.doc_type && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.doc_type}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Наименование *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                  {errors.name && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.name}</span>}
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Номер</label>
                  <input type="text" name="number" value={formData.number} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Версия</label>
                  <input type="text" name="version" value={formData.version} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Дата разработки</label>
                  <input type="date" name="development_date" value={formData.development_date} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Разработчик</label>
                  <input type="text" name="developer" value={formData.developer} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Утвердил</label>
                  <input type="text" name="approved_by" value={formData.approved_by} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Дата утверждения</label>
                  <input type="date" name="approval_date" value={formData.approval_date} onChange={handleInputChange} />
                </div>

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>Путь к файлу</label>
                  <input type="text" name="file_path" value={formData.file_path} onChange={handleInputChange} />
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

                <div style={{ height: '10px' }} />

                <div className="field">
                  <label>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} /> Активен
                  </label>
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

      {showDeleteModal && deletingDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '400px', margin: '20px' }}>
            <div className="cardHead">
              <div className="title">Удаление документа</div>
            </div>
            <div className="cardBody">
              <p>Вы уверены, что хотите удалить документ "{deletingDoc.name}"?</p>
              <div style={{ height: '12px' }} />
              <div className="actions">
                <button className="btn danger" onClick={handleDeleteConfirm}>Удалить</button>
                <button className="btn" onClick={() => { setShowDeleteModal(false); setDeletingDoc(null); }}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectDocumentation;
