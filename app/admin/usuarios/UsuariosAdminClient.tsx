"use client"

import { useState, useMemo } from "react"
import { Search, Download, ChevronUp, ChevronDown } from "lucide-react"
import Link from "next/link"

type Usuario = {
  id: string
  email: string
  full_name: string
  profile_count: number
  created_at: string
  last_sign_in_at: string | null
}

type SortKey = "email" | "full_name" | "profile_count" | "created_at" | "last_sign_in_at"

function exportCSV(rows: Usuario[]) {
  const header = ["E-mail", "Nome", "Perfis", "Cadastro", "Último acesso"]
  const lines = rows.map(u => [
    `"${u.email}"`,
    `"${u.full_name}"`,
    u.profile_count,
    new Date(u.created_at).toLocaleDateString("pt-BR"),
    u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "Nunca",
  ].join(","))
  const csv = [header.join(","), ...lines].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "usuarios.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function UsuariosAdminClient({ usuarios }: { usuarios: Usuario[] }) {
  const [search, setSearch]   = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortAsc, setSortAsc] = useState(false)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 opacity-20" />
    return sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let rows = !q ? usuarios : usuarios.filter(u =>
      u.email.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q)
    )
    return [...rows].sort((a, b) => {
      const va = a[sortKey] ?? ""
      const vb = b[sortKey] ?? ""
      return sortAsc
        ? (va < vb ? -1 : va > vb ? 1 : 0)
        : (va > vb ? -1 : va < vb ? 1 : 0)
    })
  }, [usuarios, search, sortKey, sortAsc])

  function Th({ label, k, align = "left" }: { label: string; k: SortKey; align?: "left" | "center" }) {
    return (
      <th
        onClick={() => toggleSort(k)}
        className={`px-4 py-3 text-${align} text-gray-400 font-medium text-xs cursor-pointer select-none hover:text-white transition-colors`}
      >
        <span className={`inline-flex items-center gap-1 ${align === "center" ? "justify-center" : ""}`}>
          {label}
          <SortIcon k={k} />
        </span>
      </th>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} de {usuarios.length} usuário(s)</p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por e-mail ou nome..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#1e3a8a]/50"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <Th label="E-mail"       k="email" />
              <Th label="Nome"         k="full_name" />
              <Th label="Perfis"       k="profile_count" align="center" />
              <Th label="Cadastro"     k="created_at" />
              <Th label="Último acesso"k="last_sign_in_at" />
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-500 py-10">Nenhum usuário encontrado</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-200">{u.email || "—"}</td>
                <td className="px-4 py-3 text-gray-300">{u.full_name || "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-[#1e3a8a]/20 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {u.profile_count}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "Nunca"}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/usuarios/${u.id}`} className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Ver perfis →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
