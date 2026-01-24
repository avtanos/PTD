import React from 'react';
import { BasePage } from './BasePage';

const Integration1C: React.FC = () => {
  return (
    <BasePage
      title="Интеграция с 1С"
      subtitle="Интеграция с 1С • В разработке"
      breadcrumbs={[{ label: 'Главная', href: '#dashboard' }, { label: 'Интеграция с 1С' }]}
    >
      <div className="card">
        <div className="cardHead">
          <div>
            <div className="title">Модуль в разработке</div>
            <div className="desc">Бэкенд готов • Интерфейс в разработке</div>
          </div>
          <span className="chip warn">0%</span>
        </div>
        <div className="cardBody">
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <p>Модуль "Интеграция с 1С" будет реализован в ближайшее время.</p>
            <p className="mini" style={{ marginTop: '10px' }}>Бэкенд API доступен и готов к использованию</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
};

export default Integration1C;
