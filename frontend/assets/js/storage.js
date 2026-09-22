const DATA_KEY = 'control-laboral:data:v1';
const SESSION_KEY = 'control-laboral:session:v1';

const toIsoDate = (date = new Date()) => date.toISOString().slice(0, 10);
const isoAt = (days, hour, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

function seedData() {
  return {
    employees: [
      { id: 'admin-1', name: 'Administrador General', code: 'AD001', pin: '0671', role: 'admin', position: 'Administrador', active: true },
      { id: 'emp-1', name: 'Adonis Vasquez', code: 'EM0038', pin: '1020', role: 'employee', position: 'Arquitecto', active: true },
      { id: 'emp-2', name: 'Benjamin Alfonso', code: 'EM0014', pin: '8844', role: 'employee', position: 'Ingeniero de Sistemas', active: true },
      { id: 'emp-3', name: 'Celeste Lechuga', code: 'EM0030', pin: '7777', role: 'employee', position: 'Arquitecta', active: true },
      { id: 'emp-4', name: 'Xiomara Ramirez', code: 'EM0033', pin: '7920', role: 'employee', position: 'Arquitecta', active: true }
    ],
    attendance: [
      { id: 'att-1', employeeId: 'emp-1', entry: isoAt(-2, 9, 12), exit: isoAt(-2, 18, 4) },
      { id: 'att-2', employeeId: 'emp-1', entry: isoAt(-1, 9, 31), exit: isoAt(-1, 18, 12) },
      { id: 'att-3', employeeId: 'emp-2', entry: isoAt(0, 9, 8), exit: null }
    ],
    projects: [
      { id: 'project-1', name: 'Torre Alta Vista', area: 'Arquitectura y Diseño' },
      { id: 'project-2', name: 'Sistema de horarios', area: 'Tecnología y Sistemas' }
    ],
    tasks: [
      { id: 'task-1', employeeId: 'emp-1', project: 'Torre Alta Vista', description: 'Modelado 3D de la fachada principal.', state: 'En Progreso', priority: 'Alta', createdAt: isoAt(0, 9), deadline: isoAt(0, 17), notes: [] },
      { id: 'task-2', employeeId: 'emp-1', project: 'Torre Alta Vista', description: 'Preparar láminas para la revisión de materiales.', state: 'Asignada', priority: 'Media', createdAt: isoAt(0, 9), deadline: isoAt(1, 12), notes: [] },
      { id: 'task-3', employeeId: 'emp-2', project: 'Sistema de horarios', description: 'Validar el flujo de autenticación y roles.', state: 'Enviar a Revisión', priority: 'Alta', createdAt: isoAt(0, 9), deadline: isoAt(0, 16), notes: [] },
      { id: 'task-4', employeeId: 'emp-3', project: 'Torre Alta Vista', description: 'Actualizar plano de instalaciones.', state: 'Completada', priority: 'Media', createdAt: isoAt(-1, 9), deadline: isoAt(-1, 17), notes: [] }
    ]
  };
}

export function getData() {
  const stored = localStorage.getItem(DATA_KEY);
  if (!stored) {
    const initial = seedData();
    localStorage.setItem(DATA_KEY, JSON.stringify(initial));
    return initial;
  }
  try { return JSON.parse(stored); } catch { localStorage.removeItem(DATA_KEY); return getData(); }
}

export function saveData(data) { localStorage.setItem(DATA_KEY, JSON.stringify(data)); }
export function resetData() { localStorage.setItem(DATA_KEY, JSON.stringify(seedData())); }
export function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
export function setSession(user) { localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, role: user.role })); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }
export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return getData().employees.find((employee) => employee.id === session.id && employee.active) || null;
}
export function authenticate(code, pin, role) {
  const normalized = code.trim().toUpperCase();
  return getData().employees.find((employee) => employee.active && employee.role === role && employee.code.toUpperCase() === normalized && employee.pin === pin.trim()) || null;
}
export function getEmployee(id) { return getData().employees.find((employee) => employee.id === id); }
export function employees() { return getData().employees.filter((employee) => employee.role === 'employee' && employee.active); }
export function todayAttendance(employeeId) {
  return getData().attendance.find((record) => record.employeeId === employeeId && toIsoDate(new Date(record.entry)) === toIsoDate()) || null;
}
export function attendanceFor(employeeId) {
  return getData().attendance.filter((record) => record.employeeId === employeeId).sort((a, b) => new Date(b.entry) - new Date(a.entry));
}
export function markAttendance(employeeId, kind) {
  const data = getData(); const current = data.attendance.find((record) => record.employeeId === employeeId && toIsoDate(new Date(record.entry)) === toIsoDate());
  if (kind === 'entry') {
    if (current) return { ok: false, message: 'Ya registraste tu entrada hoy.' };
    data.attendance.push({ id: uid('att'), employeeId, entry: new Date().toISOString(), exit: null });
  } else {
    if (!current) return { ok: false, message: 'Primero debes registrar tu entrada.' };
    if (current.exit) return { ok: false, message: 'Tu salida ya fue registrada.' };
    current.exit = new Date().toISOString();
  }
  saveData(data); return { ok: true, message: kind === 'entry' ? 'Entrada registrada correctamente.' : 'Salida registrada correctamente.' };
}
export function tasksFor(user) { const tasks = getData().tasks; return user.role === 'admin' ? tasks : tasks.filter((task) => task.employeeId === user.id); }
export function updateTask(id, changes) { const data = getData(); const task = data.tasks.find((item) => item.id === id); if (task) Object.assign(task, changes); saveData(data); return task; }
export function createTask(task) { const data = getData(); const created = { id: uid('task'), state: 'Asignada', notes: [], createdAt: new Date().toISOString(), ...task }; data.tasks.unshift(created); saveData(data); return created; }
export function createEmployee(employee) { const data = getData(); const created = { id: uid('emp'), role: 'employee', active: true, ...employee }; data.employees.push(created); saveData(data); return created; }
export function projects() { return getData().projects || []; }
export function createProject(project) { const data = getData(); if (!data.projects) data.projects = []; const created = { id: uid('project'), ...project }; data.projects.push(created); saveData(data); return created; }
export function dateLabel(value, options = { day: '2-digit', month: 'short', year: 'numeric' }) { return new Intl.DateTimeFormat('es-CO', options).format(new Date(value)); }
export function timeLabel(value) { return value ? new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(value)) : 'Pendiente'; }
export function isLate(record) { if (!record?.entry) return false; const entry = new Date(record.entry); return entry.getHours() > 9 || (entry.getHours() === 9 && entry.getMinutes() > 40); }
export function escapeHtml(value = '') { const element = document.createElement('span'); element.textContent = value; return element.innerHTML; }
