"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { SurebetRow } from "@/lib/types/surebet"

export function useRealtimeSurebets(initialData: SurebetRow[]) {
  const [surebets, setSurebets] = useState<SurebetRow[]>(initialData)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const newIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("surebets-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "surebets" },
        async (payload) => {
          // Fetch full row from view since payload only has raw table data
          const { data } = await supabase
            .from("surebet_dashboard")
            .select("*")
            .eq("id", payload.new.id)
            .maybeSingle()
          if (!data) return

          const row = data as SurebetRow
          setSurebets(prev => [row, ...prev])

          // Highlight animation
          const next = new Set(newIdsRef.current)
          next.add(row.id)
          newIdsRef.current = next
          setNewIds(new Set(next))
          setTimeout(() => {
            const updated = new Set(newIdsRef.current)
            updated.delete(row.id)
            newIdsRef.current = updated
            setNewIds(new Set(updated))
          }, 1500)
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "surebets" },
        (payload) => {
          const updated = payload.new as { id: string; expires_at: string | null }
          if (updated.expires_at && new Date(updated.expires_at) <= new Date()) {
            setSurebets(prev => prev.filter(s => s.id !== updated.id))
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "surebets" },
        (payload) => {
          setSurebets(prev => prev.filter(s => s.id !== (payload.old as { id: string }).id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { surebets, newIds }
}
