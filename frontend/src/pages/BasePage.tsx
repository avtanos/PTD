import React from 'react';

interface BasePageProps {
  title: string;
  subtitle: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const BasePage: React.FC<BasePageProps> = ({ title, subtitle, breadcrumbs, actions, children }) => {
  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {crumb.href ? (
                  <a href={crumb.href}>{crumb.label}</a>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <span className="sep">/</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="h1">{title}</div>
          <p className="h2">{subtitle}</p>
        </div>
        {actions && <div className="actions">{actions}</div>}
      </div>
      {children}
    </>
  );
};

export const createStubPage = (moduleName: string, apiPath: string): React.FC<{}> => {
  const StubPage: React.FC<{}> = () => {
    return (
      <BasePage
        title={moduleName}
        subtitle="Модуль в разработке"
        breadcrumbs={[{ label: 'Главная', href: '#dashboard' }, { label: moduleName }]}
        actions={<a className="btn primary" href={`#${moduleName.toLowerCase()}`}>+ Создать</a>}
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
              <p>Модуль "{moduleName}" будет реализован в ближайшее время.</p>
              <p className="mini" style={{ marginTop: '10px' }}>Бэкенд API доступен и готов к использованию</p>
            </div>
          </div>
        </div>
      </BasePage>
    );
  };
  return StubPage;
};
