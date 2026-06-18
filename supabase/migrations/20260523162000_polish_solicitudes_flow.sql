alter table public.solicitudes
  drop constraint if exists solicitudes_tipo_check;

alter table public.solicitudes
  add constraint solicitudes_tipo_check
  check (
    tipo = any (
      array[
        'desbloqueo_notas'::text,
        'modificar_asistencia'::text,
        'cita_padres'::text,
        'permiso_personal'::text,
        'permiso_ausencia'::text,
        'llegada_tardia'::text,
        'retiro_anticipado'::text,
        'reunion_encargado'::text,
        'reunion_direccion'::text,
        'constancia_pago'::text,
        'constancia_estudio'::text
      ]
    )
  );

drop policy if exists "Recepción ve solicitudes operativas" on public.solicitudes;
create policy "Recepción ve solicitudes operativas"
  on public.solicitudes
  for select
  using (
    exists (
      select 1
      from public.perfiles
      where perfiles.id = auth.uid()
        and perfiles.rol = 'recepcion'
    )
    and tipo = any (
      array[
        'constancia_pago'::text,
        'constancia_estudio'::text,
        'llegada_tardia'::text,
        'retiro_anticipado'::text
      ]
    )
  );

drop policy if exists "Recepción gestiona solicitudes operativas" on public.solicitudes;
create policy "Recepción gestiona solicitudes operativas"
  on public.solicitudes
  for update
  using (
    exists (
      select 1
      from public.perfiles
      where perfiles.id = auth.uid()
        and perfiles.rol = 'recepcion'
    )
    and tipo = any (
      array[
        'constancia_pago'::text,
        'constancia_estudio'::text,
        'llegada_tardia'::text,
        'retiro_anticipado'::text
      ]
    )
  )
  with check (
    exists (
      select 1
      from public.perfiles
      where perfiles.id = auth.uid()
        and perfiles.rol = 'recepcion'
    )
    and tipo = any (
      array[
        'constancia_pago'::text,
        'constancia_estudio'::text,
        'llegada_tardia'::text,
        'retiro_anticipado'::text
      ]
    )
  );
