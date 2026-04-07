import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import { NIVEL_COLOR as nivelColor } from '../constants/colores'

export default function PerfilAlumno({ seccion = 'perfil' }) {
  const { perfil } = useAuth()
  const [estudiante, setEstudiante] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (perfil?.estudiante_id) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    setLoading(true)
    const { data: est } = await supabase
      .from('estudiantes')
      .select('*, grados(nombre, nivel, componentes_nota)')
      .eq('id', perfil.estudiante_id)
      .single()
    setEstudiante(est)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #f0ecf8', borderTopColor: '#5B2D8E', animation: 'spin 0.8s linear infinite' }} />
        <style>{"@keyframes spin { to { transform: rotate(360deg) } }"}</style>
        <span style={{ fontSize: 13, color: '#b0a8c0', fontWeight: 500 }}>Cargando...</span>
      </div>
    </div>
  )

  if (!estudiante) return (
    <div style={{ textAlign: 'center', padding: 48, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ color: '#b0a8c0', fontSize: 13 }}>No se encontró un estudiante vinculado a tu cuenta.</div>
    </div>
  )

  const nivel     = nivelColor[estudiante.grados?.nivel] || nivelColor.primaria
  const iniciales = `${estudiante.nombre?.charAt(0) || ''}${estudiante.apellido?.charAt(0) || ''}`

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', maxWidth: 760, margin: '0 auto' }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      {seccion === 'perfil' && (
        <div style={{
          background: 'linear-gradient(135deg, #1a0d30 0%, #3d1f61 60%, #5B2D8E 100%)',
          borderRadius: 24, padding: '28px 24px 24px', marginBottom: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.05,
            backgroundImage: 'radial-gradient(circle at 20% 50%, #D4A017 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 40%)',
          }} />
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(212,160,23,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #D4A017, #b8860b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 24, letterSpacing: '-0.5px',
              boxShadow: '0 0 0 3px rgba(212,160,23,0.3), 0 8px 24px rgba(0,0,0,0.3)',
            }}>
              {iniciales}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>
                Estudiante CBIS
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', lineHeight: 1.2, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {estudiante.nombre} {estudiante.apellido}
              </div>
              <span style={{ ...nivel, padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                {estudiante.grados?.nombre}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── MI PERFIL ────────────────────────────────────────── */}
      {seccion === 'perfil' && (
        <div>
          <SectionLabel>Información Personal</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Nombre completo',      val: `${estudiante.nombre} ${estudiante.apellido}` },
              { label: 'NIE',                  val: estudiante.nie },
              { label: 'Género',               val: estudiante.genero },
              { label: 'Fecha de nacimiento',  val: estudiante.fecha_nacimiento ? new Date(estudiante.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-SV') : null },
              { label: 'Correo institucional', val: estudiante.correo_institucional },
              { label: 'Dirección',            val: estudiante.direccion },
              { label: 'Municipio',            val: estudiante.municipio },
            ].map(({ label, val }) => (
              <InfoCard key={label} label={label} val={val} />
            ))}
          </div>

          <SectionLabel>Encargado</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {[
              { label: 'Nombre',   val: estudiante.nombre_tutor || estudiante.nombre_padre || estudiante.nombre_madre },
              { label: 'Teléfono', val: estudiante.telefono_tutor || estudiante.telefono_padre || estudiante.telefono_madre },
            ].map(({ label, val }) => (
              <InfoCard key={label} label={label} val={val} />
            ))}
          </div>
        </div>
      )}

      {/* ── MIS NOTAS ────────────────────────────────────────── */}
      {seccion === 'notas' && (
        <Boletin
          estudianteId={perfil?.estudiante_id}
          gradoId={perfil?.grado_id || estudiante?.grado_id}
          nivel={estudiante?.grados?.nivel}
          componentesNota={estudiante?.grados?.componentes_nota}
        />
      )}

    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, marginTop: 4 }}>
      {children}
    </div>
  )
}

function InfoCard({ label, val }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 6px rgba(61,31,97,0.06)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 14, color: val ? '#1a0d30' : '#d1d5db', fontWeight: val ? 600 : 400 }}>{val || '—'}</div>
    </div>
  )
}

// ── Boletín ───────────────────────────────────────────────
const PESOS_NOTA = { ac: 0.35, ai: 0.35, em: 0.10, ep: 0.10, ef: 0.20 }

function calcNFT(componentes, notasMap) {
  const vals = componentes.map(c => notasMap[c])
  if (vals.some(v => v === null || v === undefined)) return null
  return componentes.reduce((sum, c) => sum + parseFloat(notasMap[c]) * PESOS_NOTA[c], 0)
}

function colorNota(n) {
  if (n === null || n === undefined) return '#d1d5db'
  if (n < 5)  return '#ef4444'
  if (n < 7)  return '#f59e0b'
  return '#22c55e'
}
function bgNota(n) {
  if (n === null || n === undefined) return '#f9fafb'
  if (n < 5)  return '#fef2f2'
  if (n < 7)  return '#fffbeb'
  return '#f0fdf4'
}

function Boletin({ estudianteId, gradoId, nivel, componentesNota }) {
  const { yearEscolar } = useYearEscolar()
  const [materias, setMaterias]   = useState([])
  const [notas, setNotas]         = useState({})
  const [loading, setLoading]     = useState(true)
  const [periodoTab, setPeriodoTab] = useState(1)

  const componentes  = componentesNota?.split(',') || ['ac', 'ai', 'em', 'ef']
  const numPeriodos  = nivel === 'bachillerato' ? 4 : 3
  const periodoLabel = nivel === 'bachillerato' ? 'Bimestre' : 'Trimestre'

  useEffect(() => {
    const year = yearEscolar || new Date().getFullYear()
    if (!estudianteId || !gradoId) return
    async function cargar() {
      setLoading(true)
      const [{ data: mgs }, { data: ns }] = await Promise.all([
        supabase.from('materia_grado').select('materia_id').eq('grado_id', gradoId),
        supabase.from('notas').select('*').eq('estudiante_id', estudianteId).eq('grado_id', gradoId).eq('año_escolar', year),
      ])
      if (mgs?.length) {
        const ids = mgs.map(m => m.materia_id)
        const { data: ms } = await supabase.from('materias').select('id, nombre').in('id', ids).order('nombre')
        setMaterias(ms || [])
      }
      const mapa = {}
      for (const n of (ns || [])) mapa[`${n.materia_id}-${n.periodo}-${n.tipo}`] = n.nota
      setNotas(mapa)
      setLoading(false)
    }
    cargar()
  }, [estudianteId, gradoId, yearEscolar])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>Cargando boletín...</div>

  if (!materias.length) return (
    <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px rgba(61,31,97,0.06)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f3eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9b8e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61', marginBottom: 6 }}>Aún no hay notas registradas</div>
      <div style={{ fontSize: 13, color: '#9ca3af' }}>Las notas aparecerán aquí una vez que el docente las registre.</div>
    </div>
  )

  const materiasConNotas = materias.map(m => {
    const nftsPeriodo = Array.from({ length: numPeriodos }, (_, i) => {
      const map = {}
      for (const c of componentes) map[c] = notas[`${m.id}-${i + 1}-${c}`] ?? null
      return calcNFT(componentes, map)
    })
    const validos = nftsPeriodo.filter(v => v !== null)
    const acu = validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : null
    return { ...m, nftsPeriodo, acu }
  })

  const notasPeriodo = periodoTab > 0
    ? materiasConNotas.map(m => m.nftsPeriodo[periodoTab - 1]).filter(v => v !== null)
    : materiasConNotas.map(m => m.acu).filter(v => v !== null)
  const promedio = notasPeriodo.length ? notasPeriodo.reduce((a, b) => a + b, 0) / notasPeriodo.length : null

  return (
    <div>
      {/* Tabs período */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
        {Array.from({ length: numPeriodos }, (_, i) => {
          const p = i + 1
          const activo = periodoTab === p
          return (
            <button key={p} onClick={() => setPeriodoTab(p)} style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: activo ? 700 : 600,
              background: activo ? '#1a0d30' : '#fff',
              color: activo ? '#fff' : '#9ca3af',
              boxShadow: activo ? '0 4px 12px rgba(26,13,48,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
              flexShrink: 0, transition: 'all 0.15s',
            }}>
              {periodoLabel} {p}
            </button>
          )
        })}
        <button onClick={() => setPeriodoTab(0)} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13, fontWeight: periodoTab === 0 ? 700 : 600,
          background: periodoTab === 0 ? '#D4A017' : '#fff',
          color: periodoTab === 0 ? '#fff' : '#9ca3af',
          boxShadow: periodoTab === 0 ? '0 4px 12px rgba(212,160,23,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
          flexShrink: 0, marginLeft: 'auto', transition: 'all 0.15s',
        }}>
          Acumulado
        </button>
      </div>

      {/* Promedio */}
      {promedio !== null && (
        <div style={{
          background: 'linear-gradient(135deg, #1a0d30, #3d1f61)',
          borderRadius: 16, padding: '16px 20px', marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 2 }}>
              Promedio {periodoTab === 0 ? 'Acumulado' : `${periodoLabel} ${periodoTab}`}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: colorNota(promedio), letterSpacing: '-0.5px' }}>
              {promedio.toFixed(2)}
            </div>
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `conic-gradient(${colorNota(promedio)} ${(promedio / 10) * 360}deg, rgba(255,255,255,0.1) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#2d1554', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: colorNota(promedio) }}>{Math.round((promedio / 10) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista materias */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {materiasConNotas.map(m => {
          const nota = periodoTab === 0 ? m.acu : m.nftsPeriodo[periodoTab - 1]
          const pct  = nota !== null ? Math.min((nota / 10) * 100, 100) : 0
          return (
            <div key={m.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 6px rgba(61,31,97,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a0d30', flex: 1, paddingRight: 12 }}>{m.nombre}</div>
                <span style={{
                  fontSize: 16, fontWeight: 900, color: colorNota(nota),
                  background: bgNota(nota), padding: '3px 12px', borderRadius: 8,
                  minWidth: 52, textAlign: 'center', flexShrink: 0,
                }}>
                  {nota !== null ? nota.toFixed(2) : '—'}
                </span>
              </div>
              <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: nota !== null ? `${pct}%` : '0%',
                  background: nota === null ? '#e5e7eb' : nota < 5 ? '#ef4444' : nota < 7 ? '#f59e0b' : '#22c55e',
                  transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
