export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  // Encabezados CORS para comunicación del frontend
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Respuesta para preflight OPTIONS
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- MANEJO DE PETICIÓN POST (Inicio de sesión) ---
    if (method === 'POST') {
      const { email, password } = await request.json();

      if (!email || !password) {
        return new Response(
          JSON.stringify({ success: false, message: 'Email y contraseña requeridos.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Consulta preparada en SQLite (Cloudflare D1)
      const user = await env.DB.prepare(
        'SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? LIMIT 1'
      ).bind(email).first();

      if (!user) {
        return new Response(
          JSON.stringify({ success: false, message: 'Usuario o contraseña incorrectos.' }),
          { status: 401, headers: corsHeaders }
        );
      }

      // Validación de contraseña
      if (user.password !== password) {
        return new Response(
          JSON.stringify({ success: false, message: 'Usuario o contraseña incorrectos.' }),
          { status: 401, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Inicio de sesión exitoso.',
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // --- MANEJO DE PETICIÓN GET (Obtener / Verificar perfil de usuario) ---
    if (method === 'GET') {
      const url = new URL(request.url);
      const email = url.searchParams.get('email');

      if (!email) {
        return new Response(
          JSON.stringify({ success: false, message: 'Falta el parámetro email.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const user = await env.DB.prepare(
        'SELECT id, nombre, email, rol FROM usuarios WHERE email = ?'
      ).bind(email).first();

      if (!user) {
        return new Response(
          JSON.stringify({ success: false, message: 'Usuario no encontrado.' }),
          { status: 404, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({ success: true, user }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Método no soportado.' }),
      { status: 405, headers: corsHeaders }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}