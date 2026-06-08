// Hooks para el tablero de control ETL
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Estado general del ETL (se refresca cada 10s automáticamente)
export function useEstadoETL(intervalo = 10000) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetch = useCallback(async () => {
    const { data: rows, error: err } = await supabase
      .schema('dw')
      .from('v_estado_etl')
      .select('*')
      .single()
    if (err) setError(err.message)
    else { setData(rows); setLastRefresh(new Date()) }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const timer = setInterval(fetch, intervalo)
    return () => clearInterval(timer)
  }, [fetch, intervalo])

  return { data, loading, error, lastRefresh, refetch: fetch }
}

// Historial de ejecuciones del log ETL
export function useLogETL(limit = 20) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data: rows } = await supabase
      .schema('dw')
      .from('etl_log')
      .select('*')
      .order('ejecutado_en', { ascending: false })
      .limit(limit)
    setData(rows || [])
    setLoading(false)
  }, [limit])

  useEffect(() => {
    fetch()
    // Suscripción en tiempo real al log
    const channel = supabase
      .channel('etl_log_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'dw', table: 'etl_log' }, () => fetch())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetch])

  return { data, loading, refetch: fetch }
}

// Suscripción en tiempo real a consulta_viabilidad (para contar nuevos registros live)
export function useContadorLive() {
  const [total, setTotal]     = useState(null)
  const [nuevos, setNuevos]   = useState(0)

  useEffect(() => {
    // Contar inicial
    supabase.from('consulta_viabilidad').select('*', { count: 'exact', head: true })
      .then(({ count }) => setTotal(count))

    // Escuchar inserts en tiempo real
    const channel = supabase
      .channel('consulta_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consulta_viabilidad' },
        (payload) => {
          setTotal(t => (t || 0) + 1)
          setNuevos(n => n + 1)
          // Limpiar indicador de "nuevo" después de 5s
          setTimeout(() => setNuevos(n => Math.max(0, n - 1)), 5000)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return { total, nuevos }
}
