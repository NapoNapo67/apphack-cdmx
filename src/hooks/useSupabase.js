import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabase(table, query = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase.from(table).select(query.select || '*')
      if (query.filter) {
        Object.entries(query.filter).forEach(([k, v]) => { q = q.eq(k, v) })
      }
      if (query.order) q = q.order(query.order, { ascending: query.ascending ?? true })
      if (query.limit) q = q.limit(query.limit)
      const { data: rows, error: err } = await q
      if (err) throw err
      setData(rows || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [table, JSON.stringify(query)])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
