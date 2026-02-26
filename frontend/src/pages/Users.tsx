import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import './Pages.css';
import { mockUsers, mockPermissions } from '../mocks/data';

interface User {
  id: number;
  username: string;
  email?: string;
  full_name: string;
  role: string;
  department_id?: number;
  position?: string;
  phone?: string;
  is_active: boolean;
  notes?: string;
  personnel_id?: number | null;
}

interface Permission {
  id: number;
  code: string;
  name: string;
  module?: string;
}

interface Department {
  id: number;
  name: string;
}

interface PersonnelItem {
  id: number;
  tab_number?: string;
  full_name: string;
  position: string;
  department_id?: number;
}

interface RoleItem {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [filters, setFilters] = useState({ search: '', role: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [permissionPage, setPermissionPage] = useState(1);
  const [pageSize] = useState(20);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [personnelList, setPersonnelList] = useState<PersonnelItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: '',
    department_id: '' as number | '',
    position: '',
    phone: '',
    is_active: true,
    notes: '',
    personnel_id: '' as number | '',
  });
  const [rolePermissions, setRolePermissions] = useState<Record<string, number[]>>({});
  const [rolesList, setRolesList] = useState<RoleItem[]>([]);
  const [roleEditRole, setRoleEditRole] = useState<string | null>(null);
  const [roleEditSelectedPermissions, setRoleEditSelectedPermissions] = useState<number[]>([]);
  const [roleEditSearch, setRoleEditSearch] = useState('');
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [addRoleCode, setAddRoleCode] = useState('');
  const [addRoleName, setAddRoleName] = useState('');
  const [addRoleError, setAddRoleError] = useState<string | null>(null);

  const fetchRolePermissions = async (permData: Permission[]) => {
    try {
      const res = await axios.get(`${API_URL}/roles/permissions`);
      if (Array.isArray(res.data)) {
        const map: Record<string, number[]> = {};
        res.data.forEach((rp: { role: string; permission_ids: number[] }) => {
          map[rp.role] = rp.permission_ids || [];
        });
        setRolePermissions(map);
        return;
      }
    } catch (error) {
      console.error('Ошибка загрузки матрицы ролей и прав:', error);
    }
    // Фолбек: оставляем пустую матрицу — роли можно будет заполнять вручную
    setRolePermissions({});
  };

  const saveRolePermissionsForRole = async (role: string, permissionIds: number[]) => {
    await axios.put(`${API_URL}/roles/${role}/permissions`, {
      role,
      permission_ids: permissionIds,
    });
    await fetchRolePermissions(permissions);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_URL}/roles/`);
      setRolesList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRolesList([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, permRes, depRes, personnelRes, rolesRes] = await Promise.all([
        axios.get(`${API_URL}/users/`),
        axios.get(`${API_URL}/permissions/`),
        axios.get(`${API_URL}/departments/`),
        axios.get(`${API_URL}/personnel/`, { params: { limit: 500 } }),
        axios.get(`${API_URL}/roles/`),
      ]);
      const usersData = Array.isArray(usersRes.data) && usersRes.data.length > 0 ? usersRes.data : mockUsers;
      const permData = Array.isArray(permRes.data) && permRes.data.length > 0 ? permRes.data : mockPermissions;
      setUsers(usersData);
      setPermissions(permData);
      if (Array.isArray(depRes.data)) {
        setDepartments(depRes.data);
      }
      if (Array.isArray(personnelRes.data)) {
        setPersonnelList(personnelRes.data);
      }
      setRolesList(Array.isArray(rolesRes.data) ? rolesRes.data : []);
      await fetchRolePermissions(permData);
    } catch (error) {
      console.error('Ошибка загрузки данных пользователей/прав:', error);
      setUsers(mockUsers);
      setPermissions(mockPermissions);
      await fetchRolePermissions(mockPermissions);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormError(null);
    setFormData({
      username: '',
      email: '',
      full_name: '',
      role: '',
      department_id: '',
      position: '',
      phone: '',
      is_active: true,
      notes: '',
      personnel_id: '',
    });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormError(null);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      full_name: user.full_name || '',
      role: user.role || '',
      department_id: user.department_id ?? '',
      position: user.position || '',
      phone: user.phone || '',
      is_active: user.is_active,
      notes: user.notes || '',
      personnel_id: user.personnel_id ?? '',
    });
    setShowModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'department_id' || name === 'personnel_id'
          ? (value ? Number(value) : '')
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.username.trim() || !formData.role) {
      setFormError('Заполните логин и роль.');
      return;
    }
    if (!editingUser && !formData.personnel_id) {
      setFormError('Выберите сотрудника из Кадров.');
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        username: formData.username.trim(),
        email: formData.email.trim() || null,
        role: formData.role,
        phone: formData.phone.trim() || null,
        is_active: formData.is_active,
        notes: formData.notes.trim() || null,
        personnel_id: formData.personnel_id || null,
      };
      if (editingUser) {
        payload.full_name = formData.full_name?.trim() || editingUser.full_name || '';
        payload.department_id = formData.department_id || editingUser.department_id || null;
        payload.position = formData.position?.trim() || editingUser.position || null;
      }
      if (editingUser) {
        await axios.put(`${API_URL}/users/${editingUser.id}`, payload);
      } else {
        await axios.post(`${API_URL}/users/`, payload);
      }
      setShowModal(false);
      setEditingUser(null);
      await fetchData();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail && typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : 'Ошибка сохранения пользователя';
      setFormError(msg);
    }
  };

  if (loading && users.length === 0) return <div className="loading">Загрузка...</div>;

  const roleLabels: Record<string, string> = {
    admin: 'Администратор',
    pto_head: 'Руководитель ПТО',
    pto_engineer: 'Инженер ПТО',
    site_manager: 'Начальник участка',
    foreman: 'Прораб',
    master: 'Мастер',
    storekeeper: 'Заведующий складом',
    operator: 'Оператор СМУ',
    geodesist: 'Геодезист',
    oge_head: 'Руководитель ОГЭ',
    ogm_head: 'Руководитель ОГМ',
    architect: 'Архитектор',
    sales_manager: 'Менеджер по продажам',
    accountant: 'Бухгалтер',
    debt_collector: 'Отдел дебиторки',
  };
  const roleLabelsCombined: Record<string, string> = { ...roleLabels };
  rolesList.forEach((r) => { roleLabelsCombined[r.code] = r.name; });
  const allRoles = rolesList.length > 0
    ? rolesList.map((r) => [r.code, r.name] as [string, string])
    : Object.entries(roleLabels);

  const filteredUsers = users.filter(u => {
    if (filters.role && u.role !== filters.role) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!u.username.toLowerCase().includes(search) && !u.full_name.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  const filteredPermissions = permissions; // используется в модалке, фильтрация ниже по поиску

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const filteredRoles = allRoles.filter(([, label]) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return label.toLowerCase().includes(search);
  });
  const paginatedRoles = filteredRoles.slice((permissionPage - 1) * pageSize, permissionPage * pageSize);
  const totalUserPages = Math.ceil(filteredUsers.length / pageSize);
  const totalPermissionPages = Math.ceil(filteredRoles.length / pageSize);

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Пользователи и роли</span></div>
          <div className="h1">Пользователи и роли</div>
          <p className="h2">Список пользователей • назначение ролей и прав доступа • связь с подразделениями.</p>
        </div>
        <div className="actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            className="btn primary"
            href="#users"
            onClick={(e) => {
              e.preventDefault();
              openCreateModal();
            }}
          >
            + Добавить пользователя
          </a>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setShowAddRoleModal(true);
              setAddRoleCode('');
              setAddRoleName('');
              setAddRoleError(null);
            }}
          >
            + Добавить роль
          </button>
        </div>
      </div>

      <div className="card">
        <div className="cardHead">
          <div>
            <div className="title">Управление пользователями и правами</div>
            <div className="desc">Управление пользователями • назначение ролей • управление разрешениями</div>
          </div>
        </div>
        <div className="cardBody">
            <div className="tabs">
              <div className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Пользователи</div>
              <div className={`tab ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>Разрешения</div>
            </div>

          {activeTab === 'users' && (
            <>
              <div className="toolbar" style={{ marginTop: '10px' }}>
                <div className="filters">
                  <div className="field">
                    <label>Поиск</label>
                    <input type="text" placeholder="Логин или ФИО..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Роль</label>
                    <select value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})}>
                      <option value="">Все</option>
                      {Object.keys(roleLabelsCombined).map(role => <option key={role} value={role}>{roleLabelsCombined[role]}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <table>
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>ID</th>
                  <th>ФИО</th>
                  <th style={{ width: '16%' }}>Логин</th>
                  <th style={{ width: '18%' }}>Роль</th>
                  <th style={{ width: '14%' }}>Должность</th>
                  <th style={{ width: '10%' }}>Статус</th>
                  <th className="tRight" style={{ width: '14%' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Пользователи не найдены</td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.full_name}</td>
                      <td>{u.username}</td>
                      <td><span className="chip info">{roleLabelsCombined[u.role] || u.role}</span></td>
                      <td>{u.position || '—'}</td>
                      <td><span className={`chip ${u.is_active ? 'ok' : 'danger'}`}>{u.is_active ? 'Активен' : 'Неактивен'}</span></td>
                      <td className="tRight">
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => openEditModal(u)}
                        >
                          Открыть
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalUserPages > 1 && (
              <div className="tableFooter">
                <div className="pager">
                  <button className="btn small" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                  <span>Стр. {currentPage} из {totalUserPages}</span>
                  <button className="btn small" onClick={() => setCurrentPage(p => Math.min(totalUserPages, p + 1))} disabled={currentPage === totalUserPages}>›</button>
                </div>
              </div>
            )}
            </>
          )}

          {activeTab === 'permissions' && (
            <>
              <div className="toolbar" style={{ marginTop: '10px' }}>
                <div className="filters">
                  <div className="field">
                    <label>Поиск</label>
                    <input type="text" placeholder="Код или название..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                  </div>
                </div>
              </div>
              <table>
              <thead>
                <tr>
                  <th>Роль</th>
                  <th style={{ width: '40%' }}>Права</th>
                  <th style={{ width: '35%' }}>Права для роли</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRoles.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '40px' }}>Роли не найдены</td>
                  </tr>
                ) : (
                  paginatedRoles.map(([role, label]) => {
                    const permIds = rolePermissions[role] || [];
                    const permMap: Record<number, Permission> = {};
                    filteredPermissions.forEach((p) => {
                      permMap[p.id] = p;
                    });
                    const permsForRole = permIds
                      .map((id) => permMap[id])
                      .filter(Boolean) as Permission[];
                    return (
                      <tr key={role}>
                        <td>
                          {label}
                          <div className="mini">{role}</div>
                        </td>
                        <td>
                          {permsForRole.length === 0
                            ? <span className="mini">Права не назначены</span>
                            : permsForRole.map((p) => (
                                <span key={p.id} className="chip mini" style={{ marginRight: 4, marginTop: 4 }}>
                                  {p.name}
                                </span>
                              ))}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => {
                              setRoleEditRole(role);
                              setRoleEditSelectedPermissions(permIds);
                              setRoleEditSearch('');
                            }}
                          >
                            Настроить
                          </button>
                          {' '}
                          {permsForRole.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                              {permsForRole.map((p) => (
                                <span key={p.id} className="chip mini" style={{ marginRight: 4, marginTop: 2 }}>
                                  {p.code}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {totalPermissionPages > 1 && (
              <div className="tableFooter">
                <div className="pager">
                  <button className="btn small" onClick={() => setPermissionPage(p => Math.max(1, p - 1))} disabled={permissionPage === 1}>‹</button>
                  <span>Стр. {permissionPage} из {totalPermissionPages}</span>
                  <button className="btn small" onClick={() => setPermissionPage(p => Math.min(totalPermissionPages, p + 1))} disabled={permissionPage === totalPermissionPages}>›</button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingUser(null); }}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Редактирование пользователя' : 'Добавление пользователя'}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => { setShowModal(false); setEditingUser(null); }}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {formError && (
                <div className="pageError" style={{ marginBottom: '12px' }}>
                  <strong>Ошибка:</strong> {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="form-grid">
                <div className="field">
                  <label>Логин *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="field">
                  <label>Сотрудник (Кадры) *</label>
                  <select
                    name="personnel_id"
                    value={formData.personnel_id}
                    onChange={handleFormChange}
                    required={!editingUser}
                  >
                    <option value="">Не привязан</option>
                    {personnelList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} {p.tab_number ? `(${p.tab_number})` : ''} — {p.position}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="field">
                  <label>Телефон</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="field">
                  <label>Роль *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Выберите роль</option>
                    {Object.keys(roleLabelsCombined).map((role) => (
                      <option key={role} value={role}>
                        {roleLabelsCombined[role]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Примечания</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={2}
                  />
                </div>
                <div className="field">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleFormChange}
                    />{' '}
                    Активен
                  </label>
                </div>
                <div className="modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button type="submit" className="btn primary">
                    Сохранить
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {roleEditRole && (
        <div className="modal-overlay" onClick={() => { setRoleEditRole(null); setRoleEditSearch(''); }}>
          <div className="modal-content modal-large" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Права для роли</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => { setRoleEditRole(null); setRoleEditSearch(''); }}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="field">
                <label>Роль</label>
                <div className="mini">
                  <strong>{roleEditRole && roleLabelsCombined[roleEditRole]}</strong>
                  {roleEditRole && <span> ({roleEditRole})</span>}
                </div>
              </div>
              <div className="field">
                <label>Поиск по действиям</label>
                <input
                  type="text"
                  value={roleEditSearch}
                  onChange={(e) => setRoleEditSearch(e.target.value)}
                  placeholder="Начните вводить код или название действия..."
                />
              </div>
              <div className="field">
                <label>Права (множественный выбор)</label>
                <div style={{ border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
                      padding: '4px 8px',
                      background: 'var(--bgElevated)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <span>Наименование</span>
                    <span>Код</span>
                  </div>
                  <select
                    multiple
                    size={Math.min(10, filteredPermissions.length || 10)}
                    value={roleEditSelectedPermissions.map(String)}
                    onChange={(e) => {
                      const options = Array.from(e.target.options);
                      const selected = options.filter(o => o.selected).map(o => Number(o.value));
                      setRoleEditSelectedPermissions(selected);
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: 13,
                    }}
                  >
                    {filteredPermissions
                      .filter((p) => {
                        if (!roleEditSearch.trim()) return true;
                        const q = roleEditSearch.toLowerCase();
                        return (
                          p.code.toLowerCase().includes(q) ||
                          p.name.toLowerCase().includes(q) ||
                          (p.module || '').toLowerCase().includes(q)
                        );
                      })
                      .map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}
                        >
                          {p.name} │ {p.code}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setRoleEditRole(null); setRoleEditSearch(''); }}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={async () => {
                    if (!roleEditRole) return;
                    const roleCode = roleEditRole;
                    const selectedIds = [...roleEditSelectedPermissions];
                    setRolePermissions((prev) => ({
                      ...prev,
                      [roleCode]: selectedIds,
                    }));
                    setRoleEditRole(null);
                    setRoleEditSearch('');
                    try {
                      await saveRolePermissionsForRole(roleCode, selectedIds);
                    } catch {
                      await fetchRolePermissions(permissions);
                    }
                  }}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showAddRoleModal && (
        <div className="modal-overlay" onClick={() => { setShowAddRoleModal(false); setAddRoleError(null); }}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Добавить роль</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => { setShowAddRoleModal(false); setAddRoleError(null); }}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {addRoleError && (
                <div className="alert error" style={{ marginBottom: 12 }}>{addRoleError}</div>
              )}
              <div className="field">
                <label>Код *</label>
                <input
                  type="text"
                  value={addRoleCode}
                  onChange={(e) => setAddRoleCode(e.target.value)}
                  placeholder="например: custom_role"
                />
              </div>
              <div className="field">
                <label>Наименование *</label>
                <input
                  type="text"
                  value={addRoleName}
                  onChange={(e) => setAddRoleName(e.target.value)}
                  placeholder="например: Пользовательская роль"
                />
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setShowAddRoleModal(false); setAddRoleError(null); }}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={async () => {
                    const code = addRoleCode.trim();
                    const name = addRoleName.trim();
                    if (!code || !name) {
                      setAddRoleError('Заполните код и наименование.');
                      return;
                    }
                    setAddRoleError(null);
                    try {
                      await axios.post(`${API_URL}/roles/`, { code, name });
                      setShowAddRoleModal(false);
                      setAddRoleCode('');
                      setAddRoleName('');
                      await fetchRoles();
                      await fetchRolePermissions(permissions);
                    } catch (err: unknown) {
                      const msg = axios.isAxiosError(err) && err.response?.data?.detail
                        ? (Array.isArray(err.response.data.detail) ? err.response.data.detail.map((x: { msg?: string }) => x.msg).join(' ') : String(err.response.data.detail))
                        : 'Не удалось создать роль.';
                      setAddRoleError(msg);
                    }
                  }}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Users;
