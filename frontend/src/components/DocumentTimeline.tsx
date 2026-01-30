import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { getMockDocumentStatuses } from '../mocks/data';

interface Project {
  id: number;
  name: string;
  code?: string;
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

// Структура дорожной карты для таймлайна (соответствует схеме)
const TIMELINE_STRUCTURE = [
  {
    code: 'sketch',
    name: 'Эскизный проект',
    level: 0,
    children: [
      {
        code: 'sketch.itc',
        name: 'Инженерно-технические условия',
        level: 1,
        children: [
          { code: 'sketch.itc.heat', name: 'Теплоснабжение', level: 2 },
          { code: 'sketch.itc.power', name: 'Электроснабжение', level: 2 },
          { code: 'sketch.itc.water', name: 'Водопровод и канализация', level: 2 },
          { code: 'sketch.itc.gas', name: 'Газоснабжение', level: 2 },
          { code: 'sketch.itc.phone', name: 'Телефонизация', level: 2 },
        ],
      },
      { code: 'sketch.geo', name: 'Инженерно-геологические условия', level: 1 },
      { code: 'sketch.urban', name: 'Градостроительное заключение', level: 1 },
    ],
  },
  {
    code: 'working',
    name: 'Рабочий проект',
    level: 0,
    children: [
      { code: 'working.genplan', name: 'Стройгенплан', level: 1 },
      { code: 'working.ppr', name: 'ППР (План производственных работ)', level: 1 },
      { code: 'working.survey', name: 'Акт выноса в натуру', level: 1 },
      {
        code: 'working.gp_ar',
        name: 'ГП АР (Генеральный план и Архитектурные решения)',
        level: 1,
        children: [
          { code: 'working.gp_ar.mchs', name: 'Согласование с МЧС', level: 2 },
          { code: 'working.gp_ar.sanepid', name: 'Согласование с Санэпид', level: 2 },
          { code: 'working.gp_ar.mpret', name: 'Согласование с МПРЭТН (экология)', level: 2 },
        ],
      },
      {
        code: 'working.expertise',
        name: 'Прохождение госэкспертизы',
        level: 1,
        children: [
          {
            code: 'working.expertise.stage1',
            name: '1 этап Госэкспертизы',
            level: 2,
            children: [
              { code: 'working.register', name: 'Включение в реестр строящихся объектов', level: 3 },
            ],
          },
          {
            code: 'working.expertise.stage2',
            name: '2 этап Госэкспертизы',
            level: 2,
            children: [
              {
                code: 'working.networks',
                name: 'Проекты Инженерные сети',
                level: 3,
                children: [
                  {
                    code: 'working.networks.external',
                    name: 'Наружные сети',
                    level: 4,
                    children: [
                      { code: 'working.networks.external.heat', name: 'Теплоснабжение', level: 5 },
                      { code: 'working.networks.external.power', name: 'Электроснабжение', level: 5 },
                      { code: 'working.networks.external.water', name: 'Наружный водопровод и канализация', level: 5 },
                      { code: 'working.networks.external.gas', name: 'Газоснабжение', level: 5 },
                    ],
                  },
                  {
                    code: 'working.networks.internal',
                    name: 'Внутренние сети',
                    level: 4,
                    children: [
                      { code: 'working.networks.internal.hvac', name: 'Отопление и вентиляция', level: 5 },
                      { code: 'working.networks.internal.electrical', name: 'Электромонтаж и электрооборудования', level: 5 },
                      { code: 'working.networks.internal.water', name: 'Водопровод и канализация', level: 5 },
                      { code: 'working.networks.internal.gas', name: 'Газоснабжение', level: 5 },
                      { code: 'working.networks.internal.fire', name: 'Пожаротушение и сигнализация', level: 5 },
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

interface DocumentTimelineProps {
  projectId: number | null;
  projects: Project[];
}

const DocumentTimeline: React.FC<DocumentTimelineProps> = ({ projectId, projects }) => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterBlocking, setFilterBlocking] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchStatuses();
    } else {
      setStatuses([]);
    }
  }, [projectId]);

  const fetchStatuses = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/document-roadmap/statuses/`, {
        params: { project_id: projectId },
      });
      setStatuses(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Ошибка загрузки статусов:', error);
      // Используем мок-данные если API недоступен
      console.log('Используем мок-данные для демонстрации');
      const mockStatuses = getMockDocumentStatuses(projectId);
      setStatuses(mockStatuses as any);
    } finally {
      setLoading(false);
    }
  };

  const getStatusForSection = (sectionCode: string): Status | null => {
    return statuses.find((s) => s.section_code === sectionCode) || null;
  };

  const getExecutionStatusColor = (status: string): string => {
    switch (status) {
      case 'not_started':
        return '#dc3545'; // Красный
      case 'in_progress':
        return '#ffc107'; // Желтый
      case 'completed':
        return '#28a745'; // Зеленый
      case 'on_approval':
        return '#007bff'; // Синий
      default:
        return '#6c757d';
    }
  };

  const getDocumentStatusColor = (status?: string): string => {
    if (!status) return '#6c757d';
    switch (status) {
      case 'valid':
        return '#28a745'; // Зеленый
      case 'expiring':
        return '#ffc107'; // Желтый
      case 'expired':
        return '#dc3545'; // Красный
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Определить критический путь (узлы, которые блокируют другие)
  const isCriticalPath = (item: any): boolean => {
    const status = getStatusForSection(item.code);
    // Критический путь: не начатые или просроченные узлы, которые имеют дочерние элементы
    if (item.children && item.children.length > 0) {
      if (!status || status.execution_status === 'not_started' || status.document_status === 'expired') {
        return true;
      }
    }
    return false;
  };

  // Проверить, является ли узел блокирующим или просроченным
  const isBlockingOrOverdue = (item: any): boolean => {
    const status = getStatusForSection(item.code);
    if (!status) return true; // Нет статуса = блокирующий
    return status.execution_status === 'not_started' || status.document_status === 'expired';
  };

  const renderTimelineItem = (item: any, index: number, parentIndex?: number): React.ReactNode => {
    const status = getStatusForSection(item.code);
    const hasChildren = item.children && item.children.length > 0;
    const leftOffset = item.level * 50 + 20; // Отступ от вертикальной линии таймлайна
    const isMainStage = item.level === 0;
    const isCritical = isCriticalPath(item);
    const isBlocking = isBlockingOrOverdue(item);

    // Фильтр блокирующих/просроченных
    if (filterBlocking && !isBlocking) {
      // Проверяем дочерние элементы
      if (!hasChildren || !item.children.some((child: any) => isBlockingOrOverdue(child))) {
        return null;
      }
    }

    return (
      <div key={`${item.code}-${index}`} style={{ position: 'relative', marginBottom: '16px' }}>
        {/* Вертикальная линия связи */}
        {item.level > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${leftOffset - 20}px`,
              top: '-8px',
              width: '2px',
              height: '24px',
              background: 'var(--border)',
            }}
          />
        )}

        {/* Горизонтальная линия связи */}
        {item.level > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${leftOffset - 20}px`,
              top: '16px',
              width: '20px',
              height: '2px',
              background: 'var(--border)',
            }}
          />
        )}

        {/* Точка на таймлайне */}
        <div
          style={{
            position: 'absolute',
            left: `${leftOffset - 6}px`,
            top: '10px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: status
              ? getExecutionStatusColor(status.execution_status)
              : '#6c757d',
            border: '2px solid var(--bg)',
            zIndex: 2,
          }}
        />

        {/* Карточка этапа */}
        <div
          style={{
            marginLeft: `${leftOffset}px`,
            padding: '12px 16px',
            background: isMainStage ? 'var(--accent)' : 'var(--bg-secondary)',
            border: `2px solid ${status ? getExecutionStatusColor(status.execution_status) : 'var(--border)'}`,
            borderRadius: '8px',
            position: 'relative',
            minHeight: '80px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: isMainStage ? 'bold' : 'normal',
                  fontSize: isMainStage ? '16px' : '14px',
                  marginBottom: '8px',
                  color: isMainStage ? 'var(--text)' : 'var(--text)',
                }}
              >
                {item.name}
              </div>

              {status && (
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {status.request_date && (
                      <span>
                        <strong>Дата обращения:</strong> {formatDate(status.request_date)}
                      </span>
                    )}
                    {status.due_date && (
                      <span>
                        <strong>Срок исполнения:</strong> {formatDate(status.due_date)}
                      </span>
                    )}
                    {status.valid_until_date && (
                      <span>
                        <strong>Срок действия:</strong>{' '}
                        <span style={{ color: getDocumentStatusColor(status.document_status) }}>
                          {formatDate(status.valid_until_date)}
                        </span>
                      </span>
                    )}
                  </div>
                  {(status.executor_company || status.executor_authority) && (
                    <div style={{ marginTop: '4px' }}>
                      {status.executor_company && (
                        <span style={{ marginRight: '12px' }}>
                          <strong>Исполнитель (компания):</strong> {status.executor_company}
                        </span>
                      )}
                      {status.executor_authority && (
                        <span>
                          <strong>Исполнитель (гос орган):</strong> {status.executor_authority}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
              {status && (
                <>
                  <span
                    className="chip"
                    style={{
                      background: getExecutionStatusColor(status.execution_status),
                      color: 'white',
                      fontSize: '11px',
                      padding: '2px 8px',
                    }}
                  >
                    {status.execution_status === 'not_started'
                      ? 'Не начат'
                      : status.execution_status === 'in_progress'
                      ? 'В работе'
                      : status.execution_status === 'completed'
                      ? 'Выполнено'
                      : 'На согласовании'}
                  </span>
                  {status.document_status && (
                    <span
                      className="chip"
                      style={{
                        background: getDocumentStatusColor(status.document_status),
                        color: 'white',
                        fontSize: '11px',
                        padding: '2px 8px',
                      }}
                    >
                      {status.document_status === 'valid'
                        ? 'Действителен'
                        : status.document_status === 'expiring'
                        ? 'Истекает'
                        : 'Просрочен'}
                    </span>
                  )}
                  {status.files_count > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>📎 {status.files_count}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Рекурсивно рендерим дочерние элементы */}
        {hasChildren && (
          <div style={{ marginTop: '8px' }}>
            {item.children.map((child: any, childIndex: number) => renderTimelineItem(child, childIndex, index))}
          </div>
        )}
      </div>
    );
  };

  if (!projectId) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
        Выберите проект для отображения таймлайна дорожной карты документов
      </p>
    );
  }

  if (loading) {
    return <div className="loading">Загрузка данных таймлайна...</div>;
  }

  return (
    <div style={{ position: 'relative', minHeight: '400px' }}>
        {/* Вертикальная линия таймлайна */}
        <div
          style={{
            position: 'absolute',
            left: '20px',
            top: '0',
            bottom: '0',
            width: '2px',
            background: 'linear-gradient(to bottom, var(--accent), var(--border))',
            zIndex: 1,
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, paddingLeft: '20px' }}>
          {TIMELINE_STRUCTURE.map((item, index) => renderTimelineItem(item, index))}
        </div>

        {/* Легенда */}
        <div
          style={{
            marginTop: '32px',
            padding: '16px',
            background: 'var(--bg)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Легенда:</div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#dc3545',
                }}
              />
              <span>Не начат</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ffc107',
                }}
              />
              <span>В работе</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#28a745',
                }}
              />
              <span>Выполнено</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#007bff',
                }}
              />
              <span>На согласовании</span>
            </div>
          </div>
        </div>
    </div>
  );
};

export default DocumentTimeline;
