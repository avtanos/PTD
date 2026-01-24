import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleNav = (page: string) => {
    navigate(`#${page}`, { replace: true });
    window.location.hash = `#${page}`;
    window.location.reload();
  };

  return (
    <>
      <div className="pageHead">
        <div>
          <div className="crumbs">
            <a href="#dashboard" onClick={(e) => { e.preventDefault(); handleNav('dashboard'); }}>Главная</a> <span className="sep">/</span>
            <span>Дашборд</span>
          </div>
          <div className="h1">Дашборд управления строительством</div>
          <p className="h2">Сводка по заявкам, договорам, сметам, ТМЦ, КС-2/КС-3, дебиторке и контролю.</p>
        </div>
        <div className="actions">
          <a className="btn small" href="#applications" onClick={(e) => { e.preventDefault(); handleNav('applications'); }}>Открыть заявки</a>
          <a className="btn primary small" href="#estimates" onClick={(e) => { e.preventDefault(); handleNav('estimates'); }}>Создать смету</a>
        </div>
      </div>

      <div className="card">
        <div className="cardHead">
          <div>
            <div className="title">Ключевые показатели</div>
          </div>
          <span className="chip info">Общее соответствие ~35%</span>
        </div>
        <div className="cardBody">
          <div className="kpi">
            <div className="kpiItem">
              <div className="k">Заявки</div>
              <div className="v">38</div>
              <div className="s"><span className="chip warn">12 на согласовании</span> <span className="chip danger">5 просрочено</span></div>
            </div>
            <div className="kpiItem">
              <div className="k">Договора</div>
              <div className="v">14</div>
              <div className="s"><span className="chip info">3 требуют продления</span></div>
            </div>
            <div className="kpiItem">
              <div className="k">Сметы</div>
              <div className="v">27</div>
              <div className="s"><span className="chip warn">6 на проверке</span></div>
            </div>
            <div className="kpiItem">
              <div className="k">Материалы / остатки</div>
              <div className="v">1 284</div>
              <div className="s"><span className="chip danger">18 дефицит</span> <span className="chip ok">в норме 92%</span></div>
            </div>
          </div>

          <div style={{ height: '24px' }}></div>

          <div className="title" style={{ fontSize: '16px', marginBottom: '12px' }}>Эффективность реализации проектов</div>
          <div className="kpi">
            <div className="kpiItem">
              <div className="k">Выполнение бюджета</div>
              <div className="v">78%</div>
              <div className="s" style={{ marginBottom: '8px' }}>Факт / План расходов</div>
              <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '78%', height: '100%', background: 'var(--accent)', borderRadius: '3px' }}></div>
              </div>
              <div className="mini" style={{ marginTop: '6px', fontSize: '11px' }}>Соотношение факт. расходов к плановым</div>
            </div>
            <div className="kpiItem">
              <div className="k">Соблюдение графиков</div>
              <div className="v">92%</div>
              <div className="s" style={{ marginBottom: '8px' }}>Задачи в срок</div>
              <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '92%', height: '100%', background: 'var(--ok)', borderRadius: '3px' }}></div>
              </div>
              <div className="mini" style={{ marginTop: '6px', fontSize: '11px' }}>Процент задач, выполненных в срок</div>
            </div>
            <div className="kpiItem">
              <div className="k">Готовность документации</div>
              <div className="v">45%</div>
              <div className="s" style={{ marginBottom: '8px' }}>Закрытые акты (КС-2/3)</div>
              <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '45%', height: '100%', background: 'var(--warn)', borderRadius: '3px' }}></div>
              </div>
              <div className="mini" style={{ marginTop: '6px', fontSize: '11px' }}>% закрытых актов от общего объема</div>
            </div>
          </div>

          <div style={{ height: '24px' }}></div>

          <div className="grid">
            <div className="card">
              <div className="cardHead">
                <div>
                  <div className="title">Очередь задач ПТО</div>
                </div>
                <span className="chip warn">Фокус недели</span>
              </div>
              <div className="cardBody">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '16%' }}>Тип</th>
                      <th>Объект / проект</th>
                      <th style={{ width: '18%' }}>Срок</th>
                      <th style={{ width: '18%' }}>Статус</th>
                      <th style={{ width: '10%' }} className="tRight">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="chip info">Заявка</span></td>
                      <td>ЖК "Ала-Тоо" — бетон, арматура (склад №1)</td>
                      <td>Сегодня</td>
                      <td><span className="chip warn">На согласовании</span></td>
                      <td className="tRight"><a className="btn small" href="#applications" onClick={(e) => { e.preventDefault(); handleNav('applications'); }}>Открыть</a></td>
                    </tr>
                    <tr>
                      <td><span className="chip info">Смета</span></td>
                      <td>Цех — земляные работы (локальная смета)</td>
                      <td>+2 дня</td>
                      <td><span className="chip warn">На проверке</span></td>
                      <td className="tRight"><a className="btn small" href="#validation" onClick={(e) => { e.preventDefault(); handleNav('validation'); }}>Проверить</a></td>
                    </tr>
                    <tr>
                      <td><span className="chip info">Договор</span></td>
                      <td>Подрядчик "СтройЛидер" — монтаж металлоконструкций</td>
                      <td>+5 дней</td>
                      <td><span className="chip info">Draft</span></td>
                      <td className="tRight"><a className="btn small" href="#contracts" onClick={(e) => { e.preventDefault(); handleNav('contracts'); }}>Открыть</a></td>
                    </tr>
                    <tr>
                      <td><span className="chip info">Счет</span></td>
                      <td>КС-3 №12 — счет на оплату (НДС)</td>
                      <td>Просрочено</td>
                      <td><span className="chip danger">Не оплачено</span></td>
                      <td className="tRight"><a className="btn small" href="#invoices" onClick={(e) => { e.preventDefault(); handleNav('invoices'); }}>Контроль</a></td>
                    </tr>
                  </tbody>
                </table>
                <div className="tableFooter">
                  <span>Показано 4 из 18 записей</span>
                  <div className="pager">
                    <button className="btn small" type="button">Назад</button>
                    <button className="btn small" type="button">1</button>
                    <button className="btn small" type="button">2</button>
                    <button className="btn small" type="button">Далее</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
