import { attendanceFor, createEmployee, createProject, employees, escapeHtml, isLate, projects, tasksFor } from './storage.js';
import { mountShell, requireUser } from './layout.js';

const user = requireUser({ admin: true });
if (user) {
  mountShell(user);
  const dialog = document.querySelector('#employee-dialog'); const form = document.querySelector('#employee-form'); const projectDialog = document.querySelector('#project-dialog'); const projectForm = document.querySelector('#project-form');
  const render = () => {
    const team = employees(); const tasks = tasksFor(user); const completed = tasks.filter((task) => task.state === 'Completada').length;
    const onTime = team.filter((employee) => { const record = attendanceFor(employee.id)[0]; return record && !isLate(record); }).length;
    const metrics = [['Equipo activo', team.length, 'personas registradas'], ['A tiempo hoy', onTime, 'marcaciones sin tardanza'], ['Tareas finalizadas', completed, `de ${tasks.length} asignadas`], ['En revisión', tasks.filter((task) => task.state === 'Enviar a Revisión').length, 'por validar']];
    document.querySelector('#admin-metrics').innerHTML = metrics.map(([label, value, detail]) => `<article class="metric-card"><p>${label}</p><strong>${value}</strong><small>${detail}</small></article>`).join('');
    document.querySelector('#employees-list').innerHTML = team.map((employee) => { const record = attendanceFor(employee.id).find((item) => new Date(item.entry).toDateString() === new Date().toDateString()); return `<div class="employee-row"><span class="avatar">${initials(employee.name)}</span><div><strong>${escapeHtml(employee.name)}</strong><p>${escapeHtml(employee.position)} · ${escapeHtml(employee.code)}</p></div><span class="badge ${record ? (isLate(record) ? 'badge-danger' : 'badge-success') : ''}">${record ? (isLate(record) ? 'Tardanza' : 'Presente') : 'Sin marcar'}</span></div>`; }).join('');
    document.querySelector('#admin-tasks').innerHTML = tasks.slice(0, 5).map((task) => `<div class="compact-item"><span class="priority-dot priority-${task.priority.toLowerCase()}"></span><div><strong>${escapeHtml(task.project)}</strong><p>${escapeHtml(task.description)}</p></div><span class="badge">${task.state}</span></div>`).join('') || '<div class="empty-state"><strong>No hay tareas registradas.</strong></div>';
    document.querySelector('#projects-list').innerHTML = projects().map((project) => `<div class="project-row"><span class="project-symbol">◈</span><div><strong>${escapeHtml(project.name)}</strong><p>${escapeHtml(project.area)}</p></div></div>`).join('') || '<div class="empty-state"><strong>No hay proyectos registrados.</strong></div>';
  };
  document.querySelector('#add-employee').addEventListener('click', () => dialog.showModal());
  form.addEventListener('submit', (event) => { event.preventDefault(); if (!form.checkValidity()) { form.reportValidity(); return; } const code = document.querySelector('#employee-code').value.trim().toUpperCase(); if (employees().some((employee) => employee.code === code)) { window.alert('Ese código ya está en uso.'); return; } createEmployee({ name: document.querySelector('#employee-name').value.trim(), position: document.querySelector('#employee-position').value.trim(), code, pin: document.querySelector('#employee-pin').value.trim() }); dialog.close(); form.reset(); render(); });
  document.querySelector('#add-project').addEventListener('click', () => projectDialog.showModal());
  projectForm.addEventListener('submit', (event) => { event.preventDefault(); if (!projectForm.checkValidity()) { projectForm.reportValidity(); return; } createProject({ name: document.querySelector('#project-name').value.trim(), area: document.querySelector('#project-area').value.trim() }); projectDialog.close(); projectForm.reset(); render(); });
  render();
}
function initials(name) { return name.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase(); }
