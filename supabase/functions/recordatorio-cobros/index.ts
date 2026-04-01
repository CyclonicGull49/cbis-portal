import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    const hoy = new Date()
    const dia = hoy.getDate()

    // Solo corre el día 9 de cada mes
    // (el cron también lo limita, pero esto es un doble seguro)
    if (dia !== 9) {
      return new Response(JSON.stringify({ mensaje: `Hoy es día ${dia}, no es día 9. Sin acción.` }), { status: 200 })
    }

    const año = hoy.getFullYear()
    const mes = String(hoy.getMonth() + 1).padStart(2, '0')
    const fechaVenc = `${año}-${mes}-10` // vence mañana

    // Buscar cobros pendientes que vencen mañana (día 10)
    const { data: cobros, error: errCobros } = await supabase
      .from('cobros')
      .select(`
        id, monto, mes, estudiante_id,
        estudiantes(
          nombre, apellido, grado_id,
          perfiles!perfiles_estudiante_id_fkey(id, rol)
        ),
        conceptos_cobro(nombre)
      `)
      .eq('estado', 'pendiente')
      .eq('fecha_vencimiento', fechaVenc)

    if (errCobros) throw errCobros

    if (!cobros || cobros.length === 0) {
      return new Response(JSON.stringify({ mensaje: 'Sin cobros pendientes para mañana.' }), { status: 200 })
    }

    // Agrupar por padre/alumno para evitar notifs duplicadas
    const notifMap: Record<string, { monto: number, cobros: string[], estudianteNombre: string }> = {}

    for (const cobro of cobros) {
      const est = cobro.estudiantes as any
      if (!est) continue

      // Buscar perfil del alumno directamente
      const { data: perfilAlumno } = await supabase
        .from('perfiles')
        .select('id')
        .eq('estudiante_id', cobro.estudiante_id)
        .eq('rol', 'alumno')
        .single()

      // Buscar padres vinculados al estudiante
      const { data: padres } = await supabase
        .from('perfiles')
        .select('id')
        .eq('estudiante_id', cobro.estudiante_id)
        .eq('rol', 'padre')

      const destinatarios = [
        ...(perfilAlumno ? [perfilAlumno.id] : []),
        ...((padres || []).map((p: any) => p.id)),
      ]

      const nombreConcepto = (cobro.conceptos_cobro as any)?.nombre || 'cuota'
      const nombreEst = `${est.nombre} ${est.apellido}`

      for (const uid of destinatarios) {
        if (!notifMap[uid]) {
          notifMap[uid] = { monto: 0, cobros: [], estudianteNombre: nombreEst }
        }
        notifMap[uid].monto += parseFloat(cobro.monto)
        notifMap[uid].cobros.push(nombreConcepto)
      }
    }

    // Insertar notificaciones en lotes de 50
    const notifs = Object.entries(notifMap).map(([uid, info]) => ({
      usuario_id: uid,
      tipo: 'pago',
      titulo: 'Cobro vence mañana',
      mensaje: `Tu pago de $${info.monto.toFixed(2)} (${info.cobros.join(', ')}) vence mañana. Acércate a recepción para evitar cargos.`,
      link: 'mis-cobros',
    }))

    let insertados = 0
    for (let i = 0; i < notifs.length; i += 50) {
      const { error } = await supabase.from('notificaciones').insert(notifs.slice(i, i + 50))
      if (!error) insertados += Math.min(50, notifs.length - i)
    }

    return new Response(
      JSON.stringify({
        mensaje: `Recordatorios enviados`,
        cobros_procesados: cobros.length,
        notificaciones_enviadas: insertados,
        fecha_vencimiento: fechaVenc,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    console.error('Error en recordatorio-cobros:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
