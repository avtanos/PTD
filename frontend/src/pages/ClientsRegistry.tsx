import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ProjectBlocksTab } from '../components/ProjectBlocksTab';
import type { Apartment, ClientRecord } from '../components/ProjectBlocksTab';
import { CLIENTS, loadApartmentsFromStorage, PROJECT_BLOCKS_STORAGE_KEY } from '../components/ProjectBlocksTab';

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
  paymentSubmissions: PaymentSubmission[];
  companyNotifications: CompanyNotification[];
};

const defaultRegistryFile = (): RegistryFile => ({
  extraClients: [],
  cabinetAccess: {},
  paymentSubmissions: [],
  companyNotifications: [],
});

function loadRegistry(): RegistryFile {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) return defaultRegistryFile();
    const p = JSON.parse(raw);
    return {
      extraClients: Array.isArray(p?.extraClients) ? p.extraClients : [],
      cabinetAccess: p?.cabinetAccess && typeof p.cabinetAccess === 'object' ? p.cabinetAccess : {},
      paymentSubmissions: Array.isArray(p?.paymentSubmissions) ? p.paymentSubmissions : [],
      companyNotifications: Array.isArray(p?.companyNotifications) ? p.companyNotifications : [],
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

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '8px 14px',
  borderRadius: 8,
  border: `1px solid ${active ? 'var(--accent2)' : 'var(--line)'}`,
  background: active ? 'rgba(74,222,128,0.12)' : 'var(--card)',
  color: active ? 'var(--accent2)' : 'var(--muted)',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'var(--font)',
});

const ClientsRegistry: React.FC = () => {
  const [tab, setTab] = useState<'registry' | 'cabinet' | 'payments' | 'notify'>('registry');
  const [file, setFile] = useState<RegistryFile>(() => loadRegistry());
  const [apartments, setApartments] = useState<Apartment[]>(() => loadApartmentsFromStorage());

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

  const [addOpen, setAddOpen] = useState(false);
  const [addFio, setAddFio] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassport, setAddPassport] = useState('');

  const handleAddClient = () => {
    const fio = addFio.trim();
    if (!fio) return;
    const id = `MOCK-REG-${Date.now().toString(36)}`;
    const row: ClientRecord = {
      id,
      fio,
      phone: addPhone.trim() || '+7 (900) 000-00-00',
      email: addEmail.trim() || `mock.${id}@example.invalid`,
      passport: addPassport.trim() || 'MOCK-REG-PASS',
    };
    persist({ ...file, extraClients: [...file.extraClients, row] });
    setAddFio('');
    setAddPhone('');
    setAddEmail('');
    setAddPassport('');
    setAddOpen(false);
  };

  const toggleCabinet = (clientId: string, v: boolean) => {
    persist({ ...file, cabinetAccess: { ...file.cabinetAccess, [clientId]: v } });
  };

  const cabinetLink = (clientId: string) =>
    `${window.location.origin}${window.location.pathname}#clientcabinet?id=${encodeURIComponent(clientId)}`;

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

  return (
    <div className="page">
      <div className="crumbs">
        <a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Реестр клиентов</span>
      </div>
      <div className="h1">Реестр клиентов</div>
      <div className="muted mini" style={{ marginBottom: 16 }}>
        Единое место для учёта покупателей, выдачи доступа в личный кабинет, приёма платежей и рассылки уведомлений (демо без
        бэкенда). Данные по квартирам синхронизированы с разделом «Проекты → Блоки».
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <button type="button" style={tabBtn(tab === 'registry')} onClick={() => setTab('registry')}>
          Реестр и квартиры
        </button>
        <button type="button" style={tabBtn(tab === 'cabinet')} onClick={() => setTab('cabinet')}>
          Доступ в кабинет
        </button>
        <button type="button" style={tabBtn(tab === 'payments')} onClick={() => setTab('payments')}>
          Платежи от клиента
        </button>
        <button type="button" style={tabBtn(tab === 'notify')} onClick={() => setTab('notify')}>
          Уведомления
        </button>
        <button type="button" className="btn small" onClick={refreshApartments}>
          Обновить из «Блоки»
        </button>
      </div>

      {tab === 'registry' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div className="muted mini">Тот же список, что во вкладке проекта «Клиенты», плюс добавленные здесь записи.</div>
            <button type="button" className="btn primary small" onClick={() => setAddOpen(true)}>
              + Добавить клиента
            </button>
          </div>
          <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <ProjectBlocksTab variant="clients-only" projectName="Сводно по демо-блокам" />
          </div>
          {file.extraClients.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Дополнительно в реестре (не привязаны к квартирам в демо)</div>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>ФИО</th>
                    <th>Телефон</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {file.extraClients.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.fio}</td>
                      <td>{c.phone}</td>
                      <td>{c.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'cabinet' && (
        <div className="card" style={{ padding: 16 }}>
          <div className="muted mini" style={{ marginBottom: 12 }}>
            Включите доступ — клиент откроет кабинет по ссылке (в демо без авторизации, только по id). В кабинете: блок, этаж,
            квартира, график платежей.
          </div>
          <table>
            <thead>
              <tr>
                <th>Клиент</th>
                <th>ID</th>
                <th>Доступ</th>
                <th>Ссылка в кабинет</th>
              </tr>
            </thead>
            <tbody>
              {allClients.map((c) => {
                const on = Boolean(file.cabinetAccess[c.id]);
                return (
                  <tr key={c.id}>
                    <td>{c.fio}</td>
                    <td>
                      <code style={{ fontSize: 11 }}>{c.id}</code>
                    </td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="checkbox" checked={on} onChange={(e) => toggleCabinet(c.id, e.target.checked)} />
                        <span>Выдан</span>
                      </label>
                    </td>
                    <td>
                      {on ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 420 }}>
                          <input readOnly value={cabinetLink(c.id)} style={{ fontSize: 11, width: '100%' }} />
                          <a className="btn small" href={`#clientcabinet?id=${encodeURIComponent(c.id)}`} target="_blank" rel="noreferrer">
                            Открыть кабинет
                          </a>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payments' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Форма приёма платежа (от клиента)</div>
            <div className="muted mini" style={{ marginBottom: 12 }}>
              Выбор квартиры из привязанных к клиенту в демо-данных; квитанция — только имя файла (локально не загружается).
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              <label className="field">
                <span>Клиент</span>
                <select value={payClientId} onChange={(e) => { setPayClientId(e.target.value); setPayAptId(''); }}>
                  <option value="">— выберите —</option>
                  {allClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fio} ({c.id})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Квартира</span>
                <select value={payAptId} onChange={(e) => setPayAptId(e.target.value)} disabled={!payClientId}>
                  <option value="">— выберите —</option>
                  {clientApts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.block} • эт.{a.floor} • кв.{a.aptIdx + 1} ({a.area}м²)
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Сумма</span>
                <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="например 150000" />
              </label>
              <label className="field" style={{ gridColumn: '1 / -1' }}>
                <span>Комментарий</span>
                <input value={payComment} onChange={(e) => setPayComment(e.target.value)} placeholder="Необязательно" />
              </label>
              <label className="field" style={{ gridColumn: '1 / -1' }}>
                <span>Квитанция (файл)</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setPayReceiptName(f?.name ?? null);
                  }}
                />
                {payReceiptName && <span className="mini muted">{payReceiptName}</span>}
              </label>
            </div>
            <button type="button" className="btn primary small" style={{ marginTop: 12 }} onClick={submitPayment}>
              Зафиксировать платёж
            </button>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Заявки на платёж</div>
            {file.paymentSubmissions.length === 0 ? (
              <div className="muted mini">Пока нет записей</div>
            ) : (
              <table>
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
                        <td className="tRight">{p.amount.toLocaleString('ru-RU')}</td>
                        <td>{p.receiptFileName ?? '—'}</td>
                        <td>{p.comment || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'notify' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Новое уведомление от застройщика</div>
            <div className="muted mini" style={{ marginBottom: 12 }}>
              В демо уведомления сохраняются локально и отображаются в кабинете клиента. Тип «напоминание по графику» —
              подсвечивается отдельно.
            </div>
            <div style={{ display: 'grid', gap: 10, maxWidth: 560 }}>
              <label className="field">
                <span>Получатель</span>
                <select value={nClientId} onChange={(e) => setNClientId(e.target.value)}>
                  <option value="">Все с выданным доступом</option>
                  {allClients.filter((c) => file.cabinetAccess[c.id]).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fio}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Тип</span>
                <select value={nType} onChange={(e) => setNType(e.target.value as 'payment_reminder' | 'general')}>
                  <option value="payment_reminder">Напоминание по графику платежа</option>
                  <option value="general">Общее сообщение</option>
                </select>
              </label>
              <label className="field">
                <span>Заголовок</span>
                <input value={nTitle} onChange={(e) => setNTitle(e.target.value)} />
              </label>
              <label className="field">
                <span>Текст</span>
                <textarea value={nBody} onChange={(e) => setNBody(e.target.value)} rows={4} style={{ width: '100%' }} />
              </label>
              <button type="button" className="btn primary small" onClick={sendNotification} style={{ justifySelf: 'start' }}>
                Отправить в кабинет (демо)
              </button>
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>История</div>
            {file.companyNotifications.length === 0 ? (
              <div className="muted mini">Пусто</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Тип</th>
                    <th>Кому</th>
                    <th>Заголовок</th>
                  </tr>
                </thead>
                <tbody>
                  {file.companyNotifications.map((n) => (
                    <tr key={n.id}>
                      <td>{new Date(n.createdAt).toLocaleString('ru-RU')}</td>
                      <td>{n.type === 'payment_reminder' ? 'График платежа' : 'Общее'}</td>
                      <td>{n.clientId ? allClients.find((c) => c.id === n.clientId)?.fio ?? n.clientId : 'Все с доступом'}</td>
                      <td>{n.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {addOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          role="presentation"
          onClick={() => setAddOpen(false)}
        >
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: 20 }} role="presentation" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>Новый клиент (мокап)</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <label className="field">
                <span>ФИО *</span>
                <input value={addFio} onChange={(e) => setAddFio(e.target.value)} />
              </label>
              <label className="field">
                <span>Телефон</span>
                <input value={addPhone} onChange={(e) => setAddPhone(e.target.value)} />
              </label>
              <label className="field">
                <span>Email</span>
                <input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
              </label>
              <label className="field">
                <span>Паспорт</span>
                <input value={addPassport} onChange={(e) => setAddPassport(e.target.value)} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button type="button" className="btn small" onClick={() => setAddOpen(false)}>
                Отмена
              </button>
              <button type="button" className="btn small primary" onClick={handleAddClient}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsRegistry;
