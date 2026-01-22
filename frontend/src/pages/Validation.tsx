import React from 'react';
import { BasePage } from './BasePage';

const Validation: React.FC = () => {
  return (
    <BasePage
      title="Проверка смет"
      subtitle="API: /api/v1/validation/ • В разработке"
      breadcrumbs={[{ label: 'Главная', href: '#dashboard' }, { label: 'Проверка смет' }]}
      actions={<a className="btn primary" href="#validation">+ Проверить</a>}
    >
      <div className="card">
        <div className="cardHead">
          <div>
            <div className="title">Модуль в разработке</div>
            <div className="desc">Backend API готов • Frontend в разработке</div>
          </div>
          <span className="chip warn">0%</span>
        </div>
        <div className="cardBody">
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <p>Модуль "Проверка смет" будет реализован в ближайшее время.</p>
            <p className="mini" style={{ marginTop: '10px' }}>Backend API доступен: /api/v1/validation/</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
};

export default Validation;
