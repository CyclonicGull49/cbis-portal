import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

export function useNotificaciones() {
  const { perfil } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const [noLeidas,       setNoLeidas]       = useState(0)
  const [loading,        setLoading]        = useState(true)

  const cargar = useCallback(async () => {
    if (!perfil?.id) return
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', perfil.id)
      .order('creado_en', { ascending: false })
      .limit(30)
    setNotificaciones(data || [])
    setNoLeidas((data || []).filter(n => !n.leida).length)
    setLoading(false)
  }, [perfil?.id])

  useEffect(() => {
    cargar()
    if (!perfil?.id) return
    const channel = supabase
      .channel(`notif-${perfil.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notificaciones',
        filter: `usuario_id=eq.${perfil.id}`,
      }, () => cargar())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [perfil?.id, cargar])

  async function marcarLeida(id) {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    setNoLeidas(prev => Math.max(0, prev - 1))
  }

  async function marcarTodasLeidas() {
    if (!perfil?.id) return
    await supabase.from('notificaciones').update({ leida: true })
      .eq('usuario_id', perfil.id).eq('leida', false)
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    setNoLeidas(0)
  }

  return { notificaciones, noLeidas, loading, marcarLeida, marcarTodasLeidas, recargar: cargar }
}

export async function crearNotificacion({ usuario_id, tipo, titulo, mensaje, link = null }) {
  return supabase.from('notificaciones').insert({ usuario_id, tipo, titulo, mensaje, link })
}

export async function crearNotificaciones(notifs) {
  return supabase.from('notificaciones').insert(notifs)
}