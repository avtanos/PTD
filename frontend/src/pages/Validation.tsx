import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrencySimple } from '../utils/currency';
import './Pages.css';

interface Project {
  id: number;
  name: string;
}

interface Estimate {
  id: number;
  number: string;
  name: string;
  project_id: number;
  total_amount: number;
}

interface VolumeMatch {
  id: number;
  work_name: string;
  project_volume: number;
  estimated_volume: number;
  actual_volume: number;
  deviation_estimate: number;
  deviation_percentage: number;
  status: string;
}

interface EstimateValidation {
  id: number;
  validation_type: string;
  rule: string;
  status: string;
  description: string;
  deviation_percentage: number;
  is_critical: boolean;
}

const Validation: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [selectedEstimate, setSelectedEstimate] = useState<number | ''>('');
  const [volumeMatches, setVolumeMatches] = useState<VolumeMatch[]>([]);
  const [validations, setValidations] = useState<EstimateValidation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'volumes' | 'rules'>('volumes');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchEstimates(Number(selectedProject));
    } else {
      setEstimates([]);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedEstimate) {
      fetchValidationData(Number(selectedEstimate));
    }
  }, [selectedEstimate]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects/`).catch(() => ({ data: [] }));
      let projectsData: Project[] = [];
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        projectsData = res.data.data;
      } else if (Array.isArray(res.data)) {
        projectsData = res.data;
      }
      
      // Если проекты не загрузились, используем мок-данные
      if (projectsData.length === 0) {
        projectsData = [
          { id: 1, name: 'Строительство детского сада' },
          { id: 2, name: 'Установка систем видеонаблюдения' },
          { id: 3, name: 'Реконструкция системы отопления' },
          { id: 4, name: 'Строительство автостоянки' },
          { id: 5, name: 'Геодезическая съемка участка' },
          { id: 6, name: 'Монтаж лифтового оборудования' },
        ];
      }
      
      setProjects(projectsData);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
      // Используем мок-данные при ошибке
      setProjects([
        { id: 1, name: 'Строительство детского сада' },
        { id: 2, name: 'Установка систем видеонаблюдения' },
        { id: 3, name: 'Реконструкция системы отопления' },
        { id: 4, name: 'Строительство автостоянки' },
        { id: 5, name: 'Геодезическая съемка участка' },
        { id: 6, name: 'Монтаж лифтового оборудования' },
      ]);
    }
  };

  const fetchEstimates = async (projectId: number) => {
    try {
      const res = await axios.get(`${API_URL}/estimates/`, { params: { project_id: projectId } }).catch(() => ({ data: [] }));
      setEstimates(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Ошибка загрузки смет:', error);
    }
  };

  const fetchValidationData = async (estimateId: number) => {
    setLoading(true);
    try {
      // В реальном приложении здесь были бы вызовы к API валидации
      // Сейчас мы используем заглушки или пустые массивы, если API еще не вернул данные
      const [volRes, valRes] = await Promise.all([
        axios.post(`${API_URL}/validation/estimates/${estimateId}/validate-volume`).catch(() => ({ data: [] })), // Это может вернуть один объект или ошибку, если нет данных
        axios.get(`${API_URL}/validation/estimates/${estimateId}/validations`).catch(() => ({ data: [] })),
      ]);
      
      // Обработка ответа валидации объемов (может быть массив или один объект)
      const volData = volRes.data;
      setVolumeMatches(Array.isArray(volData) ? volData : (volData ? [volData] : []));
      
      setValidations(Array.isArray(valRes.data) ? valRes.data : []);
    } catch (error) {
      console.error('Ошибка загрузки данных валидации:', error);
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    if (!selectedEstimate) return;
    setLoading(true);
    try {
      // Запуск проверки объемов
      await axios.post(`${API_URL}/validation/estimates/${selectedEstimate}/validate-volume`);
      // Обновление данных
      fetchValidationData(Number(selectedEstimate));
    } catch (error) {
      console.error('Ошибка запуска проверки:', error);
      alert('Ошибка при запуске проверки (возможно, отсутствуют данные для сравнения)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Проверка смет</span></div>
          <div className="h1">Проверка смет</div>
          <p className="h2">Автоматическая проверка объемов • соответствие проекту • контроль стоимости.</p>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <div className="title">Параметры проверки</div>
          </div>
          <div className="cardBody">
            <div className="toolbar">
              <div className="filters">
                <div className="field">
                  <label>Проект</label>
                  <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">Выберите проект</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Смета</label>
                  <select value={selectedEstimate} onChange={(e) => setSelectedEstimate(e.target.value ? Number(e.target.value) : '')} disabled={!selectedProject}>
                    <option value="">Выберите смету</option>
                    {estimates.map(e => <option key={e.id} value={e.id}>{e.number} - {e.name}</option>)}
                  </select>
                </div>
                <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button className="btn primary" onClick={runValidation} disabled={!selectedEstimate || loading}>
                    {loading ? 'Проверка...' : 'Запустить проверку'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedEstimate && (
          <div className="card">
            <div className="cardHead">
              <div className="title">Результаты проверки</div>
            </div>
            <div className="cardBody">
              <div className="tabs">
                <div className={`tab ${activeTab === 'volumes' ? 'active' : ''}`} onClick={() => setActiveTab('volumes')}>Объемы работ</div>
                <div className={`tab ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>Правила валидации</div>
              </div>

              {activeTab === 'volumes' && (
                <table style={{ marginTop: '15px' }}>
                  <thead>
                    <tr>
                      <th>Наименование работ</th>
                      <th className="tRight">По проекту</th>
                      <th className="tRight">В смете</th>
                      <th className="tRight">Отклонение</th>
                      <th className="tRight">%</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volumeMatches.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>Нет данных о расхождениях</td></tr>
                    ) : (
                      volumeMatches.map((m) => (
                        <tr key={m.id}>
                          <td>{m.work_name}</td>
                          <td className="tRight">{m.project_volume}</td>
                          <td className="tRight">{m.estimated_volume}</td>
                          <td className="tRight" style={{ color: m.deviation_estimate > 0 ? 'var(--danger)' : 'inherit' }}>
                            {m.deviation_estimate > 0 ? '+' : ''}{m.deviation_estimate}
                          </td>
                          <td className="tRight">{m.deviation_percentage ? Number(m.deviation_percentage).toFixed(1) : 0}%</td>
                          <td>
                            <span className={`chip ${Math.abs(m.deviation_percentage) > 5 ? 'danger' : 'ok'}`}>
                              {Math.abs(m.deviation_percentage) > 5 ? 'Отклонение' : 'Норма'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'rules' && (
                <table style={{ marginTop: '15px' }}>
                  <thead>
                    <tr>
                      <th>Правило</th>
                      <th>Описание</th>
                      <th>Статус</th>
                      <th>Критичность</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validations.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px' }}>Проверки не выполнялись</td></tr>
                    ) : (
                      validations.map((v) => (
                        <tr key={v.id}>
                          <td>{v.rule}</td>
                          <td>{v.description}</td>
                          <td>
                            <span className={`chip ${v.status === 'passed' ? 'ok' : v.status === 'failed' ? 'danger' : 'warn'}`}>
                              {v.status}
                            </span>
                          </td>
                          <td>{v.is_critical ? 'Да' : 'Нет'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Validation;
