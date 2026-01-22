import React from 'react';
import { BasePage } from './BasePage';

const DocumentVersions: React.FC = () => {
  return (
    <BasePage
      title="Версии документов"
      subtitle="API: /api/v1/document-versions/ • В разработке"
      breadcrumbs={[{ label: 'Главная', href: '#dashboard' }, { label: 'Версии документов' }]}
      actions={<a className="btn primary" href="#documentversions">+ Создать</a>}
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
            <p>Модуль "Версии документов" будет реализован в ближайшее время.</p>
            <p className="mini" style={{ marginTop: '10px' }}>Backend API доступен: /api/v1/document-versions/</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
};

export default DocumentVersions;
