import json
from datetime import datetime, timezone, timedelta

# Zona horaria por defecto: UTC-5 (America/Lima)
TZ_OFFSET = timezone(timedelta(hours=-5))

def now_local_iso():
    return datetime.now(TZ_OFFSET).strftime("%Y-%m-%d %H:%M:%S")

def today_local_iso():
    return datetime.now(TZ_OFFSET).strftime("%Y-%m-%d")

def json_response(data, status=200):
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
    return Response(json.dumps(data, default=str), status=status, headers=headers)

def handle_cors():
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
    return Response("", status=204, headers=headers)

async def on_fetch(request, env):
    method = request.method
    url = request.url
    path = "/" + "/".join(url.split("/")[3:]).split("?")[0]

    if method == "OPTIONS":
        return handle_cors()

    try:
        # =========================================================
        # 1. AUTENTICACIÓN
        # =========================================================
        if path == "/api/auth/login" and method == "POST":
            body = await request.json()
            code = (body.get("code") or "").strip().upper()
            pin = (body.get("pin") or "").strip()
            role = body.get("role")

            if role in ("Empleado", "Trabajador"):
                sql = """
                    SELECT T.ID_Trabajador AS id, E.Nombre_Completo AS name,
                           T.Rol_Cargo AS position, T.Codigo_Trabajador AS code,
                           'Empleado' AS role
                    FROM Trabajadores T
                    JOIN Empleados E ON E.ID_Empleado = T.ID_Empleado
                    WHERE UPPER(T.Codigo_Trabajador) = ?
                      AND T.PIN_Acceso = ?
                      AND E.Estado = 'Activo'
                """
                stmt = env.DB.prepare(sql).bind(code, pin)
                user = await stmt.first()
            elif role == "Administrador":
                sql = """
                    SELECT A.ID_Administrador AS id, E.Nombre_Completo AS name,
                           'Administrador' AS position, A.Codigo_Administrador AS code,
                           'Administrador' AS role
                    FROM Administrador A
                    JOIN Empleados E ON E.ID_Empleado = A.ID_Empleado
                    WHERE UPPER(A.Codigo_Administrador) = ?
                      AND A.PIN_Acceso = ?
                      AND E.Estado = 'Activo'
                """
                stmt = env.DB.prepare(sql).bind(code, pin)
                user = await stmt.first()
            else:
                return json_response({"error": "Perfil de usuario no válido"}, status=400)

            if user:
                return json_response({"success": True, "user": dict(user)})
            return json_response({"error": "Credenciales inválidas o cuenta inactiva."}, status=401)

        # =========================================================
        # 2. ASISTENCIA (EMPLEADO)
        # =========================================================
        if path == "/api/attendance/today" and method == "GET":
            worker_id = url.split("worker_id=")[1].split("&")[0]
            today = today_local_iso()
            sql = """
                SELECT ID_Asistencia AS id, Fecha_Entrada AS entry, Fecha_Salida AS salida
                FROM Asistencia
                WHERE ID_Trabajador = ? AND DATE(Fecha_Entrada) = ?
                ORDER BY ID_Asistencia DESC LIMIT 1
            """
            result = await env.DB.prepare(sql).bind(worker_id, today).first()
            return json_response({"attendance": dict(result) if result else None})

        if path == "/api/attendance/entry" and method == "POST":
            body = await request.json()
            worker_id = body.get("worker_id")
            now_dt = now_local_iso()
            today = today_local_iso()

            # Verificar que no exista ya una entrada hoy
            check_sql = "SELECT ID_Asistencia FROM Asistencia WHERE ID_Trabajador = ? AND DATE(Fecha_Entrada) = ?"
            existing = await env.DB.prepare(check_sql).bind(worker_id, today).first()
            if existing:
                return json_response({"error": "Ya registraste tu entrada de hoy."}, status=400)

            sql = "INSERT INTO Asistencia (ID_Trabajador, Fecha_Entrada, Fecha_Calculada) VALUES (?, ?, ?)"
            await env.DB.prepare(sql).bind(worker_id, now_dt, today).run()
            return json_response({"success": True, "entry_time": now_dt})

        if path == "/api/attendance/exit" and method == "POST":
            body = await request.json()
            worker_id = body.get("worker_id")
            now_dt = now_local_iso()
            today = today_local_iso()

            sql = """
                UPDATE Asistencia
                SET Fecha_Salida = ?
                WHERE ID_Trabajador = ? AND (DATE(Fecha_Entrada) = ? OR Fecha_Calculada = ?) AND Fecha_Salida IS NULL
            """
            res = await env.DB.prepare(sql).bind(now_dt, worker_id, today, today).run()
            return json_response({"success": True, "exit_time": now_dt})

        # =========================================================
        # 3. GESTIÓN DE TAREAS (EMPLEADO)
        # =========================================================
        if path == "/api/tasks/my-today" and method == "GET":
            worker_id = url.split("worker_id=")[1].split("&")[0]
            today = today_local_iso()
            sql = """
                SELECT T.ID_Tarea AS id, P.Nombre_Proyecto AS project, T.Descripcion_Tarea AS description,
                       T.Estado_Tarea AS state, T.Observaciones AS notes,
                       T.Fecha_Inicio AS start_time, T.Fecha_Entrega AS end_time
                FROM Tareas T
                JOIN Proyectos P ON P.ID_Proyecto = T.ID_Proyecto
                WHERE T.ID_Trabajador = ? AND (DATE(T.Fecha) = ? OR DATE(T.Fecha_Inicio) = ?)
                ORDER BY T.ID_Tarea DESC
            """
            result = await env.DB.prepare(sql).bind(worker_id, today, today).all()
            return json_response({"tasks": [dict(r) for r in result.results]})

        if path == "/api/tasks/update-status" and method == "POST":
            body = await request.json()
            task_id = body.get("task_id")
            worker_id = body.get("worker_id")
            new_state = body.get("state")
            notes = body.get("notes") or ""

            # Validar límite de entrega (Lógica fuera de plazo)
            task_info = await env.DB.prepare("SELECT Fecha_Entrega FROM Tareas WHERE ID_Tarea = ?").bind(task_id).first()
            if task_info and task_info["Fecha_Entrega"]:
                limit_dt = datetime.strptime(str(task_info["Fecha_Entrega"]).replace("T", " ")[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=TZ_OFFSET)
                current_dt = datetime.now(TZ_OFFSET)
                if current_dt > limit_dt:
                    tag = "[ENTREGADO FUERA DE PLAZO]"
                    if tag not in notes:
                        notes = f"{tag}\n{notes}".strip()

            sql = "UPDATE Tareas SET Estado_Tarea = ?, Observaciones = ? WHERE ID_Tarea = ? AND ID_Trabajador = ?"
            await env.DB.prepare(sql).bind(new_state, notes, task_id, worker_id).run()
            return json_response({"success": True, "notes": notes})

        # =========================================================
        # 4. CHAT Y COMUNICACIÓN POR TAREA
        # =========================================================
        if path == "/api/tasks/comments" and method == "GET":
            task_id = url.split("task_id=")[1].split("&")[0]
            sql = """
                SELECT Autor AS author, Rol AS role, Mensaje AS message, Fecha AS date
                FROM Comentarios_Tarea
                WHERE ID_Tarea = ?
                ORDER BY ID_Comentario ASC
            """
            result = await env.DB.prepare(sql).bind(task_id).all()
            return json_response({"comments": [dict(r) for r in result.results]})

        if path == "/api/tasks/comments" and method == "POST":
            body = await request.json()
            task_id = body.get("task_id")
            author = body.get("author")
            role = body.get("role")
            message = (body.get("message") or "").strip()
            now_dt = now_local_iso()

            if not message:
                return json_response({"error": "El mensaje no puede estar vacío"}, status=400)

            sql = "INSERT INTO Comentarios_Tarea (ID_Tarea, Autor, Rol, Mensaje, Fecha) VALUES (?, ?, ?, ?, ?)"
            await env.DB.prepare(sql).bind(task_id, author, role, message, now_dt).run()
            return json_response({"success": True, "date": now_dt})

        # =========================================================
        # 5. MONITOREO Y TAREAS (ADMINISTRADOR)
        # =========================================================
        if path == "/api/admin/attendance-today" and method == "GET":
            today = today_local_iso()
            sql = """
                SELECT E.Nombre_Completo AS employee, 
                       W.Codigo_Trabajador AS code,
                       A.Fecha_Entrada AS entry, 
                       A.Fecha_Salida AS exit
                FROM Trabajadores W
                JOIN Empleados E ON E.ID_Empleado = W.ID_Empleado
                LEFT JOIN Asistencia A ON W.ID_Trabajador = A.ID_Trabajador AND (A.Fecha_Calculada = ? OR DATE(A.Fecha_Entrada) = ?)
                WHERE E.Estado = 'Activo'
                ORDER BY E.Nombre_Completo ASC
            """
            result = await env.DB.prepare(sql).bind(today, today).all()
            return json_response({"attendance": [dict(r) for r in result.results]})

        if path == "/api/admin/tasks-today" and method == "GET":
            today = today_local_iso()
            sql = """
                SELECT T.ID_Tarea AS id, E.Nombre_Completo AS emp, P.Nombre_Proyecto AS project, 
                       T.Descripcion_Tarea AS description, T.Estado_Tarea AS state, T.Observaciones AS notes
                FROM Tareas T
                JOIN Trabajadores W ON W.ID_Trabajador = T.ID_Trabajador
                JOIN Empleados E ON E.ID_Empleado = W.ID_Empleado
                JOIN Proyectos P ON P.ID_Proyecto = T.ID_Proyecto
                WHERE DATE(T.Fecha) = ? OR DATE(T.Fecha_Inicio) = ?
                ORDER BY T.ID_Tarea DESC
            """
            result = await env.DB.prepare(sql).bind(today, today).all()
            return json_response({"tasks": [dict(r) for r in result.results]})

        if path == "/api/admin/tasks/state" and method == "POST":
            body = await request.json()
            task_id = body.get("task_id")
            new_state = body.get("state")
            sql = "UPDATE Tareas SET Estado_Tarea = ? WHERE ID_Tarea = ?"
            await env.DB.prepare(sql).bind(new_state, task_id).run()
            return json_response({"success": True})

        if path == "/api/admin/tasks/create" and method == "POST":
            body = await request.json()
            worker_id = body.get("worker_id")
            admin_id = body.get("admin_id")
            project_id = body.get("project_id")
            description = (body.get("description") or "").strip()
            start_time = body.get("start_time")
            end_time = body.get("end_time")
            today = today_local_iso()

            sql = """
                INSERT INTO Tareas (ID_Trabajador, ID_Administrador_Asignador, ID_Proyecto, Descripcion_Tarea, Estado_Tarea, Fecha_Inicio, Fecha_Entrega, Fecha)
                VALUES (?, ?, ?, ?, 'Asignada', ?, ?, ?)
            """
            await env.DB.prepare(sql).bind(worker_id, admin_id, project_id, description, start_time, end_time, today).run()
            return json_response({"success": True})

        if path == "/api/admin/tasks/delete" and method == "POST":
            body = await request.json()
            task_id = body.get("task_id")
            await env.DB.prepare("DELETE FROM Comentarios_Tarea WHERE ID_Tarea = ?").bind(task_id).run()
            await env.DB.prepare("DELETE FROM Tareas WHERE ID_Tarea = ?").bind(task_id).run()
            return json_response({"success": True})

        # =========================================================
        # 6. GESTIÓN DE PERSONAL Y PROYECTOS
        # =========================================================
        if path == "/api/admin/workers" and method == "GET":
            sql = """
                SELECT W.ID_Trabajador AS id, W.ID_Empleado AS emp_id, E.Nombre_Completo AS name,
                       COALESCE(E.Correo, '') AS email, COALESCE(E.Telefono, '') AS phone,
                       W.Rol_Cargo AS position, W.Codigo_Trabajador AS code, E.Estado AS status
                FROM Trabajadores W
                JOIN Empleados E ON E.ID_Empleado = W.ID_Empleado
                ORDER BY E.Nombre_Completo ASC
            """
            result = await env.DB.prepare(sql).all()
            return json_response({"workers": [dict(r) for r in result.results]})

        if path == "/api/admin/workers/create" and method == "POST":
            body = await request.json()
            name = body.get("name", "").strip()
            email = body.get("email", "").strip() or None
            phone = body.get("phone", "").strip() or None
            position = body.get("position", "").strip()
            code = body.get("code", "").strip().upper()
            pin = body.get("pin", "").strip()

            emp_res = await env.DB.prepare(
                "INSERT INTO Empleados (Nombre_Completo, Correo, Telefono, Estado) VALUES (?, ?, ?, 'Activo')"
            ).bind(name, email, phone).run()
            
            # Obtener el último ID insertado en SQLite D1
            last_emp = await env.DB.prepare("SELECT last_insert_rowid() AS id").first()
            emp_id = last_emp["id"]

            await env.DB.prepare(
                "INSERT INTO Trabajadores (ID_Empleado, Rol_Cargo, Codigo_Trabajador, PIN_Acceso) VALUES (?, ?, ?, ?)"
            ).bind(emp_id, position, code, pin).run()

            return json_response({"success": True})

        if path == "/api/admin/workers/delete" and method == "POST":
            body = await request.json()
            emp_id = body.get("emp_id")
            # En cascada de D1/SQLite
            worker = await env.DB.prepare("SELECT ID_Trabajador FROM Trabajadores WHERE ID_Empleado = ?").bind(emp_id).first()
            if worker:
                w_id = worker["ID_Trabajador"]
                await env.DB.prepare("DELETE FROM Asistencia WHERE ID_Trabajador = ?").bind(w_id).run()
                await env.DB.prepare("DELETE FROM Tareas WHERE ID_Trabajador = ?").bind(w_id).run()
                await env.DB.prepare("DELETE FROM Trabajadores WHERE ID_Trabajador = ?").bind(w_id).run()
            await env.DB.prepare("DELETE FROM Empleados WHERE ID_Empleado = ?").bind(emp_id).run()
            return json_response({"success": True})

        if path == "/api/admin/projects" and method == "GET":
            result = await env.DB.prepare("SELECT ID_Proyecto AS id, Nombre_Proyecto AS name, Area_Departamento AS area FROM Proyectos ORDER BY ID_Proyecto DESC").all()
            return json_response({"projects": [dict(r) for r in result.results]})

        if path == "/api/admin/projects/create" and method == "POST":
            body = await request.json()
            p_name = body.get("name", "").strip()
            p_area = body.get("area", "").strip()
            await env.DB.prepare("INSERT INTO Proyectos (Nombre_Proyecto, Area_Departamento) VALUES (?, ?)").bind(p_name, p_area).run()
            return json_response({"success": True})

        if path == "/api/admin/projects/delete" and method == "POST":
            body = await request.json()
            p_id = body.get("id")
            has_tasks = await env.DB.prepare("SELECT ID_Tarea FROM Tareas WHERE ID_Proyecto = ? LIMIT 1").bind(p_id).first()
            if has_tasks:
                return json_response({"error": "No se puede eliminar: el proyecto contiene tareas vinculadas."}, status=400)
            await env.DB.prepare("DELETE FROM Proyectos WHERE ID_Proyecto = ?").bind(p_id).run()
            return json_response({"success": True})

        # =========================================================
        # 7. ANALÍTICA, REPORTES Y PERFIL
        # =========================================================
        if path == "/api/admin/analytics/generate" and method == "POST":
            body = await request.json()
            worker_id = body.get("worker_id")
            start_date = body.get("start_date")
            end_date = body.get("end_date")

            sql_ast = """
                SELECT 
                    COUNT(*) AS total_dias,
                    SUM(CASE WHEN TIME(Fecha_Entrada) <= '09:40:00' THEN 1 ELSE 0 END) AS a_tiempo,
                    SUM(CASE WHEN TIME(Fecha_Entrada) > '09:40:00' THEN 1 ELSE 0 END) AS tardanzas
                FROM Asistencia 
                WHERE ID_Trabajador = ? AND (Fecha_Calculada BETWEEN ? AND ? OR DATE(Fecha_Entrada) BETWEEN ? AND ?)
            """
            kpi_ast = await env.DB.prepare(sql_ast).bind(worker_id, start_date, end_date, start_date, end_date).first()

            sql_tar = """
                SELECT 
                    COUNT(*) AS total_tareas,
                    SUM(CASE WHEN Estado_Tarea = 'Completada' THEN 1 ELSE 0 END) AS completadas
                FROM Tareas 
                WHERE ID_Trabajador = ? AND (DATE(Fecha) BETWEEN ? AND ? OR DATE(Fecha_Inicio) BETWEEN ? AND ?)
            """
            kpi_tar = await env.DB.prepare(sql_tar).bind(worker_id, start_date, end_date, start_date, end_date).first()

            tot_tar = kpi_tar["total_tareas"] if kpi_tar and kpi_tar["total_tareas"] else 0
            completadas = kpi_tar["completadas"] if kpi_tar and kpi_tar["completadas"] else 0
            eficiencia = round((completadas / tot_tar * 100), 1) if tot_tar > 0 else 0.0

            # Detalle de tareas en el rango
            sql_detalle = """
                SELECT P.Nombre_Proyecto AS project, T.Descripcion_Tarea AS task, T.Estado_Tarea AS state
                FROM Tareas T
                JOIN Proyectos P ON T.ID_Proyecto = P.ID_Proyecto
                WHERE T.ID_Trabajador = ? AND (DATE(T.Fecha) BETWEEN ? AND ? OR DATE(T.Fecha_Inicio) BETWEEN ? AND ?)
                ORDER BY T.ID_Tarea DESC
            """
            det_res = await env.DB.prepare(sql_detalle).bind(worker_id, start_date, end_date, start_date, end_date).all()

            return json_response({
                "tot_asistencias": kpi_ast["total_dias"] if kpi_ast and kpi_ast["total_dias"] else 0,
                "a_tiempo": kpi_ast["a_tiempo"] if kpi_ast and kpi_ast["a_tiempo"] else 0,
                "tardanzas": kpi_ast["tardanzas"] if kpi_ast and kpi_ast["tardanzas"] else 0,
                "tot_tareas": tot_tar,
                "completadas": completadas,
                "eficiencia": eficiencia,
                "tasks_breakdown": [dict(r) for r in det_res.results]
            })

        if path == "/api/profile/change-password" and method == "POST":
            body = await request.json()
            user_id = body.get("user_id")
            role = body.get("role")
            curr_pass = body.get("current_password")
            new_pass = body.get("new_password")

            table = "Administrador" if role == "Administrador" else "Trabajadores"
            pk = "ID_Administrador" if role == "Administrador" else "ID_Trabajador"

            user_db = await env.DB.prepare(f"SELECT PIN_Acceso FROM {table} WHERE {pk} = ?").bind(user_id).first()
            if not user_db or user_db["PIN_Acceso"] != curr_pass:
                return json_response({"error": "La contraseña actual es incorrecta."}, status=400)

            await env.DB.prepare(f"UPDATE {table} SET PIN_Acceso = ? WHERE {pk} = ?").bind(new_pass, user_id).run()
            return json_response({"success": True})

        return json_response({"error": f"Ruta no encontrada: {path}"}, status=404)

    except Exception as e:
        return json_response({"error": f"Error interno en Worker: {str(e)}"}, status=500)