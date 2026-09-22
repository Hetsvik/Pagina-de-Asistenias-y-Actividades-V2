import { attendanceFor, dateLabel, isLate, markAttendance, resetData, timeLabel, todayAttendance } from './storage.js';
import { mountShell as mount, requireUser } from './layout.js';

const user = requireUser();
if (user) {
  mount(user);
  document.querySelector('#current-date').textContent = dateLabel(new Date(), { weekday: 'long', day: 'numeric', month: 'long' });
  const render = () => {
    const current = todayAttendance(user.id);
    const entryDisabled = Boolean(current); const exitDisabled = !current || Boolean(current.exit);
    document.querySelector('#attendance-status').innerHTML = `<div class="attendance-hero-copy"><p class="eyebrow">Jornada de hoy</p><h2>${current?.exit ? 'Jornada completada' : current ? 'Tu jornada está en curso' : 'Aún no has iniciado tu jornada'}</h2><p>${current ? `Entrada ${timeLabel(current.entry)}${current.exit ? ` · Salida ${timeLabel(current.exit)}` : ''}` : 'Marca tu entrada cuando inicies actividades.'}</p></div><div class="attendance-actions"><button class="button button-primary" id="mark-entry" ${entryDisabled ? 'disabled' : ''}>Marcar entrada</button><button class="button button-secondary" id="mark-exit" ${exitDisabled ? 'disabled' : ''}>Marcar salida</button></div>`;
    document.querySelector('#mark-entry').addEventListener('click', () => action('entry'));
    document.querySelector('#mark-exit').addEventListener('click', () => action('exit'));
    document.querySelector('#attendance-table').innerHTML = attendanceFor(user.id).map((record) => `<tr><td>${dateLabel(record.entry)}</td><td>${timeLabel(record.entry)}</td><td>${timeLabel(record.exit)}</td><td><span class="badge ${isLate(record) ? 'badge-danger' : 'badge-success'}">${isLate(record) ? 'Tardanza' : record.exit ? 'Completada' : 'En curso'}</span></td></tr>`).join('') || '<tr><td colspan="4" class="table-empty">No hay registros.</td></tr>';
  };
  const action = (kind) => { const result = markAttendance(user.id, kind); if (!result.ok) window.alert(result.message); render(); };
  document.querySelector('#clear-attendance').addEventListener('click', () => { if (window.confirm('¿Restablecer todos los datos de demostración?')) { resetData(); render(); } });
  render();
}
