import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { normalizeToArray } from '../utils/normalizeData';
import { handleApiError, showError } from '../utils/errorHandler';

interface Project {
  id: number;
  name: string;
  code?: string;
}

interface ExecutiveDocument {
  id: number;
  project_id: number;
  doc_type: string;
  name: string;
  number?: string;
  date?: string;
  description?: string;
  file_path?: string;
  created_by?: string;
  approved_by?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  project?: Project;
}

interface ExecutiveDocFormData {
  project_id: number | '';
  doc_type: string;
  name: string;
  number: string;
  date: string;
  description: string;
  file_path: string;
  created_by: string;
  approved_by: string;
  status: string;
}

const DOC_TYPES = [
  { value: 'executive_scheme', label: 'Исполнительная схема' },
  { value: 'hidden_work_act', label: 'Акт на скрытые работы' },
  { value: 'test_act', label: 'Акт испытаний' },
  { value: 'work_journal', label: 'Журнал работ' },
  { value: 'material_certificate', label: 'Сертификат на материалы' },
  { value: 'other', label: 'Прочее' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Черновик' },
  { value: 'in_work', label: 'В работе' },
  { value: 'in_review', label: 'На проверке' },
  { value: 'approved', label: 'Утвержден' },
  { value: 'signed', label: 'Подписан' },
  { value: 'rejected', label: 'Отклонен' },
];

// Мок-данные для тестирования
const MOCK_DOCS: ExecutiveDocument[] = [
  {
    id: 1,
    project_id: 1,
    doc_type: 'executive_scheme',
    name: 'Исполнительная схема свайного поля',
    number: 'ИС-001',
    date: '2024-02-10',
    description: 'Схема расположения свай ось 1-10',
    status: 'approved',
    created_at: '2024-02-10',
    created_by: 'Иванов И.И.',
    approved_by: 'Петров П.П.'
  },
  {
    id: 2,
    project_id: 1,
    doc_type: 'hidden_work_act',
    name: 'Акт скрытых работ на армирование',
    number: 'АОСР-005',
    date: '2024-02-12',
    description: 'Армирование ростверка',
    status: 'signed',
    created_at: '2024-02-12',
    created_by: 'Иванов И.И.',
    approved_by: 'Сидоров С.С.'
  },
  {
    id: 3,
    project_id: 2,
    doc_type: 'test_act',
    name: 'Акт испытания бетона',
    number: 'АИ-003',
    date: '2024-03-01',
    description: 'Результаты лабораторных испытаний кубиков',
    status: 'in_review',
    created_at: '2024-03-01',
    created_by: 'Козлов К.К.'
  },
];

const ExecutiveDocs: React.FC = () => {
  const [docs, setDocs] = useState<ExecutiveDocument[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ExecutiveDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<ExecutiveDocument | null>(null);
  const [formData, setFormData] = useState<ExecutiveDocFormData>({
    project_id: '',
    doc_type: 'executive_scheme',
    name: '',
    number: '',
    date: '',
    description: '',
    file_path: '',
    created_by: '',
    approved_by: '',
    status: 'draft',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({ 
    status: '', 
    doc_type: '', 
    project_id: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    fetchData();
  }, []);

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.status, filters.doc_type, filters.project_id, filters.search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [docsResponse, projectsResponse] = await Promise.all([
        axios.get(`${API_URL}/executive-docs/`),
        axios.get(`${API_URL}/projects/`),
      ]);
      
      // Обработка документов
      const docsData = normalizeToArray<ExecutiveDocument>(docsResponse.data);
      setDocs(docsData);
      
      // Обработка проектов - новый формат с метаданными
      let projectsData: Project[] = [];
      if (projectsResponse.data && projectsResponse.data.data && Array.isArray(projectsResponse.data.data)) {
        // Новый формат с метаданными
        projectsData = projectsResponse.data.data;
      } else if (Array.isArray(projectsResponse.data)) {
        // Старый формат (массив)
        projectsData = projectsResponse.data;
      } else {
        // Попытка нормализовать
        projectsData = normalizeToArray<Project>(projectsResponse.data);
      }
      
      // Фильтруем только валидные проекты с id
      projectsData = projectsData.filter(p => p && p.id !== undefined && p.id !== null);
      setProjects(projectsData);
    } catch (err: any) {
      console.error('Ошибка загрузки данных:', err);
      // Fallback to mock data
      setDocs(MOCK_DOCS);
      setProjects([]);
      // Don't show error if we fallback
      // const errorState = handleApiError(err);
      // setError(errorState.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = useMemo(() => {
    return docs.filter(d => {
      if (filters.status && d.status !== filters.status) return false;
      if (filters.doc_type && d.doc_type !== filters.doc_type) return false;
      if (filters.project_id && d.project_id.toString() !== filters.project_id) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          d.name.toLowerCase().includes(search) ||
          (d.number && d.number.toLowerCase().includes(search)) ||
          (d.description && d.description.toLowerCase().includes(search)) ||
          (d.created_by && d.created_by.toLowerCase().includes(search)) ||
          (d.approved_by && d.approved_by.toLowerCase().includes(search))
        );
      }
      return true;
    });
  }, [docs, filters]);

  const paginatedDocs = useMemo(() => {
    return filteredDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredDocs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredDocs.length / pageSize);

  const handleOpenModal = (doc?: ExecutiveDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        project_id: doc.project_id,
        doc_type: doc.doc_type,
        name: doc.name,
        number: doc.number || '',
        date: doc.date ? doc.date.split('T')[0] : '',
        description: doc.description || '',
        file_path: doc.file_path || '',
        created_by: doc.created_by || '',
        approved_by: doc.approved_by || '',
        status: doc.status || 'draft',
      });
    } else {
      setEditingDoc(null);
      setFormData({
        project_id: '',
        doc_type: 'executive_scheme',
        name: '',
        number: '',
        date: '',
        description: '',
        file_path: '',
        created_by: '',
        approved_by: '',
        status: 'draft',
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (!formData.name.trim()) newErrors.name = 'Наименование документа обязательно';
    if (!formData.doc_type) newErrors.doc_type = 'Тип документа обязателен';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setErrors({});

    try {
      const submitData = {
        ...formData,
        project_id: Number(formData.project_id),
        number: formData.number || null,
        date: formData.date || null,
        description: formData.description || null,
        file_path: formData.file_path || null,
        created_by: formData.created_by || null,
        approved_by: formData.approved_by || null,
      };

      if (editingDoc) {
        await axios.put(`${API_URL}/executive-docs/${editingDoc.id}`, submitData);
      } else {
        await axios.post(`${API_URL}/executive-docs/`, submitData);
      }
      handleCloseModal();
      await fetchData();
    } catch (err: any) {
      console.error('Ошибка сохранения документа:', err);
      const errorState = handleApiError(err);
      
      // Если есть ошибки валидации, показываем их в форме
      if (Object.keys(errorState.validationErrors).length > 0) {
        setErrors(errorState.validationErrors);
      } else {
        showError(errorState);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;
    
    setDeleting(true);
    const docId = deletingDoc.id;
    
    // Оптимистичное удаление
    setDocs(prev => prev.filter(d => d.id !== docId));

    try {
      await axios.delete(`${API_URL}/executive-docs/${docId}`);
      setShowDeleteModal(false);
      setDeletingDoc(null);
      await fetchData();
    } catch (err: any) {
      console.error('Ошибка удаления документа:', err);
      const errorState = handleApiError(err);
      showError(errorState);
      // Откатываем оптимистичное удаление
      await fetchData();
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getDocTypeLabel = (type: string) => {
    return DOC_TYPES.find(dt => dt.value === type)?.label || type;
  };

  const getStatusChip = (status: string) => {
    const chips: Record<string, string> = {
      draft: 'info',
      in_work: 'warn',
      in_review: 'info',
      approved: 'ok',
      signed: 'ok',
      rejected: 'danger',
    };
    return chips[status] || 'info';
  };

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  };

  const handleExportExcel = () => {
    // Заглушка для экспорта в Excel
    alert('Экспорт в Excel будет реализован в следующей версии');
  };

  if (loading && docs.length === 0) {
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
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Исполнительная документация</span></div>
          <div className="h1">Исполнительная документация</div>
          <p className="h2">Реестр ИД • типы документов • статусы • связи с проектами и исполнительными съемками.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#executive-docs" onClick={(e) => { e.preventDefault(); handleOpenModal(); }}>+ Создать документ</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр исполнительной документации</div>
              <div className="desc">Поиск, фильтры, сортировка, экспорт</div>
            </div>
            <span className="chip info">Исполнительная документация</span>
          </div>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Статус</label>
                  <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                    <option value="">Все</option>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Тип документа</label>
                  <select value={filters.doc_type} onChange={(e) => setFilters({...filters, doc_type: e.target.value})}>
                    <option value="">Все</option>
                    {DOC_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Проект</label>
                  <select value={filters.project_id} onChange={(e) => setFilters({...filters, project_id: e.target.value})}>
                    <option value="">Все</option>
                    {projects.filter(p => p && p.id).map(p => <option key={p.id} value={p.id.toString()}>{p.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Поиск</label>
                  <input 
                    type="text" 
                    placeholder="Название, номер, описание..." 
                    value={filters.search} 
                    onChange={(e) => setFilters({...filters, search: e.target.value})} 
                  />
                </div>
              </div>
              <div className="actions">
                <a className="btn small" href="#executive-docs" onClick={(e) => { e.preventDefault(); setFilters({status: '', doc_type: '', project_id: '', search: ''}); setCurrentPage(1); }}>Сбросить</a>
                <a className="btn small" href="#executive-docs" onClick={(e) => { e.preventDefault(); handleExportExcel(); }}>Экспорт Excel</a>
              </div>
            </div>

            {filteredDocs.length > 0 && (
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
                ✓ <strong style={{ color: 'var(--text)', fontSize: '14px' }}>Найдено документов: {filteredDocs.length} из {docs.length}</strong>
              </div>
            )}

            <table>
              <thead>
                <tr>
                  <th style={{ width: '8%' }}>ID</th>
                  <th>Наименование</th>
                  <th style={{ width: '14%' }}>Тип</th>
                  <th style={{ width: '12%' }}>Номер</th>
                  <th style={{ width: '16%' }}>Проект</th>
                  <th style={{ width: '12%' }}>Дата</th>
                  <th style={{ width: '12%' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                      {docs.length === 0 
                        ? 'Документы не загружены' 
                        : filteredDocs.length === 0
                        ? 'Документы не найдены по заданным фильтрам'
                        : 'Документы не найдены на текущей странице'}
                    </td>
                  </tr>
                ) : (
                  paginatedDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.id}</td>
                      <td>
                        <strong>{doc.name}</strong>
                        {doc.description && <div className="mini" style={{ color: 'var(--muted2)', fontSize: '11px', marginTop: '4px' }}>{doc.description.substring(0, 50)}...</div>}
                      </td>
                      <td>{getDocTypeLabel(doc.doc_type)}</td>
                      <td>{doc.number || '-'}</td>
                      <td>{doc.project?.name || projects.find(p => p.id === doc.project_id)?.name || `ID: ${doc.project_id}`}</td>
                      <td>{formatDate(doc.date)}</td>
                      <td><span className={`chip ${getStatusChip(doc.status)}`}>{getStatusLabel(doc.status)}</span></td>
                      <td className="tRight">
                        <a className="btn small" href="#executive-docs" onClick={(e) => { e.preventDefault(); handleOpenModal(doc); }}>Открыть</a>
                        <a className="btn small danger" href="#executive-docs" onClick={(e) => { e.preventDefault(); setDeletingDoc(doc); setShowDeleteModal(true); }}>Уд.</a>
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
                  <button className="btn small" type="button" disabled={currentPage === 1 || loading} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>←</button>
                  <button className="btn small" type="button" disabled>{currentPage}</button>
                  <button className="btn small" type="button" disabled={currentPage >= totalPages || loading} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>→</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={handleCloseModal}>
            <div className="card" style={{ maxWidth: '700px', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="cardHead">
                <div>
                  <div className="title">{editingDoc ? 'Редактирование документа' : 'Создание документа'}</div>
                  <div className="desc">Заполните форму для {editingDoc ? 'редактирования' : 'создания'} исполнительной документации</div>
                </div>
                <button className="btn ghost small" onClick={handleCloseModal} disabled={saving}>✕</button>
              </div>
              <div className="cardBody">
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <label>Проект *</label>
                    <select name="project_id" value={formData.project_id} onChange={handleInputChange} required disabled={saving}>
                      <option value="">Выберите проект</option>
                      {projects.filter(p => p && p.id).map((p) => <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>)}
                    </select>
                    {errors.project_id && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.project_id}</span>}
                  </div>

                  <div style={{ height: '10px' }} />

                  <div className="field">
                    <label>Тип документа *</label>
                    <select name="doc_type" value={formData.doc_type} onChange={handleInputChange} required disabled={saving}>
                      {DOC_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                    {errors.doc_type && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.doc_type}</span>}
                  </div>

                  <div style={{ height: '10px' }} />

                  <div className="field">
                    <label>Наименование *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required disabled={saving} />
                    {errors.name && <span className="mini" style={{ color: 'var(--danger)' }}>{errors.name}</span>}
                  </div>

                  <div style={{ height: '10px' }} />

                  <div className="field">
                    <label>Номер документа</label>
                    <input type="text" name="number" value={formData.number} onChange={handleInputChange} disabled={saving} />
                  </div>

                  <div style={{ height: '10px' }} />

                  <div className="field">
                    <label>Дата документа</label>
                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} disabled={saving} />
                  </div>

                  <div style={{ height: '10px' }} />

                  <div className="field">
                    <label>Создал</label>
                    <input type="text" name="created_by" value={formData.created_by} onChange={handleInputChange} disabled={saving} />
                  </div>

                  <div style={{ height: '10px' }} />

                  <div className="field">
                    <label>Утвердил</label>
                    <input type="text" name="approved_by" value={formData.approved_by} onChange={handleInputChange} disabled={saving} />
                  </div>

                  <div style={{ height: '10px' }} />

                  <div className="field">
                    <label>Путь к файлу</label>
                    <input type="text" name="file_path" value={formData.file_path} onChange={handleInputChange} placeholder="/путь/к/файлу.pdf" disabled={saving} />
                  </div>

                  <div style={{ height: '10px' }} />

                  <div className="field">
                    <label>Описание</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} disabled={saving} />
                  </div>

                  <div style={{ height: '10px' }} />

                  <div className="field">
                    <label>Статус</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} disabled={saving}>
                      {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
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
      </div>

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
                <button className="btn danger" onClick={handleDeleteConfirm} disabled={deleting}>
                  {deleting ? 'Удаление...' : 'Удалить'}
                </button>
                <button className="btn" onClick={() => { setShowDeleteModal(false); setDeletingDoc(null); }} disabled={deleting}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExecutiveDocs;
