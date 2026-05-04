import React, { useMemo, useState, useEffect } from 'react';
import {
  CLIENTS,
  genPayments,
  loadApartmentsFromStorage,
  type Apartment,
  type ClientRecord,
} from '../components/ProjectBlocksTab';

const REGISTRY_STORAGE_KEY = 'ptd.clientsRegistry.v1';

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
  extraClients: ClientRecord[];
  notes: CompanyNotification[];
  payments: PaymentSubmission[];
};

function readRegistrySlice(): RegistrySlice {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw)
      return {
        cabinetAccess: {},
        extraClients: [],
        notes: [],
        payments: [],
      };
    const p = JSON.parse(raw);
    return {
      cabinetAccess: p?.cabinetAccess && typeof p.cabinetAccess === 'object' ? p.cabinetAccess : {},
      extraClients: Array.isArray(p?.extraClients) ? p.extraClients : [],
      notes: Array.isArray(p?.companyNotifications) ? p.companyNotifications : [],
      payments: Array.isArray(p?.paymentSubmissions) ? p.paymentSubmissions : [],
    };
  } catch {
    return { cabinetAccess: {}, extraClients: [], notes: [], payments: [] };
  }
}

function appendClientPayment(row: PaymentSubmission) {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    const base = raw ? JSON.parse(raw) : {};
    base.extraClients = Array.isArray(base.extraClients) ? base.extraClients : [];
    base.cabinetAccess = base.cabinetAccess && typeof base.cabinetAccess === 'object' ? base.cabinetAccess : {};
    base.companyNotifications = Array.isArray(base.companyNotifications) ? base.companyNotifications : [];
    base.paymentSubmissions = Array.isArray(base.paymentSubmissions) ? base.paymentSubmissions : [];
    base.paymentSubmissions.unshift(row);
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(base));
  } catch {
    // ignore
  }
}

function getClientIdFromHash(): string | null {
  const h = window.location.hash.slice(1);
  const qs = h.includes('?') ? h.split('?')[1] : '';
  const params = new URLSearchParams(qs);
  return params.get('id');
}

const ClientCabinet: React.FC = () => {
  const [cid, setCid] = useState<string | null>(() => getClientIdFromHash());
  const [apartments, setApartments] = useState<Apartment[]>(() => loadApartmentsFromStorage());
  const [reg, setReg] = useState(() => readRegistrySlice());

  useEffect(() => {
    const tick = () => {
      setCid(getClientIdFromHash());
      setApartments(loadApartmentsFromStorage());
      setReg(readRegistrySlice());
    };
    tick();
    window.addEventListener('hashchange', tick);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && tick());
    return () => window.removeEventListener('hashchange', tick);
  }, []);

  const client = useMemo(() => {
    if (!cid) return null;
    const fromDemo = CLIENTS.find((c) => c.id === cid);
    const fromExtra = reg.extraClients.find((c) => c.id === cid);
    return fromDemo ?? fromExtra ?? null;
  }, [cid, reg.extraClients]);

  const allowed = Boolean(cid && reg.cabinetAccess[cid!]);

  const myApts = useMemo(() => {
    if (!cid) return [];
    return apartments.filter((a) => a.clientId === cid);
  }, [apartments, cid]);

  const myNotifications = useMemo(() => {
    if (!cid) return [];
    return reg.notes.filter((n) => n.clientId === null || n.clientId === cid);
  }, [cid, reg.notes]);

  const myPayments = useMemo(() => {
    if (!cid) return [];
    return reg.payments.filter((p) => p.clientId === cid);
  }, [cid, reg.payments]);

  const [payAptId, setPayAptId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payComment, setPayComment] = useState('');
  const [payReceiptName, setPayReceiptName] = useState<string | null>(null);

  const submitClientPayment = () => {
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
    setPayAptId('');
    setReg(readRegistrySlice());
  };

  if (!cid) {
    return (
      <div className="page">
        <div className="muted mini">Откройте кабинет по ссылке из реестра клиентов (параметр id в адресе).</div>
        <a className="btn small" href="#clientsregistry">
          К реестру клиентов
        </a>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="page">
        <div className="h1">Личный кабинет</div>
        <div className="muted mini" style={{ marginBottom: 12 }}>
          Доступ для клиента <code>{cid}</code> не включён. Обратитесь в офис застройщика или попросите менеджера выдать доступ в
          разделе «Реестр клиентов → Доступ в кабинет».
        </div>
        <a className="btn small" href="#clientsregistry">
          К реестру
        </a>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="crumbs">
        <span>Личный кабинет клиента</span> <span className="sep">/</span> <span>{client?.fio ?? cid}</span>
      </div>
      <div className="h1">Здравствуйте, {client?.fio ?? 'клиент'} </div>
      <div className="muted mini" style={{ marginBottom: 20 }}>
        Демонстрационный кабинет: ваши квартиры и график платежей подтягиваются из тех же демо-данных, что и в ПТО (вкладка
        «Блоки»).
      </div>

      {client && (
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Контакты в карточке (мокап)</div>
          <div style={{ fontSize: 14 }}>{client.phone}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{client.email}</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 4 }}>Паспорт: {client.passport}</div>
        </div>
      )}

      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>Мои объекты</div>
      {myApts.length === 0 ? (
        <div className="muted mini" style={{ marginBottom: 24 }}>
          Нет привязанных квартир в демо-базе. Менеджер может привязать квартиру через «Проекты → Блоки → 2D» в режиме
          редактирования.
        </div>
      ) : (
        myApts.map((a) => {
          const pays = genPayments(a);
          const total = pays.reduce((s, p) => s + p.amount, 0);
          const paid = pays.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0);
          return (
            <div key={a.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>
                    {a.block} • этаж {a.floor} • кв.{a.aptIdx + 1} ({a.type})
                  </div>
                  <div className="muted mini">{a.area} м² • {a.price.toLocaleString('ru-RU')} $</div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'var(--card2)',
                    border: '1px solid var(--line)',
                  }}
                >
                  {a.status === 'sold' ? 'Продано' : a.status === 'reserved' ? 'Бронь' : 'Статус'}
                </span>
              </div>
              {pays.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>График платежей (мок)</div>
                  <div className="muted mini" style={{ marginBottom: 6 }}>
                    Оплачено {paid.toLocaleString('ru-RU')} $ из {total.toLocaleString('ru-RU')} $
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 8 }}>
                    <table style={{ width: '100%', fontSize: 12 }}>
                      <thead style={{ background: 'var(--panel)', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ textAlign: 'left', padding: 6 }}>№</th>
                          <th style={{ textAlign: 'left', padding: 6 }}>Дата</th>
                          <th style={{ textAlign: 'right', padding: 6 }}>Сумма</th>
                          <th style={{ padding: 6 }}> </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pays.map((p) => (
                          <tr key={p.n} style={{ borderTop: '1px solid var(--line)' }}>
                            <td style={{ padding: 6 }}>{p.n}</td>
                            <td style={{ padding: 6, color: 'var(--muted)' }}>{p.date}</td>
                            <td style={{ padding: 6, textAlign: 'right' }}>{p.amount.toLocaleString('ru-RU')} $</td>
                            <td style={{ padding: 6 }}>
                              {p.paid ? <span style={{ color: 'var(--ok)', fontWeight: 700 }}>✓</span> : <span className="muted">○</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      <div style={{ fontWeight: 800, fontSize: 16, margin: '24px 0 10px' }}>Сообщить об оплате</div>
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div className="muted mini" style={{ marginBottom: 12 }}>
          Прикрепите данные платежа — заявка попадёт в тот же реестр, что и при вводе менеджером (демо, без отправки на сервер).
        </div>
        {myApts.length === 0 ? (
          <div className="muted mini">Сначала привяжите квартиру к вашему профилю в ПТО.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 10, maxWidth: 480 }}>
              <label className="field">
                <span>Квартира</span>
                <select value={payAptId} onChange={(e) => setPayAptId(e.target.value)}>
                  <option value="">— выберите —</option>
                  {myApts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.block} • эт.{a.floor} • кв.{a.aptIdx + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Сумма</span>
                <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Сумма платежа" />
              </label>
              <label className="field">
                <span>Комментарий</span>
                <input value={payComment} onChange={(e) => setPayComment(e.target.value)} />
              </label>
              <label className="field">
                <span>Квитанция</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPayReceiptName(e.target.files?.[0]?.name ?? null)}
                />
                {payReceiptName && <span className="mini muted">{payReceiptName}</span>}
              </label>
              <button type="button" className="btn primary small" style={{ justifySelf: 'start' }} onClick={submitClientPayment}>
                Отправить
              </button>
            </div>
            {myPayments.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Ранее отправлено</div>
                <table style={{ width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--panel)' }}>
                      <th style={{ textAlign: 'left', padding: 6 }}>Дата</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Объект</th>
                      <th style={{ textAlign: 'right', padding: 6 }}>Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPayments.map((p) => (
                      <tr key={p.id} style={{ borderTop: '1px solid var(--line)' }}>
                        <td style={{ padding: 6 }}>{new Date(p.submittedAt).toLocaleString('ru-RU')}</td>
                        <td style={{ padding: 6 }}>
                          {p.block} • эт.{p.floor} • кв.{p.aptIdx + 1}
                        </td>
                        <td style={{ padding: 6, textAlign: 'right' }}>{p.amount.toLocaleString('ru-RU')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ fontWeight: 800, fontSize: 16, margin: '20px 0 10px' }}>Уведомления застройщика</div>
      {myNotifications.length === 0 ? (
        <div className="muted mini">Нет сообщений.</div>
      ) : (
        myNotifications.map((n) => (
          <div
            key={n.id}
            style={{
              borderRadius: 10,
              border: `1px solid ${n.type === 'payment_reminder' ? 'var(--warn)' : 'var(--line)'}`,
              padding: 12,
              marginBottom: 8,
              background: n.type === 'payment_reminder' ? 'rgba(245,158,11,0.08)' : 'var(--card)',
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
              {new Date(n.createdAt).toLocaleString('ru-RU')}
              {n.type === 'payment_reminder' ? ' • Напоминание по платежу' : ' • Информация'}
            </div>
            <div style={{ fontWeight: 700 }}>{n.title}</div>
            <div style={{ marginTop: 6, fontSize: 14, whiteSpace: 'pre-wrap' }}>{n.body}</div>
          </div>
        ))
      )}

      <div style={{ marginTop: 28 }}>
        <a className="btn small" href="#clientsregistry">
          Раздел для менеджеров (реестр)
        </a>
      </div>
    </div>
  );
};

export default ClientCabinet;
