import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatCurrencySimple } from '../utils/currency';
import './Pages.css';

interface WorkVolume {
  id: number;
  project_id: number;
  construct_id?: number;
  work_code?: string;
  work_name: string;
  unit: string;
  planned_volume: number;
  actual_volume: number;
  completed_percentage: number;
  estimated_price?: number;
  planned_amount?: number;
  actual_amount?: number;
  status: string;
  start_date?: string;
  end_date?: string;
  entries?: WorkVolumeEntry[];
}

interface WorkVolumeEntry {
  id: number;
  work_volume_id: number;
  entry_date: string;
  actual_volume: number;
  location?: string;
  entered_by?: string;
  notes?: string;
}

interface Project {
  id: number;
  name: string;
}

const WorkVolumes: React.FC = () => {
  const [volumes, setVolumes] = useState<WorkVolume[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingVolume, setEditingVolume] = useState<WorkVolume | null>(null);
  const [selectedVolumeForEntry, setSelectedVolumeForEntry] = useState<WorkVolume | null>(null);

  const [volumeForm, setVolumeForm] = useState({
    project_id: '' as number | '',
    work_name: '',
    work_code: '',
    unit: 'м3',
    planned_volume: '',
    estimated_price: '',
    start_date: '',
    end_date: ''
  });

  const [entryForm, setEntryForm] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    actual_volume: '',
    location: '',
    entered_by: '',
    notes: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchVolumes(Number(selectedProject));
    } else {
      setVolumes([]);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects/`).catch(() => ({ data: [] }));
      setProjects(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    }
  };

  const fetchVolumes = async (projectId: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/work-volumes/`, { params: { project_id: projectId } });
      setVolumes(res.data);
    } catch (error) {
      console.error('Ошибка загрузки объемов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVolumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...volumeForm,
        project_id: Number(volumeForm.project_id),
        planned_volume: Number(volumeForm.planned_volume),
        estimated_price: volumeForm.estimated_price ? Number(volumeForm.estimated_price) : undefined
      };

      if (editingVolume) {
        await axios.put(`${API_URL}/work-volumes/${editingVolume.id}`, data);
      } else {
        await axios.post(`${API_URL}/work-volumes/`, data);
      }
      setShowModal(false);
      if (selectedProject) fetchVolumes(Number(selectedProject));
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка при сохранении');
    }
  };

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVolumeForEntry) return;

    try {
      const data = {
        ...entryForm,
        actual_volume: Number(entryForm.actual_volume)
      };
      
      await axios.post(`${API_URL}/work-volumes/${selectedVolumeForEntry.id}/entries`, data);
      setShowEntryModal(false);
      if (selectedProject) fetchVolumes(Number(selectedProject));
    } catch (error) {
      console.error('Ошибка сохранения факта:', error);
      alert('Ошибка при сохранении');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены?')) return;
    try {
      await axios.delete(`${API_URL}/work-volumes/${id}`);
      if (selectedProject) fetchVolumes(Number(selectedProject));
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'suspended': return 'warn';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
     switch (status) {
      case 'completed': return 'Завершен';
      case 'in_progress': return 'В работе';
      case 'suspended': return 'Приостановлен';
      case 'planned': return 'Запланирован';
      default: return status;
    }
  };

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs"><a href="#dashboard">Главная</a> <span className="sep">/</span> <span>Учет объемов работ</span></div>
          <div className="h1">Учет объемов работ</div>
          <p className="h2">Ведомость объемов работ • фактическое выполнение • план/факт анализ.</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => { 
            setEditingVolume(null); 
            setVolumeForm({ project_id: selectedProject || '', work_name: '', work_code: '', unit: 'м3', planned_volume: '', estimated_price: '', start_date: '', end_date: '' }); 
            setShowModal(true); 
          }} disabled={!selectedProject}>+ Добавить работу</button>
        </div>
      </div>

      <div className="card">
        <div className="cardHead">
          <div className="title">Параметры отображения</div>
        </div>
        <div className="cardBody">
          <div className="toolbar">
             <div className="field" style={{ width: '300px' }}>
                <label>Проект</label>
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Выберите проект</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="cardBody">
           {!selectedProject ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Выберите проект для просмотра объемов работ</div>
           ) : loading ? (
              <div className="loading">Загрузка...</div>
           ) : volumes.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Нет данных об объемах работ</div>
           ) : (
             <table>
               <thead>
                 <tr>
                   <th style={{ width: '10%' }}>Код</th>
                   <th>Наименование работ</th>
                   <th style={{ width: '8%' }}>Ед.</th>
                   <th className="tRight" style={{ width: '12%' }}>План</th>
                   <th className="tRight" style={{ width: '12%' }}>Факт</th>
                   <th className="tRight" style={{ width: '10%' }}>%</th>
                   <th className="tRight" style={{ width: '12%' }}>Остаток</th>
                   <th style={{ width: '10%' }}>Статус</th>
                   <th className="tRight" style={{ width: '15%' }}>Действия</th>
                 </tr>
               </thead>
               <tbody>
                 {volumes.map(v => (
                   <tr key={v.id}>
                     <td>{v.work_code || '—'}</td>
                     <td>
                        <div style={{ fontWeight: 500 }}>{v.work_name}</div>
                        {v.estimated_price && <div className="mini muted">Цена: {formatCurrencySimple(v.estimated_price)}</div>}
                     </td>
                     <td>{v.unit}</td>
                     <td className="tRight"><b>{v.planned_volume}</b></td>
                     <td className="tRight">{v.actual_volume}</td>
                     <td className="tRight">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <div className="progress-bar-mini" style={{ width: '40px' }}>
                            <div className="fill" style={{ width: `${Math.min(Number(v.completed_percentage || 0), 100)}%` }}></div>
                          </div>
                          {Number(v.completed_percentage || 0).toFixed(0)}%
                        </div>
                     </td>
                     <td className="tRight">{Math.max(0, v.planned_volume - v.actual_volume).toFixed(3)}</td>
                     <td><span className={`chip ${getStatusColor(v.status)}`}>{getStatusLabel(v.status)}</span></td>
                     <td className="tRight">
                       <button className="btn small primary" onClick={() => { setSelectedVolumeForEntry(v); setEntryForm({ ...entryForm, actual_volume: '' }); setShowEntryModal(true); }} title="Внести факт">Факт</button>
                       <button className="btn small" onClick={() => { setEditingVolume(v); setVolumeForm({ project_id: v.project_id, work_name: v.work_name, work_code: v.work_code || '', unit: v.unit || 'м3', planned_volume: v.planned_volume.toString(), estimated_price: v.estimated_price?.toString() || '', start_date: v.start_date || '', end_date: v.end_date || '' }); setShowModal(true); }}>✎</button>
                       <button className="btn small danger" onClick={() => handleDelete(v.id)}>✕</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">{editingVolume ? 'Редактирование' : 'Создание'} работы</div>
              <button className="btn ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <form onSubmit={handleVolumeSubmit}>
                <div className="field">
                   <label>Проект</label>
                   <select value={volumeForm.project_id} onChange={(e) => setVolumeForm({ ...volumeForm, project_id: Number(e.target.value) })} disabled={!!editingVolume} required>
                      <option value="">Выберите проект</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                   <label>Код работы</label>
                   <input type="text" value={volumeForm.work_code} onChange={(e) => setVolumeForm({ ...volumeForm, work_code: e.target.value })} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                   <label>Наименование работ *</label>
                   <input type="text" value={volumeForm.work_name} onChange={(e) => setVolumeForm({ ...volumeForm, work_name: e.target.value })} required />
                </div>
                <div style={{ height: '10px' }} />
                <div className="grid col-2 gap-10">
                    <div className="field">
                       <label>Ед. изм. *</label>
                       <input type="text" value={volumeForm.unit} onChange={(e) => setVolumeForm({ ...volumeForm, unit: e.target.value })} required />
                    </div>
                    <div className="field">
                       <label>Плановый объем *</label>
                       <input type="number" step="0.001" value={volumeForm.planned_volume} onChange={(e) => setVolumeForm({ ...volumeForm, planned_volume: e.target.value })} required />
                    </div>
                </div>
                <div style={{ height: '10px' }} />
                <div className="field">
                   <label>Расценка (за ед.)</label>
                   <input type="number" step="0.01" value={volumeForm.estimated_price} onChange={(e) => setVolumeForm({ ...volumeForm, estimated_price: e.target.value })} />
                </div>
                <div style={{ height: '10px' }} />
                <div className="grid col-2 gap-10">
                    <div className="field">
                       <label>Дата начала</label>
                       <input type="date" value={volumeForm.start_date} onChange={(e) => setVolumeForm({ ...volumeForm, start_date: e.target.value })} />
                    </div>
                    <div className="field">
                       <label>Дата окончания</label>
                       <input type="date" value={volumeForm.end_date} onChange={(e) => setVolumeForm({ ...volumeForm, end_date: e.target.value })} />
                    </div>
                </div>
                <div style={{ height: '20px' }} />
                <div className="actions">
                  <button type="submit" className="btn primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => setShowModal(false)}>Отмена</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEntryModal && selectedVolumeForEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '20px 0' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHead">
              <div className="title">Внести выполнение</div>
              <button className="btn ghost" onClick={() => setShowEntryModal(false)}>✕</button>
            </div>
            <div className="cardBody">
              <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                 <div style={{ fontWeight: 600 }}>{selectedVolumeForEntry.work_name}</div>
                 <div className="mini muted" style={{ marginTop: '5px' }}>
                    План: {selectedVolumeForEntry.planned_volume} {selectedVolumeForEntry.unit} • 
                    Факт: {selectedVolumeForEntry.actual_volume} {selectedVolumeForEntry.unit} • 
                    Остаток: {(selectedVolumeForEntry.planned_volume - selectedVolumeForEntry.actual_volume).toFixed(3)} {selectedVolumeForEntry.unit}
                 </div>
              </div>
              <form onSubmit={handleEntrySubmit}>
                 <div className="field">
                    <label>Дата выполнения *</label>
                    <input type="date" value={entryForm.entry_date} onChange={(e) => setEntryForm({ ...entryForm, entry_date: e.target.value })} required />
                 </div>
                 <div style={{ height: '10px' }} />
                 <div className="field">
                    <label>Выполненный объем *</label>
                    <input type="number" step="0.001" value={entryForm.actual_volume} onChange={(e) => setEntryForm({ ...entryForm, actual_volume: e.target.value })} required />
                 </div>
                 <div style={{ height: '10px' }} />
                 <div className="field">
                    <label>Участок / Локация</label>
                    <input type="text" value={entryForm.location} onChange={(e) => setEntryForm({ ...entryForm, location: e.target.value })} />
                 </div>
                 <div style={{ height: '10px' }} />
                 <div className="field">
                    <label>Ответственный</label>
                    <input type="text" value={entryForm.entered_by} onChange={(e) => setEntryForm({ ...entryForm, entered_by: e.target.value })} />
                 </div>
                 <div style={{ height: '20px' }} />
                 <div className="actions">
                    <button type="submit" className="btn primary">Сохранить</button>
                    <button type="button" className="btn" onClick={() => setShowEntryModal(false)}>Отмена</button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkVolumes;