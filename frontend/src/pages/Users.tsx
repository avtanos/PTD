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
  const [roleEditPermission, setRoleEditPermission] = useState<Permission | null>(null);
  const [roleEditSelectedRoles, setRoleEditSelectedRoles] = useState<string[]>([]);
  const [roleEditSearch, setRoleEditSearch] = useState('');

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

  const toggleRolePermission = async (role: string, permissionId: number, checked: boolean) => {
    setRolePermissions((prev) => {
      const current = prev[role] || [];
      const exists = current.includes(permissionId);
      let next = current;
      if (checked && !exists) {
        next = [...current, permissionId];
      } else if (!checked && exists) {
        next = current.filter((id) => id !== permissionId);
      }
      return { ...prev, [role]: next };
    });
    try {
      const current = rolePermissions[role] || [];
      const base = new Set(current);
      if (checked) {
        base.add(permissionId);
      } else {
        base.delete(permissionId);
      }
      await axios.put(`${API_URL}/roles/${role}/permissions`, {
        role,
        permission_ids: Array.from(base),
      });
      // После успешного сохранения перезагружаем матрицу, чтобы не расходиться с бэкендом
      await fetchRolePermissions(permissions);
    } catch (error) {
      console.error('Ошибка сохранения прав роли:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, permRes, depRes, personnelRes] = await Promise.all([
        axios.get(`${API_URL}/users/`),
        axios.get(`${API_URL}/permissions/`),
        axios.get(`${API_URL}/departments/`),
        axios.get(`${API_URL}/personnel/`, { params: { limit: 500 } }),
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

  const filteredUsers = users.filter(u => {
    if (filters.role && u.role !== filters.role) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!u.username.toLowerCase().includes(search) && !u.full_name.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  const filteredPermissions = permissions.filter(p => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!p.code.toLowerCase().includes(search) && !p.name.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedPermissions = filteredPermissions.slice((permissionPage - 1) * pageSize, permissionPage * pageSize);
  const totalUserPages = Math.ceil(filteredUsers.length / pageSize);
  const totalPermissionPages = Math.ceil(filteredPermissions.length / pageSize);

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Пользователи и роли</span></div>
          <div className="h1">Пользователи и роли</div>
          <p className="h2">Список пользователей • назначение ролей и прав доступа • связь с подразделениями.</p>
        </div>
        <div className="actions">
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
                      {Object.keys(roleLabels).map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}
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
                      <td><span className="chip info">{roleLabels[u.role] || u.role}</span></td>
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
                  <th style={{ width: '10%' }}>ID</th>
                  <th>Код</th>
                  <th>Наименование</th>
                  <th>Модуль</th>
                  <th style={{ width: '40%' }}>Роли</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Разрешения не найдены</td>
                  </tr>
                ) : (
                  paginatedPermissions.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.code}</td>
                      <td>{p.name}</td>
                      <td>{p.module || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => {
                            setRoleEditPermission(p);
                            const rolesForPermission = Object.entries(roleLabels)
                              .filter(([role]) => (rolePermissions[role] || []).includes(p.id))
                              .map(([role]) => role);
                            setRoleEditSelectedRoles(rolesForPermission);
                            setRoleEditSearch('');
                          }}
                        >
                          Настроить
                        </button>
                        {' '}
                        {Object.entries(roleLabels)
                          .filter(([role]) => (rolePermissions[role] || []).includes(p.id))
                          .map(([role, label]) => (
                            <span key={role} className="chip mini" style={{ marginRight: 4, marginTop: 4 }}>
                              {label}
                            </span>
                          ))}
                      </td>
                    </tr>
                  ))
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
                    {Object.keys(roleLabels).map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
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
      {roleEditPermission && (
        <div className="modal-overlay" onClick={() => { setRoleEditPermission(null); setRoleEditSearch(''); }}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Роли для права</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => { setRoleEditPermission(null); setRoleEditSearch(''); }}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="field">
                <label>Разрешение</label>
                <div className="mini">
                  <strong>{roleEditPermission.code}</strong> — {roleEditPermission.name}
                </div>
              </div>
              <div className="field">
                <label>Поиск по ролям</label>
                <input
                  type="text"
                  value={roleEditSearch}
                  onChange={(e) => setRoleEditSearch(e.target.value)}
                  placeholder="Начните вводить название роли..."
                />
              </div>
              <div className="field">
                <label>Роли (множественный выбор)</label>
                <select
                  multiple
                  size={Math.min(8, Object.keys(roleLabels).length)}
                  value={roleEditSelectedRoles}
                  onChange={(e) => {
                    const options = Array.from(e.target.options);
                    const selected = options.filter(o => o.selected).map(o => o.value);
                    setRoleEditSelectedRoles(selected);
                  }}
                >
                  {Object.entries(roleLabels)
                    .filter(([, label]) => {
                      if (!roleEditSearch.trim()) return true;
                      const q = roleEditSearch.toLowerCase();
                      return label.toLowerCase().includes(q);
                    })
                    .map(([role, label]) => (
                      <option key={role} value={role}>
                        {label}
                      </option>
                    ))}
                </select>
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setRoleEditPermission(null); setRoleEditSearch(''); }}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={async () => {
                    if (!roleEditPermission) return;
                    const permId = roleEditPermission.id;
                    const currentMap = rolePermissions;
                    const allRoles = Object.keys(roleLabels);
                    const promises: Promise<void>[] = [];
                    allRoles.forEach((role) => {
                      const currentIds = currentMap[role] || [];
                      const hasNow = currentIds.includes(permId);
                      const shouldHave = roleEditSelectedRoles.includes(role);
                      if (hasNow !== shouldHave) {
                        promises.push(toggleRolePermission(role, permId, shouldHave) as unknown as Promise<void>);
                      }
                    });
                    await Promise.all(promises);
                    setRoleEditPermission(null);
                    setRoleEditSearch('');
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
