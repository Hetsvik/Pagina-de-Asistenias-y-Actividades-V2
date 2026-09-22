import { clearSession, getCurrentUser } from './storage.js';

const pages = [
  { id: 'dashboard', label: 'Resumen', icon: '▦', href: 'dashboard.html' },
  { id: 'attendance', label: 'Asistencia', icon: '◷', href: 'attendance.html' },
  { id: 'tasks', label: 'Tareas', icon: '✓', href: 'tasks.html' },
  { id: 'admin', label: 'Administración', icon: '⌘', href: 'admin.html', admin: true },
  { id: 'reports', label: 'Reportes', icon: '◫', href: 'reports.html', admin: true }
];

export function requireUser({ admin = false } = {}) {
  const user = getCurrentUser();
  if (!user || (admin && user.role !== 'admin')) { window.location.replace('../index.html'); return null; }
  return user;
}

export function mountShell(user) {
  const active = document.body.dataset.page;
  const navigation = pages.filter((page) => !page.admin || user.role === 'admin').map((page) => `<a class="nav-link ${active === page.id ? 'is-active' : ''}" href="${page.href}"><span>${page.icon}</span>${page.label}</a>`).join('');
  document.querySelector('#app-sidebar').innerHTML = `<div class="sidebar-brand"><a class="brand" href="dashboard.html"><span class="brand-mark">CL</span><span>Control laboral</span></a><button id="close-menu" class="icon-button mobile-only" type="button" aria-label="Cerrar menú">×</button></div><nav class="sidebar-nav" aria-label="Navegación principal">${navigation}</nav><div class="sidebar-footer"><div class="user-mini"><span class="avatar">${initials(user.name)}</span><div><strong>${user.name}</strong><small>${user.role === 'admin' ? 'Administrador' : user.position}</small></div></div><button id="logout-button" class="logout-button" type="button">Cerrar sesión <span>→</span></button></div>`;
  document.querySelector('#app-header').innerHTML = `<button id="open-menu" class="icon-button mobile-only" type="button" aria-label="Abrir menú">☰</button><div class="topbar-date">${new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</div><div class="topbar-user"><span class="avatar">${initials(user.name)}</span><span>${user.name}</span></div>`;
  document.querySelector('#logout-button').addEventListener('click', () => { clearSession(); window.location.assign('../index.html'); });
  document.querySelector('#open-menu')?.addEventListener('click', () => document.body.classList.add('menu-open'));
  document.querySelector('#close-menu')?.addEventListener('click', () => document.body.classList.remove('menu-open'));
}
function initials(name) { return name.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase(); }
