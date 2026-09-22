import { attendanceFor, dateLabel, employees, isLate, tasksFor, timeLabel } from './storage.js';
import { mountShell, requireUser } from './layout.js';

const user = requireUser({ admin: true });
if (user) {
  mountShell(user);
  const select = document.querySelector('#report-employee');
  select.innerHTML = employees().map((employee) => `<option value="${employee.id}">${employee.name}</option>`).join('');
  const render = () => {
    const employee = employees().find((item) => item.id === select.value); if (!employee) return;
    const records = attendanceFor(employee.id); const tasks = tasksFor(user).filter((task) => task.employeeId === employee.id); const onTime = records.filter((record) => !isLate(record)).length; const complete = tasks.filter((task) => task.state === 'Completada').length; const efficiency = tasks.length ? Math.round((complete / tasks.length) * 100) : 0;
    document.querySelector('#report-metrics').innerHTML = [['Asistencias', records.length, 'registros históricos'], ['A tiempo', onTime, 'llegadas sin tardanza'], ['Tareas completadas', `${complete}/${tasks.length}`, 'actividades asignadas'], ['Eficiencia', `${efficiency}%`, 'avance de tareas']].map(([label, value, detail]) => `<article class="metric-card"><p>${label}</p><strong>${value}</strong><small>${detail}</small></article>`).join('');
    document.querySelector('#report-attendance').innerHTML = records.slice(0, 6).map((record) => `<tr><td>${dateLabel(record.entry)}</td><td>${timeLabel(record.entry)}</td><td><span class="badge ${isLate(record) ? 'badge-danger' : 'badge-success'}">${isLate(record) ? 'Tardanza' : 'A tiempo'}</span></td></tr>`).join('') || '<tr><td colspan="3" class="table-empty">Sin registros.</td></tr>';
    const states = ['Asignada', 'En Progreso', 'Enviar a Revisión', 'Completada', 'Bloqueada'];
    document.querySelector('#report-states').innerHTML = states.map((state) => { const amount = tasks.filter((task) => task.state === state).length; const percent = tasks.length ? Math.round(amount / tasks.length * 100) : 0; return `<div class="state-row"><div><strong>${state}</strong><span>${amount} tareas</span></div><div class="progress-track"><i style="width:${percent}%"></i></div></div>`; }).join('');
  };
  select.addEventListener('change', render); render();
}
