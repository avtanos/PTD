import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import './Dashboard.css';

interface Project {
  id: number;
  name: string;
  code?: string | null;
  status: string;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

interface RoadmapFile {
  id: number;
  file_name: string;
  project_id: number;
  project_name: string;
  section_name: string;
  uploaded_at: string;
}

interface PersonnelItem {
  id: number;
  full_name: string;
  position: string;
  status: string;
  is_active: boolean;
  department?: { name: string } | null;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsTotal, setProjectsTotal] = useState(0);
  const [roadmapFiles, setRoadmapFiles] = useState<RoadmapFile[]>([]);
  const [roadmapSections, setRoadmapSections] = useState<{ id: number; code: string; name: string }[]>([]);
  const [personnel, setPersonnel] = useState<PersonnelItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projRes, filesRes, sectionsRes, personRes] = await Promise.allSettled([
          axios.get(`${API_URL}/projects/`, { params: { limit: 100, skip: 0 } }),
          axios.get(`${API_URL}/document-roadmap/all-files`),
          axios.get(`${API_URL}/document-roadmap/sections/`),
          axios.get(`${API_URL}/personnel/`, { params: { limit: 500 } }),
        ]);

        if (projRes.status === 'fulfilled' && projRes.value?.data) {
          const d = projRes.value.data;
          const list = d.data && Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
          setProjects(list);
          setProjectsTotal(d.meta?.total ?? list.length);
        }

        if (filesRes.status === 'fulfilled' && Array.isArray(filesRes.value?.data)) {
          setRoadmapFiles(filesRes.value.data);
        }

        if (sectionsRes.status === 'fulfilled' && Array.isArray(sectionsRes.value?.data)) {
          setRoadmapSections(sectionsRes.value.data);
        }

        if (personRes.status === 'fulfilled' && Array.isArray(personRes.value?.data)) {
          setPersonnel(personRes.value.data);
        }
      } catch (e) {
        console.error('Ошибка загрузки дашборда:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeProjects = projects.filter((p) => p.is_active && (p.status === 'active' || !p.status));
  const employedCount = personnel.filter((p) => p.status === 'employed' || (p.is_active && !p.status)).length;
  const dismissedCount = personnel.filter((p) => p.status === 'dismissed').length;
  const uniqueProjectIds = roadmapFiles.length ? new Set(roadmapFiles.map((f) => f.project_id)).size : 0;
  const activePct = projects.length ? Math.round((activeProjects.length / projects.length) * 100) : 0;
  const employedPct = personnel.length ? Math.round((employedCount / personnel.length) * 100) : 0;
  const docsPerProject = uniqueProjectIds ? Math.round(roadmapFiles.length / uniqueProjectIds) : 0;

  if (loading && projects.length === 0 && personnel.length === 0) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="dashboardPage">
      <div className="pageHead">
        <div>
          <div className="crumbs">
            <a href="#dashboard">Главная</a> <span className="sep">/</span>
            <span>Дашборд</span>
          </div>
          <div className="h1">Дашборд</div>
          <p className="h2">Сводка по модулям: Проекты • Дорожная карта документов • Учёт кадров</p>
        </div>
      </div>

      {/* 1. Проекты */}
      <section className="dashboardSection dashboardModuleSection">
        <div className="dashboardSectionHead">
          <h2 className="dashboardSectionTitle">Проекты</h2>
          <a href="#projects" className="dashboardModuleLink">Перейти в раздел →</a>
        </div>
        <div className="dashboardKpiGrid">
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Всего проектов</div>
            <div className="dashboardKpiCardValue">{projectsTotal || projects.length}</div>
          </div>
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Активных</div>
            <div className="dashboardKpiCardValue">{activeProjects.length}</div>
            <div className="dashboardKpiTags">
              <span className="dashboardKpiTag ok">в работе</span>
            </div>
          </div>
          <div className="dashboardKpiCard dashboardKpiCardWithBar">
            <div className="dashboardKpiCardTitle">Доля активных</div>
            <div className="dashboardKpiCardValue dashboardKpiCardValueSmall">{activePct}%</div>
            <div className="dashboardEffectBar">
              <div className="dashboardEffectBarFill ok" style={{ width: `${activePct}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Дорожная карта */}
      <section className="dashboardSection dashboardModuleSection">
        <div className="dashboardSectionHead">
          <h2 className="dashboardSectionTitle">Дорожная карта документов</h2>
          <a href="#roadmap" className="dashboardModuleLink">Перейти в раздел →</a>
        </div>
        <div className="dashboardKpiGrid">
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Документов загружено</div>
            <div className="dashboardKpiCardValue">{roadmapFiles.length}</div>
          </div>
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Проектов с документами</div>
            <div className="dashboardKpiCardValue">{uniqueProjectIds || 0}</div>
          </div>
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Блоков дорожной карты</div>
            <div className="dashboardKpiCardValue">{roadmapSections.length}</div>
          </div>
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Документов на проект</div>
            <div className="dashboardKpiCardValue">{docsPerProject}</div>
            <div className="dashboardKpiTags">
              <span className="dashboardKpiTag info">среднее</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Учёт кадров */}
      <section className="dashboardSection dashboardModuleSection">
        <div className="dashboardSectionHead">
          <h2 className="dashboardSectionTitle">Учёт кадров</h2>
          <a href="#personnel" className="dashboardModuleLink">Перейти в раздел →</a>
        </div>
        <div className="dashboardKpiGrid">
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Всего сотрудников</div>
            <div className="dashboardKpiCardValue">{personnel.length}</div>
          </div>
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">В штате</div>
            <div className="dashboardKpiCardValue">{employedCount}</div>
            <div className="dashboardKpiTags">
              <span className="dashboardKpiTag ok">активны</span>
            </div>
          </div>
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Уволено</div>
            <div className="dashboardKpiCardValue">{dismissedCount}</div>
            {dismissedCount > 0 && (
              <div className="dashboardKpiTags">
                <span className="dashboardKpiTag info">в архиве</span>
              </div>
            )}
          </div>
          <div className="dashboardKpiCard dashboardKpiCardWithBar">
            <div className="dashboardKpiCardTitle">Доля в штате</div>
            <div className="dashboardKpiCardValue dashboardKpiCardValueSmall">{employedPct}%</div>
            <div className="dashboardEffectBar">
              <div className="dashboardEffectBarFill ok" style={{ width: `${employedPct}%` }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
