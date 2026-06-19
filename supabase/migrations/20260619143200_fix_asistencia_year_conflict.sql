create unique index if not exists asistencia_estudiante_fecha_grado_year_uidx
on public.asistencia (estudiante_id, fecha, grado_id, año_escolar);
