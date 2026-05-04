/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Общий ключ с демо-блоками и квартирами (для реестра клиентов и др.) */
export const PROJECT_BLOCKS_STORAGE_KEY = 'ptd.projectBlocks.v1';

// ──── DATA ────
const BLOCKS_RAW: Record<
  string,
  {
    floors: { floor: string; from: number; to: number; h: number; res: boolean }[];
    apts: number;
    labels: string[];
    defaultPos: [number, number];
    w: number;
    d: number;
  }
> = {
  'Блок 1': {
    floors: [
      { floor: 'Ф', from: -15.6, to: -14.2, h: 1.4, res: false },
      { floor: '-3', from: -14.2, to: -8.8, h: 5.4, res: false },
      { floor: '-2', from: -8.8, to: -4.6, h: 4.2, res: false },
      { floor: '-1', from: -4.6, to: -0.1, h: 4.5, res: false },
      { floor: '1', from: -0.1, to: 4.7, h: 4.8, res: true },
      { floor: '2', from: 4.7, to: 8.15, h: 3.45, res: true },
      { floor: '3', from: 8.75, to: 12.2, h: 3.45, res: true },
      { floor: '4', from: 12.2, to: 15.65, h: 3.45, res: true },
      { floor: '5', from: 15.65, to: 19.1, h: 3.45, res: true },
      { floor: '6', from: 19.1, to: 22.55, h: 3.45, res: true },
      { floor: '7', from: 22.55, to: 26.0, h: 3.45, res: true },
      { floor: '8', from: 26.0, to: 29.45, h: 3.45, res: true },
      { floor: '9', from: 29.45, to: 32.9, h: 3.45, res: true },
      { floor: '10', from: 32.9, to: 36.35, h: 3.45, res: true },
      { floor: '11', from: 36.35, to: 39.8, h: 3.45, res: true },
      { floor: '12', from: 39.8, to: 43.25, h: 3.45, res: true },
      { floor: '13', from: 43.25, to: 46.7, h: 3.45, res: true },
      { floor: '14', from: 46.7, to: 50.15, h: 3.45, res: true },
      { floor: '15т', from: 50.15, to: 53.6, h: 3.45, res: false },
    ],
    apts: 6,
    labels: ['1к', '2к', '3к', '2к', '1к', 'Ст'],
    defaultPos: [-16, 0],
    w: 10,
    d: 8,
  },
  'Блок 2': {
    floors: [
      { floor: 'Ф', from: -15.6, to: -11.55, h: 4.05, res: false },
      { floor: '-3', from: -13.1, to: -9.65, h: 3.45, res: false },
      { floor: '-2', from: -8.8, to: -5.35, h: 3.45, res: false },
      { floor: '-1', from: -4.6, to: -1.15, h: 3.45, res: false },
      { floor: '1', from: -0.1, to: 3.35, h: 3.45, res: true },
      { floor: '2', from: 4.7, to: 8.15, h: 3.45, res: true },
      { floor: '3', from: 8.75, to: 12.2, h: 3.45, res: true },
      { floor: '4', from: 12.2, to: 15.65, h: 3.45, res: true },
      { floor: '5', from: 15.65, to: 19.1, h: 3.45, res: true },
      { floor: '6', from: 19.1, to: 22.55, h: 3.45, res: true },
      { floor: '7', from: 22.55, to: 26.0, h: 3.45, res: true },
      { floor: '8', from: 26.0, to: 29.45, h: 3.45, res: true },
      { floor: '9', from: 29.45, to: 32.9, h: 3.45, res: true },
      { floor: '10', from: 32.9, to: 36.35, h: 3.45, res: true },
      { floor: '11', from: 36.35, to: 39.8, h: 3.45, res: true },
      { floor: '12', from: 39.8, to: 43.25, h: 3.45, res: true },
      { floor: '13', from: 43.25, to: 46.7, h: 3.45, res: true },
      { floor: '14', from: 46.7, to: 50.15, h: 3.45, res: true },
      { floor: '15', from: 50.15, to: 53.6, h: 3.45, res: true },
      { floor: '16', from: 53.6, to: 57.05, h: 3.45, res: true },
      { floor: '17', from: 57.05, to: 60.5, h: 3.45, res: true },
      { floor: '18', from: 60.5, to: 64.1, h: 3.6, res: true },
      { floor: '19', from: 64.1, to: 67.55, h: 3.45, res: true },
      { floor: '20', from: 67.55, to: 71.0, h: 3.45, res: true },
      { floor: '21', from: 71.0, to: 74.45, h: 3.45, res: true },
      { floor: '22', from: 74.45, to: 77.9, h: 3.45, res: true },
      { floor: '23т', from: 77.9, to: 81.7, h: 3.8, res: false },
    ],
    apts: 8,
    labels: ['1к', '2к', '3к', '2к', '1к', '2к', '3к', 'Ст'],
    defaultPos: [0, 0],
    w: 12,
    d: 10,
  },
  'Блок 3': {
    floors: [
      { floor: 'Ф', from: -15.6, to: -14.2, h: 1.4, res: false },
      { floor: '-3', from: -14.2, to: -8.8, h: 5.4, res: false },
      { floor: '-2', from: -8.8, to: -4.6, h: 4.2, res: false },
      { floor: '-1', from: -4.6, to: -0.1, h: 4.5, res: false },
      { floor: '1', from: -0.1, to: 4.7, h: 4.8, res: true },
      { floor: '2', from: 4.7, to: 8.15, h: 3.45, res: true },
      { floor: '3', from: 8.75, to: 12.2, h: 3.45, res: true },
      { floor: '4', from: 12.2, to: 15.65, h: 3.45, res: true },
      { floor: '5', from: 15.65, to: 19.1, h: 3.45, res: true },
      { floor: '6', from: 19.1, to: 22.55, h: 3.45, res: true },
      { floor: '7', from: 22.55, to: 26.0, h: 3.45, res: true },
      { floor: '8', from: 26.0, to: 29.45, h: 3.45, res: true },
      { floor: '9', from: 29.45, to: 32.9, h: 3.45, res: true },
      { floor: '10', from: 32.9, to: 36.35, h: 3.45, res: true },
      { floor: '11', from: 36.35, to: 39.8, h: 3.45, res: true },
      { floor: '12', from: 39.8, to: 43.25, h: 3.45, res: true },
      { floor: '13', from: 43.25, to: 46.7, h: 3.45, res: true },
      { floor: '14', from: 46.7, to: 50.15, h: 3.45, res: true },
      { floor: '15т', from: 50.15, to: 53.6, h: 3.45, res: false },
    ],
    apts: 6,
    labels: ['1к', '2к', '3к', '2к', '1к', 'Ст'],
    defaultPos: [16, 0],
    w: 10,
    d: 8,
  },
};

const SHAPES: { id: string; name: string; icon: string }[] = [
  { id: 'rect', name: 'Прямоугольник', icon: '▬' },
  { id: 'lshape', name: 'Г-образный', icon: '⌐' },
  { id: 'ushape', name: 'П-образный', icon: '⊓' },
  { id: 'tshape', name: 'Т-образный', icon: '⊤' },
  { id: 'hshape', name: 'Н-образный', icon: 'H' },
  { id: 'cross', name: 'Крестовой', icon: '✚' },
  { id: 'tower', name: 'Башня', icon: '▮' },
  { id: 'circle', name: 'Круглый', icon: '●' },
  { id: 'hexagon', name: 'Шестиугол.', icon: '⬡' },
  { id: 'octagon', name: 'Восьмиугол.', icon: '⯁' },
  { id: 'diamond', name: 'Ромб', icon: '◆' },
];

/** Формы, у которых геометрия лежит вдоль оси Y (Cylinder и т.п.) — без поворота. */
const Y_AXIS_SHAPES = new Set(['tower', 'circle']);

/** Полигон формы в локальных координатах блока (X×Z), упорядочен по контуру. */
function getShapePolygon(shape: string, w: number, d: number): Array<[number, number]> {
  const hw = w / 2;
  const hd = d / 2;
  switch (shape) {
    case 'lshape': {
      const cut = 0.4;
      return [
        [-hw, -hd],
        [hw, -hd],
        [hw, hd * cut],
        [hw * cut, hd * cut],
        [hw * cut, hd],
        [-hw, hd],
      ];
    }
    case 'ushape': {
      const wall = 0.25;
      return [
        [-hw, -hd],
        [hw, -hd],
        [hw, hd],
        [hw - hw * wall, hd],
        [hw - hw * wall, -hd + hd * wall * 2],
        [-hw + hw * wall, -hd + hd * wall * 2],
        [-hw + hw * wall, hd],
        [-hw, hd],
      ];
    }
    case 'tshape': {
      const stem = 0.35;
      const bar = 0.4;
      return [
        [-hw, -hd],
        [hw, -hd],
        [hw, -hd + d * bar],
        [hw * stem, -hd + d * bar],
        [hw * stem, hd],
        [-hw * stem, hd],
        [-hw * stem, -hd + d * bar],
        [-hw, -hd + d * bar],
      ];
    }
    case 'hshape': {
      const wall = 0.3;
      const cross = 0.25;
      return [
        [-hw, -hd],
        [-hw + w * wall, -hd],
        [-hw + w * wall, -hd * cross],
        [hw - w * wall, -hd * cross],
        [hw - w * wall, -hd],
        [hw, -hd],
        [hw, hd],
        [hw - w * wall, hd],
        [hw - w * wall, hd * cross],
        [-hw + w * wall, hd * cross],
        [-hw + w * wall, hd],
        [-hw, hd],
      ];
    }
    case 'cross': {
      const arm = 0.35;
      return [
        [-hw * arm, -hd],
        [hw * arm, -hd],
        [hw * arm, -hd * arm],
        [hw, -hd * arm],
        [hw, hd * arm],
        [hw * arm, hd * arm],
        [hw * arm, hd],
        [-hw * arm, hd],
        [-hw * arm, hd * arm],
        [-hw, hd * arm],
        [-hw, -hd * arm],
        [-hw * arm, -hd * arm],
      ];
    }
    case 'hexagon': {
      const out: Array<[number, number]> = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        out.push([Math.cos(a) * hw, Math.sin(a) * hd]);
      }
      return out;
    }
    case 'octagon': {
      const cut = 0.3;
      return [
        [-hw + hw * cut, -hd],
        [hw - hw * cut, -hd],
        [hw, -hd + hd * cut],
        [hw, hd - hd * cut],
        [hw - hw * cut, hd],
        [-hw + hw * cut, hd],
        [-hw, hd - hd * cut],
        [-hw, -hd + hd * cut],
      ];
    }
    case 'diamond':
      return [
        [0, -hd],
        [hw, 0],
        [0, hd],
        [-hw, 0],
      ];
    default:
      return [
        [-hw, -hd],
        [hw, -hd],
        [hw, hd],
        [-hw, hd],
      ];
  }
}

function pointInPolygon(poly: Array<[number, number]>, x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Внутри ли точка формы блока (Z — вторая координата плана). */
function pointInShape(shape: string, w: number, d: number, x: number, z: number): boolean {
  if (shape === 'rect') return Math.abs(x) <= w / 2 && Math.abs(z) <= d / 2;
  if (shape === 'tower' || shape === 'circle') {
    const rx = w / 2;
    const ry = d / 2;
    if (rx <= 0 || ry <= 0) return false;
    return (x * x) / (rx * rx) + (z * z) / (ry * ry) <= 1;
  }
  return pointInPolygon(getShapePolygon(shape, w, d), x, z);
}

/** Слоты для квартир внутри формы блока: (x, z) — центр, (sx, sz) — размер. */
function computeApartmentSlots(
  shape: string,
  w: number,
  d: number,
  n: number,
): Array<{ cx: number; cz: number; sx: number; sz: number; col: number; row: number }> {
  if (n <= 0) return [];
  const gX = 0.12;
  const gZ = 0.12;
  const startCols = Math.max(1, Math.min(Math.round(Math.sqrt(n * (w / Math.max(0.1, d)))), 6));
  for (let cols = startCols; cols <= 12; cols++) {
    const rows = Math.max(1, Math.ceil(n / cols));
    const aW = (w - gX * (cols + 1)) / cols;
    const aD = (d - gZ * (rows + 1)) / rows;
    if (aW <= 0.2 || aD <= 0.2) continue;
    const cells: Array<{ cx: number; cz: number; sx: number; sz: number; col: number; row: number }> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = -w / 2 + gX + aW / 2 + c * (aW + gX);
        const cz = -d / 2 + gZ + aD / 2 + r * (aD + gZ);
        if (pointInShape(shape, w, d, cx, cz)) cells.push({ cx, cz, sx: aW, sz: aD, col: c, row: r });
      }
    }
    if (cells.length >= n) return cells.slice(0, n);
  }
  // запасной план: разреженная сетка 12×N
  const fb: Array<{ cx: number; cz: number; sx: number; sz: number; col: number; row: number }> = [];
  const cols = 12;
  const rows = Math.max(1, Math.ceil(n / cols));
  const aW = (w - gX * (cols + 1)) / cols;
  const aD = (d - gZ * (rows + 1)) / rows;
  for (let r = 0; r < rows && fb.length < n; r++) {
    for (let c = 0; c < cols && fb.length < n; c++) {
      fb.push({
        cx: -w / 2 + gX + aW / 2 + c * (aW + gX),
        cz: -d / 2 + gZ + aD / 2 + r * (aD + gZ),
        sx: aW,
        sz: aD,
        col: c,
        row: r,
      });
    }
  }
  return fb;
}

export interface ClientRecord {
  id: string;
  fio: string;
  phone: string;
  email: string;
  passport: string;
}

/** Тестовые мокап-данные: не использовать как реальные персональные данные */
export const CLIENTS: ClientRecord[] = [
  {
    id: 'MOCK-CL-01',
    fio: 'Мокап: Покупатель №1 (выдуманное ФИО)',
    phone: '+7 (900) 555-00-01',
    email: 'mock.client.01@example.invalid',
    passport: 'MOCK-PASS-000001',
  },
  {
    id: 'MOCK-CL-02',
    fio: 'Мокап: Покупатель №2 (выдуманное ФИО)',
    phone: '+7 (900) 555-00-02',
    email: 'mock.client.02@example.invalid',
    passport: 'MOCK-PASS-000002',
  },
  {
    id: 'MOCK-CL-03',
    fio: 'Мокап: Покупатель №3 (выдуманное ФИО)',
    phone: '+7 (900) 555-00-03',
    email: 'mock.client.03@example.invalid',
    passport: 'MOCK-PASS-000003',
  },
  {
    id: 'MOCK-CL-04',
    fio: 'Мокап: Покупатель №4 (выдуманное ФИО)',
    phone: '+7 (900) 555-00-04',
    email: 'mock.client.04@example.invalid',
    passport: 'MOCK-PASS-000004',
  },
  {
    id: 'MOCK-CL-05',
    fio: 'Мокап: Покупатель №5 (выдуманное ФИО)',
    phone: '+7 (900) 555-00-05',
    email: 'mock.client.05@example.invalid',
    passport: 'MOCK-PASS-000005',
  },
  {
    id: 'MOCK-CL-06',
    fio: 'Мокап: Покупатель №6 (выдуманное ФИО)',
    phone: '+7 (900) 555-00-06',
    email: 'mock.client.06@example.invalid',
    passport: 'MOCK-PASS-000006',
  },
  {
    id: 'MOCK-CL-07',
    fio: 'Мокап: Покупатель №7 (выдуманное ФИО)',
    phone: '+7 (900) 555-00-07',
    email: 'mock.client.07@example.invalid',
    passport: 'MOCK-PASS-000007',
  },
  {
    id: 'MOCK-CL-08',
    fio: 'Мокап: Покупатель №8 (выдуманное ФИО)',
    phone: '+7 (900) 555-00-08',
    email: 'mock.client.08@example.invalid',
    passport: 'MOCK-PASS-000008',
  },
  {
    id: 'MOCK-CL-09',
    fio: 'Мокап: Покупатель №9 (выдуманное ФИО)',
    phone: '+7 (900) 555-00-09',
    email: 'mock.client.09@example.invalid',
    passport: 'MOCK-PASS-000009',
  },
  {
    id: 'MOCK-CL-10',
    fio: 'Мокап: Покупатель №10 (выдуманное ФИО)',
    phone: '+7 (900) 555-00-10',
    email: 'mock.client.10@example.invalid',
    passport: 'MOCK-PASS-000010',
  },
];

const SC: Record<string, string> = { sold: 'var(--danger)', free: 'var(--ok)', reserved: 'var(--warn)' };
const SL: Record<string, string> = { sold: 'Продана', free: 'Свободна', reserved: 'Бронь' };

type AptStatus = 'sold' | 'free' | 'reserved';

export interface Apartment {
  id: string;
  block: string;
  floor: string;
  aptIdx: number;
  type: string;
  area: number;
  price: number;
  status: AptStatus;
  clientId: string | null;
  /** позиция вне действующей сетки после изменения эт./квартир (сохранённые продажи) */
  orphaned?: boolean;
}

const LEGACY_CLIENT_ID_MAP: Record<string, string> = {
  'CL-0001': 'MOCK-CL-01',
  'CL-0002': 'MOCK-CL-02',
  'CL-0003': 'MOCK-CL-03',
  'CL-0004': 'MOCK-CL-04',
  'CL-0005': 'MOCK-CL-05',
  'CL-0006': 'MOCK-CL-06',
  'CL-0007': 'MOCK-CL-07',
  'CL-0008': 'MOCK-CL-08',
  'CL-0009': 'MOCK-CL-09',
  'CL-0010': 'MOCK-CL-10',
};

function migrateClientId(id: string | null | undefined): string | null {
  if (id == null || id === '') return null;
  return LEGACY_CLIENT_ID_MAP[id] ?? id;
}

function migrateApartmentsClientIds(aps: Apartment[]): Apartment[] {
  return aps.map((a) => {
    const nid = migrateClientId(a.clientId);
    return nid === a.clientId ? a : { ...a, clientId: nid };
  });
}

/** Снимок квартир из localStorage (как во вкладке «Блоки» проекта) */
export function loadApartmentsFromStorage(): Apartment[] {
  try {
    const raw = localStorage.getItem(PROJECT_BLOCKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.apartments)) return [];
    return migrateApartmentsClientIds(parsed.apartments as Apartment[]);
  } catch {
    return [];
  }
}

function aptIsProtected(a: Apartment): boolean {
  return a.status === 'sold' || a.status === 'reserved' || !!a.clientId;
}

function slotKeyFor(floor: string, aptIdx: number) {
  return `${String(floor)}::${aptIdx}`;
}

/** Полная синхронизация квартир блока после смены этажности / числа квартир на этаже */
function mergeApartmentsAfterBlockStructureChange(
  prev: Apartment[],
  opts: {
    finalName: string;
    prevName: string | null;
    floors: { floor: string; res: boolean }[];
    aptsCount: number;
    labels: string[];
    preserveSales: boolean;
  },
): Apartment[] {
  const { finalName, prevName, floors, aptsCount, labels, preserveSales } = opts;
  const resFloors = floors.filter((f) => f.res).map((f) => String(f.floor));
  const validKeys = new Set<string>();
  resFloors.forEach((fl) => {
    for (let i = 0; i < aptsCount; i++) validKeys.add(slotKeyFor(fl, i));
  });

  const oldForBlock = prev.filter((a) => a.block === finalName || (prevName !== null && a.block === prevName));
  /** приоритет: не orphaned, затем проданные/бронь/клиент */
  const bySlot = new Map<string, Apartment>();
  oldForBlock.forEach((a) => {
    if (a.orphaned) return;
    const k = slotKeyFor(String(a.floor), a.aptIdx);
    const cur = bySlot.get(k);
    if (!cur) {
      bySlot.set(k, a);
      return;
    }
    if (aptIsProtected(a) && !aptIsProtected(cur)) bySlot.set(k, a);
  });

  const rebuilt: Apartment[] = [];
  resFloors.forEach((fl) => {
    for (let i = 0; i < aptsCount; i++) {
      const k = slotKeyFor(fl, i);
      const ex = bySlot.get(k);
      const canonicalId = `${finalName}-${fl}-${i}`;
      if (ex) {
        rebuilt.push({
          ...ex,
          id: canonicalId,
          block: finalName,
          floor: fl,
          aptIdx: i,
          type: labels[i] ?? ex.type ?? `#${i + 1}`,
          orphaned: undefined,
        });
      } else {
        rebuilt.push({
          id: canonicalId,
          block: finalName,
          floor: fl,
          aptIdx: i,
          type: labels[i] ?? `#${i + 1}`,
          area: 40,
          price: 40000,
          status: 'free',
          clientId: null,
        });
      }
    }
  });

  let orphans: Apartment[] = [];
  if (preserveSales) {
    const rebuiltKeys = new Set(rebuilt.map((a) => slotKeyFor(String(a.floor), a.aptIdx)));
    const seenLegacy = new Set<string>();
    oldForBlock.forEach((old) => {
      if (!aptIsProtected(old) || old.orphaned) return;
      const k = slotKeyFor(String(old.floor), old.aptIdx);
      if (rebuiltKeys.has(k)) return;
      if (seenLegacy.has(k)) return;
      seenLegacy.add(k);
      const safeFlo = encodeURIComponent(String(old.floor)).replace(/%/g, '_');
      orphans.push({
        ...old,
        block: finalName,
        orphaned: true,
        id: `${finalName}-сохран-${safeFlo}-${old.aptIdx}-${old.id}`,
      });
    });
  }

  const rest = prev.filter((a) => !(a.block === finalName || (prevName !== null && a.block === prevName)));
  return [...rest, ...rebuilt, ...orphans];
}

function genApartments(blocks: typeof BLOCKS_RAW): Apartment[] {
  const a: Apartment[] = [];
  let ci = 0;
  Object.entries(blocks).forEach(([bn, bd]) => {
    bd.floors.forEach((fl) => {
      if (!fl.res) return;
      for (let i = 0; i < bd.apts; i++) {
        const sts: AptStatus[] = ['sold', 'sold', 'sold', 'free', 'reserved', 'sold', 'free'];
        const st = sts[(ci + i) % sts.length];
        const area = 35 + ((ci * 7 + i * 13) % 80);
        const price = area * (850 + ((ci * 3 + i * 17) % 400));
        a.push({
          id: `${bn}-${fl.floor}-${i}`,
          block: bn,
          floor: fl.floor,
          aptIdx: i,
          type: bd.labels[i],
          area,
          price,
          status: st,
          clientId: st === 'sold' ? CLIENTS[ci % CLIENTS.length]?.id ?? null : null,
        });
        if (st === 'sold') ci++;
      }
    });
  });
  return a;
}

// Initial demo apartments are generated in state (see ProjectBlocksTab)

interface PaymentRow {
  n: number;
  date: string;
  amount: number;
  type: string;
  paid: boolean;
}

export function genPayments(apt: Apartment | null): PaymentRow[] {
  if (!apt?.clientId) return [];
  const t = apt.price;
  const d = Math.round(t * 0.3);
  const r = t - d;
  const mo = 12 + ((apt.area * 3) % 24);
  const mp = Math.round(r / mo);
  const MOCK_PAY_YEAR = 2099;
  const p: PaymentRow[] = [
    { n: 0, date: `${MOCK_PAY_YEAR}-03-01`, amount: d, type: 'Первонач. (мок)', paid: true },
  ];
  for (let i = 1; i <= mo; i++) {
    const m = ((2 + i) % 12) + 1;
    const y = MOCK_PAY_YEAR + Math.floor((2 + i) / 12);
    p.push({
      n: i,
      date: `${y}-${String(m).padStart(2, '0')}-01`,
      amount: i === mo ? r - mp * (mo - 1) : mp,
      type: 'Ежемес. (мок)',
      paid: i <= 6,
    });
  }
  return p;
}

// ──── SHAPE GEOMETRY BUILDERS ────
function buildShapeGeometry(THREE: any, shape: string, w: number, h: number, d: number) {
  switch (shape) {
    case 'lshape': {
      const s = new THREE.Shape();
      const hw = w / 2;
      const hd = d / 2;
      const cut = 0.4;
      s.moveTo(-hw, -hd);
      s.lineTo(hw, -hd);
      s.lineTo(hw, hd * cut);
      s.lineTo(hw * cut, hd * cut);
      s.lineTo(hw * cut, hd);
      s.lineTo(-hw, hd);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    }
    case 'ushape': {
      const s = new THREE.Shape();
      const hw = w / 2;
      const hd = d / 2;
      const wall = 0.25;
      s.moveTo(-hw, -hd);
      s.lineTo(hw, -hd);
      s.lineTo(hw, hd);
      s.lineTo(hw - hw * wall, hd);
      s.lineTo(hw - hw * wall, -hd + hd * wall * 2);
      s.lineTo(-hw + hw * wall, -hd + hd * wall * 2);
      s.lineTo(-hw + hw * wall, hd);
      s.lineTo(-hw, hd);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    }
    case 'tower': {
      return new THREE.CylinderGeometry((Math.min(w, d) / 2) * 0.85, (Math.min(w, d) / 2) * 0.9, h, 8);
    }
    case 'circle': {
      const r = Math.min(w, d) / 2;
      return new THREE.CylinderGeometry(r, r, h, 36);
    }
    case 'tshape': {
      const s = new THREE.Shape();
      const hw = w / 2;
      const hd = d / 2;
      const stem = 0.35;
      const bar = 0.4;
      s.moveTo(-hw, -hd);
      s.lineTo(hw, -hd);
      s.lineTo(hw, -hd + d * bar);
      s.lineTo(hw * stem, -hd + d * bar);
      s.lineTo(hw * stem, hd);
      s.lineTo(-hw * stem, hd);
      s.lineTo(-hw * stem, -hd + d * bar);
      s.lineTo(-hw, -hd + d * bar);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    }
    case 'hshape': {
      const s = new THREE.Shape();
      const hw = w / 2;
      const hd = d / 2;
      const wall = 0.3;
      const cross = 0.25;
      s.moveTo(-hw, -hd);
      s.lineTo(-hw + w * wall, -hd);
      s.lineTo(-hw + w * wall, -hd * cross);
      s.lineTo(hw - w * wall, -hd * cross);
      s.lineTo(hw - w * wall, -hd);
      s.lineTo(hw, -hd);
      s.lineTo(hw, hd);
      s.lineTo(hw - w * wall, hd);
      s.lineTo(hw - w * wall, hd * cross);
      s.lineTo(-hw + w * wall, hd * cross);
      s.lineTo(-hw + w * wall, hd);
      s.lineTo(-hw, hd);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    }
    case 'hexagon': {
      const s = new THREE.Shape();
      const rx = w / 2;
      const ry = d / 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const x = Math.cos(a) * rx;
        const y = Math.sin(a) * ry;
        if (i === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      }
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    }
    case 'octagon': {
      const s = new THREE.Shape();
      const hw = w / 2;
      const hd = d / 2;
      const cut = 0.3;
      s.moveTo(-hw + hw * cut, -hd);
      s.lineTo(hw - hw * cut, -hd);
      s.lineTo(hw, -hd + hd * cut);
      s.lineTo(hw, hd - hd * cut);
      s.lineTo(hw - hw * cut, hd);
      s.lineTo(-hw + hw * cut, hd);
      s.lineTo(-hw, hd - hd * cut);
      s.lineTo(-hw, -hd + hd * cut);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    }
    case 'diamond': {
      const s = new THREE.Shape();
      const hw = w / 2;
      const hd = d / 2;
      s.moveTo(0, -hd);
      s.lineTo(hw, 0);
      s.lineTo(0, hd);
      s.lineTo(-hw, 0);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    }
    case 'cross': {
      const s = new THREE.Shape();
      const hw = w / 2;
      const hd = d / 2;
      const arm = 0.35;
      s.moveTo(-hw * arm, -hd);
      s.lineTo(hw * arm, -hd);
      s.lineTo(hw * arm, -hd * arm);
      s.lineTo(hw, -hd * arm);
      s.lineTo(hw, hd * arm);
      s.lineTo(hw * arm, hd * arm);
      s.lineTo(hw * arm, hd);
      s.lineTo(-hw * arm, hd);
      s.lineTo(-hw * arm, hd * arm);
      s.lineTo(-hw, hd * arm);
      s.lineTo(-hw, -hd * arm);
      s.lineTo(-hw * arm, -hd * arm);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    }
    default:
      return new THREE.BoxGeometry(w, h, d);
  }
}

// ──── 3D SCENE ────
interface Scene3DProps {
  onSelect: (apt: Apartment) => void;
  blocks: typeof BLOCKS_RAW;
  apartments: Apartment[];
  blockPositions: Record<string, [number, number]>;
  setBlockPositions: React.Dispatch<React.SetStateAction<Record<string, [number, number]>>>;
  blockShapes: Record<string, string>;
  editMode: boolean;
}

function Scene3D({
  onSelect,
  blocks,
  apartments,
  blockPositions,
  setBlockPositions,
  blockShapes,
  editMode,
}: Scene3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const rebuildRef = useRef(0);
  const editModeRef = useRef(editMode);
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);
  /** Актуальные данные сцены: основной эффект Three.js монтируется один раз, иначе buildScene замыкает старые blocks/apartments */
  const blocksRef = useRef(blocks);
  const apartmentsRef = useRef(apartments);
  const blockPositionsRef = useRef(blockPositions);
  const blockShapesRef = useRef(blockShapes);
  const onSelectRef = useRef(onSelect);
  blocksRef.current = blocks;
  apartmentsRef.current = apartments;
  blockPositionsRef.current = blockPositions;
  blockShapesRef.current = blockShapes;
  onSelectRef.current = onSelect;

  const rebuild = useCallback(() => {
    rebuildRef.current += 1;
  }, []);

  useEffect(() => {
    rebuild();
  }, [blocks, apartments, blockPositions, blockShapes, rebuild]);

  useEffect(() => {
    const THREE = (window as any).THREE;
    const mount = mountRef.current;
    if (!THREE || !mount) return;

    const el = mount;

    const W = el.clientWidth;
    const H = el.clientHeight;
    if (W < 2 || H < 2) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c12);
    scene.fog = new THREE.FogExp2(0x080c12, 0.005);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x334455, 0.5));
    const dir = new THREE.DirectionalLight(0xffeedd, 1.2);
    dir.position.set(30, 50, 20);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -50;
    dir.shadow.camera.right = 50;
    dir.shadow.camera.top = 50;
    dir.shadow.camera.bottom = -10;
    scene.add(dir);
    scene.add(new THREE.DirectionalLight(0x4488ff, 0.3).translateX(-20).translateY(30).translateZ(-30));
    const ptLight = new THREE.PointLight(0x22cc66, 0.4, 80);
    ptLight.position.set(0, 40, 0);
    scene.add(ptLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ color: 0x0a1210, roughness: 0.9 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    scene.add(new THREE.GridHelper(120, 50, 0x142a1a, 0x0c1a10));

    let theta = Math.PI / 4;
    let phi = Math.PI / 5;
    let radius = 65;

    function updateCam() {
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta),
      );
      camera.lookAt(0, 14, 0);
    }
    updateCam();

    let isDrag = false;
    let isBlockDrag = false;
    let justDragged = false;
    let dragBlock: string | null = null;
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const dragOffset = new THREE.Vector3();
    let prevX = 0;
    let prevY = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const blockGroups: Record<string, any> = {};
    let floorMeshes: any[] = [];

    function buildScene() {
      Object.values(blockGroups).forEach((g: any) => scene.remove(g));
      Object.keys(blockGroups).forEach((k) => delete blockGroups[k]);
      floorMeshes = [];
      const SCALE = 0.42;

      Object.entries(blocks).forEach(([bName, bd]) => {
        const pos = blockPositions[bName] ?? bd.defaultPos;
        const shape = blockShapes[bName] ?? 'rect';
        const group = new THREE.Group();
        group.position.set(pos[0], 0, pos[1]);
        group.userData = { blockName: bName, isBlock: true };

        /** Нежилые этажи до первого жилого — прямой прямоугольник по габаритам (ствол в форме блока только выше). */
        const firstResidentialIdx = bd.floors.findIndex((f) => f.res);

        bd.floors.forEach((fl, flIdx) => {
          const flH = fl.h * SCALE;
          const flY = (fl.from + 15.6) * SCALE + flH / 2;

          /** Силуэт блока только для участка над подзамком; префикс нежилых — box(w×d). */
          const shellShape =
            !fl.res && firstResidentialIdx !== -1 && flIdx < firstResidentialIdx ? 'rect' : shape;

          if (fl.res) {
            const slots = computeApartmentSlots(shape, bd.w, bd.d, bd.apts);
            for (let a = 0; a < bd.apts; a++) {
              const slot = slots[a];
              if (!slot) continue;
              const apt = apartments.find(
                (ap) =>
                  !ap.orphaned &&
                  ap.block === bName &&
                  String(ap.floor) === String(fl.floor) &&
                  ap.aptIdx === a,
              );
              const colorHex =
                apt?.status === 'sold' ? 0xef4444 : apt?.status === 'free' ? 0x22c55e : apt?.status === 'reserved' ? 0xf59e0b : 0x555555;
              const geo = new THREE.BoxGeometry(slot.sx, flH - 0.08, slot.sz);
              const mat = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(colorHex),
                roughness: 0.35,
                metalness: 0.15,
                transparent: true,
                opacity: 0.85,
                clearcoat: 0.3,
              });
              const mesh = new THREE.Mesh(geo, mat);
              mesh.position.set(slot.cx, flY, slot.cz);
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              mesh.userData = { block: bName, floor: fl.floor, aptIdx: a, apt, type: 'apt' };
              group.add(mesh);
              floorMeshes.push(mesh);
            }
            // плита перекрытия — по силуэту блока
            let slabGeo;
            if (shape === 'rect') slabGeo = new THREE.BoxGeometry(bd.w + 0.3, 0.05, bd.d + 0.3);
            else slabGeo = buildShapeGeometry(THREE, shape, bd.w + 0.3, 0.05, bd.d + 0.3);
            const slab = new THREE.Mesh(
              slabGeo,
              new THREE.MeshStandardMaterial({ color: 0x14201a, roughness: 0.8 }),
            );
            if (Y_AXIS_SHAPES.has(shape) || shape === 'rect') {
              slab.position.y = flY - flH / 2;
            } else {
              slab.rotation.x = -Math.PI / 2;
              slab.position.y = flY - flH / 2 - 0.025;
            }
            slab.receiveShadow = true;
            group.add(slab);
          } else {
            let geo;
            if (shellShape === 'rect') geo = new THREE.BoxGeometry(bd.w, flH, bd.d);
            else geo = buildShapeGeometry(THREE, shellShape, bd.w, flH, bd.d);

            const mat = new THREE.MeshPhysicalMaterial({
              color: 0x162a1c,
              roughness: 0.6,
              metalness: 0.2,
              transparent: true,
              opacity: 0.65,
            });
            const mesh = new THREE.Mesh(geo, mat);
            if (Y_AXIS_SHAPES.has(shellShape)) {
              mesh.position.y = flY;
            } else if (shellShape === 'rect') {
              mesh.position.y = flY;
            } else {
              mesh.rotation.x = -Math.PI / 2;
              mesh.position.y = flY - flH / 2;
            }
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = { block: bName, floor: fl.floor, type: 'base' };
            group.add(mesh);
            floorMeshes.push(mesh);
          }
        });

        const lastFl = bd.floors[bd.floors.length - 1];
        const roofY = (lastFl.to + 15.6) * SCALE;
        let roofGeo;
        let roofYOffset = 0;
        if (shape === 'tower') {
          roofGeo = new THREE.ConeGeometry((Math.min(bd.w, bd.d) / 2) * 0.85, 2, 8);
          roofYOffset = 1;
        } else if (shape === 'circle') {
          roofGeo = new THREE.ConeGeometry(Math.min(bd.w, bd.d) / 2, 2, 36);
          roofYOffset = 1;
        } else if (shape === 'hexagon') {
          roofGeo = new THREE.CylinderGeometry(Math.min(bd.w, bd.d) / 2 + 0.2, Math.min(bd.w, bd.d) / 2 + 0.2, 0.2, 6);
        } else if (shape === 'octagon') {
          roofGeo = new THREE.CylinderGeometry(Math.min(bd.w, bd.d) / 2 + 0.2, Math.min(bd.w, bd.d) / 2 + 0.2, 0.2, 8);
        } else {
          roofGeo = new THREE.BoxGeometry(bd.w + 0.6, 0.2, bd.d + 0.6);
        }
        const roof = new THREE.Mesh(
          roofGeo,
          new THREE.MeshPhysicalMaterial({
            color: 0x22c55e,
            roughness: 0.3,
            metalness: 0.5,
            emissive: 0x114422,
            emissiveIntensity: 0.3,
          }),
        );
        roof.position.y = roofY + roofYOffset;
        roof.castShadow = true;
        group.add(roof);

        scene.add(group);
        blockGroups[bName] = group;
      });
    }

    let lastBuild = -1;
    function animate() {
      frameRef.current = window.requestAnimationFrame(animate);
      if (rebuildRef.current !== lastBuild) {
        buildScene();
        lastBuild = rebuildRef.current;
        Object.entries(blockPositions).forEach(([bn, pos]) => {
          if (blockGroups[bn]) {
            blockGroups[bn].position.x = pos[0];
            blockGroups[bn].position.z = pos[1];
          }
        });
      }
      ptLight.position.x = Math.sin(Date.now() * 0.001) * 15;
      ptLight.position.z = Math.cos(Date.now() * 0.001) * 15;
      renderer.render(scene, camera);
    }
    animate();

    function getMouse(e: MouseEvent | TouchEvent): [number, number, number, number] {
      const node = mountRef.current;
      if (!node) return [0, 0, 0, 0];
      const r = node.getBoundingClientRect();
      const touchEv = e as TouchEvent;
      let clientX: number;
      let clientY: number;
      if (touchEv.touches?.length) {
        ({ clientX, clientY } = touchEv.touches[0]);
      } else if (touchEv.changedTouches?.length) {
        ({ clientX, clientY } = touchEv.changedTouches[0]);
      } else {
        ({ clientX, clientY } = e as MouseEvent);
      }
      return [
        ((clientX - r.left) / r.width) * 2 - 1,
        -(((clientY - r.top) / r.height) * 2) + 1,
        clientX,
        clientY,
      ];
    }

    function onDown(e: MouseEvent | TouchEvent) {
      const [mx, my, cx, cy] = getMouse(e);
      mouse.set(mx, my);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(floorMeshes);
      const baseHit = hits.find((h: { object: { userData: { type?: string } } }) =>
        h.object.userData.type === 'base' || h.object.userData.type === 'apt',
      );
      const wantBlockDrag = baseHit && (editModeRef.current || ('shiftKey' in e && e.shiftKey));
      if (wantBlockDrag && baseHit) {
        const blockName = baseHit.object.userData.block as string | undefined;
        if (!blockName) return;
        isBlockDrag = true;
        dragBlock = blockName;
        setDraggingBlock(blockName);
        const pt = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, pt);
        const grp = blockGroups[blockName];
        if (!grp) return;
        dragOffset.copy(pt).sub(grp.position);
        if (mountRef.current) mountRef.current.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }
      isDrag = true;
      prevX = cx;
      prevY = cy;
    }

    function onMove(e: MouseEvent | TouchEvent) {
      if (isBlockDrag && dragBlock) {
        const [mx, my] = getMouse(e);
        mouse.set(mx, my);
        raycaster.setFromCamera(mouse, camera);
        const pt = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, pt);
        const grp = blockGroups[dragBlock];
        if (grp) {
          grp.position.x = pt.x - dragOffset.x;
          grp.position.z = pt.z - dragOffset.z;
        }
        return;
      }
      if (!isDrag) return;
      const [, , cx, cy] = getMouse(e);
      theta -= (cx - prevX) * 0.008;
      phi = Math.max(0.15, Math.min(1.45, phi - (cy - prevY) * 0.008));
      prevX = cx;
      prevY = cy;
      updateCam();
    }

    function onUp() {
      if (isBlockDrag && dragBlock) {
        const grp = blockGroups[dragBlock];
        if (grp)
          setBlockPositions((prev) => ({
            ...prev,
            [dragBlock as string]: [Math.round(grp.position.x * 10) / 10, Math.round(grp.position.z * 10) / 10],
          }));
        justDragged = true;
        window.setTimeout(() => {
          justDragged = false;
        }, 250);
      }
      isDrag = false;
      isBlockDrag = false;
      dragBlock = null;
      setDraggingBlock(null);
      if (mountRef.current) mountRef.current.style.cursor = 'grab';
    }

    function onClick(e: MouseEvent) {
      if (isBlockDrag || justDragged) return;
      const [mx, my] = getMouse(e);
      mouse.set(mx, my);
      raycaster.setFromCamera(mouse, camera);
      const clicks = raycaster.intersectObjects(floorMeshes);
      const hit0 = clicks[0] as { object: { userData: { type?: string; apt?: Apartment } } } | undefined;
      if (hit0 && hit0.object.userData.type === 'apt' && hit0.object.userData.apt)
        onSelect(hit0.object.userData.apt);
    }

    function onWheel(e: WheelEvent) {
      radius = Math.max(20, Math.min(110, radius + e.deltaY * 0.05));
      updateCam();
    }

    el.addEventListener('mousedown', onDown);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('click', onClick);
    el.addEventListener('touchstart', onDown, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onUp);

    const onResize = () => {
      const node = mountRef.current;
      if (!node) return;
      const nw = node.clientWidth;
      const nh = node.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('click', onClick);
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onUp);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onSelect, blockPositions, blockShapes, setBlockPositions, rebuild]);

  return (
    <>
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: editMode ? 'grab' : 'grab',
        }}
      />
      {draggingBlock && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(34,197,94,0.18)',
            border: '1px solid var(--accent2)',
            color: 'var(--accent2)',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 700,
            zIndex: 6,
            pointerEvents: 'none',
            boxShadow: 'var(--shadow)',
          }}
        >
          Перемещаю «{draggingBlock}»
        </div>
      )}
    </>
  );
}

function Stat({ l, v }: { l: string; v: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--card2)',
        borderRadius: 6,
        padding: '6px 8px',
        textAlign: 'center',
        border: '1px solid var(--line)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent2)' }}>{v}</div>
      <div style={{ fontSize: 9, color: 'var(--muted)' }}>{l}</div>
    </div>
  );
}

function PaymentTable({ payments }: { payments: PaymentRow[] }) {
  const total = payments.reduce((s, p) => s + p.amount, 0);
  const paid = payments.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 6 }}>
        {[
          ['Всего', `${total.toLocaleString()}$`, 'var(--text)'],
          ['Оплачено', `${paid.toLocaleString()}$`, 'var(--accent2)'],
          ['Остаток', `${(total - paid).toLocaleString()}$`, 'var(--danger)'],
        ].map(([l, v, c]) => (
          <div
            key={String(l)}
            style={{ background: 'var(--card2)', borderRadius: 5, padding: '4px', textAlign: 'center', border: '1px solid var(--line)' }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 8, color: 'var(--muted)' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--line)', borderRadius: 3, height: 4, marginBottom: 6, overflow: 'hidden' }}>
        <div
          style={{
            width: `${total ? (paid / total) * 100 : 0}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent2), var(--ok))',
            borderRadius: 3,
          }}
        />
      </div>
      <div style={{ maxHeight: 160, overflowY: 'auto', borderRadius: 6, border: '1px solid var(--line)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr style={{ background: 'var(--card2)', position: 'sticky', top: 0 }}>
              {['№', 'Дата', 'Сумма', ''].map((h) => (
                <th key={h} style={{ padding: '4px 6px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600, fontSize: 9 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.n} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '3px 6px', fontWeight: 600 }}>{p.n || '—'}</td>
                <td style={{ padding: '3px 6px', color: 'var(--muted2)' }}>{p.date}</td>
                <td style={{ padding: '3px 6px', fontWeight: 600 }}>{p.amount.toLocaleString()}$</td>
                <td style={{ padding: '3px 6px' }}>
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: 3,
                      fontSize: 9,
                      fontWeight: 600,
                      background: p.paid ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.15)',
                      color: p.paid ? 'var(--ok)' : 'var(--danger)',
                    }}
                  >
                    {p.paid ? '✓' : '○'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AptDetail({ apt, onClose }: { apt: Apartment; onClose: () => void }) {
  const [showPay, setShowPay] = useState(false);
  const pays = genPayments(apt);
  const client = useMemo(() => (apt.clientId ? CLIENTS.find((c) => c.id === apt.clientId) ?? null : null), [apt.clientId]);
  return (
    <div
      style={{
        marginTop: 12,
        background: 'var(--card)',
        borderRadius: 10,
        border: '1px solid var(--line)',
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          Кв.{apt.aptIdx + 1}, Эт.{apt.floor}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            style={{
              background:
                apt.status === 'sold' ? 'var(--danger)' : apt.status === 'free' ? 'var(--ok)' : 'var(--warn)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {SL[apt.status]}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: 0 }}
          >
            ✕
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        {(
          [
            ['Блок', apt.block],
            ['Тип', apt.type],
            ['Площадь', `${apt.area} м²`],
            ['Цена', `${apt.price.toLocaleString()} $`],
          ] as const
        ).map(([l, v]) => (
          <div key={l} style={{ background: 'var(--card2)', borderRadius: 5, padding: '4px 8px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 9, color: 'var(--muted)' }}>{l}</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>
      {client && (
        <div
          style={{
            background: 'var(--panel)',
            borderRadius: 8,
            padding: 10,
            border: '1px solid var(--line)',
            marginBottom: 8,
          }}
        >
          <div
            style={{ fontSize: 9, color: 'var(--accent2)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            Клиент (мокап)
          </div>
          <div style={{ fontWeight: 600, fontSize: 12 }}>{client.fio}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {client.phone} • {client.email}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 2 }}>Паспорт: {client.passport}</div>
          {pays.length > 0 && (
            <button
              type="button"
              className="btn small"
              onClick={() => setShowPay(!showPay)}
              style={{ marginTop: 8 }}
            >
              {showPay ? 'Скрыть платежи ▲' : 'График платежей ▼'}
            </button>
          )}
        </div>
      )}
      {showPay && pays.length > 0 && <PaymentTable payments={pays} />}
    </div>
  );
}

function Blocks2D({
  blocks,
  apartments,
  selected,
  setSelected,
  editMode,
  setEditMode,
  onEditApt,
  onEditBlock,
  onNewBlock,
  onDeleteBlock,
}: {
  blocks: typeof BLOCKS_RAW;
  apartments: Apartment[];
  selected: Apartment | null;
  setSelected: (a: Apartment | null) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  onEditApt: (aptId: string) => void;
  onEditBlock: (blockName: string) => void;
  onNewBlock: () => void;
  onDeleteBlock: (blockName: string) => void;
}) {
  const [block, setBlock] = useState<string>(Object.keys(blocks)[0] || 'Блок 1');

  useEffect(() => {
    const keys = Object.keys(blocks);
    if (keys.length === 0) return;
    if (!blocks[block]) setBlock(keys[0]);
  }, [blocks, block]);

  const bd = blocks[block] || blocks[Object.keys(blocks)[0]];
  const apts = apartments.filter((a) => a.block === block && !a.orphaned);
  const orphanCount = apartments.filter((a) => a.block === block && a.orphaned).length;
  const res = bd.floors.filter((f) => f.res);

  return (
    <div style={{ padding: '12px 16px', overflowY: 'auto', flex: 1, color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {Object.keys(blocks).map((b) => (
          <button
            type="button"
            key={b}
            onClick={() => {
              setBlock(b);
              setSelected(null);
            }}
            style={{
              padding: '7px 14px',
              borderRadius: 7,
              border: `1px solid ${block === b ? 'var(--accent2)' : 'var(--line)'}`,
              background: block === b ? 'rgba(74,222,128,0.08)' : 'var(--card2)',
              color: block === b ? 'var(--accent2)' : 'var(--muted)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}
          >
            {b}
          </button>
        ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn small" onClick={() => onEditBlock(block)}>
            Настройки блока
          </button>
          <button type="button" className="btn small" onClick={onNewBlock}>
            + Блок
          </button>
          {editMode && (
            <button
              type="button"
              className="btn small"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={() => onDeleteBlock(block)}
            >
              Удалить блок
            </button>
          )}
          <button type="button" className="btn small" onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Готово' : 'Редактировать'}
          </button>
        </div>
      </div>
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 10,
          padding: 12,
          marginBottom: 12,
          border: '1px solid var(--line)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{block}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          <Stat l="Этажей" v={bd.floors.length} />
          <Stat l="Макс." v={`${bd.floors[bd.floors.length - 1]?.to?.toFixed(1)}м`} />
          <Stat l="Кв/эт" v={bd.apts || '—'} />
        </div>
        {orphanCount > 0 && (
          <div className="mini muted" style={{ marginTop: 8, color: 'var(--warn)' }}>
            Вне сетки сохранено квартир (продажи/бронь/клиент): {orphanCount}. Они учитываются во вкладке «Клиенты», в 3D/сетке не показываются.
          </div>
        )}
      </div>
      <div
        style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}
      >
        Отметки этажей
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line)', overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'var(--panel)', position: 'sticky', top: 0 }}>
                {['Этаж', 'От (м)', 'До (м)', 'H (м)', 'Отметка'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '6px 8px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--accent2)',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...bd.floors].reverse().map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 600 }}>{f.floor}</td>
                  <td style={{ padding: '5px 8px', color: 'var(--muted)' }}>{f.from.toFixed(1)}</td>
                  <td style={{ padding: '5px 8px', color: 'var(--muted)' }}>{f.to.toFixed(1)}</td>
                  <td style={{ padding: '5px 8px' }}>
                    <span
                      style={{
                        background: 'rgba(74,222,128,0.12)',
                        color: 'var(--accent2)',
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {f.h.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '5px 8px', color: 'var(--muted2)' }}>{(f as any).height_mark ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {res.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Сетка квартир
            </span>
            <div style={{ display: 'flex', gap: 8, fontSize: 9 }}>
              {(['sold', 'free', 'reserved'] as const).map((k) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: SC[k], display: 'inline-block' }} />
                  {SL[k]}
                </span>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line)', padding: 8, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2, fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={{ padding: '3px 4px', fontWeight: 600, color: 'var(--muted)', width: 36, textAlign: 'center' }}>Эт.</th>
                  {Array.from({ length: bd.apts }, (_, i) => {
                    const l = bd.labels[i] ?? '—';
                    return (
                      <th key={`${l}-${i}`} style={{ padding: '3px', fontWeight: 500, color: 'var(--muted)', textAlign: 'center' }}>
                        {i + 1}({l})
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[...res].reverse().map((fl) => (
                  <tr key={String(fl.floor)}>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent2)', fontSize: 11 }}>{fl.floor}</td>
                    {Array.from({ length: bd.apts }, (_, i) => {
                      const apt = apts.find((a) => a.floor === fl.floor && a.aptIdx === i);
                      if (!apt) return <td key={i} style={{ background: 'var(--card2)', borderRadius: 3, textAlign: 'center' }}>—</td>;
                      const c = SC[apt.status];
                      const sel = selected?.id === apt.id;
                  return (
                        <td
                          key={i}
                          role="presentation"
                      onClick={() => {
                        setSelected(sel ? null : apt);
                        if (editMode) onEditApt(apt.id);
                      }}
                          style={{
                            background: sel ? 'var(--panel)' : `color-mix(in srgb, ${c} 18%, transparent)`,
                            border: `1.5px solid ${sel ? 'var(--accent)' : `${c}`}`,
                            borderRadius: 5,
                            padding: '4px 2px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            color: sel ? 'var(--text)' : c,
                            fontWeight: 600,
                            transition: 'all .1s',
                          }}
                        >
                          {apt.area}м²
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {selected && <AptDetail apt={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

interface ClientAgg extends ClientRecord {
  apartments: Apartment[];
}

function ClientsTab({ apartments }: { apartments: Apartment[] }) {
  const [search, setSearch] = useState('');
  const [exp, setExp] = useState<string | null>(null);
  const [payApt, setPayApt] = useState<Apartment | null>(null);
  const clients = useMemo(() => {
    const m = new Map<string, ClientAgg>();
    apartments.filter((a) => a.clientId).forEach((a) => {
      const cl = CLIENTS.find((c) => c.id === a.clientId);
      if (!cl) return;
      if (!m.has(cl.id)) m.set(cl.id, { ...cl, apartments: [] });
      m.get(cl.id)!.apartments.push(a);
    });
    return Array.from(m.values());
  }, [apartments]);
  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => c.fio.toLowerCase().includes(q) || c.phone.includes(q) || c.id.toLowerCase().includes(q));
  }, [clients, search]);
  const pays = payApt ? genPayments(payApt) : [];
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', color: 'var(--text)' }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--muted2)',
          background: 'var(--card2)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 10,
        }}
      >
        Все записи клиентов, платежей и документов в этом блоке — <b>выдуманные мокап-данные</b> для интерфейса.
      </div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск: ФИО, телефон, ID..."
          style={{
            width: '100%',
            padding: '8px 12px 8px 30px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--card2)',
            color: 'var(--text)',
            fontSize: 12,
            fontFamily: 'var(--font)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)' }}>
          🔍
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>
        Клиентов: <b style={{ color: 'var(--accent2)' }}>{filtered.length}</b>
      </div>
      {filtered.map((cl) => (
        <div
          key={cl.id}
          role="presentation"
          onClick={() => {
            setExp(exp === cl.id ? null : cl.id);
            setPayApt(null);
          }}
          style={{
            background: exp === cl.id ? 'var(--panel)' : 'var(--card)',
            borderRadius: 10,
            border: `1px solid ${exp === cl.id ? 'var(--accent2)' : 'var(--line)'}`,
            padding: 12,
            marginBottom: 6,
            cursor: 'pointer',
            transition: 'all .15s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{cl.fio}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cl.phone}</div>
            </div>
            <span
              style={{
                background: 'rgba(74,222,128,0.1)',
                color: 'var(--accent2)',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                alignSelf: 'flex-start',
              }}
            >
              {cl.id}
            </span>
          </div>
          {exp === cl.id && (
            <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()} role="presentation">
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                {cl.email} • Паспорт: {cl.passport}
              </div>
              {cl.apartments.map((apt) => (
                <div
                  key={apt.id}
                  role="presentation"
                  onClick={() => setPayApt(payApt?.id === apt.id ? null : apt)}
                  style={{
                    background: payApt?.id === apt.id ? 'var(--card2)' : 'var(--card)',
                    borderRadius: 8,
                    border: `1px solid ${payApt?.id === apt.id ? 'var(--accent)' : 'var(--line)'}`,
                    padding: 8,
                    marginBottom: 4,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ fontWeight: 600 }}>
                      {apt.block}•Эт.{apt.floor}•Кв.{apt.aptIdx + 1}
                    </span>
                    <span style={{ color: 'var(--accent2)' }}>
                      {apt.area}м²•{apt.price.toLocaleString()}$
                    </span>
                  </div>
                  {payApt?.id === apt.id && (
                    <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()} role="presentation">
                      <PaymentTable payments={pays} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

declare global {
  interface Window {
    THREE?: any;
  }
}

export type ProjectBlocksTabVariant = 'full' | 'blocks-only' | 'clients-only';

interface ProjectBlocksTabProps {
  projectName?: string;
  /** full — 3D + 2D + Клиенты; blocks-only — без подвкладки «Клиенты»; clients-only — только список клиентов */
  variant?: ProjectBlocksTabVariant;
}

/** Вкладка «Блоки»: 3D (Three.js с CDN), 2D-сетка, клиенты — демо-данные. */
export function ProjectBlocksTab({ projectName, variant = 'full' }: ProjectBlocksTabProps) {
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [tab, setTab] = useState<'3d' | '2d' | 'clients'>('3d');
  const [selected, setSelected] = useState<Apartment | null>(null);
  const clone = (v: any) => JSON.parse(JSON.stringify(v));

  const [blocks, setBlocks] = useState<typeof BLOCKS_RAW>(() => {
    try {
      const raw = localStorage.getItem(PROJECT_BLOCKS_STORAGE_KEY);
      if (!raw) return clone(BLOCKS_RAW);
      const parsed = JSON.parse(raw);
      if (parsed?.blocks) return parsed.blocks;
      return clone(BLOCKS_RAW);
    } catch {
      return clone(BLOCKS_RAW);
    }
  });

  const [apartments, setApartments] = useState<Apartment[]>(() => {
    try {
      const raw = localStorage.getItem(PROJECT_BLOCKS_STORAGE_KEY);
      if (!raw) return genApartments(BLOCKS_RAW);
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.apartments)) return migrateApartmentsClientIds(parsed.apartments);
      return genApartments(BLOCKS_RAW);
    } catch {
      return genApartments(BLOCKS_RAW);
    }
  });

  const [blockPositions, setBlockPositions] = useState<Record<string, [number, number]>>(() => {
    try {
      const raw = localStorage.getItem(PROJECT_BLOCKS_STORAGE_KEY);
      if (!raw) {
        const pos: Record<string, [number, number]> = {};
        Object.entries(BLOCKS_RAW).forEach(([bn, bd]) => (pos[bn] = bd.defaultPos));
        return pos;
      }
      const parsed = JSON.parse(raw);
      if (parsed?.blockPositions) return parsed.blockPositions;
      const pos: Record<string, [number, number]> = {};
      Object.entries(BLOCKS_RAW).forEach(([bn, bd]) => (pos[bn] = bd.defaultPos));
      return pos;
    } catch {
      const pos: Record<string, [number, number]> = {};
      Object.entries(BLOCKS_RAW).forEach(([bn, bd]) => (pos[bn] = bd.defaultPos));
      return pos;
    }
  });

  const [blockShapes, setBlockShapes] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(PROJECT_BLOCKS_STORAGE_KEY);
      if (!raw) return { 'Блок 1': 'rect', 'Блок 2': 'rect', 'Блок 3': 'rect' };
      const parsed = JSON.parse(raw);
      if (parsed?.blockShapes) return parsed.blockShapes;
      return { 'Блок 1': 'rect', 'Блок 2': 'rect', 'Блок 3': 'rect' };
    } catch {
      return { 'Блок 1': 'rect', 'Блок 2': 'rect', 'Блок 3': 'rect' };
    }
  });

  const [editMode, setEditMode] = useState(false);
  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [blockEditorOpen, setBlockEditorOpen] = useState(false);
  const [blockEditorTarget, setBlockEditorTarget] = useState<string>('__new__'); // __new__ or block name
  const [blockDraftName, setBlockDraftName] = useState('');
  const [blockDraftApts, setBlockDraftApts] = useState<number>(4);
  const [blockDraftLabels, setBlockDraftLabels] = useState<string>('1к,2к,2к,Ст');
  const [blockDraftW, setBlockDraftW] = useState<number>(10);
  const [blockDraftD, setBlockDraftD] = useState<number>(8);
  const [blockDraftFloors, setBlockDraftFloors] = useState<
    { floor: string; from: number; to: number; h: number; res: boolean; height_mark: string }[]
  >([
    { floor: '1', from: 0, to: 3.3, h: 3.3, res: true, height_mark: '+3.300' },
    { floor: '2', from: 3.3, to: 6.6, h: 3.3, res: true, height_mark: '+6.600' },
  ]);
  const [blockDraftShape, setBlockDraftShape] = useState<string>('rect');
  /** При изменении числа квартир / этажей — не удалять проданные/бронь/с клиентом вне сетки */
  const [preserveExistingSales, setPreserveExistingSales] = useState(true);

  const editingApt = useMemo(
    () => (editingAptId ? apartments.find((a) => a.id === editingAptId) ?? null : null),
    [editingAptId, apartments],
  );

  useEffect(() => {
    if (!selected) return;
    if (!apartments.some((a) => a.id === selected.id && a.block === selected.block)) setSelected(null);
  }, [apartments, selected]);

  useEffect(() => {
    if (!editingAptId) return;
    if (!apartments.some((a) => a.id === editingAptId)) setEditingAptId(null);
  }, [apartments, editingAptId]);

  useEffect(() => {
    if (variant === 'clients-only') setTab('clients');
  }, [variant]);

  useEffect(() => {
    if (variant === 'blocks-only' && tab === 'clients') setTab('3d');
  }, [variant, tab]);

  useEffect(() => {
    try {
      localStorage.setItem(
        PROJECT_BLOCKS_STORAGE_KEY,
        JSON.stringify({
          blocks,
          apartments,
          blockPositions,
          blockShapes,
        }),
      );
    } catch {
      // ignore
    }
  }, [blocks, apartments, blockPositions, blockShapes]);

  useEffect(() => {
    if (window.THREE) {
      setThreeLoaded(true);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => setThreeLoaded(true);
    document.head.appendChild(s);
    return () => {};
  }, []);

  const onSelect3D = useCallback((apt: Apartment) => setSelected(apt), []);

  const openNewBlockEditor = useCallback(() => {
    setBlockEditorTarget('__new__');
    setBlockDraftName(`Блок ${Object.keys(blocks).length + 1}`);
    setBlockDraftApts(4);
    setBlockDraftLabels('1к,2к,2к,Ст');
    setBlockDraftW(10);
    setBlockDraftD(8);
    setBlockDraftFloors([
      { floor: '1', from: 0, to: 3.3, h: 3.3, res: true, height_mark: '+3.300' },
      { floor: '2', from: 3.3, to: 6.6, h: 3.3, res: true, height_mark: '+6.600' },
    ]);
    setBlockDraftShape('rect');
    setBlockEditorOpen(true);
  }, [blocks]);

  const openEditBlockEditor = useCallback(
    (blockName: string) => {
      const bd = blocks[blockName];
      if (!bd) return;
      setBlockEditorTarget(blockName);
      setBlockDraftName(blockName);
      setBlockDraftApts(bd.apts);
      setBlockDraftLabels((bd.labels || []).join(','));
      setBlockDraftW(bd.w);
      setBlockDraftD(bd.d);
      setBlockDraftFloors(
        (bd.floors || []).map((f: any) => ({
          floor: String(f.floor),
          from: Number(f.from),
          to: Number(f.to),
          h: Number(f.h),
          res: Boolean(f.res),
          height_mark: typeof f.height_mark === 'string' ? f.height_mark : `${f.to >= 0 ? '+' : '-'}${Math.abs(Number(f.to)).toFixed(3)}`,
        })),
      );
      setBlockDraftShape(blockShapes[blockName] ?? 'rect');
      setBlockEditorOpen(true);
    },
    [blocks, blockShapes],
  );

  const saveBlockFromDraft = useCallback(() => {
    const trimmedName = blockDraftName.trim();
    if (!trimmedName) return;

    // unique name (for new block)
    let finalName = trimmedName;
    if (blockEditorTarget === '__new__') {
      let n = 1;
      while (blocks[finalName]) {
        finalName = `${trimmedName} (${n++})`;
      }
    }

    const aptsCount = Math.max(1, Number(blockDraftApts || 1));
    const labels = blockDraftLabels
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const floors = blockDraftFloors
      .map((f) => ({
        ...f,
        floor: String(f.floor).trim() || '1',
        from: Number(f.from || 0),
        to: Number(f.to || 0),
        h: Number(f.to || 0) - Number(f.from || 0),
        res: Boolean(f.res),
        height_mark: (f.height_mark || '').trim() || `${(Number(f.to || 0) >= 0 ? '+' : '-') + Math.abs(Number(f.to || 0)).toFixed(3)}`,
      }))
      .sort((a, b) => Number(a.from) - Number(b.from));

    const prevName = blockEditorTarget !== '__new__' ? blockEditorTarget : null;

    setBlocks((prev) => {
      const next: any = { ...prev };
      if (prevName && prevName !== finalName) {
        delete next[prevName];
      }
      next[finalName] = {
        ...(next[finalName] || {}),
        floors,
        apts: aptsCount,
        labels,
        w: Math.max(1, Number(blockDraftW || 1)),
        d: Math.max(1, Number(blockDraftD || 1)),
        defaultPos: next[finalName]?.defaultPos ?? prev[prevName || finalName]?.defaultPos ?? [0, 0],
      };
      return next;
    });

    // positions/shapes for new or renamed block
    if (blockEditorTarget === '__new__') {
      setBlockPositions((prev) => ({ ...prev, [finalName]: [0, 0] }));
      setBlockShapes((prev) => ({ ...prev, [finalName]: blockDraftShape || 'rect' }));
    } else if (prevName && prevName !== finalName) {
      setBlockPositions((prev) => {
        const next = { ...prev } as any;
        next[finalName] = next[prevName] ?? [0, 0];
        delete next[prevName];
        return next;
      });
      setBlockShapes((prev) => {
        const next = { ...prev } as any;
        next[finalName] = blockDraftShape || next[prevName] || 'rect';
        delete next[prevName];
        return next;
      });
    } else {
      setBlockShapes((prev) => ({ ...prev, [finalName]: blockDraftShape || prev[finalName] || 'rect' }));
    }

    setApartments((prev) =>
      mergeApartmentsAfterBlockStructureChange(prev, {
        finalName,
        prevName,
        floors,
        aptsCount,
        labels,
        preserveSales: preserveExistingSales,
      }),
    );

    setBlockEditorOpen(false);
    setBlockEditorTarget('__new__');
  }, [
    blockDraftApts,
    blockDraftD,
    blockDraftFloors,
    blockDraftLabels,
    blockDraftName,
    blockDraftShape,
    blockDraftW,
    blockEditorTarget,
    blocks,
    preserveExistingSales,
    setApartments,
    setBlockPositions,
    setBlockShapes,
    setBlocks,
  ]);

  const deleteBlockByName = useCallback(
    (name: string) => {
      if (!name || !blocks[name]) return;
      const n = Object.keys(blocks).length;
      if (n <= 1) {
        window.alert('Нельзя удалить последний блок.');
        return;
      }
      if (!window.confirm(`Удалить блок «${name}» и все его квартиры из модели?`)) return;
      setBlocks((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setBlockPositions((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setBlockShapes((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setApartments((prev) => prev.filter((a) => a.block !== name));
      setSelected((sel) => (sel?.block === name ? null : sel));
      setEditingAptId((id) => {
        if (!id) return null;
        const apt = apartments.find((a) => a.id === id);
        return apt?.block === name ? null : id;
      });
      if (blockEditorTarget === name) setBlockEditorOpen(false);
    },
    [blocks, blockEditorTarget, apartments],
  );

  const subTabDefs = useMemo(() => {
    const all = [
      { k: '3d' as const, l: '3D' },
      { k: '2d' as const, l: '2D сетка' },
      { k: 'clients' as const, l: 'Клиенты' },
    ];
    if (variant === 'blocks-only') return all.filter((t) => t.k !== 'clients');
    if (variant === 'clients-only') return [];
    return all;
  }, [variant]);

  const headerTabs =
    subTabDefs.length > 0 ? (
      <div style={{ display: 'flex', gap: 2, background: 'var(--card2)', borderRadius: 7, padding: 2, border: '1px solid var(--line)' }}>
        {subTabDefs.map((t) => (
          <button
            type="button"
            key={t.k}
            onClick={() => {
              setTab(t.k);
              setSelected(null);
              setShowSettings(false);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 5,
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'var(--font)',
              background: tab === t.k ? 'var(--accent2)' : 'transparent',
              color: tab === t.k ? '#fff' : 'var(--muted)',
              transition: 'all .15s',
            }}
          >
            {t.l}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div
      style={{
        fontFamily: 'var(--font)',
        background: 'var(--panel)',
        color: 'var(--text)',
        borderRadius: 'var(--r12)',
        border: '1px solid var(--line)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 640,
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--line)',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 20,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 10,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            ЖК
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {projectName || 'Проект'}
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)' }}>
              {variant === 'clients-only'
                ? 'Клиенты по квартирам (демо)'
                : 'Интерактивные блоки (демо)'}
            </div>
          </div>
        </div>
        {headerTabs}
      </div>

      {tab === '3d' ? (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 520 }}>
          {threeLoaded ? (
            <Scene3D
              onSelect={onSelect3D}
              blocks={blocks}
              apartments={apartments}
              blockPositions={blockPositions}
              setBlockPositions={setBlockPositions}
              blockShapes={blockShapes}
              editMode={editMode}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
              Загрузка Three.js…
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: 'color-mix(in srgb, var(--card) 92%, transparent)',
              borderRadius: 8,
              padding: '8px 12px',
              border: '1px solid var(--line)',
              zIndex: 5,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              Легенда
            </div>
            {(['sold', 'free', 'reserved'] as const).map((k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: SC[k] }} />
                <span style={{ fontSize: 10, color: 'var(--muted2)' }}>{SL[k]}</span>
              </div>
            ))}
            <div style={{ fontSize: 8, color: 'var(--muted2)', marginTop: 4, borderTop: '1px solid var(--line)', paddingTop: 4 }}>
              Вращение: мышь • Зум: колесо
              <br />
              {editMode ? (
                <>
                  <span style={{ color: 'var(--accent2)', fontWeight: 700 }}>Режим правки: тяните блок мышью</span>
                  <br />
                </>
              ) : (
                <>
                  Shift+перетаскивание: двигать блок
                  <br />
                </>
              )}
              Внизу: клик по блоку — полные настройки
            </div>
          </div>

          <button
            type="button"
            className="btn small"
            onClick={() => setShowSettings(!showSettings)}
            style={{ position: 'absolute', top: 10, right: 10, zIndex: 5 }}
          >
            ⚙ Формы блоков
          </button>
          <button
            type="button"
            className="btn small"
            onClick={() => setEditMode((v) => !v)}
            style={{ position: 'absolute', top: 10, right: 150, zIndex: 5 }}
          >
            {editMode ? 'Готово' : 'Редактировать'}
          </button>
          <button
            type="button"
            className="btn small"
            onClick={openNewBlockEditor}
            style={{ position: 'absolute', top: 10, right: editMode ? 280 : 150, zIndex: 5 }}
          >
            + Блок
          </button>

          {showSettings && (
            <div
              style={{
                position: 'absolute',
                top: 48,
                right: 10,
                width: 220,
                background: 'color-mix(in srgb, var(--card) 96%, transparent)',
                borderRadius: 10,
                border: '1px solid var(--line)',
                padding: 12,
                zIndex: 6,
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}
              >
                Форма каждого блока
              </div>
              {Object.keys(blocks).map((bn) => (
                <div key={bn} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted2)' }}>{bn}</div>
                    {editMode && (
                      <button type="button" className="btn small" onClick={() => openEditBlockEditor(bn)}>
                        Правка
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {SHAPES.map((sh) => (
                      <button
                        type="button"
                        key={sh.id}
                        onClick={() => setBlockShapes((p) => ({ ...p, [bn]: sh.id }))}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 5,
                          border: `1px solid ${blockShapes[bn] === sh.id ? 'var(--accent2)' : 'var(--line)'}`,
                          background: blockShapes[bn] === sh.id ? 'rgba(74,222,128,0.12)' : 'var(--card2)',
                          color: blockShapes[bn] === sh.id ? 'var(--accent2)' : 'var(--muted)',
                          fontSize: 10,
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'var(--font)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{sh.icon}</span>
                        {sh.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 9, color: 'var(--muted2)', borderTop: '1px solid var(--line)', paddingTop: 6, marginTop: 4 }}>
                Позиции блоков:
                <br />
                {Object.entries(blockPositions).map(([bn, p]) => (
                  <span key={bn} style={{ display: 'block' }}>
                    {bn}: X={p[0]}, Z={p[1]}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 6,
              zIndex: 5,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {Object.keys(blocks).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => openEditBlockEditor(b)}
                style={{
                  background: 'color-mix(in srgb, var(--card) 88%, transparent)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--accent2)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                }}
                title="Настройки блока: этажи, отметки, квартиры"
              >
                {b}
              </button>
            ))}
          </div>

          {selected && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: showSettings ? 240 : 10,
                width: 260,
                maxWidth: 'calc(100% - 20px)',
                background: 'color-mix(in srgb, var(--card) 96%, transparent)',
                borderRadius: 12,
                border: '1px solid var(--line)',
                padding: 14,
                zIndex: 5,
                backdropFilter: 'blur(8px)',
                transition: 'right .2s',
                maxHeight: 'min(70vh, 480px)',
                overflowY: 'auto',
              }}
            >
              <AptDetail apt={selected} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>
      ) : tab === '2d' ? (
        <Blocks2D
          blocks={blocks}
          apartments={apartments}
          selected={selected}
          setSelected={setSelected}
          editMode={editMode}
          setEditMode={setEditMode}
          onEditApt={(id) => setEditingAptId(id)}
          onEditBlock={(name) => openEditBlockEditor(name)}
          onNewBlock={openNewBlockEditor}
          onDeleteBlock={deleteBlockByName}
        />
      ) : (
        <ClientsTab apartments={apartments} />
      )}

      {/* Apt editor (быстрая правка привязки клиента/статуса) */}
      {editMode && editingApt && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            width: 420,
            maxWidth: 'calc(100vw - 32px)',
            background: 'color-mix(in srgb, var(--card) 96%, transparent)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 14,
            zIndex: 9999,
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800 }}>Редактирование квартиры</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {editingApt.block} • Эт.{editingApt.floor} • Кв.{editingApt.aptIdx + 1}
              </div>
            </div>
            <button type="button" className="btn small" onClick={() => setEditingAptId(null)}>
              Закрыть
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <label style={{ display: 'block' }}>
              <div className="mini muted">Статус</div>
              <select
                value={editingApt.status}
                onChange={(e) => {
                  const status = e.target.value as AptStatus;
                  setApartments((prev) =>
                    prev.map((a) => (a.id === editingApt.id ? { ...a, status, clientId: status === 'sold' ? a.clientId : null } : a)),
                  );
                }}
                style={{ width: '100%' }}
              >
                <option value="free">Свободна</option>
                <option value="reserved">Бронь</option>
                <option value="sold">Продана</option>
              </select>
            </label>
            <label style={{ display: 'block' }}>
              <div className="mini muted">Клиент (для Продана)</div>
              <select
                value={editingApt.clientId ?? ''}
                onChange={(e) => {
                  const clientId = e.target.value || null;
                  setApartments((prev) =>
                    prev.map((a) =>
                      a.id === editingApt.id ? { ...a, clientId, status: clientId ? 'sold' : a.status === 'sold' ? 'free' : a.status } : a,
                    ),
                  );
                }}
                style={{ width: '100%' }}
              >
                <option value="">— не выбран —</option>
                {CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.fio}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block' }}>
              <div className="mini muted">Площадь (м²)</div>
              <input
                value={String(editingApt.area)}
                onChange={(e) => {
                  const area = Number(e.target.value || 0);
                  setApartments((prev) => prev.map((a) => (a.id === editingApt.id ? { ...a, area } : a)));
                }}
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ display: 'block' }}>
              <div className="mini muted">Цена</div>
              <input
                value={String(editingApt.price)}
                onChange={(e) => {
                  const price = Number(e.target.value || 0);
                  setApartments((prev) => prev.map((a) => (a.id === editingApt.id ? { ...a, price } : a)));
                }}
                style={{ width: '100%' }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Block editor */}
      {blockEditorOpen && (
        <div
          role="presentation"
          onClick={() => setBlockEditorOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: 16,
            overflow: 'auto',
          }}
        >
          <div
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 840,
              maxWidth: '100%',
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 14,
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>
                  {blockEditorTarget === '__new__' ? 'Добавить блок' : 'Редактировать блок'}
                </div>
                <div className="mini muted">Этажность + отметки (высота) + жилые этажи (для сетки квартир)</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {blockEditorTarget !== '__new__' && (
                  <button
                    type="button"
                    className="btn small"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => {
                      deleteBlockByName(blockEditorTarget);
                      setBlockEditorOpen(false);
                    }}
                  >
                    Удалить блок
                  </button>
                )}
                <button type="button" className="btn small" onClick={() => setBlockEditorOpen(false)}>
                  Отмена
                </button>
                <button type="button" className="btn small primary" onClick={saveBlockFromDraft}>
                  Сохранить
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="mini muted">Блок</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={blockEditorTarget}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '__new__') {
                      openNewBlockEditor();
                      return;
                    }
                    openEditBlockEditor(v);
                  }}
                  style={{ flex: 1 }}
                >
                  <option value="__new__">+ Новый блок…</option>
                  {Object.keys(blocks).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <input value={blockDraftName} onChange={(e) => setBlockDraftName(e.target.value)} style={{ flex: 1 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
                <label style={{ display: 'block' }}>
                  <div className="mini muted">Кв/этаж</div>
                  <input value={String(blockDraftApts)} onChange={(e) => setBlockDraftApts(Number(e.target.value || 1))} />
                </label>
                <label style={{ display: 'block' }}>
                  <div className="mini muted">Ширина</div>
                  <input value={String(blockDraftW)} onChange={(e) => setBlockDraftW(Number(e.target.value || 1))} />
                </label>
                <label style={{ display: 'block' }}>
                  <div className="mini muted">Глубина</div>
                  <input value={String(blockDraftD)} onChange={(e) => setBlockDraftD(Number(e.target.value || 1))} />
                </label>
              </div>

              <div style={{ marginTop: 10 }}>
                <div className="mini muted">Типы квартир (через запятую, по колонкам)</div>
                <input value={blockDraftLabels} onChange={(e) => setBlockDraftLabels(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ marginTop: 10 }}>
                <div className="mini muted">Форма блока</div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    padding: 8,
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    background: 'var(--card2)',
                  }}
                >
                  {SHAPES.map((sh) => {
                    const active = blockDraftShape === sh.id;
                    return (
                      <button
                        type="button"
                        key={sh.id}
                        onClick={() => setBlockDraftShape(sh.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: `1px solid ${active ? 'var(--accent2)' : 'var(--line)'}`,
                          background: active ? 'rgba(74,222,128,0.14)' : 'var(--card)',
                          color: active ? 'var(--accent2)' : 'var(--muted2)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                        title={sh.name}
                      >
                        <span style={{ fontSize: 14, lineHeight: 1 }}>{sh.icon}</span>
                        {sh.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    gap: '8px 14px',
                    rowGap: 8,
                  }}
                >
                  <span style={{ fontWeight: 800, flex: '0 0 auto', color: 'var(--accent2)' }}>Подсказка</span>
                  <span className="mini muted" style={{ flex: '1 1 200px', minWidth: 160, lineHeight: 1.35 }}>
                    Отметка (высота) обычно равна «До» с форматированием (+3.300).
                  </span>
                  <span className="mini muted" style={{ flex: '1 1 200px', minWidth: 160, lineHeight: 1.35 }}>
                    Жилые этажи (галочка) попадают в сетку квартир.
                  </span>
                  <span className="mini muted" style={{ flex: '1 1 200px', minWidth: 160, lineHeight: 1.35 }}>
                    Привязка клиента в 2D-сетке: «Редактировать» → клик по квартире.
                  </span>
                  <span className="mini muted" style={{ flex: '1 1 240px', minWidth: 200, lineHeight: 1.35 }}>
                    После сохранения квартиры синхронизируются с сеткой; чекбокс ниже сохраняет продажи.
                  </span>
                </div>
                <label style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={preserveExistingSales}
                    onChange={(e) => setPreserveExistingSales(e.target.checked)}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <span className="mini" style={{ lineHeight: 1.35 }}>
                    <b>Сохранить существующие продажи</b>: квартиры со статусом «Продана» / «Бронь» или с привязанным клиентом, выпавшие из сетки
                    после смены этажности или числа квартир, не удаляются (учёт во вкладке «Клиенты»).
                  </span>
                </label>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 900 }}>Этажи</div>
              <button
                type="button"
                className="btn small"
                onClick={() =>
                  setBlockDraftFloors((prev) => {
                    const last = prev[prev.length - 1];
                    const from = last ? Number(last.to) : 0;
                    const to = from + 3.3;
                    return [
                      ...prev,
                      { floor: String(Number(last?.floor || 0) + 1), from, to, h: to - from, res: true, height_mark: `+${to.toFixed(3)}` },
                    ];
                  })
                }
              >
                + Этаж
              </button>
            </div>

            <div style={{ marginTop: 8, border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--panel)' }}>
                    {['Этаж', 'От', 'До', 'H', 'Отметка', 'Жилой', ''].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--muted)', fontWeight: 800 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blockDraftFloors.map((f, idx) => (
                    <tr key={`${f.floor}-${idx}`} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 900, color: 'var(--accent2)' }}>
                        <input
                          value={f.floor}
                          onChange={(e) =>
                            setBlockDraftFloors((prev) => prev.map((x, i) => (i === idx ? { ...x, floor: e.target.value } : x)))
                          }
                          style={{ width: 64 }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          value={String(f.from)}
                          onChange={(e) => {
                            const from = Number(e.target.value || 0);
                            setBlockDraftFloors((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, from, h: x.to - from } : x)),
                            );
                          }}
                          style={{ width: 90 }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          value={String(f.to)}
                          onChange={(e) => {
                            const to = Number(e.target.value || 0);
                            const mark = `${to >= 0 ? '+' : '-'}${Math.abs(to).toFixed(3)}`;
                            setBlockDraftFloors((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, to, h: to - x.from, height_mark: mark } : x)),
                            );
                          }}
                          style={{ width: 90 }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px', color: 'var(--muted2)', fontWeight: 700 }}>{f.h.toFixed(2)}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          value={f.height_mark}
                          onChange={(e) =>
                            setBlockDraftFloors((prev) => prev.map((x, i) => (i === idx ? { ...x, height_mark: e.target.value } : x)))
                          }
                          style={{ width: 110 }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          type="checkbox"
                          checked={f.res}
                          onChange={(e) =>
                            setBlockDraftFloors((prev) => prev.map((x, i) => (i === idx ? { ...x, res: e.target.checked } : x)))
                          }
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => setBlockDraftFloors((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={blockDraftFloors.length <= 1}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
