-- Script adaptado para Cloudflare D1 (SQLite)

-- --------------------------------------------------------
-- Tabla: Roles_Sistema
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Roles_Sistema (
  ID_Rol INTEGER PRIMARY KEY AUTOINCREMENT,
  Nombre_Rol TEXT NOT NULL,
  Descripcion TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS UQ_Roles_Sistema_Nombre ON Roles_Sistema(Nombre_Rol);

INSERT INTO Roles_Sistema (ID_Rol, Nombre_Rol, Descripcion) VALUES
(1, 'Trabajador', 'Acceso para marcar asistencia y gestionar sus tareas.'),
(2, 'Administrador', 'Acceso al panel, reportes y gestión de personal.');

-- --------------------------------------------------------
-- Tabla: Empleados
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Empleados (
  ID_Empleado INTEGER PRIMARY KEY AUTOINCREMENT,
  Nombre_Completo TEXT NOT NULL,
  Correo TEXT,
  Telefono TEXT,
  Estado TEXT NOT NULL DEFAULT 'Activo' CHECK (Estado IN ('Activo', 'Inactivo'))
);

INSERT INTO Empleados (ID_Empleado, Nombre_Completo, Correo, Telefono, Estado) VALUES
(1, 'Administrador General', NULL, NULL, 'Activo'),
(2, 'Adonis Vasquez', NULL, NULL, 'Activo'),
(3, 'Benjamin Alfonso', 'calebalfonso83@gmail.com', '930254064', 'Activo'),
(4, 'Celeste Lechuga', NULL, NULL, 'Activo'),
(6, 'Marco Coila', NULL, NULL, 'Activo'),
(7, 'Kevin Vega', NULL, NULL, 'Activo'),
(8, 'Fiorella Alarcon', NULL, NULL, 'Activo'),
(9, 'Alejandro Guzman', NULL, NULL, 'Activo'),
(10, 'Israel Rodrigo Ochoa Mejia', 'rodrigo.ochoa333@gmail.com', '933718894', 'Activo'),
(11, 'Edu Cruz', NULL, NULL, 'Activo'),
(12, 'Matias Sebastian Moreno Rodriguez', 'matix3346@gmail.com', '923001763', 'Activo');

-- --------------------------------------------------------
-- Tabla: Administrador
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Administrador (
  ID_Administrador INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_Empleado INTEGER NOT NULL,
  Codigo_Administrador TEXT NOT NULL,
  PIN_Acceso TEXT NOT NULL,
  ID_Rol INTEGER NOT NULL DEFAULT 2,
  FOREIGN KEY (ID_Empleado) REFERENCES Empleados(ID_Empleado),
  FOREIGN KEY (ID_Rol) REFERENCES Roles_Sistema(ID_Rol)
);

CREATE UNIQUE INDEX IF NOT EXISTS UQ_Administrador_Empleado ON Administrador(ID_Empleado);
CREATE UNIQUE INDEX IF NOT EXISTS UQ_Administrador_Codigo ON Administrador(Codigo_Administrador);
CREATE INDEX IF NOT EXISTS FK_Administrador_Roles ON Administrador(ID_Rol);

INSERT INTO Administrador (ID_Administrador, ID_Empleado, Codigo_Administrador, PIN_Acceso, ID_Rol) VALUES
(1, 1, 'AD001', 'prueba123', 2);

-- --------------------------------------------------------
-- Tabla: Trabajadores
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Trabajadores (
  ID_Trabajador INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_Empleado INTEGER NOT NULL,
  Rol_Cargo TEXT NOT NULL,
  HoraIngreso TEXT,
  Codigo_Trabajador TEXT NOT NULL,
  PIN_Acceso TEXT NOT NULL,
  ID_Rol INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (ID_Empleado) REFERENCES Empleados(ID_Empleado),
  FOREIGN KEY (ID_Rol) REFERENCES Roles_Sistema(ID_Rol)
);

CREATE UNIQUE INDEX IF NOT EXISTS UQ_Trabajadores_Empleado ON Trabajadores(ID_Empleado);
CREATE UNIQUE INDEX IF NOT EXISTS UQ_Trabajadores_Codigo ON Trabajadores(Codigo_Trabajador);
CREATE INDEX IF NOT EXISTS FK_Trabajadores_Roles ON Trabajadores(ID_Rol);

INSERT INTO Trabajadores (ID_Trabajador, ID_Empleado, Rol_Cargo, HoraIngreso, Codigo_Trabajador, PIN_Acceso, ID_Rol) VALUES
(1, 2, 'Arquitecto', NULL, 'EM0038', '1020', 1),
(2, 3, 'Ingeniero de Sistemas', NULL, 'EM0014', 'XD777', 1),
(3, 4, 'Arquitecta', NULL, 'EM0030', 'ACVL2502*', 1),
(5, 6, 'Arquitecto', NULL, 'EM0009', '73064083', 1),
(6, 7, 'Abogado', NULL, 'EM0003', '0749', 1),
(7, 8, 'Abogada', NULL, 'EM0011', '9032', 1),
(8, 9, 'Arquitecto', NULL, 'EM0029', '0671', 1),
(9, 10, 'Ingeniero', NULL, 'EM0099', '3333', 1),
(10, 11, 'Ingeniero Clivil', NULL, 'EM0005', 'Wtf964003402', 1),
(11, 12, 'Sistemas', NULL, 'EM0015', '1234', 1);

-- --------------------------------------------------------
-- Tabla: Proyectos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Proyectos (
  ID_Proyecto INTEGER PRIMARY KEY AUTOINCREMENT,
  Nombre_Proyecto TEXT NOT NULL,
  Area_Departamento TEXT NOT NULL
);

INSERT INTO Proyectos (ID_Proyecto, Nombre_Proyecto, Area_Departamento) VALUES
(11, 'Creacion de planos', 'Arquitectura'),
(12, 'Creacion del apartado reporte analitico', 'Sistemas'),
(13, 'Alarma emergente', 'Sistemas'),
(14, 'ALARMA EMERGENTE DE PLAZO DE PROYECTOS', 'Sistemas');

-- --------------------------------------------------------
-- Tabla: Tareas
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Tareas (
  ID_Tarea INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_Trabajador INTEGER NOT NULL,
  ID_Administrador_Asignador INTEGER NOT NULL,
  ID_Proyecto INTEGER NOT NULL,
  Fecha TEXT NOT NULL DEFAULT (DATE('now')),
  Fecha_Inicio TEXT,
  Fecha_Entrega TEXT,
  Descripcion_Tarea TEXT NOT NULL,
  Estado_Tarea TEXT NOT NULL DEFAULT 'Asignada',
  Observaciones TEXT,
  FOREIGN KEY (ID_Trabajador) REFERENCES Trabajadores(ID_Trabajador),
  FOREIGN KEY (ID_Administrador_Asignador) REFERENCES Administrador(ID_Administrador),
  FOREIGN KEY (ID_Proyecto) REFERENCES Proyectos(ID_Proyecto) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS FK_Tareas_Administrador ON Tareas(ID_Administrador_Asignador);
CREATE INDEX IF NOT EXISTS FK_Tareas_Proyectos ON Tareas(ID_Proyecto);
CREATE INDEX IF NOT EXISTS IX_Tareas_Busqueda ON Tareas(ID_Trabajador, Fecha);

INSERT INTO Tareas (ID_Tarea, ID_Trabajador, ID_Administrador_Asignador, ID_Proyecto, Fecha, Fecha_Inicio, Fecha_Entrega, Descripcion_Tarea, Estado_Tarea, Observaciones) VALUES
(22, 2, 1, 11, '2026-09-14', '2026-09-14 13:00:00', '2026-09-14 21:50:00', 'prueba descrei´pcion', 'Asignada', NULL),
(23, 2, 1, 11, '2026-09-15', '2026-09-15 10:52:00', '2026-09-15 14:00:00', 'prueba123', 'Completada', ''),
(24, 2, 1, 12, '2026-09-15', '2026-09-15 10:52:00', '2026-09-15 14:00:00', 'prueba123', 'Completada', ''),
(25, 9, 1, 13, '2026-09-15', '2026-09-15 12:00:00', '2026-09-15 12:05:00', 'Probando la alarma emergente', 'Completada', '[ENTREGADO FUERA DE PLAZO]'),
(26, 9, 1, 14, '2026-09-15', '2026-09-15 12:16:00', '2026-09-15 12:27:00', 'probando alarma', 'Completada', ''),
(27, 1, 1, 14, '2026-09-15', '2026-09-15 12:33:00', '2026-09-15 12:39:00', 'prUEBA NUMERO 3 DE LA ALARMA', 'Asignada', NULL),
(28, 9, 1, 14, '2026-09-15', '2026-09-15 12:33:00', '2026-09-15 12:39:00', 'prUEBA NUMERO 3 DE LA ALARMA', 'Asignada', NULL),
(29, 9, 1, 14, '2026-09-15', '2026-09-15 12:47:00', '2026-09-15 12:54:00', 'prueba numero 4', 'En Progreso', ''),
(30, 9, 1, 14, '2026-09-15', '2026-09-15 13:00:00', '2026-09-15 13:03:00', 'Prueba numero 4', 'Asignada', NULL),
(31, 9, 1, 14, '2026-09-15', '2026-09-15 13:06:00', '2026-09-15 13:08:00', 'Prueba numero 6', 'Asignada', NULL),
(37, 2, 1, 13, '2026-09-18', '2026-09-18 14:11:00', '2026-09-18 14:20:00', 'prueba de alarma definitiva', 'Asignada', NULL);

-- --------------------------------------------------------
-- Tabla: Actividades
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Actividades (
  ID_Actividad INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_Tarea INTEGER NOT NULL,
  Fecha_Actividad TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Descripcion_Actividad TEXT NOT NULL,
  Estado_Actividad TEXT NOT NULL DEFAULT 'Pendiente' CHECK (Estado_Actividad IN ('Pendiente', 'En Progreso', 'Completada')),
  Observaciones TEXT,
  FOREIGN KEY (ID_Tarea) REFERENCES Tareas(ID_Tarea)
);

CREATE INDEX IF NOT EXISTS FK_Actividades_Tareas ON Actividades(ID_Tarea);

-- --------------------------------------------------------
-- Tabla: Archivos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Archivos (
  ID_Archivo INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_Trabajador INTEGER NOT NULL,
  ID_Tarea INTEGER DEFAULT NULL,
  ID_Actividad INTEGER DEFAULT NULL,
  Nombre_Original TEXT NOT NULL,
  Nombre_Almacenado TEXT NOT NULL,
  Tipo_Archivo TEXT NOT NULL,
  Tamano_Archivo INTEGER NOT NULL,
  GoogleDrive_File_ID TEXT NOT NULL,
  Ruta_GoogleDrive TEXT DEFAULT NULL,
  Fecha_Subida TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Estado TEXT NOT NULL DEFAULT 'Activo' CHECK (Estado IN ('Activo', 'Eliminado')),
  FOREIGN KEY (ID_Trabajador) REFERENCES Trabajadores(ID_Trabajador) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Tarea) REFERENCES Tareas(ID_Tarea) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Actividad) REFERENCES Actividades(ID_Actividad) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS UQ_Archivos_GoogleDrive ON Archivos(GoogleDrive_File_ID);
CREATE INDEX IF NOT EXISTS FK_Archivos_Trabajadores ON Archivos(ID_Trabajador);
CREATE INDEX IF NOT EXISTS FK_Archivos_Tareas ON Archivos(ID_Tarea);
CREATE INDEX IF NOT EXISTS FK_Archivos_Actividades ON Archivos(ID_Actividad);

-- --------------------------------------------------------
-- Tabla: Asistencia
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Asistencia (
  ID_Asistencia INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_Trabajador INTEGER NOT NULL,
  Fecha_Entrada TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Fecha_Salida TEXT DEFAULT NULL,
  Fecha_Calculada TEXT GENERATED ALWAYS AS (DATE(Fecha_Entrada)) STORED,
  Estado_Asistencia TEXT GENERATED ALWAYS AS (
    CASE WHEN TIME(Fecha_Entrada) <= '09:40:00' THEN 'A tiempo' ELSE 'Tardanza' END
  ) STORED,
  FOREIGN KEY (ID_Trabajador) REFERENCES Trabajadores(ID_Trabajador)
);

CREATE UNIQUE INDEX IF NOT EXISTS UQ_Trabajador_Fecha ON Asistencia(ID_Trabajador, Fecha_Calculada);

INSERT INTO Asistencia (ID_Asistencia, ID_Trabajador, Fecha_Entrada, Fecha_Salida) VALUES
(1, 1, '2026-08-17 09:00:00', NULL),
(2, 2, '2026-08-17 09:30:00', NULL),
(3, 1, '2026-08-24 14:23:35', NULL),
(4, 2, '2026-08-24 14:43:16', NULL),
(5, 2, '2026-08-25 10:45:09', NULL),
(6, 9, '2026-08-25 14:44:53', '2026-08-25 14:45:01'),
(7, 2, '2026-08-31 09:39:14', '2026-08-31 14:40:32'),
(8, 9, '2026-08-31 09:39:55', '2026-08-31 14:40:00'),
(9, 10, '2026-08-31 12:07:24', NULL),
(10, 2, '2026-09-01 09:33:34', '2026-09-01 13:39:43'),
(11, 9, '2026-09-01 09:57:29', '2026-09-01 13:31:42'),
(12, 5, '2026-09-01 13:51:09', '2026-09-01 13:51:24'),
(13, 10, '2026-09-01 13:52:32', '2026-09-01 18:06:57'),
(14, 5, '2026-09-02 09:26:57', '2026-09-02 17:40:09'),
(15, 5, '2026-09-03 09:18:07', NULL),
(16, 2, '2026-09-07 09:28:08', '2026-09-07 13:56:20'),
(17, 3, '2026-09-07 09:29:00', '2026-09-07 17:03:47'),
(18, 1, '2026-09-07 09:30:34', '2026-09-07 17:02:09'),
(19, 11, '2026-09-07 09:30:35', '2026-09-07 13:57:27'),
(20, 5, '2026-09-07 09:31:55', NULL),
(21, 7, '2026-09-07 09:34:25', NULL),
(22, 9, '2026-09-07 09:41:52', '2026-09-07 13:56:43'),
(23, 6, '2026-09-07 09:50:07', NULL),
(24, 7, '2026-09-08 09:23:54', NULL),
(25, 9, '2026-09-08 09:24:19', '2026-09-08 13:15:32'),
(26, 2, '2026-09-08 09:28:11', '2026-09-08 13:15:16'),
(27, 6, '2026-09-08 09:33:56', NULL),
(28, 5, '2026-09-08 11:34:55', '2026-09-08 17:15:26'),
(29, 7, '2026-09-09 09:26:45', NULL),
(30, 5, '2026-09-09 09:54:42', NULL),
(31, 6, '2026-09-09 10:19:41', NULL),
(32, 10, '2026-09-09 11:18:41', NULL),
(33, 7, '2026-09-10 09:26:03', NULL),
(34, 6, '2026-09-10 09:38:26', NULL),
(35, 3, '2026-09-10 09:42:34', '2026-09-10 17:34:26'),
(36, 1, '2026-09-10 09:43:13', NULL),
(37, 5, '2026-09-11 10:39:59', NULL),
(38, 11, '2026-09-11 11:15:20', '2026-09-11 14:52:55'),
(39, 10, '2026-09-11 13:38:05', NULL),
(40, 9, '2026-09-14 09:09:35', '2026-09-14 14:00:07'),
(41, 7, '2026-09-14 09:20:16', NULL),
(42, 2, '2026-09-14 09:25:02', '2026-09-14 13:59:58'),
(43, 1, '2026-09-14 09:36:15', '2026-09-14 17:08:02'),
(44, 5, '2026-09-14 09:50:46', NULL),
(45, 11, '2026-09-14 09:57:19', '2026-09-14 14:01:09'),
(46, 6, '2026-09-14 09:59:11', NULL),
(47, 10, '2026-09-14 12:15:05', NULL),
(48, 9, '2026-09-15 09:12:00', '2026-09-15 13:32:25'),
(49, 7, '2026-09-15 09:28:53', NULL),
(50, 5, '2026-09-15 09:37:31', NULL),
(51, 6, '2026-09-15 09:38:15', NULL),
(52, 2, '2026-09-15 09:55:50', '2026-09-15 13:34:59'),
(53, 10, '2026-09-15 10:32:36', NULL),
(54, 7, '2026-09-16 09:27:44', NULL),
(55, 5, '2026-09-16 09:33:45', '2026-09-16 17:22:50'),
(56, 6, '2026-09-16 09:42:44', NULL),
(57, 2, '2026-09-16 16:01:13', NULL),
(58, 9, '2026-09-16 20:16:58', NULL),
(59, 7, '2026-09-17 09:29:56', NULL),
(60, 6, '2026-09-17 09:32:31', NULL),
(61, 5, '2026-09-17 09:38:03', NULL),
(62, 3, '2026-09-17 09:46:28', '2026-09-17 17:10:32'),
(63, 1, '2026-09-17 09:47:45', '2026-09-17 17:11:06'),
(64, 9, '2026-09-17 16:00:15', '2026-09-17 21:23:22'),
(65, 11, '2026-09-17 16:49:51', '2026-09-17 21:54:33'),
(66, 2, '2026-09-17 16:58:35', '2026-09-17 21:04:40'),
(67, 2, '2026-09-18 09:23:31', '2026-09-18 14:27:26'),
(68, 7, '2026-09-18 09:30:32', NULL),
(69, 11, '2026-09-18 09:37:32', '2026-09-18 14:01:52'),
(70, 6, '2026-09-18 09:40:59', NULL),
(71, 5, '2026-09-18 09:52:31', NULL),
(72, 9, '2026-09-18 16:21:13', NULL),
(73, 9, '2026-09-21 09:15:57', NULL),
(74, 7, '2026-09-21 09:21:27', NULL),
(75, 11, '2026-09-21 09:31:13', NULL),
(76, 2, '2026-09-21 09:35:35', NULL),
(77, 6, '2026-09-21 09:41:41', NULL),
(78, 3, '2026-09-21 09:57:02', NULL),
(79, 1, '2026-09-21 09:58:53', NULL);

-- --------------------------------------------------------
-- Tabla: Comentarios_Tarea
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Comentarios_Tarea (
  ID_Comentario INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_Tarea INTEGER NOT NULL,
  Autor TEXT NOT NULL,
  Rol TEXT NOT NULL CHECK (Rol IN ('Administrador', 'Empleado')),
  Mensaje TEXT NOT NULL,
  Fecha TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ID_Tarea) REFERENCES Tareas(ID_Tarea) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_Comentarios_Tarea_Busqueda ON Comentarios_Tarea(ID_Tarea, Fecha);

INSERT INTO Comentarios_Tarea (ID_Comentario, ID_Tarea, Autor, Rol, Mensaje, Fecha) VALUES
(34, 22, 'Benjamin Alfonso', 'Empleado', 'confirmada la tarea', '2026-09-14 12:55:19'),
(35, 22, 'Administrador General', 'Administrador', 'bien', '2026-09-14 12:56:04'),
(36, 23, 'Benjamin Alfonso', 'Empleado', 'OK LO TENDRA AHORA MISMO', '2026-09-15 10:53:26'),
(37, 23, 'Administrador General', 'Administrador', 'ya XD', '2026-09-15 10:53:53'),
(38, 24, 'Benjamin Alfonso', 'Empleado', 'Hola arquitecto ahora mismo le envio el reporte de los empleados del mes', '2026-09-15 11:37:49'),
(39, 24, 'Administrador General', 'Administrador', 'ALTOQUE', '2026-09-15 11:38:07'),
(40, 26, 'Israel Rodrigo Ochoa Mejia', 'Empleado', 'hola', '2026-09-15 12:24:59'),
(41, 26, 'Administrador General', 'Administrador', 'vuelve a hacerlo bien', '2026-09-15 12:25:43'),
(42, 24, 'Administrador General', 'Administrador', 'listo cholo', '2026-09-15 12:41:21'),
(43, 29, 'Israel Rodrigo Ochoa Mejia', 'Empleado', 'yaaa', '2026-09-15 12:49:16'),
(44, 29, 'Israel Rodrigo Ochoa Mejia', 'Empleado', 'XD', '2026-09-15 12:50:23');

-- --------------------------------------------------------
-- Tabla: Evaluaciones_Rendimiento
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Evaluaciones_Rendimiento (
  ID_Evaluacion INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_Trabajador INTEGER NOT NULL,
  ID_Administrador INTEGER NOT NULL,
  Periodo_Texto TEXT DEFAULT NULL,
  Fecha_Inicio TEXT DEFAULT NULL,
  Fecha_Fin TEXT DEFAULT NULL,
  Total_Asistencias INTEGER DEFAULT NULL,
  Llegadas_Tiempo INTEGER DEFAULT NULL,
  Tardanzas INTEGER DEFAULT NULL,
  Total_Tareas INTEGER DEFAULT NULL,
  Tareas_Completadas INTEGER DEFAULT NULL,
  Eficiencia_Porcentaje REAL DEFAULT NULL,
  Fecha_Generacion TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ID_Trabajador) REFERENCES Trabajadores(ID_Trabajador) ON DELETE CASCADE,
  FOREIGN KEY (ID_Administrador) REFERENCES Administrador(ID_Administrador)
);

CREATE INDEX IF NOT EXISTS IX_Evaluaciones_Trabajador ON Evaluaciones_Rendimiento(ID_Trabajador);
CREATE INDEX IF NOT EXISTS IX_Evaluaciones_Administrador ON Evaluaciones_Rendimiento(ID_Administrador);

INSERT INTO Evaluaciones_Rendimiento (ID_Evaluacion, ID_Trabajador, ID_Administrador, Periodo_Texto, Fecha_Inicio, Fecha_Fin, Total_Asistencias, Llegadas_Tiempo, Tardanzas, Total_Tareas, Tareas_Completadas, Eficiencia_Porcentaje, Fecha_Generacion) VALUES
(1, 9, 1, 'Esta Semana', '2026-09-14', '2026-09-20', 2, 2, 0, 6, 2, 33.30, '2026-09-15 18:12:19');