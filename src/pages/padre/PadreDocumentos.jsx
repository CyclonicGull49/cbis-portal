import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { usePadreHijo } from '../../hooks/usePadreHijo'

const TIPO_META = {
  partida_nacimiento: { label:'Partida de nacimiento', icon:'📄' },
  dui:                { label:'DUI', icon:'🪪' },
  cedula:             { label:'Cédula', icon:'🪪' },
  constancia_pago:    { label:'Constancia de pago', icon:'🧾' },
  constancia_estudio: { label:'Constancia de estudio', icon:'📋' },
  diploma:            { label:'Diploma', icon:'🎓' },
  otro:               { label:'Otro', icon:'📎' },
}

export default function PadreDocumentos() {
  const { hijoActual } = usePadreHijo()
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [abriendo, setAbriendo] = useState(null)

  useEffect(() => { if (hijoActual) cargar() }, [hijoActual])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('documentos_estudiante')
      .select('id, tipo, nombre_archivo, storage_path, created_at')
      .eq('estudiante_id', hijoActual.id)
      .order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  async function abrirDoc(doc) {
    setAbriendo(doc.id)
    const { data } = await supabase.storage
      .from('documentos-estudiantes')
      .createSignedUrl(doc.storage_path, 60 * 60)
    setAbriendo(null)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div style={{ maxWidth:700, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontWeight:800, fontSize:20, color:'#0f1d40', letterSpacing:'-0.5px', marginBottom:4 }}>Documentos</div>
        <div style={{ fontSize:13, color:'#9ca3af' }}>{hijoActual?.nombre} {hijoActual?.apellido}</div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af', fontWeight:600 }}>Cargando…</div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
          <div style={{ color:'#9ca3af', fontSize:14 }}>No hay documentos cargados aún</div>
          <div style={{ color:'#c4b5fd', fontSize:12, marginTop:6 }}>El colegio irá subiendo documentos a medida que estén disponibles</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {docs.map(doc => {
            const meta = TIPO_META[doc.tipo] || TIPO_META.otro
            return (
              <div key={doc.id} style={{ background:'#fff', borderRadius:14, padding:'16px 20px', boxShadow:'0 2px 10px rgba(91,45,142,0.06)', border:'1px solid #f0ebff', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'#f8f7ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                  {meta.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#0f1d40', marginBottom:2 }}>{meta.label}</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>{doc.nombre_archivo}</div>
                  <div style={{ fontSize:11, color:'#c4b5fd', marginTop:2 }}>
                    {new Date(doc.created_at).toLocaleDateString('es-SV', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                </div>
                <button onClick={() => abrirDoc(doc)} disabled={abriendo === doc.id}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:20, border:'1.5px solid #e9e3ff', background:'#f8f7ff', color:'#5B2D8E', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', opacity: abriendo === doc.id ? 0.5 : 1 }}>
                  {abriendo === doc.id ? 'Abriendo…' : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Ver
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
