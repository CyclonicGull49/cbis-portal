import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

import { lazy, Suspense } from 'react'
const Estudiantes   = lazy(() => import('./Estudiantes'))
const Cobros        = lazy(() => import('./Cobros'))
const Contabilidad  = lazy(() => import('./Contabilidad'))
const Usuarios      = lazy(() => import('./Usuarios'))
const Configuracion = lazy(() => import('./Configuracion'))
const Matricula     = lazy(() => import('./Matricula'))
const Reportes      = lazy(() => import('./Reportes'))
const Notas         = lazy(() => import('./Notas'))
const Boletas       = lazy(() => import('./Boletas'))
const Asistencia    = lazy(() => import('./Asistencia'))
const PerfilAlumno  = lazy(() => import('./PerfilAlumno'))
const Solicitudes   = lazy(() => import('./Solicitudes'))
const Calendario    = lazy(() => import('./Calendario'))
const Horario       = lazy(() => import('./Horario'))
const Anecdotario   = lazy(() => import('./Anecdotario'))




const IcoEstudiantes = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)
const IcoCobradoHoy = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    <line x1="7" y1="15" x2="7.01" y2="15" strokeWidth="3"/>
  </svg>
)
const IcoMes = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const IcoPendiente = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IcoVencidos = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>
  </svg>
)
const IcoNotas = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="13" y1="17" x2="8" y2="17"/>
  </svg>
)
const IcoMaterias = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)
const IcoDocente = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
    <polyline points="9 11 12 14 15 11"/>
  </svg>
)

const NIVEL_COLOR = {
  primera_infancia: { bg: '#e0f7f6', color: '#0e9490', bar: '#0e9490', label: 'Primera Infancia' },
  primaria:         { bg: '#fef9c3', color: '#a16207', bar: '#D4A017', label: 'Primaria' },
  secundaria:       { bg: '#fff0e6', color: '#c2410c', bar: '#c2410c', label: 'Secundaria' },
  bachillerato:     { bg: '#f3eeff', color: '#5B2D8E', bar: '#5B2D8E', label: 'Bachillerato' },
}

const TIPO_COLOR = { examen: '#dc2626', excursion: '#0e9490', feriado: '#d97706', actividad: '#5B2D8E', otro: '#6b7280' }
const TIPO_BG    = { examen: '#fef2f2', excursion: '#e0f7f6', feriado: '#fffbeb', actividad: '#f3eeff', otro: '#f9fafb' }

function DashboardHome() {
  const { perfil } = useAuth()
  const rol = perfil?.rol
  const isMobile = window.innerWidth < 768

  const verFinanzas      = ['admin', 'recepcion', 'direccion_academica'].includes(rol)
  const verAcademico     = ['admin', 'direccion_academica', 'registro_academico'].includes(rol)
  const verDocente       = rol === 'docente'
  const verAlumno        = rol === 'alumno'
  const verTalentoHumano = rol === 'talento_humano'
  const verDistribucion  = !verDocente && !verAlumno

  const [stats, setStats] = useState({
    totalEstudiantes: 0, estudiantesActivos: 0,
    cobradoHoy: 0, totalMes: 0,
    cobrosPendientes: 0, cobrosVencidos: 0,
    totalPendiente: 0, anuladosMes: 0,
    pagosRecientes: [], porNivel: [], maxNivel: 1,
    notasRegistradas: 0, totalMaterias: 0,
    docenteGrado: null, docenteMaterias: 0,
    esEncargado: false, gradoEncargado: null, estudiantesGrado: 0,
    proximosEventos: [],
    alumnoNotas: [], alumnoGrado: null, alumnoPendiente: 0,
    totalUsuarios: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarStats() }, [])

  async function cargarStats() {
    setLoading(true)
    const year = new Date().getFullYear()
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const hoy = new Date().toISOString().split('T')[0]

    const promises = [
      supabase.from('estudiantes').select('id, estado, grados(nivel)'),
      supabase.from('pagos').select('monto_pagado').gte('fecha_pago', hoy).neq('anulado', true),
      supabase.from('pagos').select('monto_pagado').gte('fecha_pago', inicioMes).neq('anulado', true),
      supabase.from('pagos').select('monto_pagado').gte('fecha_pago', inicioMes).eq('anulado', true),
      supabase.from('cobros').select('id, estado, monto, fecha_vencimiento').neq('estado', 'anulado'),
      supabase.from('pagos').select('id, monto_pagado, fecha_pago, estudiantes(nombre, apellido), cobros(mes, conceptos_cobro(nombre))').neq('anulado', true).order('fecha_pago', { ascending: false }).limit(6),
      supabase.from('notas').select('id', { count: 'exact', head: true }).eq('año_escolar', year),
      supabase.from('materia_grado').select('id', { count: 'exact', head: true }),
    ]

    // Próximos eventos para todos
    const { data: proxEventos } = await supabase.from('eventos_calendario')
      .select('id, titulo, fecha_inicio, tipo')
      .eq('año_escolar', year)
      .gte('fecha_inicio', hoy)
      .order('fecha_inicio')
      .limit(5)

    // Stats alumno
    let alumnoExtra = {}
    if (verAlumno && perfil?.estudiante_id) {
      const { data: alumnoNotas } = await supabase.from('notas')
        .select('nota, tipo, periodo, materias(nombre)')
        .eq('estudiante_id', perfil.estudiante_id)
        .eq('año_escolar', year)
        .order('periodo', { ascending: false })
        .limit(6)
      const { data: alumnoEst } = await supabase.from('estudiantes')
        .select('grados(nombre, nivel)').eq('id', perfil.estudiante_id).single()
      const { data: alumnoCobros } = await supabase.from('cobros')
        .select('monto, estado').eq('estudiante_id', perfil.estudiante_id).eq('estado', 'pendiente')
      alumnoExtra = {
        alumnoNotas: alumnoNotas || [],
        alumnoGrado: alumnoEst?.grados || null,
        alumnoPendiente: alumnoCobros?.reduce((a, c) => a + parseFloat(c.monto), 0) || 0,
      }
    }

    // Stats talento humano
    let talentoExtra = {}
    if (verTalentoHumano) {
      const { count: totalUsuarios } = await supabase.from('perfiles').select('id', { count: 'exact', head: true })
      talentoExtra = { totalUsuarios: totalUsuarios || 0 }
    }

    // Stats docente
    if (verDocente) {
      promises.push(
        supabase.from('asignaciones').select('grado_id, grados(nombre, nivel)').eq('docente_id', perfil.id).eq('año_escolar', year).limit(1).single(),
        supabase.from('asignaciones').select('id', { count: 'exact', head: true }).eq('docente_id', perfil.id).eq('año_escolar', year),
      )
    }

    // Encargado: fetch estudiantes de su grado
    let encargadoExtra = { esEncargado: false, gradoEncargado: null, estudiantesGrado: 0 }
    if (verDocente) {
      const { data: gradoEnc } = await supabase.from('grados')
        .select('id, nombre, nivel').eq('encargado_id', perfil.id).single()
      if (gradoEnc) {
        const { data: estsEnc } = await supabase.from('estudiantes')
          .select('id, estado').eq('grado_id', gradoEnc.id).eq('estado', 'activo')
        encargadoExtra = {
          esEncargado: true,
          gradoEncargado: gradoEnc,
          estudiantesGrado: estsEnc?.length || 0,
        }
      }
    }

    const results = await Promise.all(promises)
    const [
      { data: estudiantes },
      { data: pagosHoy },
      { data: pagosMes },
      { data: pagosAnulados },
      { data: cobros },
      { data: pagosRecientes },
      { count: notasCount },
      { count: materiasGradoCount },
    ] = results

    const nivelMap = {}
    for (const e of (estudiantes || [])) {
      if (e.estado !== 'activo') continue
      const n = e.grados?.nivel || 'otro'
      nivelMap[n] = (nivelMap[n] || 0) + 1
    }
    const nivelOrder = ['primera_infancia', 'primaria', 'secundaria', 'bachillerato']
    const porNivel = Object.entries(nivelMap)
      .map(([nivel, count]) => ({ nivel, count }))
      .sort((a, b) => nivelOrder.indexOf(a.nivel) - nivelOrder.indexOf(b.nivel))
    const maxNivel = Math.max(...porNivel.map(p => p.count), 1)

    let docenteInfo = {}
    if (verDocente && results[8]) {
      const { data: dp } = results[8]
      const { count: matCount } = results[9]
      docenteInfo = { docenteGrado: dp?.grados, docenteMaterias: matCount || 0 }
    }

    setStats({
      totalEstudiantes: estudiantes?.length || 0,
      estudiantesActivos: (estudiantes || []).filter(e => e.estado === 'activo').length,
      cobradoHoy: pagosHoy?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0,
      totalMes: pagosMes?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0,
      anuladosMes: pagosAnulados?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0,
      cobrosPendientes: cobros?.filter(c => c.estado === 'pendiente').length || 0,
      cobrosVencidos: cobros?.filter(c => c.estado === 'pendiente' && c.fecha_vencimiento && new Date(c.fecha_vencimiento) < new Date()).length || 0,
      totalPendiente: cobros?.filter(c => c.estado === 'pendiente').reduce((a, c) => a + parseFloat(c.monto), 0) || 0,
      pagosRecientes: pagosRecientes || [],
      porNivel, maxNivel,
      notasRegistradas: notasCount || 0,
      totalMaterias: materiasGradoCount || 0,
      ...docenteInfo,
      ...encargadoExtra,
      ...alumnoExtra,
      ...talentoExtra,
      proximosEventos: proxEventos || [],
    })
    setLoading(false)
  }

  const Skeleton = ({ w = 80 }) => (
    <span style={{ display: 'inline-block', width: w, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.15)', animation: 'pulse 1.5s ease-in-out infinite' }} />
  )

  function KpiCard({ icon, label, val, sub, color, acento = false }) {
    return (
      <div style={{
        background: acento ? 'linear-gradient(135deg, #1a0d30 0%, #3d1f61 100%)' : '#fff',
        borderRadius: 16,
        padding: isMobile ? '16px 20px' : '22px 24px',
        boxShadow: acento ? '0 8px 32px rgba(61,31,97,0.45)' : '0 2px 20px rgba(61,31,97,0.09)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
        minHeight: isMobile ? (acento ? 100 : 90) : 130,
      }}>
        {acento && (<>
          <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(112,60,220,0.7) 0%, transparent 70%)', filter: 'blur(35px)', top: -60, left: -30, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,88,12,0.45) 0%, transparent 70%)', filter: 'blur(28px)', bottom: -20, right: 20, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,160,23,0.35) 0%, transparent 70%)', filter: 'blur(24px)', top: 20, right: -10, pointerEvents: 'none' }} />
        </>)}
        {!acento && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '16px 0 0 16px', background: color }} />
        )}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: acento ? 'rgba(255,255,255,0.55)' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            {label}
          </div>
          {!isMobile && (
            <div style={{ color: acento ? 'rgba(255,255,255,0.6)' : color }}>{icon}</div>
          )}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: isMobile && acento ? 12 : 0 }}>
          {isMobile && acento && (
            <div style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{icon}</div>
          )}
          <div>
            <div style={{ fontSize: isMobile ? 26 : 30, fontWeight: 900, color: acento ? '#fff' : color, letterSpacing: '-1px', lineHeight: 1, marginBottom: 4 }}>
              {loading ? <Skeleton /> : val}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: acento ? 'rgba(255,255,255,0.4)' : '#c4bad4' }}>{sub}</div>
          </div>
        </div>
      </div>
    )
  }

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div style={{ maxWidth: '100%', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0d30 0%, #2d1554 50%, #5B2D8E 100%)',
        borderRadius: 20, padding: isMobile ? '20px 20px' : '28px 32px', marginBottom: 16,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(61,31,97,0.35)',
      }}>
        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(112,60,220,0.45) 0%, transparent 70%)', filter: 'blur(55px)', top: -100, right: 180, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,88,12,0.3) 0%, transparent 70%)', filter: 'blur(40px)', top: -30, right: 30, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,160,23,0.22) 0%, transparent 70%)', filter: 'blur(40px)', bottom: -50, right: 350, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, letterSpacing: '0.5px' }}>
            {new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h1 style={{ color: '#fff', fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
            {saludo}, {perfil?.nombre}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
            Colegio Bautista Internacional de Sonsonate
          </p>
        </div>
      </div>

      {/* Fila 1: Estudiantes + distribución — solo roles que deben verla */}
      {verDistribucion && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr', gap: 16, marginBottom: 16 }}>
          <KpiCard
            acento
            icon={<IcoEstudiantes />}
            label="Estudiantes activos"
            val={stats.estudiantesActivos}
            sub={`de ${stats.totalEstudiantes} matriculados`}
            color="#5B2D8E"
          />
          <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 20px rgba(61,31,97,0.09)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16 }}>
              Distribución por nivel
            </div>
            {loading ? (
              <div style={{ color: '#c4bad4', fontSize: 13 }}>Cargando...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: isMobile ? 8 : 12 }}>
                {stats.porNivel.map(({ nivel, count }) => {
                  const cfg = NIVEL_COLOR[nivel] || { bg: '#f3f4f6', color: '#6b7280', bar: '#6b7280', label: nivel }
                  const pct = Math.round((count / stats.maxNivel) * 100)
                  return (
                    <div key={nivel} style={{ padding: '12px 14px', background: cfg.bg, borderRadius: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, marginBottom: 8 }}>{cfg.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: cfg.color, lineHeight: 1, marginBottom: 8 }}>{count}</div>
                      <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: cfg.bar, borderRadius: 100, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  )
                })}
                {!stats.porNivel.length && <div style={{ color: '#c4bad4', fontSize: 13 }}>Sin datos</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fila docente encargado */}
      {verDocente && stats.esEncargado && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
          <KpiCard acento icon={<IcoEstudiantes />} label="Mis estudiantes" val={stats.estudiantesGrado} sub={stats.gradoEncargado?.nombre} color="#5B2D8E" />
          <KpiCard icon={<IcoDocente />} label="Materias asignadas" val={stats.docenteMaterias} sub={stats.docenteGrado?.nombre || 'Docente'} color="#0e9490" />
        </div>
      )}

      {/* Fila docente sin encargo */}
      {verDocente && !stats.esEncargado && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
          <KpiCard acento icon={<IcoDocente />} label="Materias asignadas" val={stats.docenteMaterias} sub={stats.docenteGrado?.nombre || 'Docente'} color="#5B2D8E" />
          <KpiCard icon={<IcoNotas />} label="Notas registradas" val={stats.notasRegistradas.toLocaleString()} sub={`año ${new Date().getFullYear()}`} color="#0e9490" />
        </div>
      )}

      {/* Fila 2: KPIs finanzas */}
      {verFinanzas && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? 10 : 16, marginBottom: 16 }}>
          <KpiCard icon={<IcoCobradoHoy />} label="Cobrado hoy"        val={`$${stats.cobradoHoy.toFixed(2)}`}     sub="ingresos del día"                             color="#16a34a" />
          <KpiCard icon={<IcoMes />}        label="Cobrado este mes"   val={`$${stats.totalMes.toFixed(2)}`}        sub="ingresos del mes"                             color="#D4A017" />
          <KpiCard icon={<IcoPendiente />}  label="Pendiente de cobro" val={`$${stats.totalPendiente.toFixed(2)}`}  sub={`${stats.cobrosPendientes} cobros pendientes`} color="#c2410c" />
          <KpiCard icon={<IcoVencidos />}   label="Cobros vencidos"    val={stats.cobrosVencidos}                   sub="requieren atención"                           color="#dc2626" />
        </div>
      )}

      {/* Fila 3: KPIs académicos */}
      {verAcademico && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
          <KpiCard icon={<IcoNotas />}    label="Notas registradas"           val={stats.notasRegistradas.toLocaleString()} sub={`año escolar ${new Date().getFullYear()}`} color="#0e9490" />
          <KpiCard icon={<IcoMaterias />} label="Combinaciones materia-grado" val={stats.totalMaterias}                     sub="en el sistema"                            color="#a16207" />
        </div>
      )}

      {/* Tabla pagos recientes */}
      {verFinanzas && (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 20px rgba(61,31,97,0.09)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3eeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: '#3d1f61', fontSize: 14, fontWeight: 800, margin: 0, marginBottom: 2 }}>Últimos pagos</h2>
              <p style={{ fontSize: 11, color: '#b0a8c0', fontWeight: 500, margin: 0 }}>Actividad más reciente</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#5B2D8E', background: '#f3eeff', padding: '4px 12px', borderRadius: 100 }}>
              {stats.pagosRecientes.length} registros
            </span>
          </div>
          {loading ? (
            <p style={{ color: '#c4bad4', textAlign: 'center', padding: 48, fontSize: 13 }}>Cargando...</p>
          ) : !stats.pagosRecientes.length ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: '#c4bad4', fontSize: 13, margin: 0 }}>Sin pagos registrados</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#faf8ff' }}>
                  {['Estudiante', 'Concepto', 'Mes', 'Monto', 'Fecha'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.pagosRecientes.map((p, idx) => {
                  const ini = `${p.estudiantes?.nombre?.charAt(0) || ''}${p.estudiantes?.apellido?.charAt(0) || ''}`
                  const hues = ['#5B2D8E','#0e9490','#a16207','#c2410c','#16a34a','#2563eb']
                  const hue = hues[idx % hues.length]
                  return (
                    <tr key={p.id} style={{ borderTop: '1px solid #f3eeff', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: hue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                            {ini}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#3d1f61' }}>{p.estudiantes?.nombre} {p.estudiantes?.apellido}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 13, color: '#6b7280' }}>{p.cobros?.conceptos_cobro?.nombre || '—'}</td>
                      <td style={{ padding: '12px 20px', fontSize: 13, color: '#6b7280' }}>{p.cobros?.mes || '—'}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a', background: '#f0fdf4', padding: '3px 10px', borderRadius: 8 }}>
                          ${parseFloat(p.monto_pagado).toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 12, color: '#b0a8c0', fontWeight: 500 }}>
                        {new Date(p.fecha_pago).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Dashboard alumno */}
      {verAlumno && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            <KpiCard acento icon={<IcoEstudiantes />} label="Mi grado" val={stats.alumnoGrado?.nombre || '—'} sub="año escolar 2026" color="#5B2D8E" />
            <KpiCard icon={<IcoNotas />} label="Notas registradas" val={stats.alumnoNotas.length} sub="este año escolar" color="#0e9490" />
            <KpiCard icon={<IcoPendiente />} label="Cobros pendientes" val={`$${stats.alumnoPendiente.toFixed(2)}`} sub="por pagar" color="#c2410c" />
          </div>
          {stats.alumnoNotas.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 20px rgba(61,31,97,0.09)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3eeff' }}>
                <h2 style={{ color: '#3d1f61', fontSize: 14, fontWeight: 800, margin: 0 }}>Mis notas recientes</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, padding: 16 }}>
                {stats.alumnoNotas.map((n, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#b0a8c0', fontWeight: 600, marginBottom: 4 }}>{n.materias?.nombre} · P{n.periodo}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: n.nota >= 7 ? '#16a34a' : n.nota >= 5 ? '#a16207' : '#dc2626' }}>{n.nota?.toFixed(1) || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dashboard talento humano */}
      {verTalentoHumano && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          <KpiCard acento icon={<IcoEstudiantes />} label="Estudiantes activos" val={stats.estudiantesActivos} sub={`de ${stats.totalEstudiantes} matriculados`} color="#5B2D8E" />
          <KpiCard icon={<IcoDocente />} label="Usuarios registrados" val={stats.totalUsuarios} sub="en el sistema" color="#0e9490" />
          <KpiCard icon={<IcoNotas />} label="Notas registradas" val={stats.notasRegistradas.toLocaleString()} sub={`año ${new Date().getFullYear()}`} color="#a16207" />
        </div>
      )}

      {/* Próximos eventos — todos los roles */}
      {stats.proximosEventos.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 20px rgba(61,31,97,0.09)', padding: '18px 24px', marginTop: 4 }}>
          <h2 style={{ color: '#3d1f61', fontSize: 14, fontWeight: 800, margin: '0 0 14px 0' }}>Próximos eventos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.proximosEventos.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: TIPO_BG[ev.tipo] || '#f9fafb', borderRadius: 10, borderLeft: `3px solid ${TIPO_COLOR[ev.tipo] || '#6b7280'}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#3d1f61' }}>{ev.titulo}</div>
                </div>
                <div style={{ fontSize: 11, color: '#b0a8c0', fontWeight: 600, flexShrink: 0 }}>
                  {new Date(ev.fecha_inicio + 'T12:00:00').toLocaleDateString('es-SV', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { perfil } = useAuth()
  const esAlumno = perfil?.rol === 'alumno'
  const [pagina, setPagina] = useState(esAlumno ? 'mi-perfil' : 'dashboard')

  function renderPagina() {
    if (pagina.startsWith('perfil-estudiante-')) {
      const puedeVerPerfil = ['admin', 'direccion_academica', 'recepcion', 'registro_academico'].includes(perfil?.rol)
      if (!puedeVerPerfil) return <Notas onVerEstudiante={id => setPagina(`perfil-estudiante-${id}`)} />
      const id = parseInt(pagina.replace('perfil-estudiante-', ''))
      return <Estudiantes estudianteIdInicial={id} onVolver={() => setPagina('notas')} />
    }
    switch (pagina) {
      case 'reportes':      return <Reportes />
      case 'solicitudes':   return <Solicitudes />
      case 'boletas':       return <Boletas />
      case 'asistencia':    return <Asistencia />
      case 'dashboard':     return <DashboardHome />
      case 'estudiantes':   return <Estudiantes />
      case 'cobros':        return <Cobros />
      case 'notas':         return <Notas onVerEstudiante={id => setPagina(`perfil-estudiante-${id}`)} />
      case 'calendario':    return <Calendario />
      case 'horario':       return <Horario />
      case 'contabilidad':  return <Contabilidad />
      case 'usuarios':      return <Usuarios />
      case 'configuracion': return <Configuracion />
      case 'matricula':     return <Matricula />
      case 'mi-perfil':     return <PerfilAlumno seccion="perfil" />
      case 'mis-cobros':    return <PerfilAlumno seccion="cobros" />
      case 'mis-docs':      return <PerfilAlumno seccion="docs" />
      case 'mis-notas':     return <PerfilAlumno seccion="notas" />
      case 'mi-config':     return <PerfilAlumno seccion="config" />
      case 'anecdotario':   return <Anecdotario />
      default:              return esAlumno ? <PerfilAlumno seccion="perfil" /> : <DashboardHome />
    }
  }

  return (
    <Layout pagina={pagina} setPagina={setPagina}>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#b0a8c0', fontSize: 14, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
          Cargando...
        </div>
      }>
        {renderPagina()}
      </Suspense>
    </Layout>
  )
}