import { createTask, dateLabel, employees, escapeHtml, getEmployee, tasksFor, timeLabel, updateTask } from './storage.js';
import { mountShell as mount, requireUser } from './layout.js';

const user = requireUser();
if (user) {
  mount(user);
  const dialog = document.querySelector('#task-dialog'); const form = document.querySelector('#task-form'); let activeFilter = 'all';
  const assigneeField = document.querySelector('#assignee-field'); const assignee = document.querySelector('#task-assignee');
  assignee.innerHTML = employees().map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join('');
  if (user.role !== 'admin') { assigneeField.hidden = true; document.querySelector('#tasks-title').textContent = 'Mis tareas'; } else document.querySelector('#tasks-title').textContent = 'Tareas del equipo';
  const render = () => {
    let list = tasksFor(user); if (activeFilter !== 'all') list = list.filter((task) => task.state === activeFilter);
    document.querySelector('#tasks-list').innerHTML = list.length ? list.map((task) => card(task)).join('') : '<div class="empty-state"><strong>No hay tareas en esta categoría.</strong><p>Crea una tarea o selecciona otro filtro.</p></div>';
    document.querySelectorAll('[data-task-state]').forEach((select) => select.addEventListener('change', (event) => { updateTask(event.target.dataset.taskState, { state: event.target.value }); render(); }));
    document.querySelectorAll('[data-delete-task]').forEach((button) => button.addEventListener('click', () => { const all = JSON.parse(localStorage.getItem('control-laboral:data:v1')); all.tasks = all.tasks.filter((task) => task.id !== button.dataset.deleteTask); localStorage.setItem('control-laboral:data:v1', JSON.stringify(all)); render(); }));
  };
  const card = (task) => { const employee = getEmployee(task.employeeId); const allowedStates = user.role === 'admin' ? ['Asignada', 'En Progreso', 'Enviar a Revisión', 'Completada', 'Bloqueada'] : ['En Progreso', 'Enviar a Revisión']; const options = allowedStates.map((state) => `<option ${state === task.state ? 'selected' : ''}>${state}</option>`).join(''); const employeeCanUpdate = user.role === 'employee' && task.employeeId === user.id && !['Completada', 'Bloqueada'].includes(task.state); const canManage = user.role === 'admin' || employeeCanUpdate; return `<article class="task-card"><div class="task-card-top"><span class="badge priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>${user.role === 'admin' ? `<span class="assignee">${escapeHtml(employee?.name || 'Sin asignar')}</span>` : ''}</div><h2>${escapeHtml(task.project)}</h2><p>${escapeHtml(task.description)}</p><div class="task-meta"><span>◷ ${task.deadline ? `${dateLabel(task.deadline, { day: 'numeric', month: 'short' })} · ${timeLabel(task.deadline)}` : 'Sin fecha límite'}</span></div><div class="task-card-footer">${canManage ? `<select aria-label="Estado de la tarea" data-task-state="${task.id}">${options}</select>` : `<span class="badge">${task.state}</span>`}${user.role === 'admin' ? `<button class="delete-button" data-delete-task="${task.id}" type="button" aria-label="Eliminar tarea">×</button>` : ''}</div></article>`; };
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('is-active', item === button)); render(); }));
  document.querySelector('#open-task-form').addEventListener('click', () => dialog.showModal());
  form.addEventListener('submit', (event) => { event.preventDefault(); if (!form.checkValidity()) { form.reportValidity(); return; } createTask({ project: document.querySelector('#task-project').value.trim(), description: document.querySelector('#task-description').value.trim(), employeeId: user.role === 'admin' ? assignee.value : user.id, deadline: document.querySelector('#task-deadline').value ? new Date(document.querySelector('#task-deadline').value).toISOString() : null, priority: document.querySelector('#task-priority').value }); dialog.close(); form.reset(); render(); });
  render();
}
