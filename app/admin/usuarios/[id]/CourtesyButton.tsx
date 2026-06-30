"use client"

import { useState } from "react"
import { Gift, X, Loader2 } from "lucide-react"

export default function CourtesyButton({ userId, hasCourtesy }: { userId: string; hasCourtesy: boolean }) {
  const [active, setActive] = useState(hasCourtesy)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const action = active ? "revoke" : "grant"
    const res = await fetch("/api/admin/courtesy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    })
    if (res.ok) setActive(v => !v)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 ${
        active
          ? "bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400"
          : "bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400"
      }`}
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : active
          ? <><X className="w-4 h-4" /> Revogar acesso cortesia</>
          : <><Gift className="w-4 h-4" /> Conceder acesso cortesia</>
      }
    </button>
  )
}
