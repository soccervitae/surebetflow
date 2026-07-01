"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/useToast"
import { formatCurrency } from "@/lib/utils"
import {
  ArrowLeft, Eye, EyeOff, Pencil, Loader2,
  ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, Gift, Plus, Percent,
} from "lucide-react"
import type { MovimentacaoFinanceira } from "@/lib/types"

type ProfileBetFull = {
  id: string
  profile_id: string
  bet_id: string
  email: string | null
  senha_texto: string | null
  saldo: number
  ativo: boolean
  created_at: string
  bet?: { id: string; nome: string; logo_url?: string | null }
}

interface Props {
  profile: { id: string; nome: string; sobrenome: string; apelido?: string | null }
  profileBet: ProfileBetFull
  movimentacoes: MovimentacaoFinanceira[]
}

const TIPO_CONFIG = {
  deposito: { label: "Depósito",  icon: ArrowDownLeft,  color: "text-[var(--accent-text)]",  bg: "bg-[#1e3a8a]/10",  sign: "+" },
  saque:    { label: "Saque",     icon: ArrowUpRight,   color: "text-[#DC2626]",              bg: "bg-[#DC2626]/10",  sign: "-" },
  lucro:    { label: "Lucro",     icon: TrendingUp,     color: "text-green-600",              bg: "bg-green-500/10",  sign: "+" },
  perda:    { label: "Perda",     icon: TrendingDown,   color: "text-[#DC2626]",              bg: "bg-[#DC2626]/10",  sign: "-" },
  bonus:    { label: "Bônus",     icon: Gift,           color: "text-purple-500",             bg: "bg-purple-500/10", sign: "+" },
}

export default function BetDetailClient({ profile, profileBet: initial, movimentacoes }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [pb, setPb] = useState(initial)
  const [showSenha, setShowSenha] = useState(false)
  const [editando, setEditando] = useState(false)
  const [editEmail, setEditEmail] = useState(initial.email ?? "")
  const [editSenha, setEditSenha] = useState("")
  const [salvando, setSalvando] = useState(false)

  const profileName = profile.apelido || `${profile.nome} ${profile.sobrenome}`

  // Compute stats from movimentacoes
  const totalDepositos = movimentacoes.filter(m => m.tipo === "deposito").reduce((s, m) => s + m.valor, 0)
  const totalLucro = movimentacoes.filter(m => m.tipo === "lucro").reduce((s, m) => s + m.valor, 0)
  const totalPerda = movimentacoes.filter(m => m.tipo === "perda").reduce((s, m) => s + m.valor, 0)
  const lucroRealizado = totalLucro - totalPerda
  const roi = totalDepositos > 0 ? (lucroRealizado / totalDepositos) * 100 : 0

  // Group movimentações by date
  const groups: { date: string; items: MovimentacaoFinanceira[] }[] = []
  for (const m of movimentacoes) {
    const date = new Date(m.created_at).toISOString().slice(0, 10)
    const existing = groups.find(g => g.date === date)
    if (existing) existing.items.push(m)
    else groups.push({ date, items: [m] })
  }

  function formatDate(iso: string) {
    const d = new Date(iso + "T12:00:00")
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
  }

  async function handleSalvarCredenciais() {
    setSalvando(true)
    const updates: Record<string, string | null> = { email: editEmail.trim() || null }
    if (editSenha.trim()) updates.senha_texto = editSenha.trim()
    const { error } = await supabase.from("profile_bets").update(updates).eq("id", pb.id)
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" })
    } else {
      setPb(prev => ({ ...prev, email: editEmail.trim() || null, senha_texto: editSenha.trim() || prev.senha_texto }))
      toast({ title: "Credenciais atualizadas!" })
      setEditando(false)
      setEditSenha("")
    }
    setSalvando(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/perfis/${profile.id}`} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{pb.bet?.nome ?? "Bet"}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{profileName}</p>
        </div>
        <span className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
          pb.ativo ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${pb.ativo ? "bg-green-500" : "bg-red-500"}`} />
          {pb.ativo ? "Ativa" : "Inativa"}
        </span>
      </div>

      {/* Saldo + stats */}
      <Card>
        <CardContent className="p-5">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Saldo atual</p>
          <p className={`text-3xl font-bold ${pb.saldo > 0 ? "text-[var(--accent-text)]" : pb.saldo < 0 ? "text-[#DC2626]" : "text-[var(--text-primary)]"}`}>
            {formatCurrency(pb.saldo)}
          </p>
        </CardContent>
      </Card>

      {/* Lucro realizado + ROI */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Lucro realizado</p>
            </div>
            <p className={`text-xl font-bold ${lucroRealizado > 0 ? "text-green-500" : lucroRealizado < 0 ? "text-[#DC2626]" : "text-[var(--text-primary)]"}`}>
              {lucroRealizado >= 0 ? "+" : ""}{formatCurrency(lucroRealizado)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-3.5 h-3.5 text-[#a855f7]" />
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">ROI</p>
            </div>
            <p className={`text-xl font-bold ${roi > 0 ? "text-[#a855f7]" : roi < 0 ? "text-[#DC2626]" : "text-[var(--text-primary)]"}`}>
              {roi >= 0 ? "+" : ""}{roi.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credenciais */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Credenciais de acesso</CardTitle>
            {!editando && (
              <Button variant="ghost" size="sm" onClick={() => { setEditEmail(pb.email ?? ""); setEditSenha(""); setEditando(true) }}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editando ? (
            <>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Nova senha <span className="text-[var(--text-muted)] font-normal">(deixe em branco para não alterar)</span></Label>
                <Input type="text" value={editSenha} onChange={e => setEditSenha(e.target.value)} placeholder="Senha da conta" autoComplete="off" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditando(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleSalvarCredenciais} disabled={salvando}>
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm text-[var(--text-primary)]">{pb.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Senha</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[var(--text-primary)] font-mono flex-1">
                    {showSenha ? (pb.senha_texto || "—") : "••••••••"}
                  </p>
                  <button
                    onClick={() => setShowSenha(v => !v)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Extrato */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Extrato</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/perfis/${profile.id}`)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nova movimentação
          </Button>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-[var(--text-secondary)]">
              Nenhuma movimentação registrada
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map(({ date, items }) => (
              <div key={date}>
                <p className="text-xs text-[var(--text-muted)] font-medium capitalize mb-2 px-1">{formatDate(date)}</p>
                <div className="space-y-2">
                  {items.map(m => {
                    const cfg = TIPO_CONFIG[m.tipo as keyof typeof TIPO_CONFIG] ?? TIPO_CONFIG.deposito
                    const Icon = cfg.icon
                    return (
                      <Card key={m.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.bg}`}>
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text-primary)]">{cfg.label}</p>
                              {m.descricao && (
                                <p className="text-xs text-[var(--text-secondary)] truncate">{m.descricao}</p>
                              )}
                            </div>
                            <p className={`font-bold text-base flex-shrink-0 ${cfg.color}`}>
                              {cfg.sign}{formatCurrency(m.valor)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
