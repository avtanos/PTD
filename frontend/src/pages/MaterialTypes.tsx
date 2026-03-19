import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import './Pages.css';

type Item = { id: number; code: string; name: string; description?: string | null };

const MaterialTypes: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<Item[]>(`${API_URL}/materials/material-types/`).catch(() => ({ data: [] as Item[] }));
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
    setCode('');
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const openEdit = (it: Item) => {
    setEditing(it);
    setCode(it.code);
    setName(it.name);
    setDescription(it.description || '');
    setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    const n = name.trim();
    if (!c || !n) return;
    try {
      if (editing) {
        await axios.put(`${API_URL}/materials/material-types/${editing.id}`, {
          code: c,
          name: n,
          description: description.trim() || null,
        });
      } else {
        await axios.post(`${API_URL}/materials/material-types/`, {
          code: c,
          name: n,
          description: description.trim() || null,
          is_active: true,
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
      await axios.delete(`${API_URL}/materials/material-types/${id}`);
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
          <div className="h1">Тип материала</div>
          <div className="muted mini">Справочник типов материалов (используется в карточке материала).</div>
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
                  <th style={{ width: 160 }}>Код</th>
                  <th>Наименование</th>
                  <th>Описание</th>
                  <th style={{ width: 220 }} className="tRight">Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 18 }} className="muted mini">Нет данных</td></tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.id}</td>
                      <td>{it.code}</td>
                      <td>{it.name}</td>
                      <td>{it.description || '—'}</td>
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
          <div className="card" style={{ maxWidth: 560, width: '100%', margin: '20px 0' }}>
            <div className="cardHead">
              <div className="title">{editing ? 'Редактировать' : 'Добавить'} тип материала</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 24 }}>×</button>
            </div>
            <div className="cardBody">
              <form onSubmit={save}>
                <div className="field">
                  <label>Код *</label>
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="construction / tools / equipment ..." required />
                </div>
                <div className="field">
                  <label>Наименование *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Описание</label>
                  <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
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

export default MaterialTypes;

