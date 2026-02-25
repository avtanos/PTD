import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { normalizeToArray } from '../utils/normalizeData';
import './Pages.css';

/** Элемент списка файлов дорожной карты (API document-roadmap/all-files) */
interface RoadmapFileRow {
  id: number;
  file_name: string;
  file_size?: number;
  mime_type: string;
  uploaded_at: string;
  description?: string;
  status_id: number;
  project_id: number;
  project_name: string;
  section_code: string;
  section_name: string;
}

interface Project {
  id: number;
  name: string;
  code?: string;
}

/** Секция дорожной карты (API document-roadmap/sections/) */
interface RoadmapSection {
  id: number;
  code: string;
  name: string;
  parent_code?: string | null;
  order_number: number;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

const ProjectDocumentation: React.FC = () => {
  const [files, setFiles] = useState<RoadmapFileRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<RoadmapSection[]>([]);
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [filterSectionCode, setFilterSectionCode] = useState<string>('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects/`);
      let data: Project[] = [];
      if (res.data?.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      } else {
        data = normalizeToArray<Project>(res.data);
      }
      setProjects(data.filter((p: Project) => p && p.id != null));
    } catch {
      setProjects([]);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await axios.get(`${API_URL}/document-roadmap/sections/`);
      setSections(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSections([]);
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (filterProjectId) params.project_id = filterProjectId;
      if (filterSectionCode) params.section_code = filterSectionCode;
      const res = await axios.get(`${API_URL}/document-roadmap/all-files`, { params });
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error('Ошибка загрузки документов дорожной карты:', err);
      setError(err.response?.data?.detail || err.message || 'Ошибка загрузки данных');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchSections();
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [filterProjectId, filterSectionCode]);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          f.file_name.toLowerCase().includes(q) ||
          f.project_name.toLowerCase().includes(q) ||
          f.section_name.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [files, search]);

  const paginatedFiles = useMemo(() => {
    return filteredFiles.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredFiles, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredFiles.length / pageSize);

  const formatDate = (s: string) => {
    if (!s) return '—';
    try {
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return s;
    }
  };

  const viewUrl = (fileId: number) => `${API_URL}/document-roadmap/files/${fileId}/view`;
  const downloadUrl = (fileId: number) => `${API_URL}/document-roadmap/files/${fileId}/download`;

  if (loading && files.length === 0) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <>
      {error && (
        <div className="pageError">
          <strong>Ошибка:</strong> {error}
          <button type="button" className="btn small" onClick={() => { setError(null); fetchFiles(); }}>Повторить</button>
        </div>
      )}
      <div className="pageHead">
        <div>
          <div className="crumbs">
            <a href="#dashboard">Главная</a> <span className="sep">/</span>
            <span>Разрешительные документы</span>
          </div>
          <div className="h1">Разрешительные документы</div>
          <p className="h2">Документы, загруженные в блоки дорожной карты документов.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#roadmap">Дорожная карта документов</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="title">Реестр разрешительных документов</div>
              <div className="desc">Файлы из блоков дорожной карты • фильтр по проекту • скачивание</div>
            </div>
            <span className="chip info">Разрешительные документы</span>
          </div>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Проект</label>
                  <select value={filterProjectId} onChange={(e) => { setFilterProjectId(e.target.value); setCurrentPage(1); }}>
                    <option value="">Все проекты</option>
                    {projects.map((p) => (
                      <option key={p.id} value={String(p.id)}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Блок дорожной карты</label>
                  <select value={filterSectionCode} onChange={(e) => { setFilterSectionCode(e.target.value); setCurrentPage(1); }}>
                    <option value="">Все блоки</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Поиск</label>
                  <input
                    type="text"
                    placeholder="Название файла, проект, раздел..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                </div>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn small"
                  onClick={() => { setFilterProjectId(''); setFilterSectionCode(''); setSearch(''); setCurrentPage(1); }}
                >
                  Сбросить
                </button>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Проект</th>
                  <th style={{ width: '22%' }}>Блок дорожной карты</th>
                  <th>Документ</th>
                  <th style={{ width: '14%' }}>Дата загрузки</th>
                  <th className="tRight" style={{ width: '160px' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                      {files.length === 0
                        ? 'Нет загруженных документов. Загрузите файлы в блоках на странице «Дорожная карта документов».'
                        : 'По заданным фильтрам документы не найдены.'}
                    </td>
                  </tr>
                ) : (
                  paginatedFiles.map((f) => (
                    <tr key={f.id}>
                      <td>{f.project_name || '—'}</td>
                      <td>{f.section_name || f.section_code || '—'}</td>
                      <td>
                        <span>{f.file_name}</span>
                        {f.description && <div className="mini">{f.description}</div>}
                      </td>
                      <td>{formatDate(f.uploaded_at)}</td>
                      <td className="tRight">
                        <a
                          className="btn small"
                          href={viewUrl(f.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Открыть файл для просмотра в новой вкладке"
                        >
                          Просмотр
                        </a>
                        <a
                          className="btn small"
                          href={downloadUrl(f.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          title="Скачать файл"
                        >
                          Скачать
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 0 && (
              <div className="tableFooter">
                <span>Показано {paginatedFiles.length} из {filteredFiles.length} • Страница {currentPage} из {totalPages}</span>
                <div className="pager">
                  <button
                    type="button"
                    className="btn small"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ←
                  </button>
                  <span className="btn small" style={{ pointerEvents: 'none' }}>{currentPage}</span>
                  <button
                    type="button"
                    className="btn small"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDocumentation;
