# Control laboral

Aplicación estática de asistencia y actividades, preparada para desplegarse en Cloudflare. No utiliza Python, Streamlit, MySQL ni dependencias de compilación.

## Estructura

```
├── index.html             # Inicio de sesión
├── pages/                 # Vistas protegidas
│   ├── dashboard.html
│   ├── attendance.html
│   ├── tasks.html
│   ├── admin.html
│   └── reports.html
├── assets/
│   ├── css/main.css       # Diseño responsive
│   └── js/                # Módulos de interfaz y datos
└── wrangler.json          # Configuración existente de Cloudflare
```

## Ejecutar y probar

Abre `index.html` mediante un servidor estático (por ejemplo, el panel de vista previa de tu editor) o publícalo en Cloudflare. Usa una de las cuentas de demostración:

| Perfil | Código | PIN |
| --- | --- | --- |
| Administrador | `AD001` | `0671` |
| Empleado | `EM0038` | `1020` |

Los cambios de asistencia, tareas y empleados se guardan en `localStorage`; son privados de cada navegador. El botón “Restablecer datos de prueba” recupera el estado inicial.

## Publicar en Cloudflare Pages

1. Sube esta carpeta a un repositorio Git.
2. En Cloudflare Pages crea un proyecto desde ese repositorio.
3. Selecciona **sin framework**, deja vacío el comando de compilación y usa `/` como directorio de salida.
4. Publica. `index.html` será la página de inicio.

## Nota para producción

Una página estática no puede proteger credenciales ni compartir registros entre usuarios: todo código JavaScript visible al cliente es público y `localStorage` vive solo en un navegador. Para autenticación real, colaboración y persistencia compartida, conecta después un backend con Cloudflare Workers + D1 (o una API externa); la interfaz actual se puede conservar y sustituir únicamente `assets/js/storage.js` por llamadas `fetch`.
