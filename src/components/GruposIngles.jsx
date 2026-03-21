import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

const GRADOS_INGLES = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

export default function GruposIngles() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()

  const isAdmin = perfil?.rol === 'admin'
  const isRegistro = perfil?.rol === 'registro_academico'
  const isDocenteIngles = perfil?.rol === 'docente'
  const puedeEditar = isAdmin || isRegistro || isDocenteIngles

  const [grupos, setGrupos]           = useState([])
  const [grupoId, setGrupoId]         = useState(null)
  const [grupoInfo, setGrupoInfo]     = useState(null)
  const [asignados, setAsignados]     = useState([])
  const [todos, setTodos]             = useState([])
  const [busqueda, setBusqueda]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [guardando, setGuardando]     = useState(false)

  // Cargar grupos al iniciar
  useEffect(() => {
    async function cargar() {
      let q = supabase.from('grupos_especiales')
        .select('id, nombre, docente_nombre, docente_id')
        .eq('año_escolar', year)
      // Si es docente, solo sus grupos
      if (isDocenteIngles) q = q.eq('docente_id', perfil.id)
      const { data } = await q.order('orden')
      setGrupos(data || [])
    }
    cargar()
  }, [year, perfil])

  // Cargar estudiantes elegibles (7°–Bach) al iniciar
  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('estudiantes')
        .select('id, nombre, apellido, grado_id, grados(nombre)')
        .in('grado_id', GRADOS_INGLES)
        .eq('estado', 'activo')
        .order('apellido')
      setTodos(data || [])
    }
    cargar()
  }, [])

  // Cargar asignados al seleccionar grupo
  useEffect(() => {
    if (!grupoId) return
    async function cargar() {
      setLoading(true)
      const { data } = await supabase
        .from('estudiante_grupo')
        .select('id, estudiante_id, estudiantes(id, nombre, apellido, grado_id, grados(nombre))')
        .eq('grupo_id', grupoId)
        .eq('año_escolar', year)
      setAsignados((data || []).map(d => ({ ...d.estudiantes, eg_id: d.id })))
      setLoading(false)
    }
    cargar()
  }, [grupoId, year])

  const asignadosIds = new Set(asignados.map(e => e.id))

  const disponibles = todos.filter(e =>
    !asignadosIds.has(e.id) && (
      busqueda === '' ||
      `${e.apellido} ${e.nombre}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      `${e.nombre} ${e.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
    )
  )

  async function asignar(est) {
    if (!puedeEditar) return
    // Verificar si ya está en otro grupo
    const { data: existing } = await supabase
      .from('estudiante_grupo')
      .select('id, grupo_id, grupos_especiales(nombre)')
      .eq('estudiante_id', est.id)
      .eq('año_escolar', year)
      .single()

    if (existing) {
      const confirmar = window.confirm(
        `${est.apellido}, ${est.nombre} ya está en el grupo "${existing.grupos_especiales?.nombre}". ¿Deseas moverlo a este grupo?`
      )
      if (!confirmar) return
      // Eliminar del grupo anterior
      await supabase.from('estudiante_grupo').delete().eq('id', existing.id)
    }

    setGuardando(true)
    const { error } = await supabase.from('estudiante_grupo').insert({
      estudiante_id: est.id,
      grupo_id: grupoId,
      año_escolar: year,
    })
    if (error) {
      toast.error('Error al asignar estudiante')
    } else {
      setAsignados(prev => [...prev, { ...est, eg_id: null }])
      toast.success(`${est.apellido}, ${est.nombre} asignado`)
      // Recargar para obtener eg_id real
      const { data } = await supabase
        .from('estudiante_grupo')
        .select('id, estudiante_id, estudiantes(id, nombre, apellido, grado_id, grados(nombre))')
        .eq('grupo_id', grupoId).eq('año_escolar', year)
      setAsignados((data || []).map(d => ({ ...d.estudiantes, eg_id: d.id })))
    }
    setGuardando(false)
  }

  async function remover(est) {
    if (!puedeEditar) return
    const confirmar = window.confirm(`¿Remover a ${est.apellido}, ${est.nombre} del grupo?`)
    if (!confirmar) return
    setGuardando(true)
    const { error } = await supabase
      .from('estudiante_grupo')
      .delete()
      .eq('id', est.eg_id)
    if (error) {
      toast.error('Error al remover')
    } else {
      setAsignados(prev => prev.filter(e => e.id !== est.id))
      toast.success('Estudiante removido del grupo')
    }
    setGuardando(false)
  }

  // Agrupar asignados por grado
  const asignadosPorGrado = asignados.reduce((acc, e) => {
    const g = e.grados?.nombre || 'Sin grado'
    if (!acc[g]) acc[g] = []
    acc[g].push(e)
    return acc
  }, {})

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden', borderTop: '4px solid #0e9490', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3eeff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: '#e0f7f6', borderRadius: 10, padding: '8px 10px', color: '#0e9490' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61' }}>Grupos de Inglés</div>
          <div style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 500 }}>Asignación de estudiantes por grupo — Año {year}</div>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Selector de grupo */}
        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>Grupo</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {grupos.map(g => (
              <button key={g.id} onClick={() => { setGrupoId(g.id); setGrupoInfo(g); setBusqueda('') }}
                style={{
                  padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: 13, fontWeight: 700,
                  background: grupoId === g.id ? '#0e9490' : '#e0f7f6',
                  color: grupoId === g.id ? '#fff' : '#0e9490',
                  transition: 'all 0.15s',
                }}>
                {g.nombre}
              </button>
            ))}
          </div>
        </div>

        {!grupoId && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#b0a8c0', fontSize: 13, fontWeight: 600 }}>
            Selecciona un grupo para gestionar sus estudiantes
          </div>
        )}

        {grupoId && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Panel izquierdo: asignados */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#3d1f61' }}>
                  Asignados
                  <span style={{ marginLeft: 8, background: '#e0f7f6', color: '#0e9490', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                    {asignados.length}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#b0a8c0' }}>{grupoInfo?.docente_nombre}</div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#b0a8c0', fontSize: 13 }}>Cargando...</div>
              ) : asignados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#b0a8c0', fontSize: 13, background: '#fafafa', borderRadius: 12 }}>
                  No hay estudiantes en este grupo
                </div>
              ) : (
                <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Object.entries(asignadosPorGrado).sort().map(([grado, ests]) => (
                    <div key={grado}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 0 4px', borderBottom: '1px solid #f3eeff', marginBottom: 4 }}>
                        {grado}
                      </div>
                      {ests.sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)).map(est => (
                        <div key={est.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: '#fafafa', marginBottom: 2 }}>
                          <span style={{ fontSize: 13, color: '#3d1f61', fontWeight: 600 }}>{est.apellido}, {est.nombre}</span>
                          {puedeEditar && (
                            <button onClick={() => remover(est)} disabled={guardando}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                              title="Remover del grupo">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel derecho: disponibles */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#3d1f61', marginBottom: 12 }}>
                Agregar estudiante
                <span style={{ marginLeft: 8, background: '#f3eeff', color: '#5B2D8E', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  {disponibles.length} disponibles
                </span>
              </div>

              {/* Buscador */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#b0a8c0' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input
                  type="text" placeholder="Buscar por nombre o apellido..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px 9px 30px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                />
                {busqueda && (
                  <button onClick={() => setBusqueda('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#b0a8c0', fontSize: 16 }}>×</button>
                )}
              </div>

              {!puedeEditar ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#b0a8c0', fontSize: 13 }}>Solo docentes de inglés, registro o admin pueden asignar</div>
              ) : (
                <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {disponibles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#b0a8c0', fontSize: 13, background: '#fafafa', borderRadius: 12 }}>
                      {busqueda ? 'No se encontraron resultados' : 'Todos los estudiantes están asignados'}
                    </div>
                  ) : disponibles.map(est => (
                    <div key={est.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: '#fafafa', marginBottom: 2 }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#3d1f61', fontWeight: 600 }}>{est.apellido}, {est.nombre}</div>
                        <div style={{ fontSize: 10, color: '#b0a8c0', fontWeight: 600 }}>{est.grados?.nombre}</div>
                      </div>
                      <button onClick={() => asignar(est)} disabled={guardando}
                        style={{ background: '#e0f7f6', border: 'none', cursor: 'pointer', color: '#0e9490', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Asignar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
}