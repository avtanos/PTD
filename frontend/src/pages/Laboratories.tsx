import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import './Pages.css';

type RefItem = {
  id: number;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  contact_person?: string | null;
  contacts?: string | null;
  notes?: string | null;
};

const Laboratories: React.FC = () => {
  const [items, setItems] = useState<RefItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RefItem | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contacts, setContacts] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<RefItem[]>(`${API_URL}/lab-tests/refs/laboratories`).catch(() => ({ data: [] as RefItem[] }));
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setError('Не удалось загрузить справочник.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCode('');
    setAddress('');
    setContactPerson('');
    setContacts('');
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (it: RefItem) => {
    setEditing(it);
    setName(it.name);
    setCode(it.code || '');
    setAddress(it.address || '');
    setContactPerson(it.contact_person || '');
    setContacts(it.contacts || '');
    setNotes(it.notes || '');
    setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    try {
      if (editing) {
        await axios.put(`${API_URL}/lab-tests/refs/laboratories/${editing.id}`, {
          name: n,
          code: code.trim() || null,
          address: address.trim() || null,
          contact_person: contactPerson.trim() || null,
          contacts: contacts.trim() || null,
          notes: notes.trim() || null,
        });
      } else {
        await axios.post(`${API_URL}/lab-tests/refs/laboratories`, {
          name: n,
          code: code.trim() || null,
          address: address.trim() || null,
          contact_person: contactPerson.trim() || null,
          contacts: contacts.trim() || null,
          notes: notes.trim() || null,
        });
      }
      setShowModal(false);
      await load();
    } catch (err) {
      console.error(err);
      setError('Не удалось сохранить.');
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Удалить запись?')) return;
    try {
      await axios.delete(`${API_URL}/lab-tests/refs/laboratories/${id}`);
      await load();
    } catch (err) {
      console.error(err);
      setError('Не удалось удалить.');
    }
  };

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Справочники</span></div>
          <div className="h1">Лаборатория</div>
          <div className="muted mini">Справочник лабораторий / исполнителей.</div>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={openCreate}>+ Добавить</button>
        </div>
      </div>

      {error && <div className="card" style={{ marginBottom: 12 }}><div className="cardBody">{error}</div></div>}

      <div className="card">
        <div className="cardBody">
          {loading ? (
            <div className="muted mini">Загрузка…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 90 }}>ID</th>
                  <th style={{ width: 140 }}>Код</th>
                  <th>Наименование</th>
                  <th style={{ width: 220 }}>Контакт</th>
                  <th>Адрес</th>
                  <th style={{ width: 220 }} className="tRight">Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 18 }} className="muted mini">Нет данных</td></tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.id}</td>
                      <td>{it.code || '—'}</td>
                      <td>{it.name}</td>
                      <td>
                        <div className="mini">{it.contact_person || '—'}</div>
                        <div className="mini muted">{[it.phone, it.email].filter(Boolean).join(' • ') || it.contacts || '—'}</div>
                      </td>
                      <td>{it.address || '—'}</td>
                      <td className="tRight">
                        <button className="btn small" onClick={() => openEdit(it)}>Ред.</button>{' '}
                        <button className="btn small danger" onClick={() => remove(it.id)}>Уд.</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', margin: '20px 0' }}>
            <div className="cardHead">
              <div className="title">{editing ? 'Редактировать' : 'Добавить'} лабораторию</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 24 }}>×</button>
            </div>
            <div className="cardBody">
              <form onSubmit={save}>
                <div className="field">
                  <label>Наименование *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Код</label>
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="например: lab_stroylab" />
                </div>
                <div className="field">
                  <label>Контактное лицо</label>
                  <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                </div>
                <div className="field">
                  <label>Адрес</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="field">
                  <label>Контакты (произв.)</label>
                  <textarea rows={2} value={contacts} onChange={(e) => setContacts(e.target.value)} />
                </div>
                <div className="field">
                  <label>Примечание</label>
                  <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div style={{ height: 14 }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Laboratories;

