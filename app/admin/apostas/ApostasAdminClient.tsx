"use client"

import { useState, useMemo } from "react"
import { Search, Download, ChevronUp, ChevronDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

type Aposta = {
  id: string
  evento: string
  esporte: string | null
  tipo: string
  investimento_total: number
  lucro_garantido: number
  resultado_real: number | null
  roi_percentual: number
  status: string
  created_at: string
  profile: { nome: string; sobrenome: string; apelido: string | null }[] | null
}

const STATUS_COLOR: Record<string, string> = {
  pendente:   "bg-yellow-500/10 text-yellow-400",
  finalizada: "bg-green-500/10 text-green-400",
  cancelada:  "bg-red-500/10 text-red-400",
}

type SortKey = "evento" | "perfil" | "investimento_total" | "lucro_garantido" | "roi_percentual" | "status" | "created_at"

function profileName(a: Aposta) {
  const p = Array.isArray(a.profile) ? a.profile[0] : a.profile
  return p?.apelido ?? `${p?.nome ?? ""} ${p?.sobrenome ?? ""}`.trim()
}

function exportCSV(rows: Aposta[]) {
  const header = ["Evento", "Esporte", "Perfil", "Tipo", "Investido", "Lucro", "ROI%", "Status", "Data"]
  const lines = rows.map(a => [
    `"${a.evento}"`,
    a.esporte ?? "",
    `"${profileName(a)}"`,
    a.tipo,
    a.investimento_total.toFixed(2),
    a.lucro_garantido.toFixed(2),
    a.roi_percentual.toFixed(2),
    a.status,
    new Date(a.created_at).toLocaleDateString("pt-BR"),
  ].join(","))
  const csv = [header.join(","), ...lines].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "apostas.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function ApostasAdminClient({ apostas }: { apostas: Aposta[] }) {
  const [search, setSearch]     = useState("")
  const [status, setStatus]     = useState("all")
  const [sortKey, setSortKey]   = useState<SortKey>("created_at")
  const [sortAsc, setSortAsc]   = useState(false)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 opacity-20" />
    return sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  const filtered = useMemo(() => {
    let rows = apostas.filter(a => {
      const q = search.toLowerCase()
      const match = !q || a.evento.toLowerCase().includes(q) || profileName(a).toLowerCase().includes(q) || (a.esporte ?? "").toLowerCase().includes(q)
      const st = status === "all" || a.status === status
      return match && st
    })

    rows = [...rows].sort((a, b) => {
      let va: string | number, vb: string | number
      if (sortKey === "perfil")   { va = profileName(a); vb = profileName(b) }
      else if (sortKey === "evento") { va = a.evento; vb = b.evento }
      else if (sortKey === "created_at") { va = a.created_at; vb = b.created_at }
      else if (sortKey === "status") { va = a.status; vb = b.status }
      else { va = Number((a as Record<string, unknown>)[sortKey]); vb = Number((b as Record<string, unknown>)[sortKey]) }

      return sortAsc
        ? (va < vb ? -1 : va > vb ? 1 : 0)
        : (va > vb ? -1 : va < vb ? 1 : 0)
    })

    return rows
  }, [apostas, search, status, sortKey, sortAsc])

  function Th({ label, k, align = "left" }: { label: string; k: SortKey; align?: "left" | "right" }) {
    return (
      <th
        onClick={() => toggleSort(k)}
        className={`px-4 py-3 text-${align} text-gray-400 font-medium text-xs cursor-pointer select-none hover:text-white transition-colors`}
      >
        <span className="inline-flex items-center gap-1">
          {align === "right" && <SortIcon k={k} />}
          {label}
          {align === "left" && <SortIcon k={k} />}
        </span>
      </th>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Apostas</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} de {apostas.length} apostas</p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por evento, perfil ou esporte..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#1e3a8a]/50"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1e3a8a]/50"
        >
          <option value="all">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="finalizada">Finalizada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <Th label="Evento"    k="evento" />
                <Th label="Perfil"    k="perfil" />
                <th className="px-4 py-3 text-left text-gray-400 font-medium text-xs">Tipo</th>
                <Th label="Investido" k="investimento_total"  align="right" />
                <Th label="Lucro"     k="lucro_garantido"     align="right" />
                <Th label="ROI"       k="roi_percentual"      align="right" />
                <Th label="Status"    k="status" />
                <Th label="Data"      k="created_at" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-500">Nenhuma aposta encontrada</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white truncate max-w-[200px]">{a.evento}</p>
                    {a.esporte && <p className="text-xs text-gray-400">{a.esporte}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{profileName(a)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{a.tipo}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(a.investimento_total)}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">{formatCurrency(a.lucro_garantido)}</td>
                  <td className="px-4 py-3 text-right text-purple-400">{a.roi_percentual.toFixed(2)}%</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[a.status] ?? ""}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(a.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>{filtered.length} aposta{filtered.length !== 1 ? "s" : ""}</span>
            <span>
              Total investido: <span className="text-white font-medium">{formatCurrency(filtered.reduce((s, a) => s + a.investimento_total, 0))}</span>
              {" · "}
              Lucro total: <span className="text-green-400 font-medium">{formatCurrency(filtered.reduce((s, a) => s + a.lucro_garantido, 0))}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
