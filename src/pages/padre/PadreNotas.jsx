import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { usePadreHijo } from '../../hooks/usePadreHijo'
import { useYearEscolar } from '../../hooks/useYearEscolar'

const PESOS = { ac:0.35, ai:0.35, em:0.10, ep:0.10, ef:0.20 }
const COMP_LABELS = { ac:'AC', ai:'AI', em:'EM', ep:'EP', ef:'EF' }

function calcNFT(notas, comps) {
  const vals = comps.map(c => notas[c])
  if (vals.some(v => v === null || v === undefined)) return null
  return comps.reduce((sum, c) => sum + ((notas[c] || 0) * (PESOS[c] || 0)), 0)
}
function notaColor(n) {
  if (n === null || n === undefined) return '#b0a8c0'
  if (n < 5) return '#dc2626'
  if (n < 7) return '#d97706'
  return '#16a34a'
}
function notaBg(n) {
  if (n === null || n === undefined) return 'transparent'
  if (n < 5) return '#fef2f2'
  if (n < 7) return '#fffbeb'
  return '#f0fdf4'
}
const s = {
  card: { background:'#fff', borderRadius:14, padding:'0', boxShadow:'0 2px 12px rgba(91,45,142,0.07)', border:'1px solid #f0ebff', marginBottom:12, overflow:'hidden' },
  th: { padding:'10px 14px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.8px', background:'#fafafa', borderBottom:'1px solid #f3eeff', textAlign:'center' },
  td: { padding:'10px 14px', fontSize:13, fontWeight:600, color:'#0f1d40', borderBottom:'1px solid #f9f5ff', textAlign:'center' },
  nota: (n) => ({ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:32, padding:'2px 8px', borderRadius:20, fontSize:13, fontWeight:800, color: notaColor(n), background: notaBg(n) }),
  nft:  (n) => ({ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:40, padding:'3px 10px', borderRadius:20, fontSize:14, fontWeight:800, color: notaColor(n), background: notaBg(n), border: `1px solid ${n === null ? '#e9e3ff' : n < 5 ? '#fecdd3' : n < 7 ? '#fde68a' : '#bbf7d0'}` }),
}

export default function PadreNotas() {
  const { hijoActual: estudiante, loading: loadingEst } = usePadreHijo()
  const yearEscolar = useYearEscolar()
  const [loading,  setLoading]  = useState(false)
  const [materias, setMaterias] = useState([])
  const [comps,    setComps]    = useState([])
  const [isBach,   setIsBach]   = useState(false)
  const [numPer,   setNumPer]   = useState(3)
  const [periodo,  setPeriodo]  = useState(1)

  useEffect(() => { if (estudiante) cargar() }, [estudiante, yearEscolar])

  async function cargar() {
    setLoading(true)
    try {
      // grados puede venir como .grados o .grado según el hook
      const grado    = estudiante.grados || estudiante.grado
      const gradoId  = grado?.id || estudiante.grado_id
      if (!gradoId) { console.warn('PadreNotas: sin grado_id', estudiante); return }

      const compsList = (grado?.componentes_nota || 'ac,ai,em,ef').split(',')
      const esBach    = grado?.nivel === 'bachillerato'
      const nPer      = esBach ? 4 : 3
      setComps(compsList); setIsBach(esBach); setNumPer(nPer)

      const year = yearEscolar || new Date().getFullYear()

      const { data: mgs, error: mgsErr } = await supabase.from('materia_grado')
        .select('materia_id, es_complementario').eq('grado_id', gradoId)

      console.log('PadreNotas mgs:', mgs, 'gradoId:', gradoId, 'error:', mgsErr)

      const matIds = (mgs || []).map(m => m.materia_id)
      if (!matIds.length) { setMaterias([]); return }

      const { data: matsData } = await supabase.from('materias')
        .select('id, nombre').in('id', matIds).order('nombre')

      const { data: notasData } = await supabase.from('notas').select('*')
        .eq('estudiante_id', estudiante.id).eq('grado_id', gradoId).eq('año_escolar', year)

      const notasMap = {}
      for (const n of (notasData || []))
        notasMap[`${n.materia_id}-${n.periodo}-${n.tipo}`] = n.nota

      const compIds = (mgs || []).filter(m => m.es_complementario).map(m => m.materia_id)
      const lista = (matsData || []).map(m => {
        const notas = {}
        for (let p = 1; p <= nPer; p++) {
          notas[p] = {}
          for (const c of compsList) notas[p][c] = notasMap[`${m.id}-${p}-${c}`] ?? null
        }
        return { id: m.id, nombre: m.nombre, notas, esComplementaria: compIds.includes(m.id) }
      })
      setMaterias(lista)
    } catch(e) { console.error('PadreNotas:', e) }
    finally { setLoading(false) }
  }

  const periodos = Array.from({ length: numPer }, (_, i) => i + 1)

  if (loadingEst) return <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af', fontWeight:600 }}>Cargando…</div>
  if (!estudiante)  return <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af', fontSize:14 }}>No hay alumno vinculado</div>

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontWeight:800, fontSize:20, color:'#0f1d40', letterSpacing:'-0.5px', marginBottom:4 }}>Notas</div>
        <div style={{ fontSize:13, color:'#9ca3af' }}>{estudiante.nombre} {estudiante.apellido} · {estudiante.grado?.nombre}</div>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {periodos.map(p => (
          <button key={p} onClick={() => setPeriodo(p)}
            style={{ padding:'7px 20px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700, background: periodo===p ? '#5B2D8E' : '#f3eeff', color: periodo===p ? '#fff' : '#5B2D8E', transition:'all 0.2s' }}>
            Período {p}
          </button>
        ))}
        <button onClick={() => setPeriodo('all')}
          style={{ padding:'7px 20px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700, background: periodo==='all' ? '#5B2D8E' : '#f3eeff', color: periodo==='all' ? '#fff' : '#5B2D8E', transition:'all 0.2s' }}>
          Resumen
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af', fontWeight:600 }}>Cargando notas…</div>
      ) : materias.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af', fontSize:14 }}>No hay materias registradas</div>
      ) : periodo === 'all' ? (
        <div style={s.card}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={{ ...s.th, textAlign:'left', minWidth:180 }}>Materia</th>
                {periodos.map(p => <th key={p} style={s.th}>P{p}</th>)}
                <th style={{ ...s.th, color:'#5B2D8E' }}>Promedio</th>
              </tr></thead>
              <tbody>{materias.map(m => {
                const nfts = periodos.map(p => calcNFT(m.notas[p], comps))
                const validNfts = nfts.filter(n => n !== null)
                const prom = validNfts.length ? validNfts.reduce((a,b) => a+b, 0) / validNfts.length : null
                return (
                  <tr key={m.id}>
                    <td style={{ ...s.td, textAlign:'left', fontWeight:700 }}>{m.nombre}
                      {m.esComplementaria && <span style={{ marginLeft:6, fontSize:9, background:'#f3eeff', color:'#5B2D8E', padding:'1px 6px', borderRadius:8, fontWeight:700 }}>Comp.</span>}
                    </td>
                    {nfts.map((n, i) => <td key={i} style={s.td}><span style={s.nft(n)}>{n !== null ? n.toFixed(1) : '—'}</span></td>)}
                    <td style={s.td}><span style={s.nft(prom)}>{prom !== null ? prom.toFixed(1) : '—'}</span></td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={s.card}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={{ ...s.th, textAlign:'left', minWidth:180 }}>Materia</th>
                {comps.map(c => <th key={c} style={s.th}>{COMP_LABELS[c]}</th>)}
                <th style={{ ...s.th, color:'#5B2D8E' }}>NFT</th>
              </tr></thead>
              <tbody>{materias.map(m => {
                const nft = calcNFT(m.notas[periodo], comps)
                return (
                  <tr key={m.id}>
                    <td style={{ ...s.td, textAlign:'left', fontWeight:700 }}>{m.nombre}
                      {m.esComplementaria && <span style={{ marginLeft:6, fontSize:9, background:'#f3eeff', color:'#5B2D8E', padding:'1px 6px', borderRadius:8, fontWeight:700 }}>Comp.</span>}
                    </td>
                    {comps.map(c => {
                      const n = m.notas[periodo][c]
                      return <td key={c} style={s.td}><span style={s.nota(n)}>{n !== null ? n : '—'}</span></td>
                    })}
                    <td style={s.td}><span style={s.nft(nft)}>{nft !== null ? nft.toFixed(1) : '—'}</span></td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
          <div style={{ padding:'12px 16px', background:'#fafafa', borderTop:'1px solid #f3eeff', display:'flex', gap:16, flexWrap:'wrap' }}>
            {comps.map(c => (
              <span key={c} style={{ fontSize:11, color:'#9ca3af' }}>
                <strong style={{ color:'#6b7280' }}>{COMP_LABELS[c]}</strong> {Math.round((PESOS[c]||0)*100)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
