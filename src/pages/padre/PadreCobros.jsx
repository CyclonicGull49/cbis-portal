import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { usePadreHijo } from '../../hooks/usePadreHijo'

const ESTADO_META = {
  pendiente: { label:'Pendiente', color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  pagado:    { label:'Pagado',    color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
  anulado:   { label:'Anulado',  color:'#9ca3af', bg:'#f9fafb', border:'#e5e7eb' },
}

function Badge({ estado }) {
  const m = ESTADO_META[estado] || ESTADO_META.pendiente
  return (
    <span style={{ fontSize:11, fontWeight:700, color: m.color, background: m.bg, border:`1px solid ${m.border}`, borderRadius:20, padding:'3px 10px' }}>
      {m.label}
    </span>
  )
}

export default function PadreCobros() {
  const { hijoActual, loading: loadingHijo } = usePadreHijo()
  const [cobros,    setCobros]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filtro,    setFiltro]    = useState('todos')

  useEffect(() => { if (hijoActual) cargar(); else if (!loadingHijo) setLoading(false) }, [hijoActual, loadingHijo])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('cobros')
      .select('id, estado, monto, fecha_vencimiento, mes, year_escolar, anulado, conceptos_cobro(nombre, tipo)')
      .eq('estudiante_id', hijoActual.id)
      .neq('anulado', true)
      .order('fecha_vencimiento', { ascending: false })
    setCobros(data || [])
    setLoading(false)
  }

  const filtrados = filtro === 'todos' ? cobros : cobros.filter(c => c.estado === filtro)
  const totalPendiente = cobros.filter(c => c.estado === 'pendiente').reduce((s, c) => s + (c.monto || 0), 0)

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontWeight:800, fontSize:20, color:'#0f1d40', letterSpacing:'-0.5px', marginBottom:4 }}>Cobros</div>
        <div style={{ fontSize:13, color:'#9ca3af' }}>{hijoActual?.nombre} {hijoActual?.apellido}</div>
      </div>

      {/* Resumen */}
      {totalPendiente > 0 && (
        <div style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)', borderRadius:16, padding:'18px 24px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>Total pendiente</div>
            <div style={{ fontSize:28, fontWeight:800, color:'#fff', letterSpacing:'-1px' }}>${totalPendiente.toFixed(2)}</div>
          </div>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['todos','pendiente','pagado'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{ padding:'6px 18px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, background: filtro === f ? '#5B2D8E' : '#f3eeff', color: filtro === f ? '#fff' : '#5B2D8E', transition:'all 0.2s' }}>
            {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af', fontWeight:600 }}>Cargando…</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af', fontSize:14 }}>No hay cobros en esta categoría</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtrados.map(c => (
            <div key={c.id} style={{ background:'#fff', borderRadius:14, padding:'16px 20px', boxShadow:'0 2px 10px rgba(91,45,142,0.06)', border:'1px solid #f0ebff', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'#f8f7ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B2D8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'#0f1d40', marginBottom:3 }}>{c.conceptos_cobro?.nombre || 'Cobro'}</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>
                  {c.mes && `${c.mes} · `}
                  Vence: {c.fecha_vencimiento ? new Date(c.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-SV', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontWeight:800, fontSize:16, color:'#0f1d40', marginBottom:4 }}>${(c.monto || 0).toFixed(2)}</div>
                <Badge estado={c.estado} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop:20, padding:'14px 18px', background:'#f8f7ff', borderRadius:12, border:'1px solid #e9e3ff', fontSize:12, color:'#6b7280', display:'flex', gap:8, alignItems:'flex-start' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5B2D8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Los pagos se realizan en recepción del colegio. Para más información comunícate directamente con administración.
      </div>
    </div>
  )
}
