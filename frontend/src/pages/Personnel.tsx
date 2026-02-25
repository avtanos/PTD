import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';

interface Department {
  id: number;
  code: string;
  name: string;
}

interface PersonnelItem {
  id: number;
  tab_number?: string;
  full_name: string;
  position: string;
  department_id?: number;
  department?: Department;
  hire_date: string;
  dismissal_date?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  status: string;
  is_active: boolean;
}

interface PersonnelDocumentItem {
  id: number;
  personnel_id: number;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  uploaded_at: string;
}

interface PersonnelHistoryItem {
  id: number;
  personnel_id: number;
  action: string;
  changed_at: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  description?: string;
}

const STATUS_LABELS: Record<string, string> = {
  employed: 'В штате',
  dismissed: 'Уволен',
  vacation: 'Отпуск',
  maternity: 'Декретный',
  sick_leave: 'Больничный',
};

const POSITIONS = [
  'Инженер ПТО',
  'Руководитель ПТО',
  'Геодезист',
  'Прораб',
  'Мастер',
  'Инженер-сметчик',
  'Инженер ОГЭ',
  'Инженер ОГМ',
  'Техник',
  'Документовед',
  'Экономист',
  'Специалист по закупкам',
  'Инженер-конструктор',
  'Главный инженер',
  'Начальник участка',
  'Другое',
];

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  resume: 'Резюме',
  autobiography: 'Автобиография',
  diploma: 'Диплом об образовании',
  certificate: 'Сертификаты / удостоверения',
  contract: 'Трудовой договор',
  other: 'Прочее',
};

const Personnel: React.FC = () => {
  const [personnel, setPersonnel] = useState<PersonnelItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PersonnelItem | null>(null);
  const [filters, setFilters] = useState({ search: '', department_id: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [modalTab, setModalTab] = useState<'main' | 'documents' | 'history'>('main');
  const [documents, setDocuments] = useState<PersonnelDocumentItem[]>([]);
  const [history, setHistory] = useState<PersonnelHistoryItem[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [viewing, setViewing] = useState<PersonnelItem | null>(null);
  const [viewTab, setViewTab] = useState<'main' | 'documents' | 'history'>('main');
  const [viewDocuments, setViewDocuments] = useState<PersonnelDocumentItem[]>([]);
  const [viewHistory, setViewHistory] = useState<PersonnelHistoryItem[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<PersonnelItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formData, setFormData] = useState({
    tab_number: '',
    full_name: '',
    position: '',
    department_id: '' as number | '',
    hire_date: '',
    dismissal_date: '',
    birth_date: '',
    phone: '',
    email: '',
    inn: '',
    status: 'employed',
    is_active: true,
    notes: '',
  });

  useEffect(() => {
    fetchPersonnel();
    fetchDepartments();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {};
      if (filters.department_id) params.department_id = filters.department_id;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const res = await axios.get(`${API_URL}/personnel/`, { params });
      setPersonnel(res.data);
    } catch (error) {
      console.error('Ошибка загрузки кадров:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_URL}/departments/`);
      setDepartments(res.data);
    } catch (error) {
      console.error('Ошибка загрузки подразделений:', error);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, [filters.department_id, filters.status]);

  useEffect(() => {
    if (showModal && editing?.id) {
      setModalTab('main');
      axios.get(`${API_URL}/personnel/${editing.id}/documents`).then((res) => setDocuments(res.data)).catch(() => setDocuments([]));
      axios.get(`${API_URL}/personnel/${editing.id}/history`).then((res) => setHistory(res.data)).catch(() => setHistory([]));
    } else {
      setDocuments([]);
      setHistory([]);
    }
  }, [showModal, editing?.id]);

  useEffect(() => {
    if (viewing?.id) {
      setViewTab('main');
      axios.get(`${API_URL}/personnel/${viewing.id}/documents`).then((res) => setViewDocuments(res.data)).catch(() => setViewDocuments([]));
      axios.get(`${API_URL}/personnel/${viewing.id}/history`).then((res) => setViewHistory(res.data)).catch(() => setViewHistory([]));
    } else {
      setViewDocuments([]);
      setViewHistory([]);
    }
  }, [viewing?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    try {
      const payload = {
        ...formData,
        department_id: formData.department_id || null,
        dismissal_date: formData.dismissal_date || null,
        birth_date: formData.birth_date || null,
      };
      if (editing) {
        await axios.put(`${API_URL}/personnel/${editing.id}`, payload);
      } else {
        await axios.post(`${API_URL}/personnel/`, payload);
      }
      setFormSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setEditing(null);
        resetForm();
        setFormSuccess(false);
        fetchPersonnel();
      }, 400);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.detail
        ? (typeof err.response.data.detail === 'string' ? err.response.data.detail : 'Ошибка сохранения')
        : 'Ошибка сохранения';
      setFormError(msg);
    }
  };

  const resetForm = () => {
    setFormData({
      tab_number: '',
      full_name: '',
      position: '',
      department_id: '',
      hire_date: '',
      dismissal_date: '',
      birth_date: '',
      phone: '',
      email: '',
      inn: '',
      status: 'employed',
      is_active: true,
      notes: '',
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await axios.delete(`${API_URL}/personnel/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchPersonnel();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const filteredPersonnel = personnel.filter((p) => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!p.full_name?.toLowerCase().includes(s) && !p.position?.toLowerCase().includes(s) && !p.tab_number?.toLowerCase().includes(s))
        return false;
    }
    return true;
  });

  const paginated = filteredPersonnel.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredPersonnel.length / pageSize);

  if (loading && personnel.length === 0) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Кадры</span></div>
          <div className="h1">Учёт кадров</div>
          <p className="h2">Справочник сотрудников, привязка к подразделениям и проектам.</p>
        </div>
        <div className="actions">
          <a
            className="btn primary"
            href="#personnel"
            onClick={(e) => {
              e.preventDefault();
              setEditing(null);
              resetForm();
              setFormError(null);
              setFormSuccess(false);
              setFormData((f) => ({ ...f, hire_date: new Date().toISOString().slice(0, 10) }));
              setShowModal(true);
            }}
          >
            + Добавить сотрудника
          </a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр сотрудников</div>
              <div className="desc">Учёт персонала, должности, подразделения</div>
            </div>
            <span className="chip info">Кадры</span>
          </div>
          <div className="cardBody">
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Поиск по ФИО, должности, табельному..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{ maxWidth: '280px' }}
              />
              <select
                value={filters.department_id}
                onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
              >
                <option value="">Все подразделения</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Все статусы</option>
                <option value="employed">В штате</option>
                <option value="dismissed">Уволен</option>
                <option value="vacation">Отпуск</option>
                <option value="maternity">Декретный</option>
                <option value="sick_leave">Больничный</option>
              </select>
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Таб. №</th>
                  <th>ФИО</th>
                  <th style={{ width: '18%' }}>Должность</th>
                  <th style={{ width: '14%' }}>Подразделение</th>
                  <th style={{ width: '10%' }}>Приём</th>
                  <th style={{ width: '10%' }}>Статус</th>
                  <th className="tRight" style={{ width: '10%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Сотрудники не найдены</td>
                  </tr>
                ) : (
                  paginated.map((p) => (
                    <tr key={p.id}>
                      <td>{p.tab_number || '—'}</td>
                      <td>{p.full_name}</td>
                      <td>{p.position}</td>
                      <td>{p.department?.name || '—'}</td>
                      <td>{p.hire_date ? new Date(p.hire_date).toLocaleDateString('ru-RU') : '—'}</td>
                      <td><span className={`chip ${p.status === 'employed' ? 'ok' : 'danger'}`}>{STATUS_LABELS[p.status] || p.status}</span></td>
                      <td className="tRight">
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => setViewing(p)}
                          style={{ marginRight: '4px' }}
                        >
                          Просмотр
                        </button>
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => {
                            setFormError(null);
                            setEditing(p);
                            setFormData({
                              tab_number: p.tab_number || '',
                              full_name: p.full_name,
                              position: p.position,
                              department_id: p.department_id || '',
                              hire_date: p.hire_date?.slice(0, 10) || '',
                              dismissal_date: p.dismissal_date?.slice(0, 10) || '',
                              birth_date: p.birth_date?.slice(0, 10) || '',
                              phone: p.phone || '',
                              email: p.email || '',
                              inn: '',
                              status: p.status,
                              is_active: p.is_active,
                              notes: '',
                            });
                            setShowModal(true);
                          }}
                          style={{ marginRight: '4px' }}
                        >
                          Редактировать
                        </button>
                        <button
                          type="button"
                          className="btn small danger"
                          onClick={() => setDeleteConfirm(p)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="tableFooter">
                <div className="pager">
                  <button className="btn small" onClick={() => setCurrentPage((x) => Math.max(1, x - 1))} disabled={currentPage === 1}>‹</button>
                  <span>Стр. {currentPage} из {totalPages}</span>
                  <button className="btn small" onClick={() => setCurrentPage((x) => Math.min(totalPages, x + 1))} disabled={currentPage === totalPages}>›</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditing(null); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div className="cardHead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div className="title">{editing ? 'Редактирование' : 'Добавление'} сотрудника</div>
                <button type="button" className="modal-close" onClick={() => { setShowModal(false); setEditing(null); }} aria-label="Закрыть">×</button>
              </div>
              {editing && (
              <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
                <button
                  type="button"
                  onClick={() => setModalTab('main')}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: modalTab === 'main' ? '2px solid var(--primary)' : '2px solid transparent',
                    background: 'none',
                    cursor: 'pointer',
                    color: modalTab === 'main' ? 'var(--primary)' : 'var(--textSecondary)',
                    fontWeight: modalTab === 'main' ? 600 : 400,
                  }}
                >
                  Основные данные
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('documents')}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: modalTab === 'documents' ? '2px solid var(--primary)' : '2px solid transparent',
                    background: 'none',
                    cursor: 'pointer',
                    color: modalTab === 'documents' ? 'var(--primary)' : 'var(--textSecondary)',
                    fontWeight: modalTab === 'documents' ? 600 : 400,
                  }}
                >
                  Документы
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('history')}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: modalTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent',
                    background: 'none',
                    cursor: 'pointer',
                    color: modalTab === 'history' ? 'var(--primary)' : 'var(--textSecondary)',
                    fontWeight: modalTab === 'history' ? 600 : 400,
                  }}
                >
                  История
                </button>
              </div>
            )}
            <div className="cardBody" style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
              {modalTab === 'main' && (
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <label>Табельный номер</label>
                    <input type="text" value={formData.tab_number} onChange={(e) => setFormData({ ...formData, tab_number: e.target.value })} />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>ФИО *</label>
                    <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                  </div>
                  <div style={{ height: '10px' }} />
                <div className="field">
                  <label>Должность *</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                  >
                    <option value="">— Выберите —</option>
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Подразделение</label>
                    <select value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value ? Number(e.target.value) : '' })}>
                      <option value="">—</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ height: '10px' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div className="field">
                      <label>Дата приёма *</label>
                      <input type="date" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} required />
                    </div>
                    <div className="field">
                      <label>Дата увольнения</label>
                      <input type="date" value={formData.dismissal_date} onChange={(e) => setFormData({ ...formData, dismissal_date: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Дата рождения</label>
                    <input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div className="field">
                      <label>Телефон</label>
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+7 (___) ___-__-__" />
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>ИНН</label>
                    <input type="text" value={formData.inn} onChange={(e) => setFormData({ ...formData, inn: e.target.value })} placeholder="10 или 12 цифр" maxLength={12} />
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Статус</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option value="employed">В штате</option>
                      <option value="dismissed">Уволен</option>
                      <option value="vacation">Отпуск</option>
                      <option value="maternity">Декретный</option>
                      <option value="sick_leave">Больничный</option>
                    </select>
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>
                      <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} /> Активен
                    </label>
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="field">
                    <label>Примечания</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} style={{ width: '100%', resize: 'vertical', padding: '8px' }} placeholder="Дополнительная информация" />
                  </div>
                  {formError && (
                    <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(255, 107, 107, 0.15)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontSize: '14px' }}>
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid var(--ok)', borderRadius: '8px', color: 'var(--ok)', fontSize: '14px' }}>
                      {editing ? 'Изменения сохранены.' : 'Сотрудник добавлен.'}
                    </div>
                  )}
                  <div style={{ height: '16px' }} />
                  <div className="actions">
                    <button type="submit" className="btn primary">Сохранить</button>
                    <button type="button" className="btn" onClick={() => { setShowModal(false); setEditing(null); setFormError(null); }}>Отмена</button>
                  </div>
                </form>
              )}
              {modalTab === 'documents' && editing && (
                <div>
                  <div className="field" style={{ marginBottom: '16px' }}>
                    <label>Добавить документ</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end' }}>
                      <select
                        id="doc-type"
                        style={{ minWidth: '180px' }}
                      >
                        {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <input
                        type="file"
                        id="doc-file"
                        style={{ maxWidth: '240px' }}
                      />
                      <button
                        type="button"
                        className="btn primary small"
                        disabled={uploadingDoc}
                        onClick={async () => {
                          const typeSelect = document.getElementById('doc-type') as HTMLSelectElement;
                          const fileInput = document.getElementById('doc-file') as HTMLInputElement;
                          const file = fileInput?.files?.[0];
                          if (!file || !editing?.id) return;
                          setUploadingDoc(true);
                          const form = new FormData();
                          form.append('document_type', typeSelect?.value || 'other');
                          form.append('file', file);
                          try {
                            await axios.post(`${API_URL}/personnel/${editing.id}/documents`, form, {
                              headers: { 'Content-Type': 'multipart/form-data' },
                            });
                            const res = await axios.get(`${API_URL}/personnel/${editing.id}/documents`);
                            setDocuments(res.data);
                            fileInput.value = '';
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setUploadingDoc(false);
                          }
                        }}
                      >
                        {uploadingDoc ? 'Загрузка...' : 'Загрузить'}
                      </button>
                    </div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Тип</th>
                        <th>Файл</th>
                        <th>Дата</th>
                        <th className="tRight">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>Нет загруженных документов</td>
                        </tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc.id}>
                            <td>{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</td>
                            <td>
                              <a href={`${API_URL}/personnel/${editing!.id}/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
                                {doc.file_name}
                              </a>
                            </td>
                            <td>{new Date(doc.uploaded_at).toLocaleString('ru-RU')}</td>
                            <td className="tRight">
                              <button
                                type="button"
                                className="btn small danger"
                                onClick={async () => {
                                  if (!editing?.id) return;
                                  if (!window.confirm('Удалить документ?')) return;
                                  await axios.delete(`${API_URL}/personnel/${editing.id}/documents/${doc.id}`);
                                  const res = await axios.get(`${API_URL}/personnel/${editing.id}/documents`);
                                  setDocuments(res.data);
                                }}
                              >
                                Удалить
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '16px' }}>
                    <button type="button" className="btn" onClick={() => setModalTab('main')}>Назад к данным</button>
                  </div>
                </div>
              )}
              {modalTab === 'history' && editing && (
                <div>
                  <div className="desc" style={{ marginBottom: '12px' }}>История изменений и добавления информации по сотруднику</div>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '140px' }}>Дата и время</th>
                        <th style={{ width: '100px' }}>Действие</th>
                        <th>Описание</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', padding: '24px' }}>Записей пока нет</td>
                        </tr>
                      ) : (
                        history.map((h) => (
                          <tr key={h.id}>
                            <td>{new Date(h.changed_at).toLocaleString('ru-RU')}</td>
                            <td>{h.action === 'created' ? 'Создание' : 'Изменение'}</td>
                            <td>{h.description || (h.field_name ? `${h.field_name}: ${h.old_value} → ${h.new_value}` : '—')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '16px' }}>
                    <button type="button" className="btn" onClick={() => setModalTab('main')}>Назад к данным</button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {viewing && (
          <div className="modal-overlay" onClick={() => setViewing(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div className="cardHead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div className="title">Просмотр сотрудника</div>
                <button type="button" className="modal-close" onClick={() => setViewing(null)} aria-label="Закрыть">×</button>
              </div>
            <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
              <button
                type="button"
                onClick={() => setViewTab('main')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: viewTab === 'main' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  color: viewTab === 'main' ? 'var(--primary)' : 'var(--textSecondary)',
                  fontWeight: viewTab === 'main' ? 600 : 400,
                }}
              >
                Основные данные
              </button>
              <button
                type="button"
                onClick={() => setViewTab('documents')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: viewTab === 'documents' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  color: viewTab === 'documents' ? 'var(--primary)' : 'var(--textSecondary)',
                  fontWeight: viewTab === 'documents' ? 600 : 400,
                }}
              >
                Документы
              </button>
              <button
                type="button"
                onClick={() => setViewTab('history')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: viewTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  color: viewTab === 'history' ? 'var(--primary)' : 'var(--textSecondary)',
                  fontWeight: viewTab === 'history' ? 600 : 400,
                }}
              >
                История
              </button>
            </div>
            <div className="cardBody" style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
              {viewTab === 'main' && (
                <div>
                  <div className="field">
                    <label>Табельный номер</label>
                    <div style={{ padding: '8px 0', color: 'var(--text)' }}>{viewing.tab_number || '—'}</div>
                  </div>
                  <div className="field">
                    <label>ФИО</label>
                    <div style={{ padding: '8px 0', color: 'var(--text)' }}>{viewing.full_name}</div>
                  </div>
                  <div className="field">
                    <label>Должность</label>
                    <div style={{ padding: '8px 0', color: 'var(--text)' }}>{viewing.position || '—'}</div>
                  </div>
                  <div className="field">
                    <label>Подразделение</label>
                    <div style={{ padding: '8px 0', color: 'var(--text)' }}>{viewing.department?.name || '—'}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div className="field">
                      <label>Дата приёма</label>
                      <div style={{ padding: '8px 0', color: 'var(--text)' }}>{viewing.hire_date ? new Date(viewing.hire_date).toLocaleDateString('ru-RU') : '—'}</div>
                    </div>
                    <div className="field">
                      <label>Дата увольнения</label>
                      <div style={{ padding: '8px 0', color: 'var(--text)' }}>{viewing.dismissal_date ? new Date(viewing.dismissal_date).toLocaleDateString('ru-RU') : '—'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div className="field">
                      <label>Телефон</label>
                      <div style={{ padding: '8px 0', color: 'var(--text)' }}>{viewing.phone || '—'}</div>
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <div style={{ padding: '8px 0', color: 'var(--text)' }}>{viewing.email || '—'}</div>
                    </div>
                  </div>
                  <div className="field">
                    <label>Статус</label>
                    <div style={{ padding: '8px 0' }}><span className={`chip ${viewing.status === 'employed' ? 'ok' : 'danger'}`}>{STATUS_LABELS[viewing.status] || viewing.status}</span></div>
                  </div>
                  <div className="field">
                    <label>Активен</label>
                    <div style={{ padding: '8px 0', color: 'var(--text)' }}>{viewing.is_active ? 'Да' : 'Нет'}</div>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn primary" onClick={() => { setViewing(null); setEditing(viewing); setFormData({ tab_number: viewing.tab_number || '', full_name: viewing.full_name, position: viewing.position, department_id: viewing.department_id || '', hire_date: viewing.hire_date?.slice(0, 10) || '', dismissal_date: viewing.dismissal_date?.slice(0, 10) || '', birth_date: viewing.birth_date?.slice(0, 10) || '', phone: viewing.phone || '', email: viewing.email || '', inn: '', status: viewing.status, is_active: viewing.is_active, notes: '' }); setShowModal(true); }}>Редактировать</button>
                    <button type="button" className="btn" onClick={() => setViewing(null)}>Закрыть</button>
                  </div>
                </div>
              )}
              {viewTab === 'documents' && (
                <div>
                  <div className="desc" style={{ marginBottom: '12px' }}>Резюме, автобиография и другие документы. Загрузка — в режиме редактирования.</div>
                  <table>
                    <thead>
                      <tr>
                        <th>Тип</th>
                        <th>Файл</th>
                        <th>Дата</th>
                        <th className="tRight">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewDocuments.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>Нет загруженных документов</td>
                        </tr>
                      ) : (
                        viewDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td>{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</td>
                            <td>
                              <a href={`${API_URL}/personnel/${viewing.id}/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
                                {doc.file_name}
                              </a>
                            </td>
                            <td>{new Date(doc.uploaded_at).toLocaleString('ru-RU')}</td>
                            <td className="tRight">—</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '16px' }}>
                    <button type="button" className="btn primary" onClick={() => { setViewing(null); setEditing(viewing); setFormData({ tab_number: viewing.tab_number || '', full_name: viewing.full_name, position: viewing.position, department_id: viewing.department_id || '', hire_date: viewing.hire_date?.slice(0, 10) || '', dismissal_date: viewing.dismissal_date?.slice(0, 10) || '', birth_date: viewing.birth_date?.slice(0, 10) || '', phone: viewing.phone || '', email: viewing.email || '', inn: '', status: viewing.status, is_active: viewing.is_active, notes: '' }); setShowModal(true); setModalTab('documents'); }}>Редактировать (добавить документы)</button>
                    <button type="button" className="btn" onClick={() => setViewing(null)}>Закрыть</button>
                  </div>
                </div>
              )}
              {viewTab === 'history' && (
                <div>
                  <div className="desc" style={{ marginBottom: '12px' }}>История изменений и добавления информации по сотруднику</div>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '140px' }}>Дата и время</th>
                        <th style={{ width: '100px' }}>Действие</th>
                        <th>Описание</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewHistory.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', padding: '24px' }}>Записей пока нет</td>
                        </tr>
                      ) : (
                        viewHistory.map((h) => (
                          <tr key={h.id}>
                            <td>{new Date(h.changed_at).toLocaleString('ru-RU')}</td>
                            <td>{h.action === 'created' ? 'Создание' : 'Изменение'}</td>
                            <td>{h.description || (h.field_name ? `${h.field_name}: ${h.old_value} → ${h.new_value}` : '—')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '16px' }}>
                    <button type="button" className="btn primary" onClick={() => { setViewing(null); setEditing(viewing); setFormData({ tab_number: viewing.tab_number || '', full_name: viewing.full_name, position: viewing.position, department_id: viewing.department_id || '', hire_date: viewing.hire_date?.slice(0, 10) || '', dismissal_date: viewing.dismissal_date?.slice(0, 10) || '', birth_date: viewing.birth_date?.slice(0, 10) || '', phone: viewing.phone || '', email: viewing.email || '', inn: '', status: viewing.status, is_active: viewing.is_active, notes: '' }); setShowModal(true); }}>Редактировать</button>
                    <button type="button" className="btn" onClick={() => setViewing(null)}>Закрыть</button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Удаление сотрудника</h3>
                <button type="button" className="modal-close" onClick={() => setDeleteConfirm(null)} aria-label="Закрыть">×</button>
              </div>
              <div style={{ padding: '20px' }}>
                <p style={{ margin: 0 }}>Удалить сотрудника <strong>{deleteConfirm.full_name}</strong> (таб. № {deleteConfirm.tab_number || '—'})?</p>
                <p className="mini" style={{ marginTop: '8px', color: 'var(--muted2)' }}>Действие нельзя отменить.</p>
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--line)' }}>
                <button type="button" className="btn" onClick={() => setDeleteConfirm(null)}>Отмена</button>
                <button type="button" className="btn danger" onClick={handleDeleteConfirm}>Удалить</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Personnel;
