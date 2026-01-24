import React, { useState } from 'react';

const Profile: React.FC = () => {
  const [user] = useState({
    id: 1,
    full_name: 'Иванов Иван Иванович',
    username: 'ivanov_ii',
    email: 'ivanov@example.com',
    role: 'pto_engineer',
    role_name: 'Инженер ПТО',
    department: 'Производственно-технический отдел',
    position: 'Ведущий инженер',
    phone: '+996 (555) 12-34-56',
    avatar_url: null
  });

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Профиль</span></div>
          <div className="h1">Личный кабинет</div>
          <p className="h2">Управление профилем и настройками аккаунта</p>
        </div>
      </div>

      <div className="card">
        <div className="cardBody">
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ width: '200px', flexShrink: 0, textAlign: 'center' }}>
              <div style={{ 
                width: '150px', 
                height: '150px', 
                borderRadius: '50%', 
                background: 'var(--bg)', 
                margin: '0 auto 20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '48px',
                color: 'var(--muted)',
                border: '1px solid var(--line)'
              }}>
                {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <button className="btn small" style={{ width: '100%' }}>Изменить фото</button>
            </div>
            
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h2 style={{ marginBottom: '20px' }}>Общая информация</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="field">
                  <label>ФИО</label>
                  <input type="text" value={user.full_name} readOnly />
                </div>
                
                <div className="field">
                  <label>Логин</label>
                  <input type="text" value={user.username} readOnly />
                </div>

                <div className="field">
                  <label>Email</label>
                  <input type="email" value={user.email} readOnly />
                </div>

                <div className="field">
                  <label>Телефон</label>
                  <input type="text" value={user.phone} readOnly />
                </div>

                <div className="field">
                  <label>Отдел</label>
                  <input type="text" value={user.department} readOnly />
                </div>

                <div className="field">
                  <label>Должность</label>
                  <input type="text" value={user.position} readOnly />
                </div>
                
                <div className="field">
                  <label>Роль в системе</label>
                  <input type="text" value={user.role_name} readOnly style={{ color: 'var(--primary)', fontWeight: 500 }} />
                </div>
              </div>

              <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                <button className="btn primary">Сохранить изменения</button>
                <button className="btn">Сменить пароль</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="cardHead">
            <div className="title">Активность</div>
        </div>
        <div className="cardBody">
            <p className="muted">История активности будет доступна позже.</p>
        </div>
      </div>
    </>
  );
};

export default Profile;
