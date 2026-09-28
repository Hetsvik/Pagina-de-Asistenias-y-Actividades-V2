from js import Response
import json

async def on_fetch(request, env):
    url = request.url

    # Ejemplo: Login consultando la tabla 'Trabajadores' o 'Administrador'
    if "/api/login" in url and request.method == "POST":
        try:
            body_text = await request.text()
            data = json.loads(body_text)
            
            codigo = data.get("codigo")
            pin = data.get("pin")

            # Consulta nativa a D1 (SQLite)
            stmt = env.DB.prepare(
                "SELECT * FROM Trabajadores WHERE Codigo_Trabajador = ? AND PIN_Acceso = ?"
            )
            query = await stmt.bind(codigo, pin).all()
            results = query.results.to_py()

            if len(results) > 0:
                return Response.new(
                    json.dumps({"success": True, "usuario": results[0]}),
                    status=200,
                    headers={"Content-Type": "application/json"}
                )
            else:
                return Response.new(
                    json.dumps({"success": False, "mensaje": "Credenciales inválidas"}),
                    status=401,
                    headers={"Content-Type": "application/json"}
                )

        except Exception as err:
            return Response.new(
                json.dumps({"success": False, "error": str(err)}),
                status=500,
                headers={"Content-Type": "application/json"}
            )

    return Response.new("Ruta no encontrada", status=404)