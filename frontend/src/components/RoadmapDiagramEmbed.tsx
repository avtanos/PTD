import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import type { Core } from 'cytoscape';
import axios from 'axios';
import API_URL from '../utils/api';
import { getMockDocumentStatuses } from '../mocks/data';
import './RoadmapDiagramEmbed.css';

interface RoadmapStatus {
  id: number;
  project_id: number;
  section_code: string;
  execution_status: string;
}

const NODE_ID_TO_SECTION_CODE: Record<string, string> = {
  sketch: 'sketch', tu: 'sketch.itc', geo: 'sketch.geo', heat: 'sketch.itc.heat', power: 'sketch.itc.power',
  water: 'sketch.itc.water', gas: 'sketch.itc.gas', phone: 'sketch.itc.phone', urban: 'sketch.urban',
  workproj: 'working', genplan: 'working.genplan', ppr: 'working.ppr', act: 'working.survey', gpar: 'working.gp_ar',
  mchs: 'working.gp_ar.mchs', san: 'working.gp_ar.sanepid', eco: 'working.gp_ar.mpret', exp1: 'working.expertise.stage1',
  registry: 'working.register', exp2: 'working.expertise.stage2', engproj: 'working.networks',
  ext: 'working.networks.external', int: 'working.networks.internal',
  ext_heat: 'working.networks.external.heat', ext_power: 'working.networks.external.power',
  ext_water: 'working.networks.external.water', ext_gas: 'working.networks.external.gas',
  int_hv: 'working.networks.internal.hvac', int_el: 'working.networks.internal.electrical',
  int_vk: 'working.networks.internal.water', int_gas: 'working.networks.internal.gas',
  int_fire: 'working.networks.internal.fire',
};

function apiStatusToFrontend(s: string): string {
  const m: Record<string, string> = { not_started: 'not_started', in_progress: 'in_progress', on_approval: 'approval', completed: 'done' };
  return m[s] ?? 'not_started';
}

function getEffectiveStatus(nodeId: string, statusesBySection: Record<string, RoadmapStatus>, defaultStatus: string): string {
  const code = NODE_ID_TO_SECTION_CODE[nodeId];
  if (!code) return defaultStatus;
  const s = statusesBySection[code];
  return s ? apiStatusToFrontend(s.execution_status) : defaultStatus;
}

const NODES = [
  { id: 'sketch', text: 'Эскизный проект', stage: 'Исходные данные', role: 'Проектировщик', status: 'done', x: 500, y: 130, w: 200, h: 44 },
  { id: 'tu', text: 'Инженерные технические условия', stage: 'Исходные данные', role: 'Архитектура', status: 'approval', x: 260, y: 200, w: 680, h: 74 },
  { id: 'geo', text: 'Инженерные геологические изыскания', stage: 'Исходные данные', role: 'Геодезия/Геология', status: 'in_progress', x: 1100, y: 290, w: 260, h: 74 },
  { id: 'heat', text: 'Теплоснабжение', stage: 'Инженерные сети (ТУ)', role: 'Инженер ОВ', status: 'in_progress', x: 120, y: 290, w: 160, h: 44 },
  { id: 'power', text: 'Электроснабжение', stage: 'Инженерные сети (ТУ)', role: 'Инженер ЭО', status: 'not_started', x: 300, y: 290, w: 170, h: 44 },
  { id: 'water', text: 'Водопровод и канализация', stage: 'Инженерные сети (ТУ)', role: 'Инженер ВК', status: 'in_progress', x: 490, y: 290, w: 210, h: 44 },
  { id: 'gas', text: 'Газоснабжение', stage: 'Инженерные сети (ТУ)', role: 'Инженер Газ', status: 'approval', x: 720, y: 290, w: 170, h: 44 },
  { id: 'phone', text: 'Телефонизация', stage: 'Инженерные сети (ТУ)', role: 'Инженер СС', status: 'not_started', x: 900, y: 290, w: 160, h: 44 },
  { id: 'urban', text: 'Градостроительное заключение', stage: 'Проектирование', role: 'Архитектура', status: 'in_progress', x: 420, y: 360, w: 360, h: 44 },
  { id: 'workproj', text: 'Рабочий проект', stage: 'Проектирование', role: 'ГАП/ГИП', status: 'in_progress', x: 470, y: 430, w: 260, h: 44 },
  { id: 'genplan', text: 'Стройгенплан', stage: 'Проектирование', role: 'ПТО/Производство', status: 'not_started', x: 120, y: 390, w: 260, h: 44 },
  { id: 'ppr', text: 'ППР', stage: 'Проектирование', role: 'ПТО', status: 'not_started', x: 120, y: 444, w: 260, h: 58 },
  { id: 'act', text: 'Акт выноса в натуру', stage: 'Проектирование', role: 'Геодезия', status: 'in_progress', x: 120, y: 512, w: 260, h: 44 },
  { id: 'gpar', text: 'ГП АР', stage: 'Согласования', role: 'Архитектура', status: 'approval', x: 700, y: 500, w: 380, h: 74 },
  { id: 'mchs', text: 'Согласование с МЧС', stage: 'Согласования', role: 'Эксперт', status: 'not_started', x: 1200, y: 495, w: 240, h: 44 },
  { id: 'san', text: 'Согласование с Санэпид', stage: 'Согласования', role: 'Эксперт', status: 'not_started', x: 1200, y: 550, w: 240, h: 44 },
  { id: 'eco', text: 'Согласование с МПРЭТН', stage: 'Согласования', role: 'Эксперт', status: 'in_progress', x: 1200, y: 605, w: 240, h: 52 },
  { id: 'exp1', text: 'Госэкспертиза 1 этап', stage: 'Экспертиза', role: 'Госэкспертиза', status: 'blocked', x: 720, y: 610, w: 360, h: 54 },
  { id: 'registry', text: 'Реестр строящихся объектов', stage: 'Завершение', role: 'Регистратор', status: 'not_started', x: 720, y: 690, w: 360, h: 54 },
  { id: 'exp2', text: '2 этап Госэкспертизы', stage: 'Экспертиза', role: 'Госэкспертиза', status: 'not_started', x: 350, y: 560, w: 280, h: 54 },
  { id: 'engproj', text: 'Проекты Инженерные сети', stage: 'Проектирование', role: 'ГИП', status: 'in_progress', x: 350, y: 640, w: 280, h: 54 },
  { id: 'ext', text: 'Наружные сети', stage: 'Инженерные сети', role: 'Инженеры', status: 'not_started', x: 240, y: 710, w: 220, h: 44 },
  { id: 'int', text: 'Внутренние сети', stage: 'Инженерные сети', role: 'Инженеры', status: 'not_started', x: 520, y: 710, w: 220, h: 44 },
  { id: 'ext_heat', text: 'Теплоснабжение', stage: 'Наружные сети', role: 'ОВ', status: 'not_started', x: 250, y: 770, w: 200, h: 40 },
  { id: 'ext_power', text: 'Электроснабжение', stage: 'Наружные сети', role: 'ЭО', status: 'not_started', x: 250, y: 818, w: 200, h: 40 },
  { id: 'ext_water', text: 'Водопровод и канализация', stage: 'Наружные сети', role: 'ВК', status: 'not_started', x: 250, y: 866, w: 200, h: 40 },
  { id: 'ext_gas', text: 'Газоснабжение', stage: 'Наружные сети', role: 'Газ', status: 'not_started', x: 250, y: 906, w: 200, h: 40 },
  { id: 'int_hv', text: 'Отопление и вентиляция', stage: 'Внутренние сети', role: 'ОВ', status: 'not_started', x: 530, y: 770, w: 200, h: 40 },
  { id: 'int_el', text: 'Электромонтаж', stage: 'Внутренние сети', role: 'ЭО', status: 'not_started', x: 530, y: 818, w: 200, h: 40 },
  { id: 'int_vk', text: 'Водопровод и канализация', stage: 'Внутренние сети', role: 'ВК', status: 'not_started', x: 530, y: 866, w: 200, h: 40 },
  { id: 'int_gas', text: 'Газоснабжение', stage: 'Внутренние сети', role: 'ПБ', status: 'not_started', x: 530, y: 912, w: 200, h: 40 },
  { id: 'int_fire', text: 'Пожаротушение и сигнализация', stage: 'Внутренние сети', role: 'ПБ', status: 'not_started', x: 530, y: 960, w: 200, h: 40 },
];

const EDGES: { from: string; to: string }[] = [
  { from: 'sketch', to: 'tu' }, { from: 'sketch', to: 'geo' }, { from: 'tu', to: 'heat' }, { from: 'tu', to: 'power' },
  { from: 'tu', to: 'water' }, { from: 'tu', to: 'gas' }, { from: 'tu', to: 'phone' }, { from: 'tu', to: 'urban' },
  { from: 'heat', to: 'urban' }, { from: 'power', to: 'urban' }, { from: 'water', to: 'urban' }, { from: 'gas', to: 'urban' },
  { from: 'phone', to: 'urban' }, { from: 'urban', to: 'workproj' }, { from: 'geo', to: 'workproj' },
  { from: 'workproj', to: 'genplan' }, { from: 'workproj', to: 'ppr' }, { from: 'workproj', to: 'act' },
  { from: 'gpar', to: 'mchs' }, { from: 'gpar', to: 'san' }, { from: 'gpar', to: 'eco' }, { from: 'gpar', to: 'exp1' },
  { from: 'workproj', to: 'gpar' }, { from: 'exp1', to: 'registry' }, { from: 'exp1', to: 'exp2' },
  { from: 'exp2', to: 'engproj' }, { from: 'engproj', to: 'ext' }, { from: 'engproj', to: 'int' },
  { from: 'ext', to: 'ext_heat' }, { from: 'ext', to: 'ext_power' }, { from: 'ext', to: 'ext_water' }, { from: 'ext', to: 'ext_gas' },
  { from: 'int', to: 'int_hv' }, { from: 'int', to: 'int_el' }, { from: 'int', to: 'int_vk' }, { from: 'int', to: 'int_gas' }, { from: 'int', to: 'int_fire' },
];

const CYTOSCAPE_STYLE = [
  { selector: 'node', style: { label: 'data(label)', 'text-valign': 'center', 'text-halign': 'center', width: 'data(width)', height: 'data(height)', 'background-color': '#fff', 'border-width': 2, 'border-color': '#0d1736', shape: 'round-rectangle', 'font-size': '12px', color: '#0f172a', 'text-wrap': 'wrap', 'text-max-width': 'data(width)' }},
  { selector: 'node[status="done"]', style: { 'background-color': '#dcfce7', 'border-color': '#4ade80' }},
  { selector: 'node[status="in_progress"]', style: { 'background-color': '#fef9c3', 'border-color': '#ffcc66' }},
  { selector: 'node[status="approval"]', style: { 'background-color': '#e0f2fe', 'border-color': '#38bdf8' }},
  { selector: 'node[status="blocked"]', style: { 'background-color': '#ffe4e4', 'border-color': '#ff6b6b' }},
  { selector: 'node[status="not_started"]', style: { 'background-color': '#ede9fe', 'border-color': '#a78bfa' }},
  { selector: 'edge', style: { width: 2, 'line-color': '#64748b', 'target-arrow-color': '#64748b', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier' }},
];

interface RoadmapDiagramEmbedProps {
  projectId: number;
  height?: string;
}

const RoadmapDiagramEmbed: React.FC<RoadmapDiagramEmbedProps> = ({ projectId, height = '420px' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [statusesBySection, setStatusesBySection] = useState<Record<string, RoadmapStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await axios.post<RoadmapStatus[]>(`${API_URL}/document-roadmap/projects/${projectId}/init-statuses`);
        const list = Array.isArray(r.data) ? r.data : [];
        if (!cancelled) {
          const by: Record<string, RoadmapStatus> = {};
          list.forEach((s) => { by[s.section_code] = s; });
          setStatusesBySection(by);
        }
      } catch {
        try {
          const r = await axios.get<RoadmapStatus[]>(`${API_URL}/document-roadmap/statuses/`, { params: { project_id: projectId } });
          const list = Array.isArray(r.data) ? r.data : [];
          if (!cancelled) {
            const by: Record<string, RoadmapStatus> = {};
            list.forEach((s) => { by[s.section_code] = s; });
            setStatusesBySection(by);
          }
        } catch {
          if (!cancelled) {
            const mock = getMockDocumentStatuses(projectId) as RoadmapStatus[];
            const by: Record<string, RoadmapStatus> = {};
            mock.forEach((s) => { by[s.section_code] = s; });
            setStatusesBySection(by);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    if (loading || !containerRef.current) return;
    const cyNodes = NODES.map((n) => {
      const label = (n.text || '').split('\n').map((s) => s.trim()).filter(Boolean).join('\n');
      const w = n.w || 160;
      const h = n.h || 44;
      const status = getEffectiveStatus(n.id, statusesBySection, n.status || 'not_started');
      return {
        group: 'nodes' as const,
        data: { id: n.id, label, width: w, height: h, status },
        position: { x: n.x + w / 2, y: n.y + h / 2 },
      };
    });
    const cyEdges = EDGES.map((e, i) => ({ group: 'edges' as const, data: { id: 'e' + i, source: e.from, target: e.to } }));

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: { nodes: cyNodes, edges: cyEdges },
      style: CYTOSCAPE_STYLE,
      layout: { name: 'preset' },
      minZoom: 0.3,
      maxZoom: 2,
      wheelSensitivity: 0.3,
    });
    cyRef.current.fit(undefined, 20);

    const onResize = () => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 20);
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
  }, [loading, statusesBySection]);

  if (loading) return <div className="roadmapDiagramEmbedLoading">Загрузка дорожной карты…</div>;

  return (
    <div className="roadmapDiagramEmbed" style={{ height }}>
      <div ref={containerRef} className="roadmapDiagramEmbedCanvas" aria-label="Схема дорожной карты документов" />
      <a className="btn small" href="#roadmap" style={{ marginTop: 10 }}>Открыть полную дорожную карту</a>
    </div>
  );
};

export default RoadmapDiagramEmbed;
