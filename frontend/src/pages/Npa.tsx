import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import './Pages.css';

interface RoadmapSection {
  id: number;
  code: string;
  name: string;
}

interface NpaItem {
  id: number;
  title: string;
  description?: string | null;
  number?: string | null;
  date?: string | null;
  file_name?: string | null;
  section_codes: string[];
}

/** Маппинг кодов блоков дорожной карты на русские названия (fallback, если API не вернул секции) */
const SECTION_CODE_TO_RU: Record<string, string> = {
  sketch: 'Эскизный проект',
  'sketch.itc': 'Инженерно-технические условия',
  'sketch.itc.heat': 'Теплоснабжение',
  'sketch.itc.power': 'Электроснабжение',
  'sketch.itc.water': 'Водопровод и канализация',
  'sketch.itc.gas': 'Газоснабжение',
  'sketch.itc.phone': 'Телефонизация',
  'sketch.geo': 'Инженерные геологические изыскания',
  'sketch.urban': 'Градостроительное заключение',
  working: 'Рабочий проект',
  'working.genplan': 'Стройгенплан',
  'working.ppr': 'ППР',
  'working.survey': 'Акт выноса в натуру',
  'working.gp_ar': 'ГП АР',
  'working.gp_ar.mchs': 'Согласование с МЧС',
  'working.gp_ar.sanepid': 'Согласование с Санэпид',
  'working.gp_ar.mpret': 'Согласование с МПРЭТН (экология)',
  'working.expertise.stage1': '1 этап Госэкспертизы',
  'working.expertise.stage2': '2 этап Госэкспертизы',
  'working.register': 'Включение в реестр строящихся объектов',
  'working.networks': 'Инженерные сети',
  'working.networks.external': 'Наружные сети',
  'working.networks.internal': 'Внутренние сети',
  'working.networks.external.heat': 'Теплоснабжение (наруж.)',
  'working.networks.external.power': 'Электроснабжение (наруж.)',
  'working.networks.external.water': 'Водопровод и канализация (наруж.)',
  'working.networks.external.gas': 'Газоснабжение (наруж.)',
  'working.networks.internal.hvac': 'Отопление и вентиляция',
  'working.networks.internal.electrical': 'Электромонтаж',
  'working.networks.internal.water': 'Водопровод и канализация (внутр.)',
  'working.networks.internal.gas': 'Газоснабжение (внутр.)',
  'working.networks.internal.fire': 'Пожаротушение и сигнализация',
};

const MOCK_NPA: NpaItem[] = [
  {
    id: 1,
    title: 'Градостроительный кодекс',
    description: 'Базовый НПА по вопросам градостроительной деятельности.',
    number: 'ГК-01',
    date: '2020-01-15',
    file_name: undefined,
    section_codes: ['sketch', 'sketch.itc', 'working.expertise.stage1'],
  },
  {
    id: 2,
    title: 'Технический регламент по безопасности зданий и сооружений',
    description: 'Требования к безопасности объектов капитального строительства.',
    number: 'ТР-02',
    date: '2021-05-10',
    file_name: undefined,
    section_codes: ['working', 'working.networks', 'working.register'],
  },
  {
    id: 3,
    title: 'Правила подключения к инженерным сетям',
    description: 'Регламент подключения к теплоснабжению, водоснабжению и электросетям.',
    number: 'ПР-03',
    date: '2019-11-01',
    file_name: undefined,
    section_codes: ['sketch.itc.heat', 'sketch.itc.power', 'sketch.itc.water'],
  },
];

const Npa: React.FC = () => {
  const [items, setItems] = useState<NpaItem[]>([]);
  const [sections, setSections] = useState<RoadmapSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formSections, setFormSections] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    section_code: '',
    has_file: '',
    search: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [npaRes, sectionsRes] = await Promise.all([
        axios.get<NpaItem[]>(`${API_URL}/document-roadmap/npa/`),
        axios.get<RoadmapSection[]>(`${API_URL}/document-roadmap/sections/`),
      ]);
      const npaData = Array.isArray(npaRes.data) ? npaRes.data : [];
      setItems(npaData.length > 0 ? npaData : MOCK_NPA);
      setSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
    } catch (e) {
      console.error('Ошибка загрузки НПА:', e);
      setItems(MOCK_NPA);
      setError('Не удалось загрузить данные НПА, показаны примерные записи.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormNumber('');
    setFormDate('');
    setFormFile(null);
    setFormSections([]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError('Укажите название НПА.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await axios.put(`${API_URL}/document-roadmap/npa/${editingId}`, {
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          number: formNumber.trim() || null,
          date: formDate || null,
          section_codes: formSections,
        });
      } else {
        const fd = new FormData();
        fd.append('title', formTitle.trim());
        if (formDescription.trim()) fd.append('description', formDescription.trim());
        if (formNumber.trim()) fd.append('number', formNumber.trim());
        if (formDate) fd.append('date', formDate);
        fd.append('section_codes', JSON.stringify(formSections));
        if (formFile) fd.append('file', formFile);

        await axios.post(`${API_URL}/document-roadmap/npa/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowModal(false);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      console.error('Ошибка сохранения НПА:', err);
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(
          Array.isArray(err.response.data.detail)
            ? err.response.data.detail.map((x: { msg?: string }) => x.msg).join(' ')
            : String(err.response.data.detail),
        );
      } else {
        setError('Не удалось сохранить НПА.');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (code: string) => {
    setFormSections((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const sectionNameByCode = (code: string) =>
    sections.find((s) => s.code === code)?.name || SECTION_CODE_TO_RU[code] || code;

  /** Секции для выбора в форме: из API или fallback из маппинга */
  const formSectionsList =
    sections.length > 0
      ? sections
      : Object.entries(SECTION_CODE_TO_RU).map(([code, name], i) => ({
          id: -1 - i,
          code,
          name,
        }));

  const handleEdit = (npa: NpaItem) => {
    setEditingId(npa.id);
    setFormTitle(npa.title);
    setFormDescription(npa.description || '');
    setFormNumber(npa.number || '');
    setFormDate(npa.date ? npa.date.slice(0, 10) : '');
    setFormFile(null);
    setFormSections(npa.section_codes || []);
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить НПА?')) return;
    try {
      await axios.delete(`${API_URL}/document-roadmap/npa/${id}`);
      await loadData();
    } catch (e) {
      console.error('Ошибка удаления НПА:', e);
      setError('Не удалось удалить НПА.');
    }
  };

  const filteredItems = items.filter((npa) => {
    if (filters.section_code && !npa.section_codes.includes(filters.section_code)) return false;
    if (filters.has_file === 'with' && !npa.file_name) return false;
    if (filters.has_file === 'without' && npa.file_name) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (
        !npa.title.toLowerCase().includes(s) &&
        !(npa.number || '').toLowerCase().includes(s)
      ) {
        return false;
      }
    }
    return true;
  });

  if (loading && items.length === 0) {
    return <div className="loading">Загрузка НПА...</div>;
  }

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs">
            <a href="#dashboard">Главная</a> <span className="sep">/</span>{' '}
            <span>НПА</span>
          </div>
          <div className="h1">Нормативно‑правовые акты</div>
          <p className="h2">
            Справочник НПА с привязкой к блокам дорожной карты.
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Добавить НПА
          </button>
        </div>
      </div>

      {error && (
        <div className="pageError">
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      <div className="toolbar" style={{ marginBottom: 12 }}>
        <div className="filters">
          <div className="field">
            <label>Блок дорожной карты</label>
            <select
              value={filters.section_code}
              onChange={(e) => setFilters({ ...filters, section_code: e.target.value })}
            >
              <option value="">Все</option>
              {formSectionsList.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Наличие файла</label>
            <select
              value={filters.has_file}
              onChange={(e) => setFilters({ ...filters, has_file: e.target.value })}
            >
              <option value="">Все</option>
              <option value="with">Только с файлом</option>
              <option value="without">Только без файла</option>
            </select>
          </div>
          <div className="field">
            <label>Название / номер</label>
            <input
              type="text"
              placeholder="Например: Градостроительный, ГК‑01"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Номер и дата</th>
              <th>Блоки дорожной карты</th>
              <th>Файл</th>
              <th style={{ width: 140 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>
                  НПА пока не добавлены.
                </td>
              </tr>
            ) : (
              filteredItems.map((npa) => (
                <tr key={npa.id}>
                  <td>
                    <div className="project-name">{npa.title}</div>
                    {npa.description && (
                      <div style={{ fontSize: 12, color: 'var(--muted2)' }}>
                        {npa.description}
                      </div>
                    )}
                  </td>
                  <td>
                    {npa.number && <div>№ {npa.number}</div>}
                    {npa.date && (
                      <div style={{ fontSize: 12, color: 'var(--muted2)' }}>
                        от {new Date(npa.date).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                  </td>
                  <td>
                    {npa.section_codes.length === 0 ? (
                      <span className="muted">Не привязан</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {npa.section_codes.map((code) => (
                          <span key={code} className="chip mini">
                            {sectionNameByCode(code)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    {npa.file_name ? (
                      <a
                        href={`${API_URL}/document-roadmap/npa/${npa.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={npa.file_name}
                      >
                        📄 {npa.file_name}
                      </a>
                    ) : (
                      <span className="muted">Нет файла</span>
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => handleEdit(npa)}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="btn small secondary"
                        onClick={() => handleDelete(npa.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!saving) setShowModal(false);
          }}
        >
          <div
            className="modal-content"
            style={{ maxWidth: 640 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingId ? 'Редактировать НПА' : 'Добавить НПА'}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => !saving && setShowModal(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert error" style={{ marginBottom: 12 }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Название *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Описание</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="fieldRow">
                  <div className="field">
                    <label>Номер</label>
                    <input
                      type="text"
                      value={formNumber}
                      onChange={(e) => setFormNumber(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Дата</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Файл (PDF)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormFile(file);
                    }}
                  />
                </div>
                <div className="field">
                  <label>Блоки дорожной карты</label>
                  <div
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: 6,
                      padding: 8,
                      maxHeight: 200,
                      overflowY: 'auto',
                    }}
                  >
                    {formSectionsList.length === 0 ? (
                      <div className="muted">Секции дорожной карты не найдены.</div>
                    ) : (
                      formSectionsList.map((s) => (
                        <label
                          key={s.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 4,
                            fontSize: 13,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formSections.includes(s.code)}
                            onChange={() => toggleSection(s.code)}
                          />
                          <span>
                            {s.name}
                            <span style={{ color: 'var(--muted2)', fontSize: 11, marginLeft: 4 }}>
                              ({s.code})
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div
                  className="modal-footer"
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 8,
                    marginTop: 16,
                  }}
                >
                  <button
                    type="button"
                    className="btn"
                    onClick={() => !saving && setShowModal(false)}
                  >
                    Отмена
                  </button>
                  <button type="submit" className="btn primary" disabled={saving}>
                    {saving ? 'Сохранение…' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Npa;

