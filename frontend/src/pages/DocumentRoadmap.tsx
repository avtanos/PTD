import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import cytoscape from 'cytoscape';
import type { Core, NodeSingular, EdgeSingular, EventObject } from 'cytoscape';
import API_URL from '../utils/api';
import { mockProjects, getMockDocumentStatuses, getMockDocumentStatus } from '../mocks/data';
import './DocumentRoadmap.css';

interface Project {
  id: number;
  name: string;
  code?: string;
}

/** Маппинг id узла графа → section_code в API (backend init_roadmap_sections) */
const NODE_ID_TO_SECTION_CODE: Record<string, string> = {
  sketch: 'sketch',
  tu: 'sketch.itc',
  geo: 'sketch.geo',
  heat: 'sketch.itc.heat',
  power: 'sketch.itc.power',
  water: 'sketch.itc.water',
  gas: 'sketch.itc.gas',
  phone: 'sketch.itc.phone',
  urban: 'sketch.urban',
  workproj: 'working',
  genplan: 'working.genplan',
  ppr: 'working.ppr',
  act: 'working.survey',
  gpar: 'working.gp_ar',
  mchs: 'working.gp_ar.mchs',
  san: 'working.gp_ar.sanepid',
  eco: 'working.gp_ar.mpret',
  exp1: 'working.expertise.stage1',
  registry: 'working.register',
  exp2: 'working.expertise.stage2',
  engproj: 'working.networks',
  ext: 'working.networks.external',
  int: 'working.networks.internal',
  ext_heat: 'working.networks.external.heat',
  ext_power: 'working.networks.external.power',
  ext_water: 'working.networks.external.water',
  ext_gas: 'working.networks.external.gas',
  int_hv: 'working.networks.internal.hvac',
  int_el: 'working.networks.internal.electrical',
  int_vk: 'working.networks.internal.water',
  int_gas: 'working.networks.internal.gas',
  int_fire: 'working.networks.internal.fire',
};

/** Бэкенд: not_started | in_progress | on_approval | completed → фронт: not_started | in_progress | approval | done | blocked */
function apiExecutionStatusToFrontend(apiStatus: string): string {
  const map: Record<string, string> = {
    not_started: 'not_started',
    in_progress: 'in_progress',
    on_approval: 'approval',
    completed: 'done',
  };
  return map[apiStatus] ?? 'not_started';
}

function frontendStatusToApi(frontendStatus: string): string {
  const map: Record<string, string> = {
    not_started: 'not_started',
    in_progress: 'in_progress',
    approval: 'on_approval',
    done: 'completed',
    blocked: 'not_started',
  };
  return map[frontendStatus] ?? 'not_started';
}

/** Статус узла дорожной карты (ответ API /document-roadmap/statuses/) */
export interface RoadmapStatus {
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

/** Файл (ответ API /statuses/{id}/files) */
export interface RoadmapFileInfo {
  id: number;
  file_name: string;
  stored_path: string;
  file_size?: number;
  mime_type: string;
  uploaded_at: string;
  description?: string;
}

const STATUS: Record<string, { label: string; tag: string }> = {
  not_started: { label: 'Не начато', tag: 'info' },
  in_progress: { label: 'В работе', tag: 'warn' },
  approval: { label: 'На согласовании', tag: 'info' },
  done: { label: 'Выполнено', tag: 'ok' },
  blocked: { label: 'Блокирует', tag: 'danger' },
};

interface RoadmapNode {
  id: string;
  type?: string;
  text: string;
  stage: string;
  role: string;
  status: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
}

interface RoadmapEdge {
  from: string;
  to: string;
}

const NODES: RoadmapNode[] = [
  { id: 'sketch', text: 'Эскизный проект', stage: 'Исходные данные', role: 'Проектировщик', status: 'done', x: 500, y: 130, w: 200, h: 44 },
  { id: 'tu', text: 'Инженерные технические условия\n(выдается уполномоченным лицом в сфере архитектуры)', stage: 'Исходные данные', role: 'Архитектура', status: 'approval', x: 260, y: 200, w: 680, h: 74 },
  { id: 'geo', text: 'Инженерные геологические\nизыскания', stage: 'Исходные данные', role: 'Геодезия/Геология', status: 'in_progress', x: 1100, y: 290, w: 260, h: 74 },
  { id: 'heat', text: 'Теплоснабжение', stage: 'Инженерные сети (ТУ)', role: 'Инженер ОВ', status: 'in_progress', x: 120, y: 290, w: 160, h: 44 },
  { id: 'power', text: 'Электроснабжение', stage: 'Инженерные сети (ТУ)', role: 'Инженер ЭО', status: 'not_started', x: 300, y: 290, w: 170, h: 44 },
  { id: 'water', text: 'Водопровод и\nканализация', stage: 'Инженерные сети (ТУ)', role: 'Инженер ВК', status: 'in_progress', x: 490, y: 290, w: 210, h: 44 },
  { id: 'gas', text: 'Газоснабжение', stage: 'Инженерные сети (ТУ)', role: 'Инженер Газ', status: 'approval', x: 720, y: 290, w: 170, h: 44 },
  { id: 'phone', text: 'Телефонизация', stage: 'Инженерные сети (ТУ)', role: 'Инженер СС', status: 'not_started', x: 900, y: 290, w: 160, h: 44 },
  { id: 'urban', text: 'Градостроительное\nзаключение', stage: 'Проектирование', role: 'Архитектура', status: 'in_progress', x: 420, y: 360, w: 360, h: 44 },
  { id: 'workproj', text: 'Рабочий проект', stage: 'Проектирование', role: 'ГАП/ГИП', status: 'in_progress', x: 470, y: 430, w: 260, h: 44 },
  { id: 'genplan', text: 'Стройгенплан', stage: 'Проектирование', role: 'ПТО/Производство', status: 'not_started', x: 120, y: 390, w: 260, h: 44 },
  { id: 'ppr', text: 'ППР\nПлан производственных работ', stage: 'Проектирование', role: 'ПТО', status: 'not_started', x: 120, y: 444, w: 260, h: 58 },
  { id: 'act', text: 'Акт выноса\nв натуру', stage: 'Проектирование', role: 'Геодезия', status: 'in_progress', x: 120, y: 512, w: 260, h: 44 },
  { id: 'gpar', text: 'ГП АР\n(Генплан и Архитектурные решения)\nСогласование с Бишкекглавархитектурой', stage: 'Согласования', role: 'Архитектура', status: 'approval', x: 700, y: 500, w: 380, h: 74 },
  { id: 'mchs', text: 'Согласование\nс МЧС', stage: 'Согласования', role: 'Эксперт', status: 'not_started', x: 1200, y: 495, w: 240, h: 44 },
  { id: 'san', text: 'Согласование\nс Санэпид', stage: 'Согласования', role: 'Эксперт', status: 'not_started', x: 1200, y: 550, w: 240, h: 44 },
  { id: 'eco', text: 'Согласование\nс МПРЭТН (экология)', stage: 'Согласования', role: 'Эксперт', status: 'in_progress', x: 1200, y: 605, w: 240, h: 52 },
  { id: 'exp1', text: 'Прохождение государственной экспертизы\n1 этап (Госэкспертизы)', stage: 'Экспертиза', role: 'Госэкспертиза', status: 'blocked', x: 720, y: 610, w: 360, h: 54 },
  { id: 'registry', text: 'Включение в реестр\nстроящихся объектов', stage: 'Завершение', role: 'Регистратор', status: 'not_started', x: 720, y: 690, w: 360, h: 54 },
  { id: 'exp2', text: '2 этап Госэкспертизы', stage: 'Экспертиза', role: 'Госэкспертиза', status: 'not_started', x: 350, y: 560, w: 280, h: 54 },
  { id: 'engproj', text: 'Проекты\nИнженерные сети', stage: 'Проектирование', role: 'ГИП', status: 'in_progress', x: 350, y: 640, w: 280, h: 54 },
  { id: 'ext', text: 'Наружные сети', stage: 'Инженерные сети', role: 'Инженеры', status: 'not_started', x: 240, y: 710, w: 220, h: 44 },
  { id: 'int', text: 'Внутренние сети', stage: 'Инженерные сети', role: 'Инженеры', status: 'not_started', x: 520, y: 710, w: 220, h: 44 },
  { id: 'ext_heat', text: 'Теплоснабжение', stage: 'Наружные сети', role: 'ОВ', status: 'not_started', x: 250, y: 770, w: 200, h: 40 },
  { id: 'ext_power', text: 'Электроснабжение', stage: 'Наружные сети', role: 'ЭО', status: 'not_started', x: 250, y: 818, w: 200, h: 40 },
  { id: 'ext_water', text: 'Наружный водопровод\nи канализация', stage: 'Наружные сети', role: 'ВК', status: 'not_started', x: 250, y: 866, w: 200, h: 40 },
  { id: 'ext_gas', text: 'Газоснабжение', stage: 'Наружные сети', role: 'Газ', status: 'not_started', x: 250, y: 906, w: 200, h: 40 },
  { id: 'int_hv', text: 'Отопление и вентиляция', stage: 'Внутренние сети', role: 'ОВ', status: 'not_started', x: 530, y: 770, w: 200, h: 40 },
  { id: 'int_el', text: 'Электромонтаж\nи электрооборудование', stage: 'Внутренние сети', role: 'ЭО', status: 'not_started', x: 530, y: 818, w: 200, h: 40 },
  { id: 'int_vk', text: 'Водопровод\nи канализация', stage: 'Внутренние сети', role: 'ВК', status: 'not_started', x: 530, y: 866, w: 200, h: 40 },
  { id: 'int_gas', text: 'Газоснабжение', stage: 'Внутренние сети', role: 'ПБ', status: 'not_started', x: 530, y: 912, w: 200, h: 40 },
  { id: 'int_fire', text: 'Пожаротушение\nи сигнализация', stage: 'Внутренние сети', role: 'ПБ', status: 'not_started', x: 530, y: 960, w: 200, h: 40 },
];

const EDGES: RoadmapEdge[] = [
  { from: 'sketch', to: 'tu' },
  { from: 'sketch', to: 'geo' },
  { from: 'tu', to: 'heat' },
  { from: 'tu', to: 'power' },
  { from: 'tu', to: 'water' },
  { from: 'tu', to: 'gas' },
  { from: 'tu', to: 'phone' },
  { from: 'tu', to: 'urban' },
  { from: 'heat', to: 'urban' },
  { from: 'power', to: 'urban' },
  { from: 'water', to: 'urban' },
  { from: 'gas', to: 'urban' },
  { from: 'phone', to: 'urban' },
  { from: 'urban', to: 'workproj' },
  { from: 'geo', to: 'workproj' },
  { from: 'workproj', to: 'genplan' },
  { from: 'workproj', to: 'ppr' },
  { from: 'workproj', to: 'act' },
  { from: 'gpar', to: 'mchs' },
  { from: 'gpar', to: 'san' },
  { from: 'gpar', to: 'eco' },
  { from: 'gpar', to: 'exp1' },
  { from: 'workproj', to: 'gpar' },
  { from: 'exp1', to: 'registry' },
  { from: 'exp1', to: 'exp2' },
  { from: 'exp2', to: 'engproj' },
  { from: 'engproj', to: 'ext' },
  { from: 'engproj', to: 'int' },
  { from: 'ext', to: 'ext_heat' },
  { from: 'ext', to: 'ext_power' },
  { from: 'ext', to: 'ext_water' },
  { from: 'ext', to: 'ext_gas' },
  { from: 'int', to: 'int_hv' },
  { from: 'int', to: 'int_el' },
  { from: 'int', to: 'int_vk' },
  { from: 'int', to: 'int_gas' },
  { from: 'int', to: 'int_fire' },
];

const CRITICAL_PATH = new Set(['sketch', 'tu', 'urban', 'workproj', 'gpar', 'exp1', 'registry']);
const POSITIONS_STORAGE_KEY = 'roadmap-node-positions';

const CYTOSCAPE_STYLE = [
  { selector: 'node', style: {
    label: 'data(label)',
    'text-valign': 'center',
    'text-halign': 'center',
    'text-margin-y': 3,
    width: 'data(width)',
    height: 'data(height)',
    'background-color': '#fff',
    'border-width': 2,
    'border-color': '#0d1736',
    'border-opacity': 0.9,
    shape: 'round-rectangle',
    'font-size': '15px',
    'font-weight': '700',
    color: '#0f172a',
    'text-wrap': 'wrap',
    'text-max-width': 'data(width)',
  }},
  { selector: 'node[status="done"]', style: { 'background-color': '#dcfce7', 'border-color': '#4ade80' }},
  { selector: 'node[status="in_progress"]', style: { 'background-color': '#fef9c3', 'border-color': '#ffcc66' }},
  { selector: 'node[status="approval"]', style: { 'background-color': '#e0f2fe', 'border-color': '#38bdf8' }},
  { selector: 'node[status="blocked"]', style: { 'background-color': '#ffe4e4', 'border-color': '#ff6b6b' }},
  { selector: 'node[status="not_started"]', style: { 'background-color': '#f1f5f9', 'border-color': '#94a3b8' }},
  { selector: 'node.selected', style: { 'border-color': '#2563eb', 'border-width': 3 }},
  { selector: 'node.dim', style: { opacity: 0.2 }},
  { selector: 'edge', style: {
    width: 2.5,
    'line-color': '#64748b',
    'target-arrow-color': '#64748b',
    'target-arrow-shape': 'triangle',
    'curve-style': 'bezier',
    'arrow-scale': 1,
  }},
  { selector: 'edge.hi', style: { 'line-color': '#2563eb', 'target-arrow-color': '#2563eb', width: 3.2 }},
  { selector: 'edge.dim', style: { opacity: 0.14 }},
];

function nodeById(id: string): RoadmapNode | undefined {
  return NODES.find((n) => n.id === id);
}
function edgesFrom(id: string): RoadmapEdge[] {
  return EDGES.filter((e) => e.from === id);
}
function edgesTo(id: string): RoadmapEdge[] {
  return EDGES.filter((e) => e.to === id);
}
function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

function collectDependencies(id: string): Set<string> {
  const seen = new Set<string>([id]);
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    const incoming = edgesTo(cur).map((e) => e.from);
    for (const src of incoming) {
      if (!seen.has(src)) {
        seen.add(src);
        stack.push(src);
      }
    }
  }
  return seen;
}

function getPathToActiveBlocks(statusesBySection: Record<string, RoadmapStatus>): Set<string> {
  const activeIds = new Set(
    NODES.filter((n) => {
      if (n.type === 'title') return false;
      const s = getEffectiveStatus(n.id, statusesBySection);
      return s === 'in_progress' || s === 'approval' || s === 'blocked';
    }).map((n) => n.id)
  );
  const visible = new Set<string>();
  activeIds.forEach((id) => collectDependencies(id).forEach((v) => visible.add(v)));
  return visible;
}

function getPathToBlocking(statusesBySection: Record<string, RoadmapStatus>): Set<string> {
  const blockingIds = NODES.filter((n) => n.type !== 'title' && getEffectiveStatus(n.id, statusesBySection) === 'blocked').map((n) => n.id);
  const visible = new Set<string>();
  blockingIds.forEach((id) => collectDependencies(id).forEach((v) => visible.add(v)));
  return visible;
}

function getEffectiveStatus(nodeId: string, statusesBySection: Record<string, RoadmapStatus>): string {
  const sectionCode = NODE_ID_TO_SECTION_CODE[nodeId];
  const node = NODES.find((n) => n.id === nodeId);
  const defaultStatus = node?.status ?? 'not_started';
  if (!sectionCode) return defaultStatus;
  const s = statusesBySection[sectionCode];
  return s ? apiExecutionStatusToFrontend(s.execution_status) : defaultStatus;
}

const DocumentRoadmap: React.FC = () => {
  const cyContainerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomVal, setZoomVal] = useState(100);
  const [selVal, setSelVal] = useState('—');
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState('all');
  const [statusFilter, setStatusFilter] = useState('any');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [statusesBySection, setStatusesBySection] = useState<Record<string, RoadmapStatus>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [cardFiles, setCardFiles] = useState<RoadmapFileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  // Не используются в UI — статусы синхронизируются из разделов проекта; оставлены для совместимости с HMR.
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    request_date: '',
    due_date: '',
    valid_until_date: '',
    executor_company: '',
    executor_authority: '',
    execution_status: 'not_started',
    note: '',
  });

  const selectedSectionCode = selectedId ? (NODE_ID_TO_SECTION_CODE[selectedId] ?? null) : null;
  const selectedStatus = selectedSectionCode != null ? statusesBySection[selectedSectionCode] : null;
  const mockStatusForCard =
    selectedSectionCode != null && selectedProjectId != null
      ? getMockDocumentStatus(selectedSectionCode, selectedProjectId)
      : undefined;
  const effectiveStatusForSelected = selectedId ? getEffectiveStatus(selectedId, statusesBySection) : null;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API_URL}/projects/`);
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        const list = data.filter((p: Project) => p && p.id).map((p: any) => ({ id: p.id, name: p.name, code: p.code }));
        if (list.length > 0) {
          setProjects(list);
          setSelectedProjectId((prev) => (prev ? prev : list[0].id));
        } else {
          setProjects(mockProjects as Project[]);
          setSelectedProjectId(mockProjects[0]?.id ?? null);
        }
      } catch {
        setProjects(mockProjects as Project[]);
        setSelectedProjectId(mockProjects[0]?.id ?? null);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setStatusesBySection({});
      setSelectedId(null);
      setSelVal('—');
      return;
    }
    setSelectedId(null);
    setSelVal('—');
    let cancelled = false;
    setLoadingStatuses(true);
    (async () => {
      try {
        const response = await axios.post<RoadmapStatus[]>(
          `${API_URL}/document-roadmap/projects/${selectedProjectId}/init-statuses`
        );
        const list = Array.isArray(response.data) ? response.data : [];
        if (!cancelled) {
          const bySection: Record<string, RoadmapStatus> = {};
          list.forEach((s) => {
            bySection[s.section_code] = s;
          });
          setStatusesBySection(bySection);
        }
      } catch {
        try {
          const fallback = await axios.get<RoadmapStatus[]>(`${API_URL}/document-roadmap/statuses/`, {
            params: { project_id: selectedProjectId },
          });
          const list = Array.isArray(fallback.data) ? fallback.data : [];
          if (!cancelled) {
            const bySection: Record<string, RoadmapStatus> = {};
            list.forEach((s) => {
              bySection[s.section_code] = s;
            });
            setStatusesBySection(bySection);
          }
        } catch {
          if (!cancelled) {
            const mockList = getMockDocumentStatuses(selectedProjectId) as RoadmapStatus[];
            const bySection: Record<string, RoadmapStatus> = {};
            mockList.forEach((s) => {
              bySection[s.section_code] = s;
            });
            setStatusesBySection(bySection);
          }
        }
      } finally {
        if (!cancelled) setLoadingStatuses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  const fetchCardFiles = useCallback(async (statusId: number) => {
    setLoadingFiles(true);
    try {
      const response = await axios.get<RoadmapFileInfo[]>(`${API_URL}/document-roadmap/statuses/${statusId}/files`);
      setCardFiles(Array.isArray(response.data) ? response.data : []);
    } catch {
      setCardFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStatus?.id) fetchCardFiles(selectedStatus.id);
    else setCardFiles([]);
  }, [selectedStatus?.id, fetchCardFiles]);

  const handleUploadFile = useCallback(
    async (file: File) => {
      if (!selectedStatus?.id) return;
      if (file.type !== 'application/pdf') {
        window.alert('Разрешена загрузка только PDF.');
        return;
      }
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        await axios.post(`${API_URL}/document-roadmap/statuses/${selectedStatus.id}/files`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        await fetchCardFiles(selectedStatus.id);
      } catch {
        window.alert('Не удалось загрузить файл.');
      } finally {
        setUploadingFile(false);
      }
    },
    [selectedStatus?.id, fetchCardFiles]
  );

  const handleDeleteFile = useCallback(
    async (fileId: number) => {
      if (!selectedStatus?.id) return;
      if (!window.confirm('Удалить файл?')) return;
      try {
        await axios.delete(`${API_URL}/document-roadmap/files/${fileId}`);
        await fetchCardFiles(selectedStatus.id);
      } catch {
        window.alert('Не удалось удалить файл.');
      }
    },
    [selectedStatus?.id, fetchCardFiles]
  );

  const creatingStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedProjectId || !selectedSectionCode || selectedStatus || !selectedId || selectedId === 'title') {
      return;
    }
    if (creatingStatusRef.current === selectedSectionCode) return;
    creatingStatusRef.current = selectedSectionCode;
    (async () => {
      try {
        const response = await axios.post<RoadmapStatus>(`${API_URL}/document-roadmap/statuses/`, {
          project_id: selectedProjectId,
          section_code: selectedSectionCode,
          execution_status: 'not_started',
        });
        setStatusesBySection((prev) => ({ ...prev, [selectedSectionCode]: response.data }));
      } catch (err) {
        console.error(err);
      } finally {
        creatingStatusRef.current = null;
      }
    })();
  }, [selectedProjectId, selectedSectionCode, selectedStatus, selectedId]);

  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.nodes().forEach((n: NodeSingular) => {
      const id = n.id();
      const status = getEffectiveStatus(id, statusesBySection);
      (n as unknown as { data: (key: string, value?: string) => void }).data('status', status);
    });
    const cy = cyRef.current as unknown as { style: () => { update: () => void } };
    if (cy.style?.().update) cy.style().update();
    applyFilters();
    updateHighlights();
  }, [statusesBySection]); // eslint-disable-line react-hooks/exhaustive-deps

  const getSavedPositions = useCallback((): Record<string, { x: number; y: number }> => {
    try {
      const raw = localStorage.getItem(POSITIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const savePositions = useCallback(() => {
    if (!cyRef.current) return;
    const positions: Record<string, { x: number; y: number }> = {};
    cyRef.current.nodes().forEach((n: NodeSingular) => {
      const p = n.position();
      positions[n.id()] = { x: p.x, y: p.y };
    });
    try {
      localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
    } catch {
      /* ignore */
    }
  }, []);

  const buildElements = useCallback(() => {
    const saved = getSavedPositions();
    const cyNodes = NODES.map((n) => {
      const label = (n.text || '').split('\n').map((s) => s.trim()).filter(Boolean).join('\n');
      const w = n.w || 160;
      const h = n.h || 44;
      const defaultPos = { x: n.x + w / 2, y: n.y + h / 2 };
      const position =
        saved[n.id] && typeof saved[n.id].x === 'number' && typeof saved[n.id].y === 'number'
          ? { x: saved[n.id].x, y: saved[n.id].y }
          : defaultPos;
      const status = getEffectiveStatus(n.id, statusesBySection);
      return {
        group: 'nodes' as const,
        data: {
          id: n.id,
          label,
          width: w,
          height: h,
          status: status || '',
          type: n.type || '',
          stage: n.stage || '',
          role: n.role || '',
        },
        position,
      };
    });
    const cyEdges = EDGES.map((e, i) => ({
      group: 'edges' as const,
      data: { id: 'e' + i, source: e.from, target: e.to },
    }));
    return { nodes: cyNodes, edges: cyEdges };
  }, [getSavedPositions, statusesBySection]);

  const applyFilters = useCallback(() => {
    if (!cyRef.current) return;
    const q = searchQuery.trim().toLowerCase();
    const st = statusFilter;
    const visible = new Set<string>();
    const activePath = getPathToActiveBlocks(statusesBySection);
    const blockingPath = getPathToBlocking(statusesBySection);
    NODES.forEach((n) => {
      const nodeStatus = getEffectiveStatus(n.id, statusesBySection);
      let ok = true;
      if (q && n.type !== 'title') ok = n.text.toLowerCase().includes(q);
      if (ok && st !== 'any' && n.type !== 'title') ok = nodeStatus === st;
      if (ok && mode === 'critical' && n.type !== 'title') ok = CRITICAL_PATH.has(n.id);
      if (ok && mode === 'blocking' && n.type !== 'title') ok = nodeStatus === 'blocked';
      if (ok && mode === 'active_path') ok = activePath.has(n.id);
      if (ok && mode === 'path_to_blocking') ok = blockingPath.has(n.id);
      if (ok && mode === 'done_only' && n.type !== 'title') ok = nodeStatus === 'done';
      if (ok && mode === 'in_progress_only' && n.type !== 'title') ok = nodeStatus === 'in_progress';
      if (ok && mode === 'approval_only' && n.type !== 'title') ok = nodeStatus === 'approval';
      if (ok && mode === 'not_started_only' && n.type !== 'title') ok = nodeStatus === 'not_started';
      if (ok) visible.add(n.id);
    });
    cyRef.current.nodes().forEach((n: NodeSingular) => {
      n.style('display', visible.has(n.id()) ? 'element' : 'none');
    });
    cyRef.current.edges().forEach((e: EdgeSingular) => {
      const f = e.source().id();
      const t = e.target().id();
      e.style('display', visible.has(f) && visible.has(t) ? 'element' : 'none');
    });
  }, [searchQuery, mode, statusFilter, statusesBySection]);

  const updateHighlights = useCallback(() => {
    if (!cyRef.current) return;
    cyRef.current.nodes().removeClass('selected dim');
    cyRef.current.edges().removeClass('hi dim');
    applyFilters();
    if (!selectedId) return;
    const pathToSelected = collectDependencies(selectedId);
    cyRef.current.nodes().forEach((n: NodeSingular) => {
      const id = n.id();
      if (!pathToSelected.has(id)) n.addClass('dim');
      if (id === selectedId) n.addClass('selected');
    });
    cyRef.current.edges().forEach((e: EdgeSingular) => {
      const f = e.source().id();
      const t = e.target().id();
      const onPath = pathToSelected.has(f) && pathToSelected.has(t);
      if (!onPath) e.addClass('dim');
      else if (f === selectedId || t === selectedId) e.addClass('hi');
    });
  }, [selectedId, applyFilters]);

  const selectNode = useCallback((id: string) => {
    const n = nodeById(id);
    setSelectedId(id);
    setSelVal(n ? n.text.split('\n')[0] : id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setSelVal('—');
  }, []);

  useEffect(() => {
    updateHighlights();
  }, [updateHighlights]);

  const fitCy = useCallback(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current as unknown as { elements: (selector: string) => { length: number }; fit: (eles: unknown, padding: number) => void; zoom: () => number };
    const visible = cy.elements(':visible');
    cy.fit(visible.length > 0 ? visible : undefined, 28);
    setZoomVal(Math.round((cyRef.current.zoom() ?? 1) * 100));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setMode('all');
    setStatusFilter('any');
    clearSelection();
    setTimeout(() => {
      applyFilters();
      updateHighlights();
      fitCy();
    }, 0);
  }, [clearSelection, applyFilters, updateHighlights, fitCy]);

  const resetPositions = useCallback(() => {
    try {
      localStorage.removeItem(POSITIONS_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (cyContainerRef.current && cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }
    const { nodes: cyNodes, edges: cyEdges } = buildElements();
    if (cyContainerRef.current) {
      cyRef.current = cytoscape({
        container: cyContainerRef.current,
        elements: { nodes: cyNodes, edges: cyEdges },
        style: CYTOSCAPE_STYLE,
        layout: { name: 'preset' },
        minZoom: 0.35,
        maxZoom: 2,
        wheelSensitivity: 0.3,
      });
      cyRef.current.on('tap', 'node', (evt: EventObject) => selectNode((evt.target as NodeSingular).id()));
      cyRef.current.on('tap', (evt: EventObject) => {
        if (evt.target === cyRef.current) clearSelection();
      });
      cyRef.current.on('zoom pan', () => setZoomVal(Math.round((cyRef.current?.zoom() ?? 1) * 100)));
      cyRef.current.on('free', 'node', savePositions);
      cyRef.current.fit(undefined, 28);
      setZoomVal(Math.round((cyRef.current?.zoom() ?? 1) * 100));
      applyFilters();
      updateHighlights();
    }
  }, [buildElements, selectNode, clearSelection, savePositions, applyFilters, updateHighlights]);

  useEffect(() => {
    if (!cyContainerRef.current) return;
    const { nodes: cyNodes, edges: cyEdges } = buildElements();
    cyRef.current = cytoscape({
      container: cyContainerRef.current,
      elements: { nodes: cyNodes, edges: cyEdges },
      style: CYTOSCAPE_STYLE,
      layout: { name: 'preset' },
      minZoom: 0.35,
      maxZoom: 2,
      wheelSensitivity: 0.3,
    });
    cyRef.current.on('tap', 'node', (evt: EventObject) => selectNode((evt.target as NodeSingular).id()));
    cyRef.current.on('tap', (evt: EventObject) => {
      if (evt.target === cyRef.current) clearSelection();
    });
    cyRef.current.on('zoom pan', () => setZoomVal(Math.round((cyRef.current?.zoom() ?? 1) * 100)));
    cyRef.current.on('free', 'node', savePositions);
    cyRef.current.fit(undefined, 28);
    setZoomVal(Math.round((cyRef.current?.zoom() ?? 1) * 100));
    applyFilters();
    updateHighlights();

    const onResize = () => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 28);
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyFilters();
    updateHighlights();
  }, [searchQuery, mode, statusFilter, applyFilters, updateHighlights]);

  const handleStatusChipClick = (status: string) => {
    setStatusFilter(status);
    setMode('all');
  };

  const handlePrint = () => window.print();
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') clearSelection();
  };

  const selectedNode = selectedId ? nodeById(selectedId) : null;
  const deps = selectedId ? edgesTo(selectedId).map((e) => nodeById(e.from)).filter(Boolean) as RoadmapNode[] : [];
  const outs = selectedId ? edgesFrom(selectedId).map((e) => nodeById(e.to)).filter(Boolean) as RoadmapNode[] : [];
  const blockers = selectedNode ? deps.filter((d) => getEffectiveStatus(d.id, statusesBySection) !== 'done') : [];
  const whyText = !selectedId
    ? 'Выберите блок, чтобы увидеть "почему стоим": какие входящие зависимости не завершены и что они блокируют.'
    : blockers.length === 0
      ? `${selectedNode!.text.split('\n')[0]}: входящие зависимости закрыты.`
      : `${selectedNode!.text.split('\n')[0]} "стоит", потому что не закрыты зависимости: ${blockers.map((b) => `${b.text.split('\n')[0]} — ${STATUS[getEffectiveStatus(b.id, statusesBySection)]?.label || getEffectiveStatus(b.id, statusesBySection)}`).join('; ')}`;

  return (
    <>
      <div className="documentRoadmapPage" onKeyDown={handleKeyDown} tabIndex={0}>
        <section className="canvas">
          <div className="canvasHead">
            <div className="canvasHeadRow">
              <div className="t">
                Дорожная карта документов
                {selectedProjectId && (() => {
                  const p = projects.find((pr) => pr.id === selectedProjectId);
                  return p ? <><br />по проекту: {p.name}</> : null;
                })()}
              </div>
              <div className="seg" id="statusChips">
                {[
                  { status: 'any', label: 'Все', cls: '' },
                  { status: 'done', label: 'Выполнено', cls: 'ok' },
                  { status: 'in_progress', label: 'В работе', cls: 'warn' },
                  { status: 'approval', label: 'На согласовании', cls: 'info' },
                  { status: 'blocked', label: 'Блокирует', cls: 'danger' },
                  { status: 'not_started', label: 'Не начато', cls: 'notstarted' },
                ].map(({ status, label, cls }) => (
                  <div
                    key={status}
                    className={`chip ${cls} ${statusFilter === status ? 'active' : ''}`}
                    data-status={status}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStatusChipClick(status)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStatusChipClick(status)}
                    title={`Фильтр: ${label}`}
                  >
                    <span className="dot" />
                    {label}
                  </div>
                ))}
              </div>
              <div className="zoomPills zoomPillsHead">
                {loadingStatuses && <span className="pill muted" style={{ marginRight: 8 }}>Загрузка…</span>}
                <select
                  className="projectSelectHead"
                  value={selectedProjectId ?? ''}
                  onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                  aria-label="Выберите проект"
                  disabled={loadingStatuses}
                >
                  <option value="">Выберите проект</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.code ? `(${p.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="viewportContainer">
            <div className="viewport">
              <div ref={cyContainerRef} style={{ width: '100%', height: '100%', minHeight: 320 }} aria-label="Схема дорожной карты" />
            </div>
          </div>

          <div className="canvasFooter">
            <div className="canvasFooterFilters">
              <div className="footerLeft">
                <div className="field fieldSearch">
                  <label htmlFor="roadmap-search">Поиск</label>
                  <input id="roadmap-search" type="text" placeholder="Госэкспертиза, ТУ, ВК..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="roadmap-mode">Показывать</label>
                  <select id="roadmap-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="all">Все блоки</option>
                    <option value="critical">Критический путь (до Реестра)</option>
                    <option value="blocking">Только блокирующие</option>
                    <option value="active_path">Путь к активным блокам</option>
                    <option value="path_to_blocking">Путь к блокирующим</option>
                    <option value="done_only">Только выполненные</option>
                    <option value="in_progress_only">Только в работе</option>
                    <option value="approval_only">Только на согласовании</option>
                    <option value="not_started_only">Только не начатые</option>
                  </select>
                </div>
                <div className="btnRow">
                  <button type="button" className="btn primary" onClick={fitCy}>
                    Fit
                  </button>
                  <button type="button" className="btn" onClick={resetFilters}>
                    Сброс
                  </button>
                  <button type="button" className="btn ghost" onClick={handlePrint}>
                    Печать
                  </button>
                </div>
              </div>
              <div className="footerRightGroup">
                <div className="footerRight">
                  <button type="button" className="btn" onClick={resetPositions} title="Вернуть блоки в начальные позиции">
                    Сбросить позиции схемы
                  </button>
                </div>
                <div className="zoomPills">
                  <div className="pill">
                    Zoom: <b>{zoomVal}%</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          className={`cardPopupOverlay ${selectedId ? 'isOpen' : ''}`}
          aria-hidden={!selectedId}
          onClick={(e) => e.target === e.currentTarget && clearSelection()}
        >
          <div className="cardPopup" role="dialog" aria-labelledby="cardPopupTitle" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="cardPopupHead">
              <div className="t" id="cardPopupTitle">
                Карточка блока
              </div>
              <button type="button" className="cardPopupClose" onClick={clearSelection} title="Закрыть">
                ✕
              </button>
            </div>
            <div className="cardPopupBody">
              {selectedNode ? (
                <>
                  <div className="kv">
                    <div className="k">Название</div>
                    <div className="v">{escapeHtml(selectedNode.text.split('\n')[0])}</div>
                    <div className="k">Статус</div>
                    <div className="v">{STATUS[effectiveStatusForSelected || '']?.label || effectiveStatusForSelected || '—'}</div>
                    <div className="k">Этап</div>
                    <div className="v">{selectedNode.stage || '—'}</div>
                    <div className="k">Роль</div>
                    <div className="v">{selectedNode.role || '—'}</div>
                  </div>
                  {selectedStatus ? (
                    <>
                      <div className="divider" />
                      <div className="kv">
                        <div className="k">Дата обращения</div>
                        <div className="v">{(selectedStatus.request_date ?? mockStatusForCard?.request_date) ?? '—'}</div>
                        <div className="k">Срок исполнения</div>
                        <div className="v">{(selectedStatus.due_date ?? mockStatusForCard?.due_date) ?? '—'}</div>
                        <div className="k">Срок действия документа</div>
                        <div className="v">{(selectedStatus.valid_until_date ?? mockStatusForCard?.valid_until_date) ?? '—'}</div>
                        <div className="k">Исполнитель (компания)</div>
                        <div className="v">{(selectedStatus.executor_company ?? mockStatusForCard?.executor_company) ?? '—'}</div>
                        <div className="k">Исполнитель (госорган)</div>
                        <div className="v">{(selectedStatus.executor_authority ?? mockStatusForCard?.executor_authority) ?? '—'}</div>
                        {(selectedStatus.note ?? mockStatusForCard?.note) && (
                          <>
                            <div className="k">Примечание</div>
                            <div className="v">{escapeHtml((selectedStatus.note ?? mockStatusForCard?.note) ?? '')}</div>
                          </>
                        )}
                      </div>
                      <div className="divider" />
                      <div className="groupTitle">Файлы ({loadingFiles ? '…' : cardFiles.length})</div>
                      {loadingFiles ? (
                        <p className="muted">Загрузка…</p>
                      ) : (
                        <ul className="cardFileList">
                          {cardFiles.map((f) => (
                            <li key={f.id} className="cardFileItem">
                              <a href={`${API_URL}/document-roadmap/files/${f.id}/download`} target="_blank" rel="noopener noreferrer">
                                {escapeHtml(f.file_name)}
                              </a>
                              <button type="button" className="btn ghost small" onClick={() => handleDeleteFile(f.id)} title="Удалить">
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="cardUpload">
                        <label className="btn ghost small">
                          {uploadingFile ? 'Загрузка…' : 'Прикрепить PDF'}
                          <input
                            type="file"
                            accept="application/pdf"
                            disabled={uploadingFile}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadFile(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </>
                  ) : selectedSectionCode && selectedProjectId ? (
                    <p className="muted" style={{ marginTop: 8 }}>Создание статуса…</p>
                  ) : null}
                  <div className="divider" />
                  <div className="miniItem">
                    <b>Зависимости</b>
                    <p>{deps.length ? deps.map((d) => `${d.text.split('\n')[0]} (${STATUS[getEffectiveStatus(d.id, statusesBySection)]?.label || getEffectiveStatus(d.id, statusesBySection)})`).join(' • ') : 'Нет'}</p>
                  </div>
                  <div className="miniItem" style={{ marginTop: 10 }}>
                    <b>Что блокирует</b>
                    <p>{outs.length ? outs.map((o) => o.text.split('\n')[0]).join(' • ') : 'Нет'}</p>
                  </div>
                  <div className="divider" />
                  <div className="cardPopupWhy">
                    <div className="groupTitle">Подсказка по смыслу</div>
                    <div className="warnBox">{whyText}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="kv">
                    <div className="k">Название</div>
                    <div className="v">—</div>
                    <div className="k">Статус</div>
                    <div className="v">—</div>
                  </div>
                  <div className="divider" />
                  <div className="cardPopupWhy">
                    <div className="groupTitle">Подсказка по смыслу</div>
                    <div className="warnBox">{whyText}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentRoadmap;
