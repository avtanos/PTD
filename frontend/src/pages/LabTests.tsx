import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import './Pages.css';

interface Project {
  id: number;
  name: string;
  code?: string | null;
}

interface LabTestItem {
  id: number;
  project_id: number;
  test_type: string;
  sample_description?: string | null;
  lab_name?: string | null;
  protocol_number?: string | null;
  protocol_date?: string | null;
  sample_date?: string | null;
  test_date?: string | null;
  result: 'pending' | 'pass' | 'fail' | string;
  description?: string | null;
  notes?: string | null;
  file_name?: string | null;
}

const RESULT_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  pass: 'Соответствует',
  fail: 'Не соответствует',
};

const RESULT_CHIP: Record<string, string> = {
  pending: 'info',
  pass: 'ok',
  fail: 'danger',
};

const MOCK_TESTS: LabTestItem[] = [
  {
    id: 1,
    project_id: 1,
    test_type: 'Испытание бетона на прочность',
    sample_description: 'Кубики 150×150×150, партия Б-12',
    lab_name: 'ООО «СтройЛаб»',
    protocol_number: 'ЛИ-001/2024',
    protocol_date: '2024-03-18',
    sample_date: '2024-03-15',
    test_date: '2024-03-18',
    result: 'pass',
    description: 'Класс бетона подтверждён. Средняя прочность 28.4 МПа.',
    file_name: null,
  },
  {
    id: 2,
    project_id: 1,
    test_type: 'Испытание грунта (плотность)',
    sample_description: 'Участок А‑3, песок средний',
    lab_name: 'Гослаборатория',
    protocol_number: 'ЛИ-002/2024',
    protocol_date: '2024-03-22',
    result: 'pending',
    description: 'Ожидается протокол.',
    file_name: null,
  },
  {
    id: 3,
    project_id: 2,
    test_type: 'Контроль сварных соединений (УЗК)',
    sample_description: 'Ферма Ф‑2, швы №12‑18',
    lab_name: 'ООО «Неразрушающий контроль»',
    protocol_number: 'УЗК-77',
    protocol_date: '2024-02-11',
    result: 'fail',
    description: 'Обнаружены дефекты. Требуется устранение и повторный контроль.',
    file_name: null,
  },
];

const LabTests: React.FC = () => {
  const [items, setItems] = useState<LabTestItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    project_id: '',
    result: '',
    date_from: '',
    date_to: '',
    search: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LabTestItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    project_id: '' as number | '',
    test_type: '',
    sample_description: '',
    lab_name: '',
    protocol_number: '',
    protocol_date: '',
    sample_date: '',
    test_date: '',
    result: 'pending',
    description: '',
    notes: '',
  });

  const [formFile, setFormFile] = useState<File | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [testsRes, projRes] = await Promise.all([
        axios.get<LabTestItem[]>(`${API_URL}/lab-tests/`).catch(() => ({ data: [] as LabTestItem[] })),
        axios.get(`${API_URL}/projects/`).catch(() => ({ data: [] })),
      ]);

      const tests = Array.isArray(testsRes.data) ? testsRes.data : [];
      setItems(tests.length > 0 ? tests : MOCK_TESTS);

      let projList: Project[] = [];
      if (projRes.data?.data && Array.isArray(projRes.data.data)) projList = projRes.data.data;
      else if (Array.isArray(projRes.data)) projList = projRes.data;
      setProjects(projList.filter((p: any) => p && p.id != null));
    } catch (e) {
      console.error('Ошибка загрузки лабораторных испытаний:', e);
      setItems(MOCK_TESTS);
      setError('Не удалось загрузить данные, показаны примерные записи.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const projectName = (id: number) => projects.find((p) => p.id === id)?.name || `Проект #${id}`;

  const filtered = items.filter((t) => {
    if (filters.project_id && String(t.project_id) !== filters.project_id) return false;
    if (filters.result && t.result !== filters.result) return false;
    if (filters.date_from) {
      const from = new Date(filters.date_from);
      const d = t.protocol_date ? new Date(t.protocol_date) : null;
      if (d && d < from) return false;
    }
    if (filters.date_to) {
      const to = new Date(filters.date_to);
      const d = t.protocol_date ? new Date(t.protocol_date) : null;
      if (d && d > to) return false;
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!(t.protocol_number || '').toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const resetForm = () => {
    setEditing(null);
    setFormFile(null);
    setFormData({
      project_id: '',
      test_type: '',
      sample_description: '',
      lab_name: '',
      protocol_number: '',
      protocol_date: '',
      sample_date: '',
      test_date: '',
      result: 'pending',
      description: '',
      notes: '',
    });
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (t: LabTestItem) => {
    setEditing(t);
    setFormFile(null);
    setFormData({
      project_id: t.project_id,
      test_type: t.test_type || '',
      sample_description: t.sample_description || '',
      lab_name: t.lab_name || '',
      protocol_number: t.protocol_number || '',
      protocol_date: t.protocol_date ? t.protocol_date.slice(0, 10) : '',
      sample_date: t.sample_date ? t.sample_date.slice(0, 10) : '',
      test_date: t.test_date ? t.test_date.slice(0, 10) : '',
      result: t.result || 'pending',
      description: t.description || '',
      notes: t.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.test_type.trim()) {
      setError('Заполните проект и вид испытания.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        project_id: Number(formData.project_id),
        sample_description: formData.sample_description.trim() || null,
        lab_name: formData.lab_name.trim() || null,
        protocol_number: formData.protocol_number.trim() || null,
        protocol_date: formData.protocol_date || null,
        sample_date: formData.sample_date || null,
        test_date: formData.test_date || null,
        description: formData.description.trim() || null,
        notes: formData.notes.trim() || null,
      };

      let id = editing?.id;
      if (editing) {
        await axios.put(`${API_URL}/lab-tests/${editing.id}`, payload);
      } else {
        const res = await axios.post(`${API_URL}/lab-tests/`, payload);
        id = res.data?.id;
      }

      if (id && formFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('file', formFile);
        await axios.post(`${API_URL}/lab-tests/${id}/file`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setShowModal(false);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      console.error('Ошибка сохранения:', err);
      setError('Не удалось сохранить испытание.');
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить запись лабораторного испытания?')) return;
    try {
      await axios.delete(`${API_URL}/lab-tests/${id}`);
      await loadData();
    } catch (e) {
      console.error('Ошибка удаления:', e);
      setError('Не удалось удалить запись.');
    }
  };

  if (loading && items.length === 0) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Лабораторные испытания</span></div>
          <div className="h1">Лабораторные испытания</div>
          <p className="h2">Протоколы испытаний материалов и работ по проектам.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn primary" onClick={openCreate}>+ Добавить</button>
        </div>
      </div>

      {error && (
        <div className="pageError">
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      <div className="toolbar">
        <div className="filters">
          <div className="field">
            <label>Проект</label>
            <select value={filters.project_id} onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}>
              <option value="">Все</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Результат</label>
            <select value={filters.result} onChange={(e) => setFilters({ ...filters, result: e.target.value })}>
              <option value="">Все</option>
              <option value="pending">Ожидает</option>
              <option value="pass">Соответствует</option>
              <option value="fail">Не соответствует</option>
            </select>
          </div>
          <div className="field">
            <label>Период (дата протокола)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
              <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Номер протокола</label>
            <input type="text" value={filters.search} placeholder="Например: ЛИ-001/2024" onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
        </div>
        <div className="actions">
          <button type="button" className="btn small" onClick={() => setFilters({ project_id: '', result: '', date_from: '', date_to: '', search: '' })}>Сбросить</button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Проект</th>
              <th>Вид испытания</th>
              <th>Протокол</th>
              <th>Дата</th>
              <th>Результат</th>
              <th>Файл</th>
              <th style={{ width: 160 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>Записей не найдено</td></tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id}>
                  <td>{projectName(t.project_id)}</td>
                  <td>
                    <div className="project-name">{t.test_type}</div>
                    {t.sample_description && <div style={{ fontSize: 12, color: 'var(--muted2)' }}>{t.sample_description}</div>}
                  </td>
                  <td>{t.protocol_number || '—'}</td>
                  <td>{t.protocol_date ? new Date(t.protocol_date).toLocaleDateString('ru-RU') : '—'}</td>
                  <td><span className={`chip ${RESULT_CHIP[t.result] || 'info'}`}>{RESULT_LABELS[t.result] || t.result}</span></td>
                  <td>
                    {t.file_name ? (
                      <a href={`${API_URL}/lab-tests/${t.id}/file/download`} target="_blank" rel="noopener noreferrer">📄 {t.file_name}</a>
                    ) : (
                      <span className="muted">Нет файла</span>
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button type="button" className="btn small" onClick={() => openEdit(t)}>Редактировать</button>
                      <button type="button" className="btn small secondary" onClick={() => handleDelete(t.id)}>Удалить</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal-content modal-large" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Редактировать' : 'Добавить'} лабораторное испытание</h2>
              <button type="button" className="modal-close" onClick={() => !saving && setShowModal(false)} aria-label="Закрыть">×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="field">
                  <label>Проект *</label>
                  <select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? Number(e.target.value) : '' })} required>
                    <option value="">Выберите проект</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Вид испытания *</label>
                  <input value={formData.test_type} onChange={(e) => setFormData({ ...formData, test_type: e.target.value })} required />
                </div>
                <div className="fieldRow">
                  <div className="field">
                    <label>Номер протокола</label>
                    <input value={formData.protocol_number} onChange={(e) => setFormData({ ...formData, protocol_number: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Дата протокола</label>
                    <input type="date" value={formData.protocol_date} onChange={(e) => setFormData({ ...formData, protocol_date: e.target.value })} />
                  </div>
                </div>
                <div className="fieldRow">
                  <div className="field">
                    <label>Дата отбора</label>
                    <input type="date" value={formData.sample_date} onChange={(e) => setFormData({ ...formData, sample_date: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Дата испытания</label>
                    <input type="date" value={formData.test_date} onChange={(e) => setFormData({ ...formData, test_date: e.target.value })} />
                  </div>
                </div>
                <div className="fieldRow">
                  <div className="field">
                    <label>Лаборатория</label>
                    <input value={formData.lab_name} onChange={(e) => setFormData({ ...formData, lab_name: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Результат</label>
                    <select value={formData.result} onChange={(e) => setFormData({ ...formData, result: e.target.value })}>
                      <option value="pending">Ожидает</option>
                      <option value="pass">Соответствует</option>
                      <option value="fail">Не соответствует</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Описание образца/участка</label>
                  <input value={formData.sample_description} onChange={(e) => setFormData({ ...formData, sample_description: e.target.value })} />
                </div>
                <div className="field">
                  <label>Описание / показатели</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="field">
                  <label>Примечания</label>
                  <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
                <div className="field">
                  <label>Файл протокола (PDF/PNG/JPEG)</label>
                  <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e) => setFormFile(e.target.files?.[0] || null)} />
                  {uploading && <div className="muted" style={{ marginTop: 6 }}>Загрузка файла…</div>}
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                  <button type="button" className="btn" onClick={() => !saving && setShowModal(false)}>Отмена</button>
                  <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LabTests;

