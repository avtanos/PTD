import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  department_id?: number;
  position?: string;
  is_active: boolean;
}

interface Permission {
  id: number;
  code: string;
  name: string;
  module?: string;
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, permRes] = await Promise.all([
        axios.get(`${API_URL}/users/`),
        axios.get(`${API_URL}/permissions/`),
      ]);
      setUsers(usersRes.data);
      setPermissions(permRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

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
          <p className="h2">Список пользователей • назначение ролей (Мастер, Прораб, Начальник участка и т.д.) • управление разрешениями • связь с подразделениями.</p>
        </div>
        <div className="actions">
          <a className="btn primary" href="#users">+ Добавить пользователя</a>
        </div>
      </div>

      <div className="card">
        <div className="cardHead">
          <div>
            <div className="title">Управление пользователями и правами</div>
            <div className="desc">GET /api/v1/users/* • пользователи, разрешения</div>
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
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Пользователи не найдены</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.full_name}</td>
                      <td>{u.username}</td>
                      <td><span className="chip info">{roleLabels[u.role] || u.role}</span></td>
                      <td>{u.position || '—'}</td>
                      <td><span className={`chip ${u.is_active ? 'ok' : 'danger'}`}>{u.is_active ? 'Активен' : 'Неактивен'}</span></td>
                      <td className="tRight"><a className="btn small" href={`#users?id=${u.id}`}>Открыть</a></td>
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
                </tr>
              </thead>
              <tbody>
                {paginatedPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>Разрешения не найдены</td>
                  </tr>
                ) : (
                  paginatedPermissions.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.code}</td>
                      <td>{p.name}</td>
                      <td>{p.module || '—'}</td>
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
    </>
  );
};

export default Users;
