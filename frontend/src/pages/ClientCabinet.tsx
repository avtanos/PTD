import React, { useMemo, useState, useEffect } from 'react';
import {
  CLIENTS,
  genPayments,
  loadApartmentsFromStorage,
  PROJECT_BLOCKS_STORAGE_KEY,
  type Apartment,
  type ClientRecord,
} from '../components/ProjectBlocksTab';
import { findClientIdByCabinetLogin, type CabinetCredentialsMap } from '../lib/cabinetCredentials';
import {
  allocatePaidFifo,
  type PaymentScheduleRecord,
} from '../lib/paymentScheduleEngine';

const REGISTRY_STORAGE_KEY = 'ptd.clientsRegistry.v1';
const CABINET_SESSION_KEY = 'ptd.clientCabinet.sessionClientId';

function getSessionClientId(): string | null {
  try {
    return sessionStorage.getItem(CABINET_SESSION_KEY);
  } catch {
    return null;
  }
}

function setSessionClientId(id: string) {
  try {
    sessionStorage.setItem(CABINET_SESSION_KEY, id);
  } catch {
    // ignore
  }
}

function clearSessionClientId() {
  try {
    sessionStorage.removeItem(CABINET_SESSION_KEY);
  } catch {
    // ignore
  }
}

/** Демо-название ЖК для шапки кабинета (как в макете). */
const DEMO_PROJECT_NAME = 'ЖК «Северная звезда»';

type CompanyNotification = {
  id: string;
  clientId: string | null;
  type: 'payment_reminder' | 'general';
  title: string;
  body: string;
  createdAt: string;
};

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

type RegistrySlice = {
  cabinetAccess: CabinetAccessMap;
  cabinetCredentials: CabinetCredentialsMap;
  extraClients: ClientRecord[];
  notes: CompanyNotification[];
  payments: PaymentSubmission[];
  paymentSchedules: PaymentScheduleRecord[];
};

function readRegistrySlice(): RegistrySlice {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw)
      return {
        cabinetAccess: {},
        cabinetCredentials: {},
        extraClients: [],
        notes: [],
        payments: [],
        paymentSchedules: [],
      };
    const p = JSON.parse(raw);
    return {
      cabinetAccess: p?.cabinetAccess && typeof p.cabinetAccess === 'object' ? p.cabinetAccess : {},
      cabinetCredentials:
        p?.cabinetCredentials && typeof p.cabinetCredentials === 'object' ? p.cabinetCredentials : {},
      extraClients: Array.isArray(p?.extraClients) ? p.extraClients : [],
      notes: Array.isArray(p?.companyNotifications) ? p.companyNotifications : [],
      payments: Array.isArray(p?.paymentSubmissions) ? p.paymentSubmissions : [],
      paymentSchedules: Array.isArray(p?.paymentSchedules) ? p.paymentSchedules : [],
    };
  } catch {
    return {
      cabinetAccess: {},
      cabinetCredentials: {},
      extraClients: [],
      notes: [],
      payments: [],
      paymentSchedules: [],
    };
  }
}

function resolveClientRecord(cid: string, r: RegistrySlice): ClientRecord | null {
  const fromDemo = CLIENTS.find((c) => c.id === cid);
  const fromExtra = r.extraClients.find((c) => c.id === cid);
  return fromDemo ?? fromExtra ?? null;
}

function appendClientPayment(row: PaymentSubmission) {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    const base = raw ? JSON.parse(raw) : {};
    base.extraClients = Array.isArray(base.extraClients) ? base.extraClients : [];
    base.cabinetAccess = base.cabinetAccess && typeof base.cabinetAccess === 'object' ? base.cabinetAccess : {};
    base.companyNotifications = Array.isArray(base.companyNotifications) ? base.companyNotifications : [];
    base.paymentSubmissions = Array.isArray(base.paymentSubmissions) ? base.paymentSubmissions : [];
    base.paymentSchedules = Array.isArray(base.paymentSchedules) ? base.paymentSchedules : [];
    base.paymentSubmissions.unshift(row);
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(base));
  } catch {
    // ignore
  }
}

function aptTitleLine(a: Apartment): string {
  return `${a.floor} эт. · ${a.block} · кв.${a.aptIdx + 1} · ${a.type} · ${a.area} м²`;
}

function aptBadgeShort(a: Apartment): string {
  const blockLetter = a.block.replace(/^Блок\s*/i, '').trim().slice(0, 1).toUpperCase() || 'Б';
  return `${blockLetter}-${a.floor}-${a.aptIdx + 1}`;
}

const APT_STATUS_LABEL: Record<Apartment['status'], string> = {
  sold: 'Продана',
  free: 'Свободна',
  reserved: 'Бронь',
};

type CabinetMainTab = 'apartments' | 'schedule' | 'payment' | 'notify';

const ClientCabinet: React.FC = () => {
  const [cid, setCid] = useState<string | null>(() => getSessionClientId());
  const [apartments, setApartments] = useState<Apartment[]>(() => loadApartmentsFromStorage());
  const [reg, setReg] = useState(() => readRegistrySlice());
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginErr, setLoginErr] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const nextReg = readRegistrySlice();
      setReg(nextReg);
      setApartments(loadApartmentsFromStorage());
      let sid = getSessionClientId();
      if (sid) {
        if (!nextReg.cabinetAccess[sid] || !resolveClientRecord(sid, nextReg)) {
          clearSessionClientId();
          sid = null;
        }
      }
      setCid(sid);
    };
    tick();
    window.addEventListener('hashchange', tick);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && tick());
    const onStorage = (e: StorageEvent) => {
      if (e.key === REGISTRY_STORAGE_KEY || e.key === PROJECT_BLOCKS_STORAGE_KEY) tick();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('hashchange', tick);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const tryLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr(null);
    const r = readRegistrySlice();
    const creds = r.cabinetCredentials ?? {};
    const found = findClientIdByCabinetLogin(loginId, loginPw, creds);
    if (!found) {
      setLoginErr('Неверный логин или пароль.');
      return;
    }
    if (!r.cabinetAccess[found]) {
      setLoginErr('Доступ в личный кабинет для этой учётной записи отключён.');
      return;
    }
    if (!resolveClientRecord(found, r)) {
      setLoginErr('Учётная запись не найдена.');
      return;
    }
    setSessionClientId(found);
    setCid(found);
    setLoginPw('');
    setReg(readRegistrySlice());
  };

  const client = useMemo(() => {
    if (!cid) return null;
    return resolveClientRecord(cid, reg);
  }, [cid, reg]);

  const allowed = Boolean(cid && reg.cabinetAccess[cid!]);

  const myApts = useMemo(() => {
    if (!cid) return [];
    return apartments.filter((a) => a.clientId === cid);
  }, [apartments, cid]);

  const [mainTab, setMainTab] = useState<CabinetMainTab>('apartments');
  const [scheduleAptId, setScheduleAptId] = useState('');
  const [payAptId, setPayAptId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payComment, setPayComment] = useState('');
  const [payReceiptName, setPayReceiptName] = useState<string | null>(null);

  useEffect(() => {
    if (myApts.length === 0) {
      setScheduleAptId('');
      setPayAptId('');
      return;
    }
    const first = myApts[0].id;
    setScheduleAptId((prev) => (prev && myApts.some((a) => a.id === prev) ? prev : first));
    setPayAptId((prev) => (prev && myApts.some((a) => a.id === prev) ? prev : first));
  }, [myApts]);

  const scheduleApt = useMemo(() => myApts.find((a) => a.id === scheduleAptId) ?? null, [myApts, scheduleAptId]);

  const selectApartment = (aptId: string) => {
    setScheduleAptId(aptId);
    setPayAptId(aptId);
  };

  const myNotifications = useMemo(() => {
    if (!cid) return [];
    return reg.notes.filter((n) => n.clientId === null || n.clientId === cid);
  }, [cid, reg.notes]);

  const myPayments = useMemo(() => {
    if (!cid) return [];
    return reg.payments.filter((p) => p.clientId === cid);
  }, [cid, reg.payments]);

  const scheduleRows = useMemo(() => {
    if (!scheduleApt || !cid) return [];
    const saved = reg.paymentSchedules.find((s) => s.clientId === cid && s.aptId === scheduleApt.id);
    if (saved?.lines?.length) {
      const aptPay = reg.payments.filter((p) => p.clientId === cid && p.aptId === scheduleApt.id);
      const paidFlags = allocatePaidFifo(
        saved.lines.map((l) => l.amount),
        aptPay.map((p) => ({ amount: p.amount, submittedAt: p.submittedAt })),
      );
      return saved.lines.map((l, i) => ({
        n: l.n,
        date: new Date(l.dateIso).toLocaleDateString('ru-RU'),
        amount: l.amount,
        type: l.description,
        paid: paidFlags[i] ?? false,
      }));
    }
    return genPayments(scheduleApt).map((r) => ({
      n: r.n,
      date:
        /^\d{4}-\d{2}-\d{2}$/.test(String(r.date))
          ? new Date(`${r.date}T12:00:00`).toLocaleDateString('ru-RU')
          : String(r.date),
      amount: r.amount,
      type: r.type,
      paid: r.paid,
    }));
  }, [scheduleApt, cid, reg.paymentSchedules, reg.payments]);

  const submitClientPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cid) return;
    const apt = myApts.find((a) => a.id === payAptId);
    if (!apt || !payAmount.trim()) return;
    const amount = Number(payAmount.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return;
    appendClientPayment({
      id: `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      clientId: cid,
      aptId: apt.id,
      block: apt.block,
      floor: String(apt.floor),
      aptIdx: apt.aptIdx,
      amount,
      comment: payComment.trim(),
      receiptFileName: payReceiptName,
      submittedAt: new Date().toISOString(),
    });
    setPayAmount('');
    setPayComment('');
    setPayReceiptName(null);
    setReg(readRegistrySlice());
  };

  if (!cid) {
    return (
      <div className="page" style={{ maxWidth: 440 }}>
        <div className="h1" style={{ marginBottom: 8 }}>
          Вход в личный кабинет
        </div>
        <p className="muted mini" style={{ marginBottom: 20, lineHeight: 1.5 }}>
          Введите логин и пароль, полученные от менеджера в разделе «Реестр клиентов». Проверка выполняется локально в браузере (демо).
        </p>
        <form className="card" style={{ padding: 20 }} onSubmit={tryLogin}>
          <label className="field">
            <span>Логин</span>
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoComplete="username"
              placeholder="Например, asanov"
            />
          </label>
          <label className="field">
            <span>Пароль</span>
            <input
              type="password"
              value={loginPw}
              onChange={(e) => setLoginPw(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>
          {loginErr && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }} role="alert">
              {loginErr}
            </div>
          )}
          <button type="submit" className="btn primary small" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>
            Войти
          </button>
        </form>
        <a className="btn small" href="#clientsregistry" style={{ marginTop: 16, display: 'inline-flex' }}>
          К реестру (для менеджеров)
        </a>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="page">
        <div className="h1">Доступ закрыт</div>
        <div className="muted mini" style={{ marginBottom: 16 }}>
          Для учётной записи <code>{cid}</code> вход в кабинет отключён. Обратитесь к менеджеру или войдите под другим логином.
        </div>
        <button
          type="button"
          className="btn small"
          style={{ marginRight: 10 }}
          onClick={() => {
            clearSessionClientId();
            setCid(null);
          }}
        >
          На страницу входа
        </button>
        <a className="btn small" href="#clientsregistry">
          К реестру
        </a>
      </div>
    );
  }

  const recipientLabel = (n: CompanyNotification): string => {
    if (n.clientId == null) return 'Все клиенты';
    const cl = CLIENTS.find((c) => c.id === n.clientId) ?? reg.extraClients.find((c) => c.id === n.clientId);
    return cl?.fio ?? n.clientId;
  };

  return (
    <div className="page" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Шапка кабинета — структура как в макете, цвета из темы */}
      <div
        style={{
          margin: '0 -8px 24px',
          padding: '28px 24px 32px',
          borderRadius: 'var(--r16)',
          background: 'linear-gradient(135deg, var(--panel) 0%, var(--card2) 100%)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Личный кабинет покупателя</div>
        <div className="h1" style={{ marginBottom: 20 }}>
          {client?.fio ?? 'Клиент'}
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>{DEMO_PROJECT_NAME}</div>
        {client && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ marginRight: 16 }}>{client.phone}</span>
            <span>{client.email}</span>
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            className="btn small"
            onClick={() => {
              clearSessionClientId();
              setCid(null);
            }}
          >
            Выйти из кабинета
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="cardBody" style={{ paddingTop: 12 }}>
          <div className="tabs" role="tablist" aria-label="Разделы личного кабинета">
            <div
              role="tab"
              tabIndex={0}
              className={`tab ${mainTab === 'apartments' ? 'active' : ''}`}
              onClick={() => setMainTab('apartments')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setMainTab('apartments'))}
            >
              Мои квартиры
            </div>
            <div
              role="tab"
              tabIndex={0}
              className={`tab ${mainTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setMainTab('schedule')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setMainTab('schedule'))}
            >
              График платежей
            </div>
            <div
              role="tab"
              tabIndex={0}
              className={`tab ${mainTab === 'payment' ? 'active' : ''}`}
              onClick={() => setMainTab('payment')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setMainTab('payment'))}
            >
              Оплата
            </div>
            <div
              role="tab"
              tabIndex={0}
              className={`tab ${mainTab === 'notify' ? 'active' : ''}`}
              onClick={() => setMainTab('notify')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setMainTab('notify'))}
            >
              Уведомления
            </div>
          </div>

          {mainTab === 'apartments' && (
            <div style={{ marginTop: 20 }}>
              {myApts.length === 0 ? (
                <div className="muted mini" style={{ padding: '8px 0 12px' }}>
                  Нет привязанных квартир. Менеджер может привязать объект в «Проекты → Блоки».
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 20,
                    alignItems: 'start',
                  }}
                >
                  <div className="card" style={{ padding: 0, overflow: 'hidden', margin: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--line)',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Список</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: 'var(--card2)',
                          border: '1px solid var(--line)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {myApts.length}
                      </span>
                    </div>
                    {myApts.map((a, i) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => selectApartment(a.id)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '14px 16px',
                          border: 'none',
                          borderBottom: i < myApts.length - 1 ? '1px solid var(--line)' : 'none',
                          background: scheduleAptId === a.id ? 'rgba(100, 240, 200, 0.08)' : 'transparent',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 14,
                        }}
                      >
                        <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 4 }}>
                          {DEMO_PROJECT_NAME} — {a.block} — эт.{a.floor}
                        </div>
                        <strong>{aptBadgeShort(a)}</strong>
                        <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {a.type} · {a.area} м²</span>
                      </button>
                    ))}
                  </div>
                  <div className="card" style={{ padding: 20, margin: 0 }}>
                    {scheduleApt ? (
                      <>
                        <div className="title" style={{ marginBottom: 6 }}>
                          Данные о квартире
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--accent)',
                            marginBottom: 16,
                            paddingBottom: 12,
                            borderBottom: '1px solid var(--line)',
                          }}
                        >
                          {DEMO_PROJECT_NAME} — {scheduleApt.block} — эт.{scheduleApt.floor}
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(120px, 160px) 1fr',
                            gap: '12px 16px',
                            fontSize: 14,
                            alignItems: 'baseline',
                          }}
                        >
                          <div style={{ color: 'var(--muted2)' }}>Жилой комплекс</div>
                          <div style={{ fontWeight: 600 }}>{DEMO_PROJECT_NAME}</div>
                          <div style={{ color: 'var(--muted2)' }}>Блок</div>
                          <div style={{ fontWeight: 600 }}>{scheduleApt.block}</div>
                          <div style={{ color: 'var(--muted2)' }}>Этаж</div>
                          <div style={{ fontWeight: 600 }}>{scheduleApt.floor}</div>
                          <div style={{ color: 'var(--muted2)' }}>Квартира (№ на этаже)</div>
                          <div style={{ fontWeight: 600 }}>кв.{scheduleApt.aptIdx + 1}</div>
                          <div style={{ color: 'var(--muted2)' }}>Обозначение</div>
                          <div style={{ fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>{aptBadgeShort(scheduleApt)}</div>
                          <div style={{ color: 'var(--muted2)' }}>Тип</div>
                          <div style={{ fontWeight: 600 }}>{scheduleApt.type}</div>
                          <div style={{ color: 'var(--muted2)' }}>Площадь</div>
                          <div style={{ fontWeight: 600 }}>{scheduleApt.area} м²</div>
                          <div style={{ color: 'var(--muted2)' }}>Цена (ориентир)</div>
                          <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                            {Math.round(scheduleApt.price).toLocaleString('ru-RU')} ₽
                          </div>
                          <div style={{ color: 'var(--muted2)' }}>Статус в проекте</div>
                          <div style={{ fontWeight: 600 }}>{APT_STATUS_LABEL[scheduleApt.status]}</div>
                          {scheduleApt.orphaned ? (
                            <>
                              <div style={{ color: 'var(--muted2)' }}>Примечание</div>
                              <div style={{ fontSize: 13, color: 'var(--warn)' }}>
                                Квартира вне текущей сетки блока (сохранённые данные продажи).
                              </div>
                            </>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <div className="muted mini">Выберите квартиру в списке слева.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {mainTab === 'schedule' && (
            <div style={{ marginTop: 20 }}>
              {myApts.length > 1 && (
                <label className="field" style={{ marginBottom: 16 }}>
                  <span>Квартира для графика</span>
                  <select
                    value={scheduleAptId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setScheduleAptId(id);
                      setPayAptId(id);
                    }}
                  >
                    {myApts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {aptTitleLine(a)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!scheduleApt ? (
                <div className="muted mini">Нет объекта для отображения графика.</div>
              ) : scheduleRows.length === 0 ? (
                <div className="muted mini">График будет доступен после настройки графика платежей в реестре клиентов.</div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 'var(--r12)' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Дата
                        </th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Описание
                        </th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Сумма
                        </th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Статус
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleRows.map((row) => (
                        <tr key={`${row.n}-${row.date}-${row.amount}`} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '12px 16px', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{row.date}</td>
                          <td style={{ padding: '12px 16px' }}>{row.type}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                            {row.amount.toLocaleString('ru-RU')} ₽
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {row.paid ? (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  background: 'rgba(74, 222, 128, 0.15)',
                                  color: 'var(--ok)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.03em',
                                }}
                              >
                                Оплачено
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  background: 'rgba(234, 179, 8, 0.15)',
                                  color: 'var(--warn)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.03em',
                                }}
                              >
                                Ожидание
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {mainTab === 'payment' && (
            <div style={{ marginTop: 20 }}>
              <form onSubmit={submitClientPayment}>
                {myApts.length === 0 ? (
                  <div className="muted mini">Сначала привяжите квартиру к профилю в ПТО.</div>
                ) : (
                  <>
                    <label className="field" style={{ marginBottom: 14 }}>
                      <span>Квартира</span>
                      <select
                        value={payAptId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setPayAptId(id);
                          setScheduleAptId(id);
                        }}
                        required
                      >
                        {myApts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {aptBadgeShort(a)} ({a.floor} этаж)
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field" style={{ marginBottom: 14 }}>
                      <span>Сумма платежа</span>
                      <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="500 000" inputMode="decimal" />
                    </label>
                    <label className="field" style={{ marginBottom: 14 }}>
                      <span>Комментарий</span>
                      <input value={payComment} onChange={(e) => setPayComment(e.target.value)} placeholder="Необязательно" />
                    </label>
                    <div className="field" style={{ marginBottom: 16 }}>
                      <span>Квитанция</span>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '14px 16px',
                          border: '2px dashed var(--line)',
                          borderRadius: 'var(--r12)',
                          background: 'var(--card2)',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--muted)',
                        }}
                      >
                        <span aria-hidden>📎</span>
                        Прикрепить файл
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => setPayReceiptName(e.target.files?.[0]?.name ?? null)}
                        />
                      </label>
                      {payReceiptName && (
                        <div className="mini muted" style={{ marginTop: 8 }}>
                          {payReceiptName}
                        </div>
                      )}
                      <div className="muted mini" style={{ marginTop: 8 }}>
                        Файл не отправляется на сервер — сохраняется только имя (демо).
                      </div>
                    </div>
                    <button type="submit" className="btn primary small" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px' }}>
                      Отправить платёж
                    </button>
                  </>
                )}
              </form>
              {myPayments.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Ранее отправлено</div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 8 }}>
                    <table style={{ width: '100%', fontSize: 12 }}>
                      <tbody>
                        {myPayments.map((p) => (
                          <tr key={p.id} style={{ borderTop: '1px solid var(--line)' }}>
                            <td style={{ padding: 8 }}>{new Date(p.submittedAt).toLocaleDateString('ru-RU')}</td>
                            <td style={{ padding: 8 }}>
                              {p.block} · эт.{p.floor} · кв.{p.aptIdx + 1}
                            </td>
                            <td style={{ padding: 8, textAlign: 'right' }}>{p.amount.toLocaleString('ru-RU')} ₽</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {mainTab === 'notify' && (
            <div style={{ marginTop: 20 }}>
              {myNotifications.length === 0 ? (
                <div className="muted mini">Нет сообщений.</div>
              ) : (
                myNotifications.map((n) => {
                  const remind = n.type === 'payment_reminder';
                  return (
                    <div
                      key={n.id}
                      style={{
                        padding: '16px 18px',
                        borderBottom: '1px solid var(--line)',
                        borderLeft: remind ? '4px solid var(--warn)' : '4px solid var(--accent)',
                        marginBottom: 12,
                        borderRadius: '0 var(--r12) var(--r12) 0',
                        background: remind ? 'rgba(234, 179, 8, 0.06)' : 'rgba(37, 99, 235, 0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span aria-hidden>{remind ? '🔔' : 'ℹ️'}</span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              color: remind ? 'var(--danger)' : 'var(--accent)',
                            }}
                          >
                            {remind ? 'Напоминание' : 'Информация'}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--muted2)', whiteSpace: 'nowrap' }}>
                          {new Date(n.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>{n.title}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.body}</div>
                      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted2)' }}>Получатель: {recipientLabel(n)}</div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <a className="btn small" href="#clientsregistry">
          Раздел для менеджеров (реестр)
        </a>
      </div>
    </div>
  );
};

export default ClientCabinet;
