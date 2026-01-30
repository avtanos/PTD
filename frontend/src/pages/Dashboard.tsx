import React, { useState } from 'react';
import './Dashboard.css';

// Мок-данные для очереди задач ПТО
const MOCK_TASKS = [
  { id: 1, type: 'Заявка', object: 'ЖК "Ала-Тоо" — бетон, арматура (склад №1)', deadline: 'Сегодня', status: 'На согласовании', statusClass: 'warn', action: 'Открыть' },
  { id: 2, type: 'Смета', object: 'Цех — земляные работы (локальная смета)', deadline: '+2 дня', status: 'На проверке', statusClass: 'warn', action: 'Проверить' },
  { id: 3, type: 'Договор', object: 'Подрядчик "СтройЛидер" — монтаж металлоконструкций', deadline: '+5 дней', status: 'Draft', statusClass: 'info', action: 'Открыть' },
  { id: 4, type: 'Счет', object: 'КС-3 №12 — счет на оплату (НДС)', deadline: 'Просрочено', status: 'Не оплачено', statusClass: 'danger', action: 'Контроль' },
  { id: 5, type: 'Заявка', object: 'Офисный центр — материалы для отделки', deadline: '+1 день', status: 'На согласовании', statusClass: 'warn', action: 'Открыть' },
  { id: 6, type: 'Смета', object: 'Реконструкция моста — локальная смета', deadline: '+3 дня', status: 'На проверке', statusClass: 'warn', action: 'Проверить' },
];

const PAGE_SIZE = 4;
const TOTAL_ENTRIES = 18;

const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(TOTAL_ENTRIES / PAGE_SIZE);
  const displayedTasks = MOCK_TASKS.slice(0, PAGE_SIZE);

  return (
    <div className="dashboardPage">
      <div className="pageHead">
        <div>
          <div className="crumbs">
            <a href="#dashboard">Главная</a> <span className="sep">/</span>
            <span>Дашборд</span>
          </div>
          <div className="h1">Дашборд</div>
        </div>
      </div>

      {/* 1. Ключевые показатели */}
      <section className="dashboardSection">
        <div className="dashboardSectionHead">
          <h2 className="dashboardSectionTitle">Ключевые показатели</h2>
        </div>
        <div className="dashboardKpiGrid">
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Заявки</div>
            <div className="dashboardKpiCardValue">38</div>
            <div className="dashboardKpiTags">
              <span className="dashboardKpiTag warn">12 на согласовании</span>
              <span className="dashboardKpiTag danger">5 просрочено</span>
            </div>
          </div>
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Договора</div>
            <div className="dashboardKpiCardValue">14</div>
            <div className="dashboardKpiTags">
              <span className="dashboardKpiTag info">3 требуют продления</span>
            </div>
          </div>
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Сметы</div>
            <div className="dashboardKpiCardValue">27</div>
            <div className="dashboardKpiTags">
              <span className="dashboardKpiTag warn">6 на проверке</span>
            </div>
          </div>
          <div className="dashboardKpiCard">
            <div className="dashboardKpiCardTitle">Материалы / остатки</div>
            <div className="dashboardKpiCardValue">1284</div>
            <div className="dashboardKpiTags">
              <span className="dashboardKpiTag danger">18 дефицит</span>
              <span className="dashboardKpiTag ok">в норме 92%</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Эффективность реализации проектов */}
      <section className="dashboardSection">
        <div className="dashboardSectionHead">
          <h2 className="dashboardSectionTitle">Эффективность реализации проектов</h2>
        </div>
        <div className="dashboardEffectivenessGrid">
          <div className="dashboardEffectCard">
            <div className="dashboardEffectValue blue">78%</div>
            <div className="dashboardEffectLabel">Факт / План расходов</div>
            <div className="dashboardEffectBar">
              <div className="dashboardEffectBarFill blue" style={{ width: '78%' }} />
            </div>
            <div className="dashboardEffectDesc">Соотношение факт. расходов к плановым</div>
          </div>
          <div className="dashboardEffectCard">
            <div className="dashboardEffectValue green">92%</div>
            <div className="dashboardEffectLabel">Задачи в срок</div>
            <div className="dashboardEffectBar">
              <div className="dashboardEffectBarFill green" style={{ width: '92%' }} />
            </div>
            <div className="dashboardEffectDesc">Процент задач, выполненных в срок</div>
          </div>
          <div className="dashboardEffectCard">
            <div className="dashboardEffectValue orange">45%</div>
            <div className="dashboardEffectLabel">Закрытые акты (КС-2/3)</div>
            <div className="dashboardEffectBar">
              <div className="dashboardEffectBarFill orange" style={{ width: '45%' }} />
            </div>
            <div className="dashboardEffectDesc">% закрытых актов от общего объема</div>
          </div>
        </div>
      </section>

      {/* 3. Очередь задач ПТО */}
      <section className="dashboardSection">
        <div className="dashboardSectionHead">
          <h2 className="dashboardSectionTitle">Очередь задач ПТО</h2>
          <button type="button" className="dashboardFocusBtn">Фокус недели</button>
        </div>
        <div className="dashboardTaskCard">
          <table className="dashboardTaskTable">
            <thead>
              <tr>
                <th>Тип</th>
                <th>Объект / проект</th>
                <th>Срок</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {displayedTasks.map((task) => (
                <tr key={task.id}>
                  <td><span className="typeBadge">{task.type}</span></td>
                  <td>{task.object}</td>
                  <td>{task.deadline}</td>
                  <td><span className={`statusBadge ${task.statusClass}`}>{task.status}</span></td>
                  <td><span className="actionLink">{task.action}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dashboardTaskFooter">
            <span className="dashboardTaskCount">Показано {PAGE_SIZE} из {TOTAL_ENTRIES} записей</span>
            <div className="dashboardPagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={currentPage === p ? 'active' : ''}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Далее
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
