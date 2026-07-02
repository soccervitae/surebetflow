"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Plus, Calculator, DollarSign, Wallet, Loader2, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SurebetCalculator from "@/components/SurebetCalculator"
import AddBetToProfile from "@/components/AddBetToProfile"
import { ProfileForm } from "@/components/ProfileForm"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { useSwipeToDismiss } from "@/hooks/useSwipeToDismiss"

const FAB_PAGES = ["/dashboard", "/perfis", "/apostas", "/financeiro"]

type Profile = { id: string; nome: string; sobrenome: string; apelido?: string | null }
type ProfileBet = { id: string; profile_id: string; bet?: { id: string; nome: string } }

export default function GlobalFAB() {
  const pathname = usePathname()
  const { toast } = useToast()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profilesLoaded, setProfilesLoaded] = useState(false)

  // Modal states
  const [apostaModal, setApostaModal] = useState(false)
  const [apostaProfile, setApostaProfile] = useState<Profile | null>(null)
  const [apostaPickStep, setApostaPickStep] = useState(false) // picking profile

  const [movModal, setMovModal] = useState(false)
  const [movProfileId, setMovProfileId] = useState("")
  const [movBets, setMovBets] = useState<ProfileBet[]>([])
  const [movBetId, setMovBetId] = useState("")
  const [movTipo, setMovTipo] = useState<"deposito" | "saque" | "bonus" | "lucro" | "perda">("deposito")
  const [movValor, setMovValor] = useState("")
  const [movDesc, setMovDesc] = useState("")
  const [movLoading, setMovLoading] = useState(false)

  const [betsModal, setBetsModal] = useState(false)
  const [betsProfile, setBetsProfile] = useState<Profile | null>(null)
  const [betsPickStep, setBetsPickStep] = useState(false)

  const [perfilModal, setPerfilModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  async function loadProfiles() {
    if (profilesLoaded) return
    const { data } = await supabase.from("profiles").select("id, nome, sobrenome, apelido").eq("ativo", true).order("nome")
    setProfiles(data ?? [])
    setProfilesLoaded(true)
  }

  const visible = FAB_PAGES.some(p => pathname === p || pathname.startsWith(p + "/"))

  const loadProfilesRef = useRef(loadProfiles)
  loadProfilesRef.current = loadProfiles

  useEffect(() => {
    const handler = () => { loadProfilesRef.current(); setMobileOpen(true) }
    window.addEventListener("open-mobile-fab", handler)
    return () => window.removeEventListener("open-mobile-fab", handler)
  }, [])

  async function loadMovBets(profileId: string) {
    const { data } = await supabase
      .from("profile_bets")
      .select("id, profile_id, bet:bets(id, nome)")
      .eq("profile_id", profileId)
    setMovBets((data ?? []) as unknown as ProfileBet[])
    setMovBetId("")
  }

  function profileName(p: Profile) { return p.apelido || `${p.nome} ${p.sobrenome}` }

  function handleOpen() {
    setOpen(v => !v)
    loadProfiles()
  }

  function openAposta() {
    setOpen(false)
    if (profiles.length === 1) { setApostaProfile(profiles[0]); setApostaModal(true) }
    else { setApostaPickStep(true) }
  }

  function openMov() {
    setOpen(false)
    setMovProfileId(profiles.length === 1 ? profiles[0].id : "")
    if (profiles.length === 1) loadMovBets(profiles[0].id)
    setMovTipo("deposito"); setMovValor(""); setMovDesc(""); setMovBetId("")
    setMovModal(true)
  }

  function openBets() {
    setOpen(false)
    if (profiles.length === 1) { setBetsProfile(profiles[0]); setBetsModal(true) }
    else { setBetsPickStep(true) }
  }

  function openPerfil() {
    setOpen(false)
    setPerfilModal(true)
  }

  async function handleSaveMov() {
    const valor = parseFloat(movValor.replace(/\./g, "").replace(",", "."))
    if (!movProfileId || !movBetId || !valor) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" }); return
    }
    setMovLoading(true)
    const { error } = await supabase.from("movimentacoes_financeiras").insert({
      profile_id: movProfileId, profile_bet_id: movBetId,
      tipo: movTipo, valor, descricao: movDesc.trim() || null,
    })
    if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }) }
    else {
      // Recalc saldo
      const { data: movs } = await supabase.from("movimentacoes_financeiras").select("tipo, valor").eq("profile_bet_id", movBetId)
      const novoSaldo = (movs ?? []).reduce((acc, m) => {
        const v = parseFloat(String(m.valor)) || 0
        if (m.tipo === "deposito" || m.tipo === "lucro") return acc + v
        if (m.tipo === "saque" || m.tipo === "perda") return acc - v
        return acc
      }, 0)
      await supabase.from("profile_bets").update({ saldo: novoSaldo }).eq("id", movBetId)
      toast({ title: "Movimentação salva!" })
      setMovModal(false)
    }
    setMovLoading(false)
  }

  function formatBRL(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const fabItems = [
    { label: "Nova Aposta",    icon: Calculator, color: "bg-[#1e3a8a]", onClick: openAposta },
    { label: "Movimentação",   icon: DollarSign, color: "bg-[#f97316]", onClick: openMov },
    { label: "Novo Perfil",    icon: User,       color: "bg-[#16a34a]", onClick: openPerfil },
    { label: "Adicionar Bet",  icon: Wallet,     color: "bg-[#a855f7]", onClick: openBets },
  ]

  const swipe = useSwipeToDismiss(() => setMobileOpen(false))

  if (!mounted) return null

  return createPortal(
    <>
      {/* Mobile action sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div
            ref={swipe.sheetRef}
            onTouchStart={swipe.onTouchStart}
            onTouchMove={swipe.onTouchMove}
            onTouchEnd={swipe.onTouchEnd}
            className="relative bg-[var(--bg-surface)] rounded-t-2xl shadow-xl p-4 pb-8 space-y-2"
          >
            <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-4" />
            {fabItems.map(({ label, icon: Icon, color, onClick }) => (
              <button
                key={label}
                onClick={() => { setMobileOpen(false); onClick() }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-sm text-[var(--text-primary)]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop FAB */}
      {visible && <div className="fixed bottom-8 right-8 hidden md:flex flex-col items-end gap-2 z-50">
        {/* Options (expand upward) */}
        {open && (
          <div className="flex flex-col items-end gap-3 mb-2">
            {fabItems.map(({ label, icon: Icon, color, onClick }, i) => (
              <button
                key={label}
                onClick={onClick}
                className="flex items-center gap-3"
                style={{ animation: `fabItemIn 0.15s ease both`, animationDelay: `${i * 40}ms` }}
              >
                <span className="text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap">
                  {label}
                </span>
                <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center shadow-lg flex-shrink-0 hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={handleOpen}
          className="w-14 h-14 rounded-full bg-[#16a34a] hover:bg-[#15803d] flex items-center justify-center shadow-xl"
          style={{ transition: "transform 0.2s, background-color 0.2s", transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>}

      {/* Click outside to close desktop FAB */}
      {open && visible && <div className="fixed inset-0 z-40 hidden md:block" onClick={() => setOpen(false)} />}

      <style>{`
        @keyframes fabItemIn {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>

      {/* Profile picker for Aposta */}
      <Dialog open={apostaPickStep} onOpenChange={v => { if (!v) setApostaPickStep(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Escolha o perfil</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">
            {profiles.map(p => (
              <button key={p.id} onClick={() => { setApostaProfile(p); setApostaPickStep(false); setApostaModal(true) }}
                className="w-full text-left px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[#1e3a8a]/60 hover:bg-[#1e3a8a]/5 transition-colors">
                <span className="font-semibold text-sm text-[var(--text-primary)]">{profileName(p)}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Aposta modal */}
      <Dialog open={apostaModal} onOpenChange={v => { if (!v) { setApostaModal(false); setApostaProfile(null) } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[var(--accent-text)]" />
              Nova Aposta{apostaProfile ? ` — ${profileName(apostaProfile)}` : ""}
            </DialogTitle>
          </DialogHeader>
          {apostaProfile && (
            <SurebetCalculator
              profiles={profiles as any}
              defaultProfileId={apostaProfile.id}
              profileName={profileName(apostaProfile)}
              onSaved={() => setApostaModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Movimentação modal */}
      <Dialog open={movModal} onOpenChange={v => { if (!v) setMovModal(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Movimentação</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select value={movProfileId} onValueChange={v => { setMovProfileId(v); loadMovBets(v) }}>
                <SelectTrigger><SelectValue placeholder="Selecione o perfil" /></SelectTrigger>
                <SelectContent>
                  {profiles.map(p => <SelectItem key={p.id} value={p.id}>{profileName(p)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {movProfileId && (
              <div className="space-y-1.5">
                <Label>Casa de apostas</Label>
                <Select value={movBetId} onValueChange={setMovBetId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a casa" /></SelectTrigger>
                  <SelectContent>
                    {movBets.map(b => <SelectItem key={b.id} value={b.id}>{b.bet?.nome ?? b.id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={movTipo} onValueChange={v => setMovTipo(v as typeof movTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposito">Depósito</SelectItem>
                  <SelectItem value="saque">Saque</SelectItem>
                  <SelectItem value="bonus">Bônus</SelectItem>
                  <SelectItem value="lucro">Lucro</SelectItem>
                  <SelectItem value="perda">Perda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                value={movValor}
                onChange={e => setMovValor(formatBRL(e.target.value))}
                placeholder="0,00"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição <span className="text-[var(--text-muted)] font-normal">(opcional)</span></Label>
              <Input value={movDesc} onChange={e => setMovDesc(e.target.value)} placeholder="Ex: depósito inicial" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setMovModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveMov} disabled={movLoading}>
              {movLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile picker for Bets */}
      <Dialog open={betsPickStep} onOpenChange={v => { if (!v) setBetsPickStep(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Escolha o perfil</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">
            {profiles.map(p => (
              <button key={p.id} onClick={() => { setBetsProfile(p); setBetsPickStep(false); setBetsModal(true) }}
                className="w-full text-left px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[#a855f7]/60 hover:bg-[#a855f7]/5 transition-colors">
                <span className="font-semibold text-sm text-[var(--text-primary)]">{profileName(p)}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Bet modal */}
      <Dialog open={betsModal} onOpenChange={v => { if (!v) { setBetsModal(false); setBetsProfile(null) } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#a855f7]" />
              Adicionar Bet{betsProfile ? ` — ${profileName(betsProfile)}` : ""}
            </DialogTitle>
          </DialogHeader>
          {betsProfile && (
            <AddBetToProfile profileId={betsProfile.id} />
          )}
        </DialogContent>
      </Dialog>

      {/* Novo Perfil modal */}
      <Dialog open={perfilModal} onOpenChange={v => { if (!v) setPerfilModal(false) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#16a34a]" />
              Novo Perfil
            </DialogTitle>
          </DialogHeader>
          {userId && (
            <ProfileForm
              userId={userId}
              onSuccess={() => {
                setPerfilModal(false)
                toast({ title: "Perfil criado com sucesso!" })
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>,
    document.body
  )
}
