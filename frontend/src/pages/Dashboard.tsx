import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import DocumentTimeline from '../components/DocumentTimeline';
import { getMockDocumentStatuses } from '../mocks/data';

interface Project {
  id: number;
  name: string;
  code?: string;
}

interface Section {
  id: number;
  code: string;
  name: string;
  parent_code: string | null;
  order_number: number;
  is_active: boolean;
}

interface Status {
  id: number;
  project_id: number;
  section_code: string;
  request_date?: string;
  due_date?: string;
  valid_until_date?: string;
  executor_company?: string;
  executor_authority?: string;
  execution_status: string;
  document_status?: string;
  note?: string;
  files_count: number;
}

interface FileInfo {
  id: number;
  file_name: string;
  stored_path: string;
  file_size?: number;
  uploaded_at: string;
}

// Структура дорожной карты (статическая, как в схеме)
const ROADMAP_TREE = [
  {
    code: 'sketch',
    name: 'Эскизный проект',
    children: [
      {
        code: 'sketch.itc',
        name: 'Инженерно-технические условия',
        children: [
          { code: 'sketch.itc.heat', name: 'Теплоснабжение' },
          { code: 'sketch.itc.power', name: 'Электроснабжение' },
          { code: 'sketch.itc.water', name: 'Водопровод и канализация' },
          { code: 'sketch.itc.gas', name: 'Газоснабжение' },
          { code: 'sketch.itc.phone', name: 'Телефонизация' },
        ],
      },
      { code: 'sketch.geo', name: 'Инженерно-геологические условия' },
      { code: 'sketch.urban', name: 'Градостроительное заключение' },
    ],
  },
  {
    code: 'working',
    name: 'Рабочий проект',
    children: [
      { code: 'working.genplan', name: 'Стройгенплан' },
      { code: 'working.ppr', name: 'ППР (План производственных работ)' },
      { code: 'working.survey', name: 'Акт выноса в натуру' },
      {
        code: 'working.gp_ar',
        name: 'ГП АР (Генеральный план и Архитектурные решения)',
        children: [
          { code: 'working.gp_ar.mchs', name: 'Согласование с МЧС' },
          { code: 'working.gp_ar.sanepid', name: 'Согласование с Санэпид' },
          { code: 'working.gp_ar.mpret', name: 'Согласование с МПРЭТН (экология)' },
        ],
      },
      {
        code: 'working.expertise',
        name: 'Прохождение госэкспертизы',
        children: [
          {
            code: 'working.expertise.stage1',
            name: '1 этап Госэкспертизы',
            children: [
              { code: 'working.register', name: 'Включение в реестр строящихся объектов' },
            ],
          },
          {
            code: 'working.expertise.stage2',
            name: '2 этап Госэкспертизы',
            children: [
              {
                code: 'working.networks',
                name: 'Проекты Инженерные сети',
                children: [
                  {
                    code: 'working.networks.external',
                    name: 'Наружные сети',
                    children: [
                      { code: 'working.networks.external.heat', name: 'Теплоснабжение' },
                      { code: 'working.networks.external.power', name: 'Электроснабжение' },
                      { code: 'working.networks.external.water', name: 'Наружный водопровод и канализация' },
                      { code: 'working.networks.external.gas', name: 'Газоснабжение' },
                    ],
                  },
                  {
                    code: 'working.networks.internal',
                    name: 'Внутренние сети',
                    children: [
                      { code: 'working.networks.internal.hvac', name: 'Отопление и вентиляция' },
                      { code: 'working.networks.internal.electrical', name: 'Электромонтаж и электрооборудования' },
                      { code: 'working.networks.internal.water', name: 'Водопровод и канализация' },
                      { code: 'working.networks.internal.gas', name: 'Газоснабжение' },
                      { code: 'working.networks.internal.fire', name: 'Пожаротушение и сигнализация' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sketch', 'working']));
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tree' | 'timeline'>('tree');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [editingSectionCode, setEditingSectionCode] = useState<string | null>(null);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<FileInfo[]>([]);
  const [currentStatusId, setCurrentStatusId] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    request_date: '',
    due_date: '',
    valid_until_date: '',
    executor_company: '',
    executor_authority: '',
    execution_status: 'not_started',
    note: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchStatuses();
    } else {
      setStatuses([]);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/`);
      const projectsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setProjects(projectsData.filter((p: any) => p && p.id));
      if (projectsData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (error: any) {
      console.error('Ошибка загрузки проектов:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    if (!selectedProjectId) return;
    try {
      const response = await axios.get(`${API_URL}/document-roadmap/statuses/`, {
        params: { project_id: selectedProjectId },
      });
      setStatuses(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Ошибка загрузки статусов:', error);
      // Используем мок-данные если API недоступен
      console.log('Используем мок-данные для демонстрации');
      const mockStatuses = getMockDocumentStatuses(selectedProjectId);
      setStatuses(mockStatuses as any);
    }
  };

  const getStatusForSection = (sectionCode: string): Status | null => {
    return statuses.find((s) => s.section_code === sectionCode) || null;
  };

  const getExecutionStatusColor = (status: string): string => {
    switch (status) {
      case 'not_started':
        return 'danger'; // 🔴 Красный
      case 'in_progress':
        return 'warn'; // 🟡 Желтый
      case 'completed':
        return 'ok'; // 🟢 Зеленый
      case 'on_approval':
        return 'info'; // 🔵 Синий
      default:
        return 'info';
    }
  };

  const getDocumentStatusColor = (status?: string): string => {
    if (!status) return 'info';
    switch (status) {
      case 'valid':
        return 'ok'; // 🟢 Зеленый
      case 'expiring':
        return 'warn'; // 🟡 Желтый
      case 'expired':
        return 'danger'; // 🔴 Красный
      default:
        return 'info';
    }
  };

  const getExecutionStatusLabel = (status: string): string => {
    switch (status) {
      case 'not_started':
        return 'Не начат';
      case 'in_progress':
        return 'В работе';
      case 'completed':
        return 'Выполнено';
      case 'on_approval':
        return 'На согласовании';
      default:
        return status;
    }
  };

  const toggleSection = (code: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  };

  const handleOpenStatusModal = (sectionCode: string, status?: Status) => {
    setEditingSectionCode(sectionCode);
    if (status) {
      setEditingStatus(status);
      setFormData({
        request_date: status.request_date ? status.request_date.split('T')[0] : '',
        due_date: status.due_date ? status.due_date.split('T')[0] : '',
        valid_until_date: status.valid_until_date ? status.valid_until_date.split('T')[0] : '',
        executor_company: status.executor_company || '',
        executor_authority: status.executor_authority || '',
        execution_status: status.execution_status,
        note: status.note || '',
      });
    } else {
      setEditingStatus(null);
      setFormData({
        request_date: '',
        due_date: '',
        valid_until_date: '',
        executor_company: '',
        executor_authority: '',
        execution_status: 'not_started',
        note: '',
      });
    }
    setShowStatusModal(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedProjectId || !editingSectionCode) return;

    try {
      const submitData = {
        project_id: selectedProjectId,
        section_code: editingSectionCode,
        ...formData,
        request_date: formData.request_date || null,
        due_date: formData.due_date || null,
        valid_until_date: formData.valid_until_date || null,
        executor_company: formData.executor_company || null,
        executor_authority: formData.executor_authority || null,
        note: formData.note || null,
      };

      if (editingStatus) {
        await axios.put(`${API_URL}/document-roadmap/statuses/${editingStatus.id}`, submitData);
      } else {
        await axios.post(`${API_URL}/document-roadmap/statuses/`, submitData);
      }

      setShowStatusModal(false);
      fetchStatuses();
    } catch (error: any) {
      console.error('Ошибка сохранения статуса:', error);
      alert(error.response?.data?.detail || 'Ошибка сохранения статуса');
    }
  };

  const handleOpenFilesModal = async (statusId: number) => {
    setCurrentStatusId(statusId);
    try {
      const response = await axios.get(`${API_URL}/document-roadmap/statuses/${statusId}/files`);
      setCurrentFiles(Array.isArray(response.data) ? response.data : []);
      setShowFilesModal(true);
    } catch (error: any) {
      console.error('Ошибка загрузки файлов:', error);
      setCurrentFiles([]);
      setShowFilesModal(true);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !currentStatusId) return;
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Разрешена загрузка только PDF файлов');
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(`${API_URL}/document-roadmap/statuses/${currentStatusId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Обновляем список файлов
      const response = await axios.get(`${API_URL}/document-roadmap/statuses/${currentStatusId}/files`);
      setCurrentFiles(Array.isArray(response.data) ? response.data : []);
      fetchStatuses(); // Обновляем статусы для обновления счетчика файлов
    } catch (error: any) {
      console.error('Ошибка загрузки файла:', error);
      alert(error.response?.data?.detail || 'Ошибка загрузки файла');
    } finally {
      setUploadingFile(false);
      e.target.value = ''; // Сбрасываем input
    }
  };

  const handleDownloadFile = (fileId: number, fileName: string) => {
    window.open(`${API_URL}/document-roadmap/files/${fileId}/download`, '_blank');
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm('Удалить файл?')) return;
    try {
      await axios.delete(`${API_URL}/document-roadmap/files/${fileId}`);
      if (currentStatusId) {
        const response = await axios.get(`${API_URL}/document-roadmap/statuses/${currentStatusId}/files`);
        setCurrentFiles(Array.isArray(response.data) ? response.data : []);
        fetchStatuses();
      }
    } catch (error: any) {
      console.error('Ошибка удаления файла:', error);
      alert('Ошибка удаления файла');
    }
  };

  const renderSection = (section: any, level: number = 0): React.ReactNode => {
    const status = getStatusForSection(section.code);
    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections.has(section.code);
    const indent = level * 24;

    return (
      <div key={section.code} style={{ marginLeft: `${indent}px` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            borderBottom: '1px solid var(--border)',
            cursor: hasChildren ? 'pointer' : 'default',
            background: level % 2 === 0 ? 'var(--bg)' : 'var(--bg-secondary)',
          }}
          onClick={() => hasChildren && toggleSection(section.code)}
        >
          {hasChildren && (
            <span style={{ marginRight: '8px', fontSize: '12px' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren && <span style={{ marginRight: '16px', width: '8px' }} />}
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: level === 0 ? 'bold' : 'normal', fontSize: level === 0 ? '16px' : '14px' }}>
              {section.name}
            </div>
            {status && (
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                {status.executor_company && `Исполнитель: ${status.executor_company}`}
                {status.due_date && ` • Срок: ${new Date(status.due_date).toLocaleDateString('ru-RU')}`}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            {status && (
              <>
                <span className={`chip ${getExecutionStatusColor(status.execution_status)}`} style={{ fontSize: '11px' }}>
                  {getExecutionStatusLabel(status.execution_status)}
                </span>
                {status.document_status && (
                  <span className={`chip ${getDocumentStatusColor(status.document_status)}`} style={{ fontSize: '11px' }}>
                    {status.document_status === 'valid' ? 'Действителен' : status.document_status === 'expiring' ? 'Истекает' : 'Просрочен'}
                  </span>
                )}
                {status.files_count > 0 && (
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>📎 {status.files_count}</span>
                )}
                <button
                  className="btn small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenFilesModal(status.id);
                  }}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Файлы
                </button>
              </>
            )}
            <button
              className="btn small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenStatusModal(section.code, status || undefined);
              }}
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              {status ? 'Изменить' : 'Добавить'}
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {section.children.map((child: any) => renderSection(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs">
            <a href="#dashboard">Главная</a> <span className="sep">/</span>
            <span>Дашборд управления строительством</span>
          </div>
          <div className="h1">Дашборд управления строительством</div>
          <p className="h2">Дорожная карта документов для строительного объекта</p>
        </div>
        <div className="actions">
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(Number(e.target.value) || null)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}
          >
            <option value="">Выберите проект</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.code && `(${p.code})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProjectId ? (
      <div className="card">
        <div className="cardHead">
          <div>
              <div className="title">Дорожная карта документов</div>
              <div className="desc">
                {projects.find((p) => p.id === selectedProjectId)?.name}
        </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Переключатель вкладок */}
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '6px' }}>
                <button
                  className={`btn small ${activeTab === 'tree' ? 'primary' : ''}`}
                  onClick={() => setActiveTab('tree')}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Дерево
                </button>
                <button
                  className={`btn small ${activeTab === 'timeline' ? 'primary' : ''}`}
                  onClick={() => setActiveTab('timeline')}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Таймлайн
                </button>
            </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="chip" style={{ fontSize: '11px' }}>
                  🔴 Не начат
                </span>
                <span className="chip warn" style={{ fontSize: '11px' }}>
                  🟡 В работе
                </span>
                <span className="chip ok" style={{ fontSize: '11px' }}>
                  🟢 Выполнено
                </span>
                <span className="chip info" style={{ fontSize: '11px' }}>
                  🔵 На согласовании
                </span>
            </div>
            </div>
          </div>
          <div className="cardBody" style={{ padding: 0 }}>
            {activeTab === 'tree' ? (
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {ROADMAP_TREE.map((section) => renderSection(section, 0))}
              </div>
            ) : (
              <div style={{ padding: '24px' }}>
                <DocumentTimeline projectId={selectedProjectId} projects={projects} />
              </div>
            )}
          </div>
        </div>
      ) : (
            <div className="card">
          <div className="cardBody">
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
              Выберите проект для отображения дорожной карты документов
            </p>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования статуса */}
      {showStatusModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '600px', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
              <div className="cardHead">
                <div>
                <div className="title">
                  {editingStatus ? 'Редактирование статуса' : 'Добавление статуса'}
                </div>
                <div className="desc">
                  {ROADMAP_TREE.flatMap((s) => [
                    s,
                    ...(s.children || []),
                    ...(s.children?.flatMap((c: any) => c.children || []) || []),
                  ]).find((s: any) => s.code === editingSectionCode)?.name}
                </div>
              </div>
              <button className="btn ghost small" onClick={() => setShowStatusModal(false)}>
                ✕
              </button>
              </div>
              <div className="cardBody">
              <div className="field">
                <label>Дата обращения</label>
                <input
                  type="date"
                  value={formData.request_date}
                  onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Срок исполнения (до)</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Срок действия документа (до)</label>
                <input
                  type="date"
                  value={formData.valid_until_date}
                  onChange={(e) => setFormData({ ...formData, valid_until_date: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Исполнитель от компании</label>
                <input
                  type="text"
                  value={formData.executor_company}
                  onChange={(e) => setFormData({ ...formData, executor_company: e.target.value })}
                  placeholder="ФИО исполнителя"
                />
              </div>
              <div className="field">
                <label>Исполнитель от гос органа</label>
                <input
                  type="text"
                  value={formData.executor_authority}
                  onChange={(e) => setFormData({ ...formData, executor_authority: e.target.value })}
                  placeholder="ФИО исполнителя"
                />
              </div>
              <div className="field">
                <label>Статус выполнения</label>
                <select
                  value={formData.execution_status}
                  onChange={(e) => setFormData({ ...formData, execution_status: e.target.value })}
                >
                  <option value="not_started">Не начат</option>
                  <option value="in_progress">В работе</option>
                  <option value="on_approval">На согласовании</option>
                  <option value="completed">Выполнено</option>
                </select>
                  </div>
              <div className="field">
                <label>Примечание</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  placeholder="Дополнительная информация, контакты..."
                />
                </div>
              <div style={{ height: '16px' }} />
              <div className="actions">
                <button className="btn primary" onClick={handleSaveStatus}>
                  Сохранить
                </button>
                <button className="btn" onClick={() => setShowStatusModal(false)}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно файлов */}
      {showFilesModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowFilesModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '600px', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
              <div className="cardHead">
                <div>
                <div className="title">Файлы документа</div>
                <div className="desc">Загрузка и управление PDF файлами</div>
              </div>
              <button className="btn ghost small" onClick={() => setShowFilesModal(false)}>
                ✕
              </button>
                </div>
            <div className="cardBody">
              <div className="field">
                <label>Загрузить PDF файл</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleUploadFile}
                  disabled={uploadingFile}
                />
                {uploadingFile && <div className="mini">Загрузка...</div>}
              </div>
              <div style={{ height: '16px' }} />
              {currentFiles.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                  Файлы не загружены
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Имя файла</th>
                      <th style={{ width: '120px' }}>Размер</th>
                      <th style={{ width: '120px' }}>Дата</th>
                      <th style={{ width: '100px' }} className="tRight">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFiles.map((file) => (
                      <tr key={file.id}>
                        <td>{file.file_name}</td>
                        <td>
                          {file.file_size
                            ? `${(file.file_size / 1024).toFixed(1)} КБ`
                            : '-'}
                        </td>
                        <td>
                          {new Date(file.uploaded_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="tRight">
                          <button
                            className="btn small"
                            onClick={() => handleDownloadFile(file.id, file.file_name)}
                          >
                            Скачать
                          </button>
                          <button
                            className="btn small danger"
                            onClick={() => handleDeleteFile(file.id)}
                            style={{ marginLeft: '4px' }}
                          >
                            Уд.
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
