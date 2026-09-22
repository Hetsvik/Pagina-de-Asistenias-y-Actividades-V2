import { authenticate, getCurrentUser, setSession } from './storage.js';

if (getCurrentUser()) window.location.replace('pages/dashboard.html');
const form = document.querySelector('#login-form');
const message = document.querySelector('#login-message');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = new FormData(form); const user = authenticate(values.get('code'), values.get('pin'), values.get('role'));
  if (!user) { message.textContent = 'No encontramos una cuenta con esas credenciales y perfil.'; message.className = 'form-message is-error'; return; }
  setSession(user); window.location.assign(user.role === 'admin' ? 'pages/admin.html' : 'pages/dashboard.html');
});
