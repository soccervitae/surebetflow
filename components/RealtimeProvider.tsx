"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface Props {
  userId: string
}

// Global realtime sync: any change on key tables triggers router.refresh()
// so server-rendered pages update without full page reload.
// Client components with local state handle their own subscriptions separately.
export default function RealtimeProvider({ userId }: Props) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    function scheduleRefresh() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => router.refresh(), 400)
    }

    const channel = supabase
      .channel(`global-sync-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "profiles",
        filter: `user_id=eq.${userId}`,
      }, scheduleRefresh)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "usuarios",
        filter: `id=eq.${userId}`,
      }, scheduleRefresh)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "apostas",
      }, scheduleRefresh)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "aposta_legs",
      }, scheduleRefresh)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "movimentacoes_financeiras",
      }, scheduleRefresh)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "bonus",
      }, scheduleRefresh)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [userId, router])

  return null
}
