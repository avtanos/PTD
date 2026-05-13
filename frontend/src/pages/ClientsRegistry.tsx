import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Apartment, ClientRecord } from '../components/ProjectBlocksTab';
import { CLIENTS, loadApartmentsFromStorage, PROJECT_BLOCKS_STORAGE_KEY } from '../components/ProjectBlocksTab';
import {
  generateCabinetPassword,
  suggestCabinetLogin,
  type CabinetCredential,
  type CabinetCredentialsMap,
} from '../lib/cabinetCredentials';
import {
  calculateBarter,
  calculateCustom,
  calculateDiscount,
  calculateInstallment,
  calculateStandard,
  computeFinalPriceAndDetails,
  previewLinesToStored,
  scheduleTypeLabel,
  sumLines,
  type PaymentScheduleRecord,
  type PaymentScheduleType,
  type PreviewPaymentLine,
} from '../lib/paymentScheduleEngine';
import './Pages.css';

const REGISTRY_STORAGE_KEY = 'ptd.clientsRegistry.v1';

type CabinetAccessMap = Record<string, boolean>;

type PaymentSubmission = {
  id: string;
  clientId: string;
  aptId: string;
  block: string;
  floor: string;
  aptIdx: number;
  amount: number;
  comment: string;
  receiptFileName: string | null;
  submittedAt: string;
};

type CompanyNotification = {
  id: string;
  clientId: string | null;
  type: 'payment_reminder' | 'general';
  title: string;
  body: string;
  createdAt: string;
};

type RegistryFile = {
  extraClients: ClientRecord[];
  cabinetAccess: CabinetAccessMap;
  /** Учётные данные входа в ЛК (демо, в localStorage). */
  cabinetCredentials: CabinetCredentialsMap;
  paymentSubmissions: PaymentSubmission[];
  companyNotifications: CompanyNotification[];
  paymentSchedules: PaymentScheduleRecord[];
};

const defaultRegistryFile = (): RegistryFile => ({
  extraClients: [],
  cabinetAccess: {},
  cabinetCredentials: {},
  paymentSubmissions: [],
  companyNotifications: [],
  paymentSchedules: [],
});

function loadRegistry(): RegistryFile {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) return defaultRegistryFile();
    const p = JSON.parse(raw);
    return {
      extraClients: Array.isArray(p?.extraClients) ? p.extraClients : [],
      cabinetAccess: p?.cabinetAccess && typeof p.cabinetAccess === 'object' ? p.cabinetAccess : {},
      cabinetCredentials:
        p?.cabinetCredentials && typeof p.cabinetCredentials === 'object' ? p.cabinetCredentials : {},
      paymentSubmissions: Array.isArray(p?.paymentSubmissions) ? p.paymentSubmissions : [],
      companyNotifications: Array.isArray(p?.companyNotifications) ? p.companyNotifications : [],
      paymentSchedules: Array.isArray(p?.paymentSchedules) ? p.paymentSchedules : [],
    };
  } catch {
    return defaultRegistryFile();
  }
}

function saveRegistry(data: RegistryFile) {
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function aptLine(a: Apartment): string {
  return `${a.block} · эт.${a.floor} · кв.${a.aptIdx + 1}`;
}

function isAccessOpen(access: CabinetAccessMap, clientId: string): boolean {
  return Boolean(access[clientId]);
}

/** Как в личном кабинете — демо-название ЖК для карточек реестра. */
const DEMO_RESIDENTIAL_COMPLEX = 'ЖК «Северная звезда»';

function aptShortCode(a: Apartment): string {
  const blockLetter = a.block.replace(/^Блок\s*/i, '').trim().slice(0, 1).toUpperCase() || 'Б';
  return `${blockLetter}-${a.floor}-${a.aptIdx + 1}`;
}

/** Краткие обозначения квартир для карточки (А-301, Б-504). */
function shortApartmentLabelsForClient(c: ClientRecord, apts: Apartment[]): string {
  const fromBlocks = apts
    .filter((a) => a.clientId === c.id && (a.status === 'sold' || !!a.clientId))
    .map((a) => aptShortCode(a));
  const manual = c.apartmentLabels ?? [];
  const merged = Array.from(new Set([...fromBlocks, ...manual]));
  return merged.length ? merged.join(', ') : '—';
}

function scheduleCountForClient(clientId: string, schedules: PaymentScheduleRecord[]): number {
  return schedules.filter((s) => s.clientId === clientId).length;
}

type RegistryCabinetDraft = { login: string; password: string };

type RegistryCabinetAccessBlockProps = {
  draft?: RegistryCabinetDraft;
  accessOn: boolean;
  cred?: CabinetCredential;
  showPw: boolean;
  entryUrl: string;
  onTogglePw: () => void;
  onStartGrant: () => void;
  onDraftLogin: (v: string) => void;
  onDraftPassword: (v: string) => void;
  onDraftNewPw: () => void;
  onConfirmGrant: () => void;
  onCancelDraft: () => void;
  onUpdateLogin: (v: string) => void;
  onRegenPw: () => void;
  onCopyLogin: () => void;
  onCopyPassword: () => void;
  onRevoke: () => void;
};

function RegistryCabinetAccessBlock({
  draft,
  accessOn,
  cred,
  showPw,
  entryUrl,
  onTogglePw,
  onStartGrant,
  onDraftLogin,
  onDraftPassword,
  onDraftNewPw,
  onConfirmGrant,
  onCancelDraft,
  onUpdateLogin,
  onRegenPw,
  onCopyLogin,
  onCopyPassword,
  onRevoke,
}: RegistryCabinetAccessBlockProps) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid var(--cm-line)',
    fontSize: 13,
  };
  const monoInput: React.CSSProperties = {
    ...inputStyle,
    fontSize: 12,
    fontFamily: 'ui-monospace, monospace',
    flex: '1 1 160px',
    minWidth: 140,
  };

  if (draft) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cm-muted)', marginBottom: 4 }}>Логин</div>
          <input value={draft.login} onChange={(e) => onDraftLogin(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cm-muted)', marginBottom: 4 }}>Пароль</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <input type={showPw ? 'text' : 'password'} value={draft.password} onChange={(e) => onDraftPassword(e.target.value)} style={monoInput} />
            <button type="button" className="cm-btn" style={{ padding: '8px 12px', fontSize: 12 }} onClick={onTogglePw}>
              {showPw ? 'Скрыть' : 'Показать'}
            </button>
            <button type="button" className="cm-btn" style={{ padding: '8px 12px', fontSize: 12 }} onClick={onDraftNewPw}>
              Новый пароль
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" className="cm-btn cm-btn-primary" style={{ fontSize: 12 }} onClick={onConfirmGrant} disabled={!draft.login.trim()}>
            Подтвердить выдачу
          </button>
          <button type="button" className="cm-btn" style={{ fontSize: 12 }} onClick={onCancelDraft}>
            Отмена
          </button>
        </div>
      </div>
    );
  }

  if (accessOn && cred) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cm-muted)', marginBottom: 4 }}>Логин</div>
          <input value={cred.login} onChange={(e) => onUpdateLogin(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cm-muted)', marginBottom: 4 }}>Пароль</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <input type={showPw ? 'text' : 'password'} readOnly value={cred.password} style={monoInput} />
            <button type="button" className="cm-btn" style={{ padding: '8px 12px', fontSize: 12 }} onClick={onTogglePw}>
              {showPw ? 'Скрыть' : 'Показать'}
            </button>
            <button type="button" className="cm-btn" style={{ padding: '8px 12px', fontSize: 12 }} onClick={onRegenPw}>
              Новый пароль
            </button>
            <button type="button" className="cm-btn" style={{ padding: '8px 12px', fontSize: 12 }} onClick={onCopyPassword}>
              Копировать пароль
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button type="button" className="cm-btn" style={{ fontSize: 12 }} onClick={onCopyLogin}>
            Копировать логин
          </button>
          <button type="button" className="cm-btn" style={{ fontSize: 12 }} onClick={onRevoke}>
            Закрыть доступ
          </button>
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.45, color: 'var(--cm-muted)' }}>
          Страница входа:{' '}
          <a href="#clientcabinet" style={{ color: 'var(--cm-dark)', wordBreak: 'break-all' }}>
            {entryUrl}
          </a>
        </div>
      </div>
    );
  }

  if (accessOn) {
    return <span style={{ fontSize: 12, color: 'var(--cm-muted)' }}>Подождите, создаётся учётная запись…</span>;
  }

  return (
    <button type="button" className="cm-btn cm-btn-primary" style={{ fontSize: 12 }} onClick={onStartGrant}>
      Выдать доступ
    </button>
  );
}

function SchedulesManagementSection({
  schedules,
  clients,
  apartments,
  onDelete,
  onCreate,
}: {
  schedules: PaymentScheduleRecord[];
  clients: ClientRecord[];
  apartments: Apartment[];
  onDelete: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <>
      <div className="cm-section-head">
        <div>
          <p className="cm-subtitle" style={{ margin: 0 }}>
            Управление индивидуальными условиями оплаты по клиентам и квартирам.
          </p>
        </div>
        <button type="button" className="cm-btn cm-btn-primary" onClick={onCreate}>
          <span>+</span> Создать график
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="cm-empty">Пока нет созданных графиков платежей</div>
      ) : (
        <div className="cm-sch-grid">
          {schedules.map((sch) => {
            const cli = clients.find((c) => c.id === sch.clientId);
            const apt = apartments.find((a) => a.id === sch.aptId);
            return (
              <div key={sch.id} className="cm-sch-card">
                <div className="cm-sch-head">
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17 }}>{cli?.fio ?? sch.clientId}</div>
                    <div className="cm-sch-meta">
                      <span>🏢 {apt ? aptLine(apt) : sch.aptId}</span>
                      <span>📊 {sch.lines.length} платежей</span>
                    </div>
                  </div>
                  <span className={`cm-sch-badge cm-sch-badge-${sch.scheduleType}`}>{scheduleTypeLabel(sch.scheduleType)}</span>
                </div>
                <div className="cm-sch-summary">
                  <div>
                    <div className="cm-sch-sum-l">Базовая цена</div>
                    <div className="cm-sch-sum-v">{sch.totalPrice.toLocaleString('ru-RU')} ₽</div>
                  </div>
                  <div>
                    <div className="cm-sch-sum-l">К оплате</div>
                    <div className="cm-sch-sum-v">{sch.finalPrice.toLocaleString('ru-RU')} ₽</div>
                  </div>
                  <div>
                    <div className="cm-sch-sum-l">Условия</div>
                    <div className="cm-sch-sum-v" style={{ fontWeight: 600, fontSize: 12 }}>
                      {sch.details}
                    </div>
                  </div>
                </div>
                <div>
                  {sch.lines.map((line) => (
                    <div key={`${sch.id}-${line.n}-${line.dateIso}`} className="cm-sch-row">
                      <span style={{ fontWeight: 700, color: 'var(--cm-soft)' }}>#{line.n}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {new Date(line.dateIso).toLocaleDateString('ru-RU')}
                      </span>
                      <span>{line.description}</span>
                      <span style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {line.amount.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  ))}
                </div>
                <div className="cm-sch-actions">
                  <button type="button" className="cm-btn" style={{ flex: 1 }} disabled title="В разработке">
                    Редактировать
                  </button>
                  <button type="button" className="cm-btn" style={{ flex: 1 }} onClick={() => onDelete(sch.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

const CM_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap');

.clients-module-page {
  --cm-bg: #FAFAF9;
  --cm-card: #FFFFFF;
  --cm-line: #E4E4E7;
  --cm-line2: #D4D4D8;
  --cm-text: #18181B;
  --cm-muted: #52525B;
  --cm-soft: #A1A1AA;
  --cm-accent: #16A34A;
  --cm-dark: #0A0A0A;
  --cm-inverse: #FAFAF9;
  --cm-surface-2: #F5F5F4;
  font-family: Manrope, system-ui, sans-serif;
  background: var(--cm-bg);
  color: var(--cm-text);
  margin: -16px -16px 0;
  min-height: calc(100vh - 48px);
}

.clients-module-page * { box-sizing: border-box; }

/* Внутри стандартной карточки приложения — без отрицательных отступов и полноэкранной подложки */
.clients-module-page.clients-registry-inner {
  margin: 0;
  min-height: 0;
  background: transparent;
}
.clients-registry-inner .cm-container {
  padding: 0;
  max-width: none;
}

.cm-header {
  background: var(--cm-card);
  border-bottom: 1px solid var(--cm-line);
  position: sticky;
  top: 0;
  z-index: 50;
}

.cm-header-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.cm-logo {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--cm-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.cm-logo-dot {
  width: 6px;
  height: 6px;
  background: var(--cm-accent);
  border-radius: 50%;
}

.cm-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.cm-tab {
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--cm-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}

.cm-tab:hover {
  color: var(--cm-text);
  background: var(--cm-surface-2);
}

.cm-tab-active {
  color: var(--cm-inverse);
  background: var(--cm-dark);
}

.cm-main {
  padding: 40px 0 56px;
}

.cm-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 32px;
}

.cm-section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
  padding-bottom: 22px;
  border-bottom: 2px solid var(--cm-line);
}

.cm-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0;
}

.cm-subtitle {
  font-size: 14px;
  color: var(--cm-muted);
  margin: 6px 0 0;
  font-weight: 400;
  max-width: 560px;
}

.cm-btn {
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 20px;
  border: 1px solid var(--cm-line2);
  background: var(--cm-card);
  color: var(--cm-text);
  cursor: pointer;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s;
}

.cm-btn:hover {
  background: var(--cm-dark);
  color: var(--cm-inverse);
  border-color: var(--cm-dark);
}

.cm-btn-primary {
  background: var(--cm-dark);
  color: var(--cm-inverse);
  border-color: var(--cm-dark);
}

.cm-btn-primary:hover {
  background: var(--cm-text);
  border-color: var(--cm-text);
}

.cm-btn-ghost {
  background: transparent;
}

.cm-grid {
  display: grid;
  gap: 16px;
}

.cm-card {
  background: var(--cm-card);
  border: 1px solid var(--cm-line);
  border-radius: 12px;
  padding: 24px;
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
}

.cm-card:hover {
  border-color: var(--cm-soft);
  box-shadow: 0 10px 15px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.cm-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.cm-card-name {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 6px;
}

.cm-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--cm-muted);
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.cm-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.cm-badge-on {
  background: rgba(22, 163, 74, 0.1);
  color: var(--cm-accent);
}

.cm-badge-off {
  background: rgba(161, 161, 170, 0.12);
  color: var(--cm-soft);
}

.cm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.cm-tag {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  padding: 6px 12px;
  background: var(--cm-surface-2);
  border: 1px solid var(--cm-line);
  border-radius: 6px;
  font-weight: 500;
}

.cm-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--cm-line);
}

.cm-action {
  flex: 1;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 12px;
  border: 1px solid var(--cm-line);
  background: var(--cm-surface-2);
  color: var(--cm-text);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.cm-action:hover {
  background: var(--cm-dark);
  color: var(--cm-inverse);
  border-color: var(--cm-dark);
}

.cm-admin-section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--cm-muted);
  text-transform: uppercase;
  margin: 0 0 10px;
}

.cm-btn-block {
  width: 100%;
  justify-content: center;
  background: var(--cm-surface-2);
  border-color: var(--cm-line);
  margin-top: 4px;
}

.cm-btn-block:hover {
  background: var(--cm-dark);
  color: var(--cm-inverse);
  border-color: var(--cm-dark);
}

.cm-project-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--cm-muted);
  margin-top: 4px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.cm-note {
  font-size: 13px;
  color: var(--cm-muted);
  margin-bottom: 16px;
  line-height: 1.5;
}

.cm-panel {
  background: var(--cm-card);
  border: 1px solid var(--cm-line);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.cm-panel-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--cm-line);
}

.cm-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--cm-muted);
}

.cm-field input,
.cm-field select,
.cm-field textarea {
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  padding: 12px 16px;
  border: 1px solid var(--cm-line2);
  border-radius: 8px;
  background: var(--cm-card);
  color: var(--cm-text);
}

/* Выше специфичность глобальных [data-theme="dark"] input из App.css */
.cm-modal .cm-field input,
.cm-modal .cm-field select,
.cm-modal .cm-field textarea {
  background: var(--cm-card);
  border-color: var(--cm-line2);
  color: var(--cm-text);
}

.cm-field textarea { min-height: 100px; resize: vertical; }

.cm-field { margin-bottom: 16px; }

.cm-table-wrap { overflow-x: auto; }

.cm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.cm-table th,
.cm-table td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--cm-line);
  vertical-align: top;
}

.cm-table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--cm-muted);
}

.cm-admin-table .cm-admin-name {
  font-weight: 700;
  font-size: 14px;
  line-height: 1.3;
}

.cm-admin-table .cm-admin-actions {
  vertical-align: middle;
  width: 1%;
  white-space: nowrap;
}

.cm-admin-table .cm-admin-actions-inner {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.cm-icon-btn {
  width: 38px;
  height: 38px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--cm-line2);
  background: var(--cm-card);
  color: var(--cm-text);
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.cm-icon-btn:hover {
  background: var(--cm-dark);
  color: var(--cm-inverse);
  border-color: var(--cm-dark);
}

.cm-icon-btn.cm-icon-btn-primary {
  background: var(--cm-dark);
  color: var(--cm-inverse);
  border-color: var(--cm-dark);
}

.cm-icon-btn.cm-icon-btn-primary:hover {
  background: var(--cm-text);
  border-color: var(--cm-text);
}

.cm-icon-btn svg {
  width: 20px;
  height: 20px;
  display: block;
  fill: currentColor;
}

.cm-admin-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 16px 18px;
  background: var(--cm-surface-2);
  border: 1px solid var(--cm-line);
  border-radius: 10px;
}

.cm-admin-filters-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-end;
  gap: 12px 16px;
  min-width: 0;
  overflow-x: auto;
}

.cm-admin-filters .cm-field {
  margin-bottom: 0;
}

.cm-admin-filters-row .cm-admin-filter-search {
  flex: 1 1 180px;
  min-width: 0;
}

.cm-admin-filters-row .cm-field:not(.cm-admin-filter-search) {
  flex: 0 0 auto;
  width: 180px;
  min-width: 140px;
}

.cm-admin-filters-row .cm-admin-filter-reset {
  flex: 0 0 auto;
  padding-bottom: 1px;
}

.cm-admin-filter-meta {
  font-size: 12px;
  color: var(--cm-muted);
  margin: 0;
  padding-left: 2px;
}

.cm-empty {
  text-align: center;
  padding: 48px 24px;
  color: var(--cm-soft);
  font-size: 14px;
}

.cm-modal-overlay {
  /* Модалки монтируются вне .clients-module-page — дублируем токены, иначе var(--cm-*) невалидны */
  --cm-bg: #FAFAF9;
  --cm-card: #FFFFFF;
  --cm-line: #E4E4E7;
  --cm-line2: #D4D4D8;
  --cm-text: #18181B;
  --cm-muted: #52525B;
  --cm-soft: #A1A1AA;
  --cm-accent: #16A34A;
  --cm-dark: #0A0A0A;
  --cm-inverse: #FAFAF9;
  --cm-surface-2: #F5F5F4;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

[data-theme="dark"] .cm-modal-overlay {
  --cm-bg: #0b1020;
  --cm-card: #121a38;
  --cm-line: rgba(36, 48, 95, 0.85);
  --cm-line2: rgba(36, 48, 95, 0.55);
  --cm-text: #e9edff;
  --cm-muted: #aab4e6;
  --cm-soft: #7f8ac4;
  --cm-accent: #6ea8fe;
  --cm-dark: #6ea8fe;
  --cm-inverse: #091021;
  --cm-surface-2: rgba(17, 40, 80, 0.42);
}

.cm-modal {
  background: var(--cm-card);
  border: 1px solid var(--cm-line);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  color: var(--cm-text);
  scrollbar-color: rgba(127, 138, 196, 0.35) transparent;
}

.cm-modal::-webkit-scrollbar {
  width: 8px;
}

.cm-modal::-webkit-scrollbar-track {
  background: transparent;
}

.cm-modal::-webkit-scrollbar-thumb {
  background-color: rgba(127, 138, 196, 0.35);
  border-radius: 8px;
  border: 2px solid transparent;
  background-clip: content-box;
}

[data-theme="light"] .cm-modal::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.12);
}

.cm-modal-head {
  padding: 22px 24px;
  border-bottom: 1px solid var(--cm-line);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cm-modal-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.cm-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--cm-soft);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  line-height: 1;
}

.cm-modal-close:hover {
  background: var(--cm-surface-2);
  color: var(--cm-text);
}

.cm-modal-body { padding: 24px; }

.cm-modal-foot {
  padding: 20px 24px;
  border-top: 1px solid var(--cm-line);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cm-notif-item {
  padding: 16px;
  border-left: 3px solid var(--cm-line);
  background: var(--cm-surface-2);
  border-radius: 0 8px 8px 0;
  margin-bottom: 12px;
}

.cm-notif-item.cm-remind {
  border-left-color: #EAB308;
  background: rgba(234, 179, 8, 0.06);
}

.cm-notif-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 11px;
  color: var(--cm-soft);
}

.cm-modal-wide {
  max-width: 720px;
}

.cm-modal-schedules-browser {
  max-width: min(1040px, calc(100vw - 32px));
}

.cm-pay-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.cm-pay-type-card {
  padding: 12px;
  border: 2px solid var(--cm-line);
  border-radius: 10px;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.35;
  transition: border-color 0.15s, background 0.15s;
  background: var(--cm-card);
}

.cm-pay-type-card:hover {
  border-color: var(--cm-line2);
}

.cm-pay-type-card.cm-pay-type-active {
  border-color: var(--cm-accent);
  background: var(--cm-surface-2);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--cm-accent) 28%, transparent);
}

.cm-pay-type-name {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 4px;
}

.cm-sch-grid {
  display: grid;
  gap: 16px;
}

.cm-sch-card {
  border: 1px solid var(--cm-line);
  border-radius: 12px;
  padding: 20px;
  background: var(--cm-card);
}

.cm-sch-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.cm-sch-meta {
  font-size: 12px;
  color: var(--cm-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.cm-sch-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 12px;
  background: var(--cm-surface-2);
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 12px;
}

.cm-sch-sum-l {
  font-size: 10px;
  color: var(--cm-soft);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cm-sch-sum-v {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-top: 4px;
}

.cm-sch-row {
  display: grid;
  grid-template-columns: 44px 92px 1fr minmax(72px, 96px);
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--cm-line);
  font-size: 12px;
  align-items: center;
}

.cm-sch-row:last-child {
  border-bottom: none;
}

.cm-sch-actions {
  display: flex;
  gap: 8px;
  padding-top: 14px;
  margin-top: 8px;
  border-top: 1px solid var(--cm-line);
}

.cm-sch-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.cm-sch-badge-standard { background: rgba(37, 99, 235, 0.1); color: #2563EB; }
.cm-sch-badge-discount { background: rgba(22, 163, 74, 0.1); color: #16A34A; }
.cm-sch-badge-barter { background: rgba(147, 51, 234, 0.1); color: #9333EA; }
.cm-sch-badge-installment { background: rgba(234, 179, 8, 0.15); color: #CA8A04; }
.cm-sch-badge-custom { background: rgba(234, 88, 12, 0.12); color: #EA580C; }

.cm-preview-box {
  margin-top: 16px;
  padding: 16px;
  background: var(--cm-surface-2);
  border-radius: 10px;
  border: 1px solid var(--cm-line);
}

.cm-preview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--cm-line2);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@media (max-width: 640px) {
  .cm-container { padding: 0 16px; }
  .cm-header-inner { padding: 16px; }
  .cm-sch-row {
    grid-template-columns: 36px 1fr;
    grid-template-rows: auto auto;
  }
}
`;

type TabKey = 'admin' | 'payment' | 'notify';

const ClientsRegistry: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('admin');
  const [file, setFile] = useState<RegistryFile>(() => loadRegistry());
  const [apartments, setApartments] = useState<Apartment[]>(() => loadApartmentsFromStorage());
  const [showCabinetPw, setShowCabinetPw] = useState<Record<string, boolean>>({});
  /** Черновик выдачи доступа (форма после «Выдать доступ»). */
  const [cabinetGrantDraft, setCabinetGrantDraft] = useState<
    Record<string, { login: string; password: string }>
  >({});

  const refreshApartments = useCallback(() => {
    setApartments(loadApartmentsFromStorage());
    setFile(loadRegistry());
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshApartments();
    };
    document.addEventListener('visibilitychange', onVis);
    const onStorage = (e: StorageEvent) => {
      if (e.key === REGISTRY_STORAGE_KEY || e.key === PROJECT_BLOCKS_STORAGE_KEY) refreshApartments();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshApartments]);

  const persist = useCallback((next: RegistryFile) => {
    setFile(next);
    saveRegistry(next);
  }, []);

  const allClients = useMemo(() => {
    const byId = new Map<string, ClientRecord>();
    CLIENTS.forEach((c) => byId.set(c.id, c));
    file.extraClients.forEach((c) => byId.set(c.id, c));
    return Array.from(byId.values());
  }, [file.extraClients]);

  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilterAccess, setAdminFilterAccess] = useState<'all' | 'open' | 'closed'>('all');
  const [adminFilterSchedules, setAdminFilterSchedules] = useState<'all' | 'none' | 'has'>('all');

  const filteredAdminClients = useMemo(() => {
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^\d\w\u0400-\u04FF+.,\-/]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const q = norm(adminSearch);
    const words = q ? q.split(' ').filter(Boolean) : [];

    const matchesSearch = (c: ClientRecord) => {
      if (words.length === 0) return true;
      const aptShort = shortApartmentLabelsForClient(c, apartments);
      const blob = norm(
        [c.fio, c.phone, c.email, c.id, c.passport, aptShort, ...(c.apartmentLabels ?? []), DEMO_RESIDENTIAL_COMPLEX].join(
          ' ',
        ),
      );
      return words.every((w) => blob.includes(w));
    };

    return allClients.filter((c) => {
      if (!matchesSearch(c)) return false;
      const open = isAccessOpen(file.cabinetAccess, c.id);
      if (adminFilterAccess === 'open' && !open) return false;
      if (adminFilterAccess === 'closed' && open) return false;
      const schN = scheduleCountForClient(c.id, file.paymentSchedules);
      if (adminFilterSchedules === 'none' && schN !== 0) return false;
      if (adminFilterSchedules === 'has' && schN === 0) return false;
      return true;
    });
  }, [
    allClients,
    adminSearch,
    adminFilterAccess,
    adminFilterSchedules,
    file.cabinetAccess,
    file.paymentSchedules,
    apartments,
  ]);

  const [addOpen, setAddOpen] = useState(false);
  const [addFio, setAddFio] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassport, setAddPassport] = useState('');
  const [addApartment, setAddApartment] = useState('');
  const [addAccess, setAddAccess] = useState<'active' | 'inactive'>('active');

  const handleAddClient = () => {
    const fio = addFio.trim();
    if (!fio) return;
    const id = `MOCK-REG-${Date.now().toString(36)}`;
    const apt = addApartment.trim();
    const row: ClientRecord = {
      id,
      fio,
      phone: addPhone.trim() || '+7 (900) 000-00-00',
      email: addEmail.trim() || `mock.${id}@example.invalid`,
      passport: addPassport.trim() || 'MOCK-REG-PASS',
      apartmentLabels: apt ? [apt] : undefined,
    };
    const nextAccess = { ...file.cabinetAccess, [id]: addAccess === 'active' };
    const nextCred: CabinetCredential | undefined =
      addAccess === 'active'
        ? { login: suggestCabinetLogin(row), password: generateCabinetPassword() }
        : undefined;
    persist({
      ...file,
      extraClients: [...file.extraClients, row],
      cabinetAccess: nextAccess,
      cabinetCredentials: nextCred
        ? { ...file.cabinetCredentials, [id]: nextCred }
        : file.cabinetCredentials,
    });
    setAddFio('');
    setAddPhone('');
    setAddEmail('');
    setAddPassport('');
    setAddApartment('');
    setAddAccess('active');
    setAddOpen(false);
  };

  const cabinetEntryUrl = `${window.location.origin}${window.location.pathname}#clientcabinet`;

  const updateCabinetLogin = (clientId: string, login: string) => {
    const prev = file.cabinetCredentials[clientId];
    if (!prev) return;
    persist({
      ...file,
      cabinetCredentials: { ...file.cabinetCredentials, [clientId]: { ...prev, login: login.trim() } },
    });
  };

  const regenerateCabinetPassword = (clientId: string) => {
    const prev = file.cabinetCredentials[clientId];
    if (!prev) return;
    persist({
      ...file,
      cabinetCredentials: {
        ...file.cabinetCredentials,
        [clientId]: { ...prev, password: generateCabinetPassword() },
      },
    });
  };

  const startCabinetGrantForm = (clientId: string) => {
    const client = allClients.find((c) => c.id === clientId);
    setCabinetGrantDraft((d) => ({
      ...d,
      [clientId]: {
        login: client ? suggestCabinetLogin(client) : `user_${clientId.slice(-8)}`,
        password: generateCabinetPassword(),
      },
    }));
  };

  const cancelCabinetGrantForm = (clientId: string) => {
    setCabinetGrantDraft((d) => {
      const next = { ...d };
      delete next[clientId];
      return next;
    });
  };

  const confirmCabinetGrant = (clientId: string) => {
    const draft = cabinetGrantDraft[clientId];
    if (!draft || !draft.login.trim()) return;
    persist({
      ...file,
      cabinetAccess: { ...file.cabinetAccess, [clientId]: true },
      cabinetCredentials: {
        ...file.cabinetCredentials,
        [clientId]: { login: draft.login.trim(), password: draft.password },
      },
    });
    cancelCabinetGrantForm(clientId);
  };

  const revokeCabinetAccess = (clientId: string) => {
    cancelCabinetGrantForm(clientId);
    persist({ ...file, cabinetAccess: { ...file.cabinetAccess, [clientId]: false } });
  };

  const [payClientId, setPayClientId] = useState('');
  const [payAptId, setPayAptId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payComment, setPayComment] = useState('');
  const [payReceiptName, setPayReceiptName] = useState<string | null>(null);

  const clientApts = useMemo(() => {
    if (!payClientId) return [];
    return apartments.filter((a) => a.clientId === payClientId && (a.status === 'sold' || !!a.clientId));
  }, [apartments, payClientId]);

  const submitPayment = () => {
    const apt = apartments.find((a) => a.id === payAptId);
    if (!payClientId || !apt || !payAmount.trim()) return;
    const amount = Number(payAmount.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return;
    const row: PaymentSubmission = {
      id: newId('pay'),
      clientId: payClientId,
      aptId: apt.id,
      block: apt.block,
      floor: String(apt.floor),
      aptIdx: apt.aptIdx,
      amount,
      comment: payComment.trim(),
      receiptFileName: payReceiptName,
      submittedAt: new Date().toISOString(),
    };
    persist({ ...file, paymentSubmissions: [row, ...file.paymentSubmissions] });
    setPayAmount('');
    setPayComment('');
    setPayReceiptName(null);
    setPayAptId('');
  };

  const [nClientId, setNClientId] = useState<string | ''>('');
  const [nType, setNType] = useState<'payment_reminder' | 'general'>('payment_reminder');
  const [nTitle, setNTitle] = useState('');
  const [nBody, setNBody] = useState('');

  const [schOpen, setSchOpen] = useState(false);
  const [schedulesBrowserOpen, setSchedulesBrowserOpen] = useState(false);
  const [schedulesBrowserPresetClientId, setSchedulesBrowserPresetClientId] = useState<string | undefined>(undefined);
  const [cabinetAccessModalClientId, setCabinetAccessModalClientId] = useState<string | null>(null);
  const [schClientId, setSchClientId] = useState('');
  const [schAptId, setSchAptId] = useState('');
  const [schTotal, setSchTotal] = useState('');
  const [schStart, setSchStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [schType, setSchType] = useState<PaymentScheduleType>('standard');
  const [schStdInit, setSchStdInit] = useState(20);
  const [schStdCount, setSchStdCount] = useState(6);
  const [schDiscPct, setSchDiscPct] = useState(10);
  const [schDiscInit, setSchDiscInit] = useState(30);
  const [schDiscCount, setSchDiscCount] = useState(4);
  const [schBarterProp, setSchBarterProp] = useState('');
  const [schBarterVal, setSchBarterVal] = useState('');
  const [schBarterCount, setSchBarterCount] = useState(5);
  const [schInstInit, setSchInstInit] = useState(10);
  const [schInstMonths, setSchInstMonths] = useState(24);
  const [schCustInit, setSchCustInit] = useState('');
  const [schCustCount, setSchCustCount] = useState(3);
  const [schCustNote, setSchCustNote] = useState('');
  const [schPreview, setSchPreview] = useState<PreviewPaymentLine[] | null>(null);

  const schAptsForModal = useMemo(() => {
    if (!schClientId) return [];
    return apartments.filter((a) => a.clientId === schClientId && (a.status === 'sold' || !!a.clientId));
  }, [apartments, schClientId]);

  useEffect(() => {
    if (!schClientId) {
      setSchAptId('');
      return;
    }
    const list = apartments.filter((a) => a.clientId === schClientId && (a.status === 'sold' || !!a.clientId));
    setSchAptId((prev) => (prev && list.some((a) => a.id === prev) ? prev : list[0]?.id ?? ''));
  }, [schClientId, apartments]);

  const openScheduleModal = useCallback((presetClientId?: string) => {
    setSchPreview(null);
    setSchStart(new Date().toISOString().slice(0, 10));
    const firstWithApt = allClients.find((c) =>
      apartments.some((a) => a.clientId === c.id && (a.status === 'sold' || !!a.clientId)),
    );
    const cid =
      presetClientId && allClients.some((c) => c.id === presetClientId)
        ? presetClientId
        : firstWithApt?.id ?? allClients[0]?.id ?? '';
    setSchClientId(cid);
    setSchType('standard');
    setSchTotal('');
    setSchOpen(true);
  }, [allClients, apartments]);

  const buildSchedulePreviewLines = useCallback((): PreviewPaymentLine[] | null => {
    const total = Number(String(schTotal).replace(/\s/g, '').replace(',', '.'));
    const start = new Date(schStart);
    if (!Number.isFinite(total) || total <= 0 || Number.isNaN(start.getTime())) return null;
    switch (schType) {
      case 'standard':
        return calculateStandard({
          totalPrice: total,
          startDate: start,
          initialPercent: schStdInit,
          paymentsCount: Math.max(1, schStdCount),
        });
      case 'discount':
        return calculateDiscount({
          totalPrice: total,
          startDate: start,
          discountPercent: schDiscPct,
          initialPercent: schDiscInit,
          paymentsCount: Math.max(1, schDiscCount),
        });
      case 'barter': {
        const bv = Number(String(schBarterVal).replace(/\s/g, '').replace(',', '.')) || 0;
        return calculateBarter({
          totalPrice: total,
          startDate: start,
          barterValue: bv,
          paymentsCount: Math.max(1, schBarterCount),
          propertyDescription: schBarterProp,
        });
      }
      case 'installment':
        return calculateInstallment({
          totalPrice: total,
          startDate: start,
          initialPercent: schInstInit,
          months: Math.max(1, schInstMonths),
        });
      case 'custom': {
        const init = Number(String(schCustInit).replace(/\s/g, '').replace(',', '.')) || 0;
        return calculateCustom({
          totalPrice: total,
          startDate: start,
          initialAmount: init,
          paymentsCount: Math.max(1, schCustCount),
        });
      }
      default:
        return null;
    }
  }, [
    schTotal,
    schStart,
    schType,
    schStdInit,
    schStdCount,
    schDiscPct,
    schDiscInit,
    schDiscCount,
    schBarterProp,
    schBarterVal,
    schBarterCount,
    schInstInit,
    schInstMonths,
    schCustInit,
    schCustCount,
  ]);

  const runSchedulePreview = () => {
    const lines = buildSchedulePreviewLines();
    setSchPreview(lines);
  };

  const submitScheduleForm = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = buildSchedulePreviewLines();
    if (!lines?.length || !schClientId || !schAptId) return;
    const total = Number(String(schTotal).replace(/\s/g, '').replace(',', '.'));
    const bv = Number(String(schBarterVal).replace(/\s/g, '').replace(',', '.')) || 0;
    const { finalPrice, details } = computeFinalPriceAndDetails(schType, total, {
      discountPercent: schDiscPct,
      barterValue: bv,
      installmentMonths: schInstMonths,
      customNote: schCustNote,
    });
    const record: PaymentScheduleRecord = {
      id: newId('sch'),
      clientId: schClientId,
      aptId: schAptId,
      scheduleType: schType,
      totalPrice: total,
      finalPrice,
      details,
      lines: previewLinesToStored(lines),
      createdAt: new Date().toISOString(),
    };
    const rest = file.paymentSchedules.filter((s) => s.aptId !== schAptId);
    persist({ ...file, paymentSchedules: [...rest, record] });
    setSchOpen(false);
    setSchPreview(null);
  };

  const deletePaymentSchedule = (id: string) => {
    if (!window.confirm('Удалить этот график платежей?')) return;
    persist({ ...file, paymentSchedules: file.paymentSchedules.filter((s) => s.id !== id) });
  };

  useEffect(() => {
    if (!schOpen || !schAptId) return;
    const apt = apartments.find((a) => a.id === schAptId);
    if (!apt) return;
    setSchTotal((t) => (t.trim() === '' ? String(Math.round(apt.price)) : t));
  }, [schOpen, schAptId, apartments]);

  /** Старые сохранённые данные: доступ включён, но нет пары логин/пароль — создаём автоматически. */
  useEffect(() => {
    const missing = allClients.filter((c) => file.cabinetAccess[c.id] && !file.cabinetCredentials[c.id]);
    if (missing.length === 0) return;
    const next: CabinetCredentialsMap = { ...file.cabinetCredentials };
    for (const c of missing) {
      next[c.id] = { login: suggestCabinetLogin(c), password: generateCabinetPassword() };
    }
    persist({ ...file, cabinetCredentials: next });
  }, [allClients, file.cabinetAccess, file.cabinetCredentials, file.extraClients, persist]);

  const sendNotification = () => {
    const title = nTitle.trim();
    const body = nBody.trim();
    if (!title || !body) return;
    const row: CompanyNotification = {
      id: newId('ntf'),
      clientId: nClientId || null,
      type: nType,
      title,
      body,
      createdAt: new Date().toISOString(),
    };
    persist({ ...file, companyNotifications: [row, ...file.companyNotifications] });
    setNTitle('');
    setNBody('');
  };

  const cabinetAccessModalFio =
    cabinetAccessModalClientId === null
      ? undefined
      : allClients.find((c) => c.id === cabinetAccessModalClientId)?.fio;
  const cabinetAccessModalTitle =
    cabinetAccessModalClientId === null
      ? ''
      : cabinetGrantDraft[cabinetAccessModalClientId]
        ? `Выдача доступа${cabinetAccessModalFio ? ` — ${cabinetAccessModalFio}` : ''}`
        : `Доступ к кабинету${cabinetAccessModalFio ? ` — ${cabinetAccessModalFio}` : ''}`;

  const closeCabinetAccessModal = () => {
    if (cabinetAccessModalClientId && cabinetGrantDraft[cabinetAccessModalClientId]) {
      cancelCabinetGrantForm(cabinetAccessModalClientId);
    }
    setCabinetAccessModalClientId(null);
  };

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs">
            <a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Реестр клиентов</span>
          </div>
          <div className="h1">Реестр клиентов</div>
          <p className="h2">Список покупателей • доступ в личный кабинет • графики платежей • уведомления клиентам.</p>
        </div>
        <div className="actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" className="btn primary" onClick={() => setAddOpen(true)}>
            + Добавить клиента
          </button>
          <a className="btn small" href={cabinetEntryUrl}>
            Личный кабинет клиента
          </a>
        </div>
      </div>

      <div className="card">
        <div className="cardBody">
          <div className="tabs" role="tablist" aria-label="Разделы модуля">
            <div
              role="tab"
              tabIndex={0}
              className={`tab ${tab === 'admin' ? 'active' : ''}`}
              onClick={() => setTab('admin')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setTab('admin'))}
            >
              Администрирование
            </div>
            <div
              role="tab"
              tabIndex={0}
              className={`tab ${tab === 'payment' ? 'active' : ''}`}
              onClick={() => setTab('payment')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setTab('payment'))}
            >
              Оплата
            </div>
            <div
              role="tab"
              tabIndex={0}
              className={`tab ${tab === 'notify' ? 'active' : ''}`}
              onClick={() => setTab('notify')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setTab('notify'))}
            >
              Уведомления
            </div>
          </div>

          <div className="clients-module-page clients-registry-inner">
            <style>{CM_STYLES}</style>
            <div className="cm-container">
          {tab === 'admin' && (
            <>
              <div className="cm-section-head">
                <div>
                  <h1 className="cm-title">Клиенты</h1>
                  <p className="cm-subtitle">Список покупателей и их квартиры</p>
                </div>
              </div>

              {allClients.length === 0 ? (
                <div className="cm-empty">Нет клиентов в списке</div>
              ) : (
                <>
                  <div className="cm-admin-filters">
                    <div className="cm-admin-filters-row">
                      <div className="cm-field cm-admin-filter-search">
                        <label htmlFor="admin-client-search">Поиск</label>
                        <input
                          id="admin-client-search"
                          type="search"
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          placeholder="ФИО, телефон, e-mail, квартира, ID…"
                          autoComplete="off"
                        />
                      </div>
                      <div className="cm-field">
                        <label htmlFor="admin-filter-access">Доступ в кабинет</label>
                        <select
                          id="admin-filter-access"
                          value={adminFilterAccess}
                          onChange={(e) => setAdminFilterAccess(e.target.value as 'all' | 'open' | 'closed')}
                        >
                          <option value="all">Все</option>
                          <option value="open">Доступ выдан</option>
                          <option value="closed">Нет доступа</option>
                        </select>
                      </div>
                      <div className="cm-field">
                        <label htmlFor="admin-filter-schedules">Графики платежей</label>
                        <select
                          id="admin-filter-schedules"
                          value={adminFilterSchedules}
                          onChange={(e) => setAdminFilterSchedules(e.target.value as 'all' | 'none' | 'has')}
                        >
                          <option value="all">Все</option>
                          <option value="has">Есть активные</option>
                          <option value="none">Нет активных</option>
                        </select>
                      </div>
                      <div className="cm-admin-filter-reset">
                        <button
                          type="button"
                          className="cm-btn"
                          onClick={() => {
                            setAdminSearch('');
                            setAdminFilterAccess('all');
                            setAdminFilterSchedules('all');
                          }}
                        >
                          Сбросить
                        </button>
                      </div>
                    </div>
                    {(adminSearch.trim() !== '' || adminFilterAccess !== 'all' || adminFilterSchedules !== 'all') && (
                      <div className="cm-admin-filter-meta">
                        Показано: {filteredAdminClients.length} из {allClients.length}
                      </div>
                    )}
                  </div>
                  {filteredAdminClients.length === 0 ? (
                    <div className="cm-empty">Нет клиентов по заданным условиям</div>
                  ) : (
                    <div className="cm-table-wrap">
                  <table className="cm-table cm-admin-table">
                    <thead>
                      <tr>
                        <th>Клиент</th>
                        <th>Телефон</th>
                        <th>Объект</th>
                        <th>Квартиры</th>
                        <th>Графики</th>
                        <th>Статус</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminClients.map((c) => {
                        const open = isAccessOpen(file.cabinetAccess, c.id);
                        const draft = cabinetGrantDraft[c.id];
                        const schN = scheduleCountForClient(c.id, file.paymentSchedules);
                        const aptShort = shortApartmentLabelsForClient(c, apartments);
                        const activeSchedulesLabel =
                          schN === 0 ? 'нет активных' : schN === 1 ? '1 активный' : `${schN} активных`;
                        return (
                          <tr key={c.id}>
                            <td>
                              <div className="cm-admin-name">{c.fio}</div>
                            </td>
                            <td>
                              <span className="cm-meta" style={{ fontSize: 13 }}>
                                {c.phone}
                              </span>
                            </td>
                            <td>
                              <span className="cm-project-line" style={{ marginTop: 0 }}>
                                <span aria-hidden>🏢</span>
                                <span>{DEMO_RESIDENTIAL_COMPLEX}</span>
                              </span>
                            </td>
                            <td style={{ maxWidth: 220, wordBreak: 'break-word' }}>{aptShort}</td>
                            <td>{activeSchedulesLabel}</td>
                            <td>
                              <span className={`cm-badge ${open ? 'cm-badge-on' : 'cm-badge-off'}`}>
                                {open ? 'Доступ выдан' : 'Нет доступа'}
                              </span>
                            </td>
                            <td className="cm-admin-actions">
                              <div className="cm-admin-actions-inner">
                                <button
                                  type="button"
                                  className="cm-btn cm-icon-btn"
                                  title="Графики платежей"
                                  aria-label="Графики платежей"
                                  onClick={() => {
                                    setSchedulesBrowserPresetClientId(c.id);
                                    setSchedulesBrowserOpen(true);
                                  }}
                                >
                                  <svg viewBox="0 0 24 24" aria-hidden>
                                    <path d="M5 20V10h4v10H5zm6 0V4h4v16h-4zm5 0v-6h4v6h-4z" />
                                  </svg>
                                </button>
                                {open && (
                                  <button
                                    type="button"
                                    className="cm-btn cm-icon-btn"
                                    title="Доступ к кабинету"
                                    aria-label="Доступ к кабинету"
                                    onClick={() => setCabinetAccessModalClientId(c.id)}
                                  >
                                    <svg viewBox="0 0 24 24" aria-hidden>
                                      <path d="M12 12c2.21 0 4 -1.79 4 -4s-1.79 -4 -4 -4 -4 1.79 -4 4 1.79 4 4 4zm0 2c-2.67 0 -8 1.34 -8 4v2h16v-2c0 -2.66 -5.33 -4 -8 -4z" />
                                    </svg>
                                  </button>
                                )}
                                {!open && !draft && (
                                  <button
                                    type="button"
                                    className="cm-btn cm-icon-btn cm-icon-btn-primary"
                                    title="Выдать доступ"
                                    aria-label="Выдать доступ"
                                    onClick={() => {
                                      startCabinetGrantForm(c.id);
                                      setCabinetAccessModalClientId(c.id);
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" aria-hidden>
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                                    </svg>
                                  </button>
                                )}
                                {!open && draft && (
                                  <button
                                    type="button"
                                    className="cm-btn cm-icon-btn cm-icon-btn-primary"
                                    title="Продолжить выдачу доступа"
                                    aria-label="Продолжить выдачу доступа"
                                    onClick={() => setCabinetAccessModalClientId(c.id)}
                                  >
                                    <svg viewBox="0 0 24 24" aria-hidden>
                                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {tab === 'payment' && (
            <>
              <div className="cm-section-head">
                <div>
                  <h1 className="cm-title">Оплата</h1>
                  <p className="cm-subtitle">
                    Приём платежей и журнал заявок (демо, данные в браузере). Выдача доступа в личный кабинет — в разделе
                    «Администрирование».
                  </p>
                </div>
              </div>

              <div className="cm-panel">
                <div className="cm-panel-title">Новый платёж</div>
                <p className="cm-note">Выбор квартиры из привязанных к клиенту в демо-данных; квитанция — только имя файла.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                  <div className="cm-field">
                    <label>Клиент</label>
                    <select value={payClientId} onChange={(e) => { setPayClientId(e.target.value); setPayAptId(''); }}>
                      <option value="">— выберите —</option>
                      {allClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fio}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="cm-field">
                    <label>Квартира</label>
                    <select value={payAptId} onChange={(e) => setPayAptId(e.target.value)} disabled={!payClientId}>
                      <option value="">— выберите —</option>
                      {clientApts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.block} • эт.{a.floor} • кв.{a.aptIdx + 1} ({a.area} м²)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="cm-field">
                    <label>Сумма платежа</label>
                    <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="например 500000" />
                  </div>
                  <div className="cm-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Комментарий</label>
                    <input value={payComment} onChange={(e) => setPayComment(e.target.value)} placeholder="Необязательно" />
                  </div>
                  <div className="cm-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Квитанция</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setPayReceiptName(f?.name ?? null);
                      }}
                    />
                    {payReceiptName && <span style={{ fontSize: 12, color: 'var(--cm-muted)' }}>{payReceiptName}</span>}
                  </div>
                </div>
                <button type="button" className="cm-btn cm-btn-primary" onClick={submitPayment}>
                  Зафиксировать платёж
                </button>
              </div>

              <div className="cm-panel">
                <div className="cm-panel-title">Заявки на платёж</div>
                {file.paymentSubmissions.length === 0 ? (
                  <div className="cm-empty">Пока нет записей</div>
                ) : (
                  <div className="cm-table-wrap">
                    <table className="cm-table">
                      <thead>
                        <tr>
                          <th>Дата</th>
                          <th>Клиент</th>
                          <th>Объект</th>
                          <th>Сумма</th>
                          <th>Квитанция</th>
                          <th>Комментарий</th>
                        </tr>
                      </thead>
                      <tbody>
                        {file.paymentSubmissions.map((p) => {
                          const cl = allClients.find((c) => c.id === p.clientId);
                          return (
                            <tr key={p.id}>
                              <td>{new Date(p.submittedAt).toLocaleString('ru-RU')}</td>
                              <td>{cl?.fio ?? p.clientId}</td>
                              <td>
                                {p.block} • эт.{p.floor} • кв.{p.aptIdx + 1}
                              </td>
                              <td style={{ fontFamily: '"JetBrains Mono", monospace' }}>{p.amount.toLocaleString('ru-RU')}</td>
                              <td>{p.receiptFileName ?? '—'}</td>
                              <td>{p.comment || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'notify' && (
            <>
              <div className="cm-section-head">
                <div>
                  <h1 className="cm-title">Уведомления</h1>
                  <p className="cm-subtitle">Рассылка уведомлений клиентам; в демо сообщения сохраняются локально и видны в кабинете.</p>
                </div>
              </div>

              <div className="cm-panel">
                <div className="cm-panel-title">Новое уведомление</div>
                <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
                  <div className="cm-field">
                    <label>Получатель</label>
                    <select value={nClientId} onChange={(e) => setNClientId(e.target.value)}>
                      <option value="">Все с выданным доступом</option>
                      {allClients.filter((c) => isAccessOpen(file.cabinetAccess, c.id)).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fio}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="cm-field">
                    <label>Тип уведомления</label>
                    <select value={nType} onChange={(e) => setNType(e.target.value as 'payment_reminder' | 'general')}>
                      <option value="payment_reminder">Напоминание по графику</option>
                      <option value="general">Информационное</option>
                    </select>
                  </div>
                  <div className="cm-field">
                    <label>Заголовок</label>
                    <input value={nTitle} onChange={(e) => setNTitle(e.target.value)} />
                  </div>
                  <div className="cm-field">
                    <label>Текст уведомления</label>
                    <textarea value={nBody} onChange={(e) => setNBody(e.target.value)} rows={4} />
                  </div>
                  <button type="button" className="cm-btn cm-btn-primary" style={{ justifySelf: 'start' }} onClick={sendNotification}>
                    Отправить
                  </button>
                </div>
              </div>

              <div className="cm-panel">
                <div className="cm-panel-title">История уведомлений</div>
                {file.companyNotifications.length === 0 ? (
                  <div className="cm-empty">Нет отправленных уведомлений</div>
                ) : (
                  file.companyNotifications.map((n) => (
                    <div key={n.id} className={`cm-notif-item ${n.type === 'payment_reminder' ? 'cm-remind' : ''}`}>
                      <div className="cm-notif-meta">
                        <span>{n.type === 'payment_reminder' ? 'Напоминание по графику' : 'Информационное'}</span>
                        <span>{new Date(n.createdAt).toLocaleString('ru-RU')}</span>
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>{n.title}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{n.body}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--cm-soft)' }}>
                        Кому: {n.clientId ? allClients.find((c) => c.id === n.clientId)?.fio ?? n.clientId : 'Все с доступом'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
        </div>
      </div>

      {schedulesBrowserOpen && (
        <div
          className="cm-modal-overlay"
          role="presentation"
          onClick={() => {
            setSchedulesBrowserOpen(false);
            setSchedulesBrowserPresetClientId(undefined);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSchedulesBrowserOpen(false);
              setSchedulesBrowserPresetClientId(undefined);
            }
          }}
        >
          <div
            className="cm-modal cm-modal-schedules-browser"
            role="dialog"
            aria-labelledby="schedules-browser-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cm-modal-head">
              <h2 id="schedules-browser-title" className="cm-modal-title">
                Графики платежей
              </h2>
              <button
                type="button"
                className="cm-modal-close"
                aria-label="Закрыть"
                onClick={() => {
                  setSchedulesBrowserOpen(false);
                  setSchedulesBrowserPresetClientId(undefined);
                }}
              >
                ×
              </button>
            </div>
            <div className="cm-modal-body">
              <SchedulesManagementSection
                schedules={file.paymentSchedules}
                clients={allClients}
                apartments={apartments}
                onDelete={deletePaymentSchedule}
                onCreate={() => {
                  openScheduleModal(schedulesBrowserPresetClientId);
                  setSchedulesBrowserOpen(false);
                  setSchedulesBrowserPresetClientId(undefined);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {cabinetAccessModalClientId && (
        <div
          className="cm-modal-overlay"
          role="presentation"
          onClick={closeCabinetAccessModal}
          onKeyDown={(e) => e.key === 'Escape' && closeCabinetAccessModal()}
        >
          <div
            className="cm-modal cm-modal-wide"
            role="dialog"
            aria-labelledby="cabinet-access-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cm-modal-head">
              <h2 id="cabinet-access-modal-title" className="cm-modal-title">
                {cabinetAccessModalTitle}
              </h2>
              <button type="button" className="cm-modal-close" aria-label="Закрыть" onClick={closeCabinetAccessModal}>
                ×
              </button>
            </div>
            <div className="cm-modal-body">
              <p className="cm-note" style={{ marginTop: 0 }}>
                Логин и пароль для входа в личный кабинет (демо, данные хранятся в браузере).
              </p>
              <h4 className="cm-admin-section-title">Доступ</h4>
              <RegistryCabinetAccessBlock
                draft={cabinetGrantDraft[cabinetAccessModalClientId]}
                accessOn={isAccessOpen(file.cabinetAccess, cabinetAccessModalClientId)}
                cred={file.cabinetCredentials[cabinetAccessModalClientId]}
                showPw={!!showCabinetPw[cabinetAccessModalClientId]}
                entryUrl={cabinetEntryUrl}
                onTogglePw={() =>
                  setShowCabinetPw((s) => ({ ...s, [cabinetAccessModalClientId]: !s[cabinetAccessModalClientId] }))
                }
                onStartGrant={() => startCabinetGrantForm(cabinetAccessModalClientId)}
                onDraftLogin={(v) =>
                  setCabinetGrantDraft((d) => {
                    const cur = d[cabinetAccessModalClientId];
                    if (!cur) return d;
                    return { ...d, [cabinetAccessModalClientId]: { ...cur, login: v } };
                  })
                }
                onDraftPassword={(v) =>
                  setCabinetGrantDraft((d) => {
                    const cur = d[cabinetAccessModalClientId];
                    if (!cur) return d;
                    return { ...d, [cabinetAccessModalClientId]: { ...cur, password: v } };
                  })
                }
                onDraftNewPw={() =>
                  setCabinetGrantDraft((d) => {
                    const cur = d[cabinetAccessModalClientId];
                    if (!cur) return d;
                    return { ...d, [cabinetAccessModalClientId]: { ...cur, password: generateCabinetPassword() } };
                  })
                }
                onConfirmGrant={() => {
                  confirmCabinetGrant(cabinetAccessModalClientId);
                }}
                onCancelDraft={() => {
                  cancelCabinetGrantForm(cabinetAccessModalClientId);
                  setCabinetAccessModalClientId(null);
                }}
                onUpdateLogin={(v) => updateCabinetLogin(cabinetAccessModalClientId, v)}
                onRegenPw={() => regenerateCabinetPassword(cabinetAccessModalClientId)}
                onCopyLogin={() =>
                  void navigator.clipboard.writeText(file.cabinetCredentials[cabinetAccessModalClientId]?.login ?? '')
                }
                onCopyPassword={() =>
                  void navigator.clipboard.writeText(file.cabinetCredentials[cabinetAccessModalClientId]?.password ?? '')
                }
                onRevoke={() => {
                  revokeCabinetAccess(cabinetAccessModalClientId);
                  setCabinetAccessModalClientId(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {schOpen && (
        <div
          className="cm-modal-overlay"
          role="presentation"
          onClick={() => {
            setSchOpen(false);
            setSchPreview(null);
          }}
          onKeyDown={(e) => e.key === 'Escape' && (setSchOpen(false), setSchPreview(null))}
        >
          <div className="cm-modal cm-modal-wide" role="dialog" aria-labelledby="sch-modal-title" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={submitScheduleForm}>
              <div className="cm-modal-head">
                <h2 id="sch-modal-title" className="cm-modal-title">
                  Создание графика платежей
                </h2>
                <button
                  type="button"
                  className="cm-modal-close"
                  aria-label="Закрыть"
                  onClick={() => {
                    setSchOpen(false);
                    setSchPreview(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="cm-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="cm-field">
                    <label>Клиент</label>
                    <select value={schClientId} onChange={(e) => setSchClientId(e.target.value)} required>
                      <option value="">Выберите клиента</option>
                      {allClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fio}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="cm-field">
                    <label>Квартира</label>
                    <select
                      value={schAptId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSchAptId(id);
                        const apt = apartments.find((a) => a.id === id);
                        if (apt) setSchTotal(String(Math.round(apt.price)));
                      }}
                      required
                      disabled={schAptsForModal.length === 0}
                    >
                      {schAptsForModal.length === 0 ? (
                        <option value="">Нет привязанных квартир</option>
                      ) : (
                        schAptsForModal.map((a) => (
                          <option key={a.id} value={a.id}>
                            {aptLine(a)} ({a.area} м²)
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="cm-field">
                  <label>Общая стоимость квартиры</label>
                  <input
                    value={schTotal}
                    onChange={(e) => setSchTotal(e.target.value)}
                    placeholder="5 000 000"
                    inputMode="decimal"
                    required
                  />
                  <div className="cm-note" style={{ marginTop: 6 }}>
                    Полная цена до применения условий; для демо можно отредактировать вручную.
                  </div>
                </div>

                <div className="cm-field">
                  <label>Тип расчёта</label>
                  <div className="cm-pay-type-grid">
                    {(
                      [
                        ['standard', 'Стандартный', 'Равные платежи по графику', '💳'],
                        ['discount', 'Со скидкой', 'Процентная скидка от цены', '🏷️'],
                        ['barter', 'Бартер', 'Зачёт имущества в счёт оплаты', '🔄'],
                        ['installment', 'Рассрочка 0%', 'Без процентов на длительный срок', '📅'],
                        ['custom', 'Индивидуальный', 'Гибкие условия оплаты', '⚙️'],
                      ] as const
                    ).map(([key, name, desc, icon]) => (
                      <button
                        key={key}
                        type="button"
                        className={`cm-pay-type-card ${schType === key ? 'cm-pay-type-active' : ''}`}
                        onClick={() => setSchType(key)}
                      >
                        <div style={{ fontSize: 22, marginBottom: 6 }} aria-hidden>
                          {icon}
                        </div>
                        <div className="cm-pay-type-name">{name}</div>
                        <div style={{ color: 'var(--cm-muted)', fontSize: 11 }}>{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {schType === 'standard' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="cm-field">
                      <label>Первоначальный взнос (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={schStdInit}
                        onChange={(e) => setSchStdInit(Number(e.target.value))}
                      />
                    </div>
                    <div className="cm-field">
                      <label>Количество платежей</label>
                      <input
                        type="number"
                        min={1}
                        value={schStdCount}
                        onChange={(e) => setSchStdCount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {schType === 'discount' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="cm-field">
                        <label>Размер скидки (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={schDiscPct}
                          onChange={(e) => setSchDiscPct(Number(e.target.value))}
                        />
                      </div>
                      <div className="cm-field">
                        <label>Первоначальный взнос (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={schDiscInit}
                          onChange={(e) => setSchDiscInit(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="cm-field">
                      <label>Количество платежей</label>
                      <input
                        type="number"
                        min={1}
                        value={schDiscCount}
                        onChange={(e) => setSchDiscCount(Number(e.target.value))}
                      />
                    </div>
                  </>
                )}

                {schType === 'barter' && (
                  <>
                    <div className="cm-field">
                      <label>Описание имущества</label>
                      <input value={schBarterProp} onChange={(e) => setSchBarterProp(e.target.value)} placeholder="Квартира на ул. Ленина, 45" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="cm-field">
                        <label>Оценочная стоимость имущества</label>
                        <input value={schBarterVal} onChange={(e) => setSchBarterVal(e.target.value)} placeholder="2 000 000" inputMode="decimal" />
                      </div>
                      <div className="cm-field">
                        <label>Количество платежей (остаток)</label>
                        <input
                          type="number"
                          min={1}
                          value={schBarterCount}
                          onChange={(e) => setSchBarterCount(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {schType === 'installment' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="cm-field">
                      <label>Первоначальный взнос (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={schInstInit}
                        onChange={(e) => setSchInstInit(Number(e.target.value))}
                      />
                    </div>
                    <div className="cm-field">
                      <label>Срок рассрочки (месяцев)</label>
                      <input
                        type="number"
                        min={1}
                        value={schInstMonths}
                        onChange={(e) => setSchInstMonths(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {schType === 'custom' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="cm-field">
                        <label>Первоначальный взнос</label>
                        <input value={schCustInit} onChange={(e) => setSchCustInit(e.target.value)} placeholder="1 500 000" inputMode="decimal" />
                      </div>
                      <div className="cm-field">
                        <label>Количество платежей</label>
                        <input
                          type="number"
                          min={1}
                          value={schCustCount}
                          onChange={(e) => setSchCustCount(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="cm-field">
                      <label>Примечание</label>
                      <input value={schCustNote} onChange={(e) => setSchCustNote(e.target.value)} placeholder="Условия для корпоративного клиента" />
                    </div>
                  </>
                )}

                <div className="cm-field">
                  <label>Дата первого платежа</label>
                  <input type="date" value={schStart} onChange={(e) => setSchStart(e.target.value)} required />
                </div>

                <button type="button" className="cm-btn" style={{ width: '100%', marginBottom: 8 }} onClick={runSchedulePreview}>
                  Предварительный просмотр
                </button>

                {schPreview && schPreview.length > 0 && (
                  <div className="cm-preview-box">
                    <div className="cm-preview-head">
                      <span>Предварительный просмотр</span>
                      <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                        {sumLines(schPreview).toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    {schPreview.map((p) => (
                      <div key={`pv-${p.number}-${p.date.getTime()}`} className="cm-sch-row">
                        <span style={{ fontWeight: 700, color: 'var(--cm-soft)' }}>#{p.number}</span>
                        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {p.date.toLocaleDateString('ru-RU')}
                        </span>
                        <span>{p.description}</span>
                        <span style={{ textAlign: 'right', fontWeight: 700 }}>{p.amount.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="cm-modal-foot">
                <button
                  type="button"
                  className="cm-btn"
                  onClick={() => {
                    setSchOpen(false);
                    setSchPreview(null);
                  }}
                >
                  Отмена
                </button>
                <button type="submit" className="cm-btn cm-btn-primary" disabled={schAptsForModal.length === 0 || !schAptId}>
                  Создать график
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addOpen && (
        <div
          className="cm-modal-overlay"
          role="presentation"
          onClick={() => setAddOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setAddOpen(false)}
        >
          <div className="cm-modal" role="dialog" aria-labelledby="cm-add-title" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-head">
              <h2 id="cm-add-title" className="cm-modal-title">
                Добавить клиента
              </h2>
              <button type="button" className="cm-modal-close" aria-label="Закрыть" onClick={() => setAddOpen(false)}>
                ×
              </button>
            </div>
            <div className="cm-modal-body">
              <div className="cm-field">
                <label>ФИО</label>
                <input value={addFio} onChange={(e) => setAddFio(e.target.value)} placeholder="Иванов Иван Иванович" />
              </div>
              <div className="cm-field">
                <label>Телефон</label>
                <input value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="+7 (999) 123-45-67" />
              </div>
              <div className="cm-field">
                <label>Email</label>
                <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="ivanov@example.com" />
              </div>
              <div className="cm-field">
                <label>Квартира (метка)</label>
                <input value={addApartment} onChange={(e) => setAddApartment(e.target.value)} placeholder="А-301 или Блок 1 · эт.3 · кв.4" />
              </div>
              <div className="cm-field">
                <label>Паспорт</label>
                <input value={addPassport} onChange={(e) => setAddPassport(e.target.value)} placeholder="Необязательно для демо" />
              </div>
              <div className="cm-field">
                <label>Доступ к личному кабинету</label>
                <select value={addAccess} onChange={(e) => setAddAccess(e.target.value as 'active' | 'inactive')}>
                  <option value="active">Включён</option>
                  <option value="inactive">Выключен</option>
                </select>
              </div>
            </div>
            <div className="cm-modal-foot">
              <button type="button" className="cm-btn" onClick={() => setAddOpen(false)}>
                Отмена
              </button>
              <button type="button" className="cm-btn cm-btn-primary" onClick={handleAddClient}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientsRegistry;
