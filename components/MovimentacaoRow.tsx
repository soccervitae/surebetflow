"use client"

import { ArrowDownLeft, ArrowUpRight, TrendingUp, Gift } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export type MovimentacaoItem = {
  id: string
  created_at: string
  tipo: string
  valor: number
  betNome?: string | null
  descricao?: string | null
  profileNome?: string | null
}

function tLabel(tipo: string) {
  if (tipo === "deposito") return "Depósito"
  if (tipo === "saque")   return "Saque"
  if (tipo === "lucro")   return "Lucro"
  if (tipo === "perda")   return "Perda"
  return "Bônus"
}

function tColor(tipo: string) {
  if (tipo === "saque")   return "text-[#DC2626]"
  if (tipo === "perda")   return "text-orange-500"
  if (tipo === "lucro")   return "text-green-500"
  if (tipo === "bonus")   return "text-purple-500"
  return "text-[var(--accent-text)]"
}

function tBg(tipo: string) {
  if (tipo === "saque")   return "bg-[#DC2626]/10"
  if (tipo === "perda")   return "bg-orange-500/10"
  if (tipo === "lucro")   return "bg-green-500/10"
  if (tipo === "bonus")   return "bg-purple-500/10"
  return "bg-[#1e3a8a]/10"
}

function tIcon(tipo: string) {
  if (tipo === "deposito") return <ArrowDownLeft className="h-5 w-5 text-[var(--accent-text)]" />
  if (tipo === "lucro")    return <TrendingUp    className="h-5 w-5 text-green-500" />
  if (tipo === "perda")    return <ArrowUpRight  className="h-5 w-5 text-orange-500" />
  if (tipo === "bonus")    return <Gift          className="h-5 w-5 text-purple-500" />
  return                          <ArrowUpRight  className="h-5 w-5 text-[#DC2626]" />
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

interface Props {
  item: MovimentacaoItem
}

export default function MovimentacaoRow({ item }: Props) {
  const sub: string[] = []
  if (item.profileNome) sub.push(item.profileNome)
  sub.push(fmtHora(item.created_at))
  if (item.descricao && !item.descricao.startsWith("Aposta: ")) sub.push(item.descricao)

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tBg(item.tipo)}`}>
        {tIcon(item.tipo)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.betNome ?? "—"}</p>
        {item.tipo === "perda" && item.descricao?.startsWith("Aposta: ") && (
          <p className="text-xs text-[var(--text-secondary)] truncate">{item.descricao.replace("Aposta: ", "")}</p>
        )}
        <p className="text-xs text-[var(--text-muted)] truncate">{sub.join(" · ")}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${tColor(item.tipo)}`}>
          {item.tipo === "saque" || item.tipo === "perda" ? "-" : "+"}{formatCurrency(item.valor)}
        </p>
        <p className="text-xs text-[var(--text-muted)]">{tLabel(item.tipo)}</p>
      </div>
    </div>
  )
}

export function fmtGroupDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")
}
