from js import Response
import json

async def on_fetch(request, env):
    url = request.url

    # Ruta de prueba de API
    if "/api/ping" in url:
        return Response.new(
            json.dumps({"status": "ok", "mensaje": "API funcionando perfectamente"}),
            status=200,
            headers={"Content-Type": "application/json"}
        )

    # Consulta a la base de datos D1
    if "/api/empleados" in url:
        try:
            stmt = env.DB.prepare("SELECT * FROM Empleados LIMIT 5;")
            query = await stmt.all()
            results = query.results.to_py()
            return Response.new(
                json.dumps(results),
                status=200,
                headers={"Content-Type": "application/json"}
            )
        except Exception as err:
            return Response.new(
                json.dumps({"error": str(err)}),
                status=500,
                headers={"Content-Type": "application/json"}
            )

    return Response.new("Backend Python activo en Cloudflare Workers", status=200)