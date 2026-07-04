"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Bookmaker, ScraperRun, AdminSurebetRow, AdminStats } from "./types"
import {
  Building2, Activity, Zap, Check, X, Plus, Pencil,
  ChevronDown, ChevronRight, AlertTriangle, Settings,
} from "lucide-react"
import { useToast } from "@/hooks/useToast"

// ─── helpers ────────────────────────────────────────────────────────────────

const ANOMALY_THRESHOLD = 8 // % — surebets acima disso são suspeitas

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "agora"
  if (hours < 1) return `${mins}min atrás`
  if (days < 1) return `${hours}h atrás`
  return `${days}d atrás`
}

function StatusBadge({ status }: { status: ScraperRun["status"] | "no_data" }) {
  const map = {
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    partial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    no_data: "bg-gray-700/40 text-gray-500 border-gray-700",
  }
  const labels = { success: "OK", partial: "Parcial", error: "Erro", no_data: "Sem dados" }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wide ${map[status]}`}>
      {labels[status]}
    </span>
  )
}

type Tab = "casas" | "monitoramento" | "surebets"

interface Props {
  initialBookmakers: Bookmaker[]
  initialScraperRuns: ScraperRun[]
  initialSurebets: AdminSurebetRow[]
  initialStats: AdminStats
}

// ─── main component ──────────────────────────────────────────────────────────

export default function AdminSurebetsClient({
  initialBookmakers, initialScraperRuns, initialSurebets, initialStats,
}: Props) {
  const [tab, setTab] = useState<Tab>("casas")
  const [bookmakers, setBookmakers] = useState(initialBookmakers)
  const [scraperRuns, setScraperRuns] = useState(initialScraperRuns)
  const [surebets] = useState(initialSurebets)
  const [stats] = useState(initialStats)
  const [threshold, setThreshold] = useState(ANOMALY_THRESHOLD)
  const supabase = createClient()
  const { toast } = useToast()

  // Realtime: pool scraper_runs every 30s + subscribe
  useEffect(() => {
    const channel = supabase
      .channel("admin-scraper-runs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "scraper_runs" }, payload => {
        setScraperRuns(prev => [payload.new as ScraperRun, ...prev].slice(0, 200))
      })
      .subscribe()

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("scraper_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(200)
      if (data) setScraperRuns(data as ScraperRun[])
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [supabase])

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "casas", label: "Casas de Apostas", icon: Building2 },
    { key: "monitoramento", label: "Monitoramento", icon: Activity },
    { key: "surebets", label: "Surebets", icon: Zap },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Surebets — Admin</h1>
        <p className="text-gray-400 text-sm mt-1">Gestão de casas, monitoramento do scraper e operação das surebets</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-[#1e3a8a] text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "casas" && (
        <CasasTab
          bookmakers={bookmakers}
          setBookmakers={setBookmakers}
          scraperRuns={scraperRuns}
          supabase={supabase}
          toast={toast}
        />
      )}
      {tab === "monitoramento" && (
        <MonitoramentoTab bookmakers={bookmakers} scraperRuns={scraperRuns} />
      )}
      {tab === "surebets" && (
        <SurebetsTab
          surebets={surebets}
          stats={stats}
          bookmakers={bookmakers}
          threshold={threshold}
          setThreshold={setThreshold}
        />
      )}
    </div>
  )
}

// ─── Tab: Casas de Apostas ───────────────────────────────────────────────────

function CasasTab({
  bookmakers, setBookmakers, scraperRuns, supabase, toast,
}: {
  bookmakers: Bookmaker[]
  setBookmakers: React.Dispatch<React.SetStateAction<Bookmaker[]>>
  scraperRuns: ScraperRun[]
  supabase: ReturnType<typeof createClient>
  toast: (opts: { title: string; variant?: "destructive" }) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", base_url: "", is_licensed_br: false })
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Last run per bookmaker
  const lastRunMap = useMemo(() => {
    const map = new Map<string, ScraperRun>()
    for (const r of scraperRuns) {
      if (r.bookmaker_id && !map.has(r.bookmaker_id)) map.set(r.bookmaker_id, r)
    }
    return map
  }, [scraperRuns])

  function openNew() {
    setForm({ name: "", slug: "", base_url: "", is_licensed_br: false })
    setEditingId(null)
    setShowForm(true)
  }
  function openEdit(b: Bookmaker) {
    setForm({ name: b.name, slug: b.slug, base_url: b.base_url ?? "", is_licensed_br: b.is_licensed_br })
    setEditingId(b.id)
    setShowForm(true)
  }
  function cancel() { setShowForm(false); setEditingId(null) }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Nome e slug são obrigatórios", variant: "destructive" })
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      base_url: form.base_url.trim() || null,
      is_licensed_br: form.is_licensed_br,
    }
    if (editingId) {
      const { data, error } = await supabase.from("bookmakers").update(payload).eq("id", editingId).select().single()
      if (error) toast({ title: "Erro ao salvar", variant: "destructive" })
      else { setBookmakers(prev => prev.map(b => b.id === editingId ? data as Bookmaker : b)); toast({ title: "Casa atualizada!" }); cancel() }
    } else {
      const { data, error } = await supabase.from("bookmakers").insert({ ...payload, is_active: true }).select().single()
      if (error) toast({ title: "Erro ao criar", variant: "destructive" })
      else { setBookmakers(prev => [...prev, data as Bookmaker].sort((a, b) => a.name.localeCompare(b.name))); toast({ title: "Casa criada!" }); cancel() }
    }
    setSaving(false)
  }

  async function toggleActive(b: Bookmaker) {
    setTogglingId(b.id)
    const { error } = await supabase.from("bookmakers").update({ is_active: !b.is_active }).eq("id", b.id)
    if (error) toast({ title: "Erro ao atualizar", variant: "destructive" })
    else setBookmakers(prev => prev.map(bk => bk.id === b.id ? { ...bk, is_active: !bk.is_active } : bk))
    setTogglingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">{bookmakers.length} casas cadastradas</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> Nova Casa
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-white">{editingId ? "Editar Casa" : "Nova Casa de Apostas"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Nome *", key: "name", placeholder: "Ex: Betano" },
              { label: "Slug *", key: "slug", placeholder: "ex: betano" },
              { label: "Base URL", key: "base_url", placeholder: "https://betano.com.br" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs text-gray-400">{label}</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#1e3a8a]"
                  placeholder={placeholder}
                  value={(form as Record<string, string | boolean>)[key] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_licensed_br}
                  onChange={e => setForm(f => ({ ...f, is_licensed_br: e.target.checked }))}
                  className="w-4 h-4 accent-[#1e3a8a]"
                />
                <span className="text-sm text-gray-300">Licenciada .bet.br</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              <Check className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={cancel} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors">
              <X className="h-4 w-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Casa</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Slug</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Licenciada</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Scraper</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Ativo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {bookmakers.map(b => {
              const lastRun = lastRunMap.get(b.id)
              return (
                <tr key={b.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{b.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{b.slug}</td>
                  <td className="px-4 py-3">
                    {b.is_licensed_br
                      ? <span className="text-green-400 text-xs font-medium">✓ .bet.br</span>
                      : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={lastRun ? lastRun.status : "no_data"} />
                      {lastRun && <span className="text-gray-500 text-[10px]">{timeAgo(lastRun.started_at)}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(b)}
                      disabled={togglingId === b.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${b.is_active ? "bg-green-500" : "bg-gray-700"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${b.is_active ? "translate-x-4" : "translate-x-1"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!bookmakers.length && <p className="text-center text-gray-500 py-10">Nenhuma casa cadastrada</p>}
      </div>
    </div>
  )
}

// ─── Tab: Monitoramento ──────────────────────────────────────────────────────

function MonitoramentoTab({ bookmakers, scraperRuns }: { bookmakers: Bookmaker[]; scraperRuns: ScraperRun[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const byBookmaker = useMemo(() => {
    const map = new Map<string, ScraperRun[]>()
    for (const r of scraperRuns) {
      if (!r.bookmaker_id) continue
      if (!map.has(r.bookmaker_id)) map.set(r.bookmaker_id, [])
      map.get(r.bookmaker_id)!.push(r)
    }
    return map
  }, [scraperRuns])

  const activeBookmakers = bookmakers.filter(b => b.is_active)

  // Summary counts
  const errCount = activeBookmakers.filter(b => {
    const runs = byBookmaker.get(b.id)
    return runs && runs[0]?.status === "error"
  }).length

  const totalOddsLast = scraperRuns.reduce((acc, r) => {
    const isRecent = Date.now() - new Date(r.started_at).getTime() < 3600000
    return isRecent ? acc + (r.odds_count ?? 0) : acc
  }, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Casas ativas", value: activeBookmakers.length, color: "text-white" },
          { label: "Com erro (última exec)", value: errCount, color: errCount > 0 ? "text-red-400" : "text-green-400" },
          { label: "Odds capturadas (1h)", value: totalOddsLast.toLocaleString("pt-BR"), color: "text-white" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Per-bookmaker */}
      <div className="space-y-2">
        {activeBookmakers.map(b => {
          const runs = byBookmaker.get(b.id) ?? []
          const last = runs[0]
          const recent10 = runs.slice(0, 10)
          const errors = last?.errors ?? []
          const isExpanded = expandedId === b.id

          return (
            <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-800/40 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : b.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{b.name}</span>
                    <StatusBadge status={last ? last.status : "no_data"} />
                    {last && <span className="text-gray-500 text-xs">{timeAgo(last.started_at)}</span>}
                  </div>
                  {last && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {last.odds_count} odds · {last.finished_at ? fmtDate(last.finished_at) : "em andamento"}
                    </p>
                  )}
                </div>

                {/* Mini trend sparkline (text-based) */}
                <div className="flex items-end gap-0.5 h-6">
                  {recent10.map((r, i) => {
                    const h = recent10.reduce((m, x) => Math.max(m, x.odds_count ?? 0), 1)
                    const pct = Math.max(0.1, (r.odds_count ?? 0) / h)
                    const col = r.status === "error" ? "bg-red-500" : r.status === "partial" ? "bg-yellow-500" : "bg-green-500"
                    return (
                      <div
                        key={i}
                        title={`${r.odds_count} odds — ${r.status}`}
                        className={`w-1.5 rounded-sm ${col} opacity-80`}
                        style={{ height: `${Math.max(4, pct * 24)}px` }}
                      />
                    )
                  })}
                </div>

                {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />}
              </div>

              {isExpanded && (
                <div className="border-t border-gray-800 px-4 py-3 space-y-3">
                  {/* Recent runs table */}
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left py-1 font-medium">Início</th>
                        <th className="text-left py-1 font-medium">Fim</th>
                        <th className="text-left py-1 font-medium">Odds</th>
                        <th className="text-left py-1 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent10.map(r => (
                        <tr key={r.id} className="border-t border-gray-800/50">
                          <td className="py-1.5 text-gray-300 font-mono">{fmtDate(r.started_at)}</td>
                          <td className="py-1.5 text-gray-400 font-mono">{r.finished_at ? fmtDate(r.finished_at) : "—"}</td>
                          <td className="py-1.5 text-gray-300 font-mono">{r.odds_count}</td>
                          <td className="py-1.5"><StatusBadge status={r.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Errors */}
                  {errors.length > 0 && (
                    <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-400 mb-2">Erros recentes</p>
                      <ul className="space-y-1">
                        {errors.slice(0, 5).map((e, i) => (
                          <li key={i} className="text-xs text-red-300 font-mono break-all">• {String(e)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {!activeBookmakers.length && <p className="text-center text-gray-500 py-10">Nenhuma casa ativa</p>}
      </div>
    </div>
  )
}

// ─── Tab: Surebets operacional ───────────────────────────────────────────────

function SurebetsTab({
  surebets, stats, bookmakers, threshold, setThreshold,
}: {
  surebets: AdminSurebetRow[]
  stats: AdminStats
  bookmakers: Bookmaker[]
  threshold: number
  setThreshold: (n: number) => void
}) {
  const [thresholdInput, setThresholdInput] = useState(String(threshold))

  // Bookmaker ranking
  const bookRanking = useMemo(() => {
    const count = new Map<string, number>()
    for (const s of surebets) {
      count.set(s.leg_a.bookmaker_name, (count.get(s.leg_a.bookmaker_name) ?? 0) + 1)
      count.set(s.leg_b.bookmaker_name, (count.get(s.leg_b.bookmaker_name) ?? 0) + 1)
    }
    return Array.from(count.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [surebets])

  const anomalias = surebets.filter(s => Number(s.profit_pct) > threshold)
  const normais = surebets.filter(s => Number(s.profit_pct) <= threshold)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Surebets ativas", value: stats.surebets_ativas },
          { label: "Detectadas (24h)", value: stats.surebets_24h },
          { label: "Profit% médio", value: `${stats.avg_profit_pct.toFixed(2)}%` },
          { label: "Casas ativas", value: stats.bookmakers_ativos },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold font-mono text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Anomaly threshold config */}
      <div className="bg-gray-900 border border-yellow-800/40 rounded-xl p-4 flex items-center gap-4">
        <Settings className="h-4 w-4 text-yellow-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Limite de anomalia</p>
          <p className="text-xs text-gray-400">Surebets acima deste profit% são sinalizadas como suspeitas (possível bug no scraper)</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.5"
            min="1"
            className="w-20 h-8 px-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm font-mono focus:outline-none focus:border-yellow-500"
            value={thresholdInput}
            onChange={e => setThresholdInput(e.target.value)}
          />
          <button
            onClick={() => {
              const v = parseFloat(thresholdInput)
              if (!isNaN(v) && v > 0) setThreshold(v)
            }}
            className="px-3 h-8 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Anomalias */}
      {anomalias.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-sm font-semibold text-red-400">Anomalias detectadas ({anomalias.length}) — profit acima de {threshold}%</p>
          </div>
          <div className="bg-red-900/10 border border-red-800/40 rounded-xl overflow-hidden">
            <SurebetTable surebets={anomalias} highlight />
          </div>
        </div>
      )}

      {/* Casas ranking */}
      {bookRanking.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-white mb-3">Casas mais frequentes em surebets</p>
          <div className="space-y-2">
            {bookRanking.map(([name, count]) => {
              const max = bookRanking[0][1]
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-300 w-32 truncate">{name}</span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1e3a8a] rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 font-mono w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabela normal */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">Surebets ativas ({normais.length})</p>
        </div>
        <SurebetTable surebets={normais} />
      </div>
    </div>
  )
}

function SurebetTable({ surebets, highlight = false }: { surebets: AdminSurebetRow[]; highlight?: boolean }) {
  if (!surebets.length) {
    return <p className="text-center text-gray-500 py-8 text-sm">Nenhuma surebet</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Evento</th>
            <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Leg A</th>
            <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Leg B</th>
            <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Profit%</th>
            <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Detectada</th>
          </tr>
        </thead>
        <tbody>
          {surebets.map(s => (
            <tr key={s.id} className={`border-b border-gray-800/50 ${highlight ? "bg-red-900/10" : "hover:bg-gray-800/30"} transition-colors`}>
              <td className="px-4 py-2.5">
                <p className="text-gray-200 font-medium">{s.home_team} vs {s.away_team}</p>
                <p className="text-gray-500">{s.league} · {s.sport}</p>
              </td>
              <td className="px-4 py-2.5">
                <p className="text-gray-300">{s.leg_a.bookmaker_name}</p>
                <p className="text-gray-500 font-mono">{s.leg_a.selection} @ {Number(s.leg_a.odds).toFixed(2)}</p>
              </td>
              <td className="px-4 py-2.5">
                <p className="text-gray-300">{s.leg_b.bookmaker_name}</p>
                <p className="text-gray-500 font-mono">{s.leg_b.selection} @ {Number(s.leg_b.odds).toFixed(2)}</p>
              </td>
              <td className="px-4 py-2.5">
                <span className={`font-bold font-mono ${highlight ? "text-red-400" : Number(s.profit_pct) >= 2 ? "text-green-400" : "text-green-600"}`}>
                  +{Number(s.profit_pct).toFixed(2)}%
                </span>
              </td>
              <td className="px-4 py-2.5 text-gray-500">{timeAgo(s.detected_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
