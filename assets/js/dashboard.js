import { employees, isLate, tasksFor, timeLabel, todayAttendance } from './storage.js';
import { mountShell as mount, requireUser } from './layout.js';

const user = requireUser();
if (user) {
  mount(user);
  const attendance = todayAttendance(user.id);
  const ownTasks = tasksFor(user);
  const completed = ownTasks.filter((task) => task.state === 'Completada').length;
  const isAdmin = user.role === 'admin';
  document.querySelector('#dashboard-title').textContent = `Hola, ${user.name.split(' ')[0]}`;
  document.querySelector('#dashboard-subtitle').textContent = isAdmin ? 'Este es el estado de operación del equipo.' : 'Aquí tienes una vista de tu jornada.';
  const metrics = isAdmin ? [
    ['Equipo activo', employees().length, 'personas registradas'],
    ['Entradas hoy', new Set((JSON.parse(localStorage.getItem('control-laboral:data:v1'))?.attendance || []).filter((item) => new Date(item.entry).toDateString() === new Date().toDateString()).map((item) => item.employeeId)).size, 'marcaciones realizadas'],
    ['Tareas abiertas', ownTasks.filter((task) => task.state !== 'Completada').length, 'pendientes de seguimiento'],
    ['Entregas en revisión', ownTasks.filter((task) => task.state === 'Enviar a Revisión').length, 'requieren validación']
  ] : [
    ['Entrada', attendance ? timeLabel(attendance.entry) : 'Pendiente', attendance ? (isLate(attendance) ? 'registrada con tardanza' : 'a tiempo') : 'sin registro'],
    ['Salida', attendance?.exit ? timeLabel(attendance.exit) : 'Pendiente', attendance?.exit ? 'jornada cerrada' : 'aún no registrada'],
    ['Tareas activas', ownTasks.filter((task) => task.state !== 'Completada').length, 'para avanzar hoy'],
    ['Completadas', `${completed}/${ownTasks.length}`, 'avance total']
  ];
  document.querySelector('#dashboard-metrics').innerHTML = metrics.map(([label, value, detail]) => `<article class="metric-card"><p>${label}</p><strong>${value}</strong><small>${detail}</small></article>`).join('');
  document.querySelector('#attendance-summary').innerHTML = attendance ? `<div class="attendance-summary"><div><span class="status-dot ${attendance.exit ? 'done' : 'active'}"></span><strong>${attendance.exit ? 'Jornada finalizada' : 'Jornada en curso'}</strong><p>Entrada: ${timeLabel(attendance.entry)} · Salida: ${timeLabel(attendance.exit)}</p></div><span class="badge ${isLate(attendance) ? 'badge-danger' : 'badge-success'}">${isLate(attendance) ? 'Tardanza' : 'A tiempo'}</span></div>` : `<div class="empty-state"><strong>Aún no has marcado tu entrada.</strong><p>Regístrala para iniciar el seguimiento de tu jornada.</p></div>`;
  const displayTasks = ownTasks.filter((task) => task.state !== 'Completada').slice(0, 4);
  document.querySelector('#upcoming-tasks').innerHTML = displayTasks.length ? displayTasks.map((task) => `<div class="compact-item"><span class="priority-dot priority-${task.priority.toLowerCase()}"></span><div><strong>${task.project}</strong><p>${task.description}</p></div><span class="badge">${task.state}</span></div>`).join('') : '<div class="empty-state"><strong>Todo al día.</strong><p>No hay tareas pendientes.</p></div>';
}
