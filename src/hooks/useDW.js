import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Hook genérico para vistas del Data Warehouse (esquema dw)
function useView(viewName) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data: rows, error: err } = await supabase.from(viewName).select('*')
      if (err) setError(err.message)
      else setData(rows)
      setLoading(false)
    }
    fetch()
  }, [viewName])

  return { data, loading, error }
}

export function useKPIs()            { return useView('v_kpis') }
export function useTendencia()       { return useView('v_tendencia_mensual') }
export function usePorAlcaldia()     { return useView('v_por_alcaldia') }
export function usePorTipo()         { return useView('v_por_tipo') }
export function usePorEstado()       { return useView('v_por_estado') }
