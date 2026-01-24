import React from 'react';
import { BasePage } from './BasePage';

const DocumentVersions: React.FC = () => {
  return (
    <BasePage
      title="Версии документов"
      subtitle="Версии документов • В разработке"
      breadcrumbs={[{ label: 'Главная', href: '#dashboard' }, { label: 'Версии документов' }]}
      actions={<a className="btn primary" href="#documentversions">+ Создать</a>}
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
            <p>Модуль "Версии документов" будет реализован в ближайшее время.</p>
            <p className="mini" style={{ marginTop: '10px' }}>Бэкенд API доступен и готов к использованию</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
};

export default DocumentVersions;
