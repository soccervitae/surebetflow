"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProfileForm } from "@/components/ProfileForm"
import { useToast } from "@/hooks/useToast"
import { createClient } from "@/lib/supabase/client"
import { Plus, User, SlidersHorizontal, X } from "lucide-react"
import type { Profile } from "@/lib/types"

function maskCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "")
  if (d.length !== 11) return cpf
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
}

type FilterStatus = "todos" | "ativo" | "inativo"
type SortBy = "default" | "lucro" | "roi"

interface ProfileStats {
  lucro: number
  roi: number
}

interface Props {
  profiles: Profile[]
  userId: string
  planLimit: number
  currentCount: number
}

export default function PerfisClient({ profiles: initialProfiles, userId, planLimit, currentCount }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [showCreate, setShowCreate] = useState(false)
  const { toast } = useToast()

  const [showFilter, setShowFilter] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("todos")
  const [sortBy, setSortBy] = useState<SortBy>("default")
  const [stats, setStats] = useState<Record<string, ProfileStats>>({})
  const [statsLoaded, setStatsLoaded] = useState(false)

  const atLimit = profiles.length >= planLimit

  const hasActiveFilters = filterStatus !== "todos" || sortBy !== "default"

  async function loadStats() {
    if (statsLoaded) return
    const supabase = createClient()
    const { data } = await supabase
      .from("movimentacoes_financeiras")
      .select("profile_id, tipo, valor")
      .in("profile_id", profiles.map(p => p.id))
    const map: Record<string, ProfileStats> = {}
    for (const m of data ?? []) {
      if (!map[m.profile_id]) map[m.profile_id] = { lucro: 0, roi: 0 }
    }
    // compute per profile
    const acc: Record<string, { depositos: number; lucro: number; perda: number }> = {}
    for (const m of data ?? []) {
      if (!acc[m.profile_id]) acc[m.profile_id] = { depositos: 0, lucro: 0, perda: 0 }
      const v = parseFloat(String(m.valor)) || 0
      if (m.tipo === "deposito") acc[m.profile_id].depositos += v
      if (m.tipo === "lucro") acc[m.profile_id].lucro += v
      if (m.tipo === "perda") acc[m.profile_id].perda += v
    }
    const result: Record<string, ProfileStats> = {}
    for (const id of Object.keys(acc)) {
      const { depositos, lucro, perda } = acc[id]
      const lucroLiq = lucro - perda
      result[id] = {
        lucro: lucroLiq,
        roi: depositos > 0 ? (lucroLiq / depositos) * 100 : 0,
      }
    }
    setStats(result)
    setStatsLoaded(true)
  }

  useEffect(() => {
    if (sortBy === "lucro" || sortBy === "roi") loadStats()
  }, [sortBy])

  const displayed = useMemo(() => {
    let list = [...profiles]
    if (filterStatus === "ativo") list = list.filter(p => p.ativo)
    if (filterStatus === "inativo") list = list.filter(p => !p.ativo)
    if (sortBy === "lucro") list.sort((a, b) => (stats[b.id]?.lucro ?? 0) - (stats[a.id]?.lucro ?? 0))
    if (sortBy === "roi") list.sort((a, b) => (stats[b.id]?.roi ?? 0) - (stats[a.id]?.roi ?? 0))
    return list
  }, [profiles, filterStatus, sortBy, stats])

  function clearFilters() {
    setFilterStatus("todos")
    setSortBy("default")
  }

  function handleCreated(profile: Profile) {
    setProfiles(prev => [profile, ...prev])
    setShowCreate(false)
    toast({ title: "Perfil criado com sucesso!" })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Perfis</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Gerencie seus perfis de apostador</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Novo perfil — desktop only */}
          <Button className="hidden sm:flex" onClick={() => !atLimit && setShowCreate(true)} disabled={atLimit}>
            <Plus className="h-4 w-4 mr-2" />
            Novo perfil
          </Button>

          {/* Filtrar */}
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors flex-shrink-0 ${
              showFilter || hasActiveFilters
                ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            {showFilter ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            Filtrar{hasActiveFilters && !showFilter ? " •" : ""}
          </button>
        </div>
      </div>

      {atLimit && (
        <p className="text-xs text-amber-600 sm:text-right">
          Limite do plano atingido ({profiles.length}/{planLimit} perfis).{" "}
          <Link href="/assinatura" className="underline font-medium hover:text-amber-700">
            Faça upgrade para Trader Pro.
          </Link>
        </p>
      )}

      {/* Filtros */}
      {showFilter && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide flex-shrink-0">Status</p>
              {(["todos", "ativo", "inativo"] as FilterStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    filterStatus === s
                      ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                      : "border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {s === "todos" ? "Todos" : s === "ativo" ? "Ativos" : "Inativos"}
                </button>
              ))}

              <div className="w-px h-4 bg-[var(--border)] hidden sm:block" />

              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide flex-shrink-0">Ordenar</p>
              {([
                { value: "default", label: "Padrão" },
                { value: "lucro",   label: "Maior Lucro" },
                { value: "roi",     label: "Maior ROI" },
              ] as { value: SortBy; label: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    sortBy === opt.value
                      ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                      : "border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              {hasActiveFilters && (
                <button onClick={clearFilters} className="ml-auto text-xs text-[var(--accent-text)] font-medium">
                  Limpar
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {displayed.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-[var(--text-secondary)]">
              {hasActiveFilters ? "Nenhum perfil encontrado com os filtros aplicados" : "Nenhum perfil cadastrado"}
            </p>
            {!hasActiveFilters && (
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro perfil
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map(profile => (
            <Link key={profile.id} href={`/perfis/${profile.id}`}>
              <Card className="hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      {profile.foto_url && <AvatarImage src={profile.foto_url} />}
                      <AvatarFallback>
                        {profile.nome.charAt(0)}{profile.sobrenome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[var(--text-primary)] truncate">
                          {profile.apelido || `${profile.nome} ${profile.sobrenome}`}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          profile.ativo ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${profile.ativo ? "bg-green-500" : "bg-red-500"}`} />
                          {profile.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      {profile.cpf && (
                        <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                          {maskCpf(profile.cpf)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Perfil</DialogTitle>
          </DialogHeader>
          <ProfileForm userId={userId} onSuccess={handleCreated} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
