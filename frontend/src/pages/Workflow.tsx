import React from 'react';
import { BasePage } from './BasePage';

const Workflow: React.FC = () => {
  return (
    <BasePage
      title="Workflow заявок"
      subtitle="API: /api/v1/workflow/ • В разработке"
      breadcrumbs={[{ label: 'Главная', href: '#dashboard' }, { label: 'Workflow заявок' }]}
      actions={<a className="btn primary" href="#workflow">+ Настроить</a>}
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
            <p>Модуль "Workflow заявок" будет реализован в ближайшее время.</p>
            <p className="mini" style={{ marginTop: '10px' }}>Backend API доступен: /api/v1/workflow/</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
};

export default Workflow;
