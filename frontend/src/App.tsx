import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

// Import all pages
import Dashboard from './pages/Dashboard';
import DocumentRoadmap from './pages/DocumentRoadmap';
import Projects from './pages/Projects';
import ExecutiveDocs from './pages/ExecutiveDocs';
import KS2 from './pages/KS2';
import KS3 from './pages/KS3';
import GPR from './pages/GPR';
import PPR from './pages/PPR';
import Applications from './pages/Applications';
import Contracts from './pages/Contracts';
import Tenders from './pages/Tenders';
import Estimates from './pages/Estimates';
import Materials from './pages/Materials';
import Invoices from './pages/Invoices';
import Departments from './pages/Departments';
import Constructs from './pages/Constructs';
import StandardRates from './pages/StandardRates';
import ProjectDocumentation from './pages/ProjectDocumentation';
// Import all stub pages
import ExecutiveSurveys from './pages/ExecutiveSurveys';
import WorkVolumes from './pages/WorkVolumes';
import ProjectChanges from './pages/ProjectChanges';
import Workflow from './pages/Workflow';
import DocumentVersions from './pages/DocumentVersions';
import Integration1C from './pages/Integration1C';
import Validation from './pages/Validation';
import Users from './pages/Users';
import Personnel from './pages/Personnel';
import Receivables from './pages/Receivables';
import Profile from './pages/Profile';
import Sales from './pages/Sales';

const API_URL = '/api/v1';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    // Поддержка как HashRouter, так и BrowserRouter
    const hash = location.hash.slice(1);
    const path = location.pathname.replace('/PTD', '').replace('/', '') || location.pathname.replace('/', '');
    const page = hash || path || 'dashboard';
    setCurrentPage(page);
  }, [location]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleNavClick = (page: string) => {
    setCurrentPage(page);
    window.location.hash = `#${page}`;
    setNavOpen(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'roadmap': return <DocumentRoadmap />;
      case 'projects': return <Projects />;
      case 'execdocs': return <ExecutiveDocs />;
      case 'ks2': return <KS2 />;
      case 'ks3': return <KS3 />;
      case 'gpr': return <GPR />;
      case 'ppr': return <PPR />;
      case 'applications': return <Applications />;
      case 'contracts': return <Contracts />;
      case 'tenders': return <Tenders />;
      case 'estimates': return <Estimates />;
      case 'materials': return <Materials />;
      case 'invoices': return <Invoices />;
      case 'departments': return <Departments />;
      case 'constructs': return <Constructs />;
      case 'standardrates': return <StandardRates />;
      case 'projdocs': return <ProjectDocumentation />;
      case 'surveys': return <ExecutiveSurveys />;
      case 'volumes': return <WorkVolumes />;
      case 'changes': return <ProjectChanges />;
      case 'workflow': return <Workflow />;
      case 'docversions': return <DocumentVersions />;
      case 'integration1c': return <Integration1C />;
      case 'validation': return <Validation />;
      case 'users': return <Users />;
      case 'personnel': return <Personnel />;
      case 'receivables': return <Receivables />;
      case 'sales': return <Sales />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  const NavLink: React.FC<{ to: string; icon: string; children: React.ReactNode; meta?: string }> = ({ to, icon, children, meta }) => (
    <a
      href={`#${to}`}
      onClick={(e) => {
        e.preventDefault();
        handleNavClick(to);
      }}
      className={currentPage === to ? 'active' : ''}
      title={typeof children === 'string' ? children : undefined}
      data-label={typeof children === 'string' ? children : undefined}
    >
      <svg className="ic" viewBox="0 0 24 24"><path d={icon} /></svg>
      <span className="navLabel">{children}</span>
      {meta && <span className="meta">{meta}</span>}
    </a>
  );

  return (
    <div className={`App ${sidebarCollapsed ? 'sidebarCollapsed' : ''}`}>
      <input
        type="checkbox"
        id="navToggle"
        checked={navOpen}
        onChange={(e) => setNavOpen(e.target.checked)}
        style={{ display: 'none' }}
      />
      {navOpen && (
        <label className="overlay" onClick={() => setNavOpen(false)} aria-label="Закрыть меню" />
      )}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <div className="logo">
            <img src={`${process.env.PUBLIC_URL || ''}/logo.png`} alt="OpenCM" className="logoImg" />
          </div>
          <div className="brandText">
            <div className="title brandTitleOpenCM"><span className="brandOpen">Open</span><span className="brandCM">CM</span></div>
            <div className="sub">Управление строительством</div>
          </div>
        </div>
        <div className="navGroup">Обзор</div>
        <nav className="nav">
          <NavLink to="dashboard" icon="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z">Дашборд</NavLink>
          <NavLink to="roadmap" icon="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z">Дорожная карта</NavLink>
        </nav>

        <div className="navGroup">Проекты и документы</div>
        <nav className="nav">
          <NavLink to="projects" icon="M10 4H4v6h6V4Zm10 0h-6v6h6V4ZM10 14H4v6h6v-6Zm10 0h-6v6h6v-6Z">Проекты</NavLink>
          <NavLink to="projdocs" icon="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6Zm1 7V3.5L19.5 9H15ZM8 13h8v-2H8v2Zm0 4h8v-2H8v2Z">Проектная документация</NavLink>
          <NavLink to="execdocs" icon="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6Zm1 7V3.5L19.5 9H15ZM8 13h8v-2H8v2Zm0 4h8v-2H8v2Z">Исполнительная документация</NavLink>
          <NavLink to="surveys" icon="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5Z">Исполнительные съемки</NavLink>
          <NavLink to="changes" icon="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-5 14H7v-2h7v2Zm3-4H7v-2h10v2Zm0-4H7V7h10v2Z">Изменения проекта</NavLink>
        </nav>

        <div className="navGroup">Производственная документация</div>
        <nav className="nav">
          <NavLink to="ks2" icon="M3 5h18v14H3V5Zm2 2v2h14V7H5Zm0 4v6h14v-6H5Z">КС-2</NavLink>
          <NavLink to="ks3" icon="M4 4h16v4H4V4Zm0 6h16v10H4V10Zm2 2v2h12v-2H6Z">КС-3</NavLink>
          <NavLink to="gpr" icon="M3 17h2v-7H3v7Zm4 0h2V7H7v10Zm4 0h2V4h-2v13Zm4 0h2V10h-2v7Zm4 0h2V6h-2v11Z">ГПР</NavLink>
          <NavLink to="ppr" icon="M6 2h9l5 5v15c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2Zm8 1.5V8h4.5L14 3.5ZM7 12h10v-2H7v2Zm0 4h10v-2H7v2Z">ППР</NavLink>
        </nav>

        <div className="navGroup">Закупки и договоры</div>
        <nav className="nav">
          <NavLink to="tenders" icon="M12 2 2 7l10 5 10-5-10-5Zm0 7L2 4v14l10 5 10-5V4l-10 5Z">Тендеры</NavLink>
          <NavLink to="contracts" icon="M6 2h12c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2Zm2 6h8V6H8v2Zm0 4h8v-2H8v2Zm0 4h6v-2H8v2Z">Договора</NavLink>
          <NavLink to="applications" icon="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-8 14H7v-2h4v2Zm6-4H7v-2h10v2Zm0-4H7V7h10v2Z">Заявки</NavLink>
        </nav>

        <div className="navGroup">Сметы и финансы</div>
        <nav className="nav">
          <NavLink to="estimates" icon="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-9 14H7v-2h3v2Zm7-4H7v-2h10v2Zm0-4H7V7h10v2Z">Сметы</NavLink>
          <NavLink to="validation" icon="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm-1 15-4-4 1.4-1.4L11 14.2l5.6-5.6L18 10l-7 7Z">Проверка смет</NavLink>
          <NavLink to="invoices" icon="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2Zm3 7h6V7H9v2Zm0 4h6v-2H9v2Z">Счета на оплату</NavLink>
          <NavLink to="receivables" icon="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm1 17h-2v-2h2v2Zm0-4h-2V7h2v7Z">Дебиторская задолженность</NavLink>
          <NavLink to="sales" icon="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2Zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2ZM7.17 14h9.66c.75 0 1.41-.41 1.75-1.03L21 6H6.21L5.27 4H2v2h2l3.6 7.59-1.35 2.44C5.52 17.37 6.48 19 8 19h12v-2H8l1.17-2Z">Отдел продаж</NavLink>
        </nav>

        <div className="navGroup">Материалы и учет</div>
        <nav className="nav">
          <NavLink to="materials" icon="M20 8h-3V4H7v4H4v12h16V8Zm-5 0H9V6h6v2Z">Материалы и склады</NavLink>
          <NavLink to="volumes" icon="M4 19h16v2H4v-2Zm2-2h3V7H6v10Zm5 0h3V3h-3v14Zm5 0h3V11h-3v6Z">Учет объемов работ</NavLink>
        </nav>

        <div className="navGroup">Справочники</div>
        <nav className="nav">
          <NavLink to="departments" icon="M4 21V3h16v18H4Zm2-2h12v-4H6v4Zm0-6h12V5H6v8Z">Подразделения</NavLink>
          <NavLink to="constructs" icon="M12 2 2 7l10 5 10-5-10-5Zm0 7L2 4v14l10 5 10-5V4l-10 5Z">Конструктивы</NavLink>
          <NavLink to="standardrates" icon="M3 17h18v2H3v-2Zm2-4h14v2H5v-2Zm0-4h14v2H5V9Zm0-4h14v2H5V5Z">Нормативные расценки</NavLink>
        </nav>

        <div className="navGroup">Администрирование</div>
        <nav className="nav">
          <NavLink to="users" icon="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h7v-2.5c0-2.33-4.67-3.5-7-3.5Z">Пользователи и роли</NavLink>
          <NavLink to="personnel" icon="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h7v-2.5c0-2.33-4.67-3.5-7-3.5Z">Кадры</NavLink>
          <NavLink to="workflow" icon="M10 17h4v-2h-4v2Zm-7 4h18v-2H3v2ZM3 3v2h18V3H3Zm0 6v2h18V9H3Z">Workflow заявок</NavLink>
          <NavLink to="docversions" icon="M12 8V4l8 8h-4v4l-8-8h4Z">Версии документов</NavLink>
          <NavLink to="integration1c" icon="M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.63-.05.94 0 .31.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.6.22l2.39-.96c.5.4 1.05.71 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z">Интеграция с 1С</NavLink>
        </nav>

        <button
          type="button"
          className="sidebarToggle"
          onClick={() => setSidebarCollapsed((c) => !c)}
          title={sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
          aria-label={sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          <svg className="ic" viewBox="0 0 24 24" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : undefined }}>
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
      </aside>

      <main className="main">
        {currentPage !== 'roadmap' && (
          <div className="topbar">
            <label className="burger" onClick={() => setNavOpen(true)} aria-label="Открыть меню">
              <svg className="ic" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2Zm0-5h18v-2H3v2Zm0-7v2h18V6H3Z" /></svg>
            </label>

            <div className="globalSearch" role="search">
              <svg className="ic" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.49 21.49 20 15.5 14Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z" /></svg>
              <input 
                type="text" 
                placeholder="Глобальный поиск (Ctrl+K)..." 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                     alert(`Поиск по запросу "${e.currentTarget.value}" в разработке`);
                  }
                }}
              />
            </div>

            <div className="pill">
              <span className="dot"></span> Статус: <b>Онлайн</b>
            </div>
            <div className="pill">Роль: <b>Инженер ПТО</b></div>
            <button className="btn small" onClick={toggleTheme} title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}>
              <svg className="ic" viewBox="0 0 24 24">
                {theme === 'dark' ? (
                  <path d="M12 9c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3zm0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
                ) : (
                  <path d="M12.34 2.02C6.59 1.82 2 6.42 2 12c0 5.52 4.48 10 10 10 3.71 0 6.93-2.02 8.66-5.02-7.51-.25-13.1-6.66-8.32-14.96z" />
                )}
              </svg>
              {theme === 'dark' ? 'Светлая' : 'Темная'}
            </button>
            <a className="btn small" href="#profile" onClick={(e) => { e.preventDefault(); handleNavClick('profile'); }} title="Профиль и доступы">
              <svg className="ic" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" /></svg>
              Кабинет
            </a>
          </div>
        )}

        <section className="pages">
           {/* <div className={`${currentPage === 'dashboard' ? 'active' : ''}`}> */}
          <div>
            {renderPage()}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
