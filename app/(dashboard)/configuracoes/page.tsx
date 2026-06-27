"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/components/ThemeProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Settings, Camera, Loader2, Shield, Monitor, Smartphone,
  Clock, LogOut, Key, User, AlertTriangle, Sun, Moon,
  FileText, Lock, ExternalLink, CreditCard, CheckCircle, XCircle,
  Calendar, RefreshCw, Star, Pencil
} from "lucide-react"

interface Assinatura {
  id: string
  plan: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_subscription_id: string | null
  created_at: string
}

interface SessionInfo {
  id: string
  created_at: string
  updated_at: string
  user_agent?: string
  ip?: string
}

function parseDevice(ua: string): { nome: string; icone: "monitor" | "smartphone" } {
  const mobile = /android|iphone|ipad|ipod|mobile/i.test(ua)
  if (mobile) {
    if (/iphone/i.test(ua)) return { nome: "iPhone", icone: "smartphone" }
    if (/ipad/i.test(ua)) return { nome: "iPad", icone: "smartphone" }
    if (/android/i.test(ua)) return { nome: "Android", icone: "smartphone" }
    return { nome: "Dispositivo móvel", icone: "smartphone" }
  }
  if (/windows/i.test(ua)) return { nome: "Windows", icone: "monitor" }
  if (/mac os/i.test(ua)) return { nome: "Mac", icone: "monitor" }
  if (/linux/i.test(ua)) return { nome: "Linux", icone: "monitor" }
  return { nome: "Computador", icone: "monitor" }
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Microsoft Edge"
  if (/opr\//i.test(ua)) return "Opera"
  if (/chrome/i.test(ua)) return "Google Chrome"
  if (/safari/i.test(ua)) return "Safari"
  if (/firefox/i.test(ua)) return "Firefox"
  return "Navegador desconhecido"
}

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const [tab, setTab] = useState<"conta" | "configuracoes" | "assinatura">("conta")

  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [lastSignIn, setLastSignIn] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [device, setDevice] = useState<{ nome: string; icone: "monitor" | "smartphone" } | null>(null)
  const [browser, setBrowser] = useState("")
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [removingSession, setRemovingSession] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  const [nome, setNome] = useState("")
  const [sobrenome, setSobrenome] = useState("")
  const [dataNascimento, setDataNascimento] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState("")

  const [uploading, setUploading] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [logoutAllOpen, setLogoutAllOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [loadingAssinatura, setLoadingAssinatura] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [migrateLoading, setMigrateLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "")
        setUserId(user.id)
        setAvatarUrl(user.user_metadata?.avatar_url ?? "")
        setLastSignIn(user.last_sign_in_at ?? null)
        setCreatedAt(user.created_at ?? null)
        const { data: usuario } = await supabase.from("usuarios").select("nome, sobrenome, data_nascimento").eq("id", user.id).single()
        if (usuario) {
          setNome(usuario.nome ?? "")
          setSobrenome(usuario.sobrenome ?? "")
          setDataNascimento(usuario.data_nascimento ?? "")
        }
        // Load assinatura
        setLoadingAssinatura(true)
        const { data: ass } = await supabase
          .from("assinaturas")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
        setAssinatura(ass ?? null)
        setLoadingAssinatura(false)
      }
    })

    const ua = navigator.userAgent
    setDevice(parseDevice(ua))
    setBrowser(parseBrowser(ua))

    // Load sessions + current session id
    const supabase2 = createClient()
    supabase2.auth.getSession().then(({ data }) => {
      setCurrentSessionId((data.session as any)?.id ?? null)
    })

    setLoadingSessions(true)
    fetch("/api/auth/sessions")
      .then(r => r.json())
      .then(d => setSessions(d.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false))
  }, [])

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop()
      const fileName = `${userId}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(fileName)
      const url = data.publicUrl
      await supabase.auth.updateUser({ data: { avatar_url: url } })
      setAvatarUrl(url)
    } catch (err) {
      console.error("Erro ao fazer upload:", err)
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSavingProfile(true)
    setProfileSuccess("")
    const supabase = createClient()
    await supabase.from("usuarios").update({
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      data_nascimento: dataNascimento || null,
    }).eq("id", userId)
    setProfileSuccess("Perfil atualizado com sucesso!")
    setSavingProfile(false)
    setTimeout(() => setProfileSuccess(""), 3000)
  }

  const PLAN_INFO: Record<string, { name: string; price: string; maxProfiles: number }> = {
    trader:     { name: "Trader",     price: "R$ 99,00/mês",  maxProfiles: 5  },
    trader_pro: { name: "Trader Pro", price: "R$ 179,00/mês", maxProfiles: 20 },
    pro:        { name: "Trader",     price: "R$ 99,00/mês",  maxProfiles: 5  },
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? "Erro ao abrir portal. Verifique se o portal do cliente está ativado no Stripe Dashboard.")
        setPortalLoading(false)
      }
    } catch {
      alert("Erro ao conectar com o servidor. Tente novamente.")
      setPortalLoading(false)
    }
  }

  async function migratePlan(targetPlan: string) {
    setMigrateLoading(true)
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: targetPlan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setMigrateLoading(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")
    if (newPassword.length < 8) { setPasswordError("A senha deve ter pelo menos 8 caracteres."); return }
    if (newPassword !== confirmPassword) { setPasswordError("As senhas não coincidem."); return }
    setSavingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPasswordError("Erro ao alterar senha. Tente novamente."); setSavingPassword(false); return }
    setPasswordSuccess("Senha alterada com sucesso!")
    setNewPassword("")
    setConfirmPassword("")
    setSavingPassword(false)
  }

  async function handleRevokeSession(sessionId: string) {
    setRemovingSession(sessionId)
    await fetch("/api/auth/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    setRemovingSession(null)
  }

  async function handleLogoutAll() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut({ scope: "global" })
    router.push("/login")
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—"
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    })
  }

  const DeviceIcon = device?.icone === "smartphone" ? Smartphone : Monitor
  const isDark = theme === "dark"

  const TABS = ["conta", "assinatura", "configuracoes"] as const
  const tabs = [
    { key: "conta" as const,          label: "Minha Conta",   icon: User },
    { key: "assinatura" as const,     label: "Assinatura",    icon: CreditCard },
    { key: "configuracoes" as const,  label: "Configurações", icon: Settings },
  ]

  const touchStartX = useRef(0)
  function handleTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 50) return
    const idx = TABS.indexOf(tab)
    if (dx < 0 && idx < TABS.length - 1) setTab(TABS[idx + 1])
    if (dx > 0 && idx > 0) setTab(TABS[idx - 1])
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="hidden md:flex w-9 h-9 bg-[var(--bg-elevated)] rounded-xl items-center justify-center">
          <User className="w-5 h-5 text-[var(--text-secondary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Minha Conta</h1>
          <p className="text-sm text-[var(--text-secondary)]">Gerencie seus dados e preferências</p>
        </div>
      </div>

      {/* Tabs — mobile: full-width border-b; desktop: pills */}
      <div className="-mx-4 md:mx-0 md:hidden">
        <div className="flex border-b border-[var(--border)]">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key
                  ? "border-[#1e3a8a] text-[var(--accent-text)]"
                  : "border-transparent text-[var(--text-secondary)]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="hidden md:flex gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Swipe wrapper */}
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* ── ABA: MINHA CONTA ── */}
      {tab === "conta" && (
        <>
          {/* Profile card — centered */}
          <Card>
            <CardContent className="pt-8 pb-6 flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="Foto da conta" />}
                  <AvatarFallback className="text-2xl">
                    {nome ? nome.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center hover:bg-[#1e40af] transition-colors disabled:opacity-50 shadow"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>

              {(nome || sobrenome) && (
                <p className="text-lg font-semibold text-[var(--text-primary)]">{`${nome} ${sobrenome}`.trim()}</p>
              )}
              <p className="text-sm text-[var(--text-secondary)]">{email}</p>
              {createdAt && (
                <p className="text-xs text-[var(--text-muted)]">Conta criada em {formatDate(createdAt)}</p>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowEditSheet(true)}
                  className="md:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Editar conta
                </button>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Editar conta
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" /> Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    required
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-[#DC2626] bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-lg px-3 py-2">
                    {passwordError}
                  </p>
                )}
                {passwordSuccess && (
                  <p className="text-sm text-[var(--accent-text)] bg-[#1e3a8a]/5 border border-[#1e3a8a]/20 rounded-lg px-3 py-2">
                    {passwordSuccess}
                  </p>
                )}
                <Button type="submit" className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white" disabled={savingPassword}>
                  <Shield className="h-4 w-4 mr-2" />
                  {savingPassword ? "Salvando..." : "Alterar senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── ABA: ASSINATURA ── */}
      {tab === "assinatura" && (
        <>
          {loadingAssinatura ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
              </CardContent>
            </Card>
          ) : !assinatura ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1e3a8a]/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-[var(--accent-text)]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[var(--text-primary)]">Nenhuma assinatura ativa</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Assine um plano para acessar todos os recursos.</p>
                </div>
                <Link
                  href="/assinatura"
                  className="px-5 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium transition-colors"
                >
                  Ver planos
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Status card */}
              {(() => {
                const planInfo = PLAN_INFO[assinatura.plan ?? ""] ?? { name: assinatura.plan, price: "—", maxProfiles: 0 }
                const isActive = assinatura.status === "active" || assinatura.status === "trialing"
                const otherPlan = assinatura.plan === "trader_pro" ? "trader" : "trader_pro"
                const otherPlanInfo = PLAN_INFO[otherPlan]
                return (
                  <>
                    <Card className={`border ${isActive ? "border-[#1e3a8a]/40 bg-[#1e3a8a]/5" : "border-[var(--border)]"}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#1e3a8a]/10 flex items-center justify-center flex-shrink-0">
                              <Star className="h-5 w-5 text-[var(--accent-text)]" />
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text-primary)]">{planInfo.name}</p>
                              <p className="text-sm text-[var(--text-muted)]">{planInfo.price}</p>
                            </div>
                          </div>
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                            assinatura.status === "active" ? "bg-green-500/15 text-green-600"
                            : assinatura.status === "trialing" ? "bg-blue-500/15 text-blue-600"
                            : assinatura.status === "past_due" ? "bg-yellow-500/15 text-yellow-600"
                            : "bg-red-500/15 text-red-600"
                          }`}>
                            {assinatura.status === "active" && <CheckCircle className="h-3 w-3" />}
                            {assinatura.status === "canceled" && <XCircle className="h-3 w-3" />}
                            {{ active: "Ativa", trialing: "Trial", past_due: "Pagamento pendente", canceled: "Cancelada", incomplete: "Incompleta" }[assinatura.status] ?? assinatura.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] border-t border-[var(--border)] pt-4">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-[#1e3a8a]" />
                            Até {planInfo.maxProfiles} perfis
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-[#1e3a8a]" />
                            Casas ilimitadas
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-[#1e3a8a]" />
                            Calculadora 2-way e 3-way
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-[#1e3a8a]" />
                            Dashboard financeiro
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Details */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CreditCard className="h-4 w-4" /> Detalhes da assinatura
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="divide-y divide-[var(--border)]">
                        {[
                          { icon: Calendar, label: assinatura.cancel_at_period_end ? "Expira em" : "Próxima cobrança", value: assinatura.current_period_end ? new Date(assinatura.current_period_end).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
                          { icon: RefreshCw, label: "Renovação automática", value: assinatura.cancel_at_period_end ? <span className="text-red-500 font-medium">Desativada</span> : <span className="text-green-600 font-medium">Ativada</span> },
                          ...(assinatura.created_at ? [{ icon: Clock, label: "Assinante desde", value: new Date(assinatura.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) }] : []),
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                              {label}
                            </div>
                            <div className="text-sm text-[var(--text-primary)]">{value}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Actions */}
                    {isActive && (
                      <>
                        <button
                          onClick={openPortal}
                          disabled={portalLoading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white text-sm font-medium transition-colors"
                        >
                          {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          {portalLoading ? "Abrindo portal..." : "Renovar / Gerenciar assinatura"}
                        </button>

                        {/* Migrate plan */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" /> Migrar de plano
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]">
                              <div>
                                <p className="font-semibold text-[var(--text-primary)] text-sm">{otherPlanInfo.name}</p>
                                <p className="text-xs text-[var(--text-muted)]">{otherPlanInfo.price} · até {otherPlanInfo.maxProfiles} perfis</p>
                              </div>
                              <button
                                onClick={() => migratePlan(otherPlan)}
                                disabled={migrateLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a]/10 disabled:opacity-60 text-sm font-medium transition-colors flex-shrink-0"
                              >
                                {migrateLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                {assinatura.plan === "trader_pro" ? "Fazer downgrade" : "Fazer upgrade"}
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </>
                )
              })()}
            </>
          )}
        </>
      )}

      {/* ── ABA: CONFIGURAÇÕES ── */}
      {tab === "configuracoes" && (
        <>
          {/* Tema */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Aparência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#1e3a8a]/10">
                    {isDark ? <Moon className="h-4 w-4 text-[var(--accent-text)]" /> : <Sun className="h-4 w-4 text-[var(--accent-text)]" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{isDark ? "Modo escuro" : "Modo claro"}</p>
                    <p className="text-xs text-[var(--text-muted)]">Altere o tema da interface</p>
                  </div>
                </div>
                <button
                  onClick={toggle}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? "bg-[#1e3a8a]" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Sessão */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Dispositivos conectados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Sessão atual */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                <div className="p-2 rounded-lg bg-[#1e3a8a]/10">
                  <DeviceIcon className="h-5 w-5 text-[var(--accent-text)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {device?.nome ?? "—"} · {browser}
                    </p>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Este dispositivo
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mt-1">
                    <Clock className="w-3 h-3" />
                    Último acesso: {formatDate(lastSignIn)}
                  </span>
                </div>
              </div>

              {/* Outros dispositivos */}
              {loadingSessions ? (
                <div className="flex items-center gap-2 py-2 text-xs text-[var(--text-muted)]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando outros dispositivos...
                </div>
              ) : sessions.filter(s => s.id !== currentSessionId).length > 0 ? (
                <>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pt-1">
                    Outras sessões ativas
                  </p>
                  {sessions
                    .filter(s => s.id !== currentSessionId)
                    .map(s => {
                      const ua = s.user_agent ?? ""
                      const dev = parseDevice(ua)
                      const brw = parseBrowser(ua)
                      const OtherIcon = dev.icone === "smartphone" ? Smartphone : Monitor
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                          <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                            <OtherIcon className="h-5 w-5 text-[var(--text-secondary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {dev.nome} · {brw}
                            </p>
                            <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mt-0.5">
                              <Clock className="w-3 h-3" />
                              Último acesso: {formatDate(s.updated_at)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            disabled={removingSession === s.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#DC2626] border border-[#DC2626]/30 hover:bg-[#DC2626]/5 transition-colors disabled:opacity-50"
                          >
                            {removingSession === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                            Revogar
                          </button>
                        </div>
                      )
                    })}
                </>
              ) : !loadingSessions && sessions.length > 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-1">Nenhuma outra sessão ativa encontrada.</p>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                className="w-full text-[#DC2626] border-[#DC2626]/30 hover:bg-[#DC2626]/5"
                onClick={() => setLogoutAllOpen(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair de todos os dispositivos
              </Button>
            </CardContent>
          </Card>

          {/* Legal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Legal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/privacidade"
                target="_blank"
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#1e3a8a]/10">
                    <Lock className="h-4 w-4 text-[var(--accent-text)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Política de Privacidade</p>
                    <p className="text-xs text-[var(--text-muted)]">Como tratamos seus dados</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
              </Link>
              <Link
                href="/termos"
                target="_blank"
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#1e3a8a]/10">
                    <FileText className="h-4 w-4 text-[var(--accent-text)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Termos de Uso</p>
                    <p className="text-xs text-[var(--text-muted)]">Regras e condições do serviço</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
              </Link>
            </CardContent>
          </Card>
        </>
      )}

      </div> {/* end swipe wrapper */}

      {/* Edit profile form — shared between Sheet and Dialog */}
      {(() => {
        const editForm = (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-nome">Nome</Label>
                <Input id="edit-nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-sobrenome">Sobrenome</Label>
                <Input id="edit-sobrenome" value={sobrenome} onChange={e => setSobrenome(e.target.value)} placeholder="Seu sobrenome" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={email} disabled className="bg-[var(--bg-muted)] text-[var(--text-secondary)]" />
              <p className="text-xs text-[var(--text-muted)]">Para alterar o e-mail, entre em contato com o suporte.</p>
            </div>
            {profileSuccess && (
              <p className="text-sm text-[var(--accent-text)] bg-[#1e3a8a]/5 border border-[#1e3a8a]/20 rounded-lg px-3 py-2">
                {profileSuccess}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1 bg-[#1e3a8a] hover:bg-[#1e40af] text-white" disabled={savingProfile}>
                <User className="h-4 w-4 mr-2" />
                {savingProfile ? "Salvando..." : "Salvar alterações"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowEditSheet(false); setShowEditModal(false) }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )
        return (
          <>
            {/* Sheet — mobile */}
            <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
              <SheetContent
                side="bottom"
                className="h-[80vh] flex flex-col p-0 rounded-t-2xl"
                onTouchStart={e => { (e.currentTarget as any)._swipeY = e.touches[0].clientY }}
                onTouchEnd={e => {
                  const startY = (e.currentTarget as any)._swipeY
                  if (startY !== undefined && e.changedTouches[0].clientY - startY > 80) setShowEditSheet(false)
                }}
              >
                <SheetHeader className="px-5 pt-5 pb-3 border-b border-[var(--border)] flex-shrink-0">
                  <SheetTitle className="flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-[var(--accent-text)]" />
                    Editar conta
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-5 py-4">{editForm}</div>
              </SheetContent>
            </Sheet>

            {/* Dialog — desktop */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Pencil className="h-5 w-5 text-[var(--accent-text)]" />
                    Editar conta
                  </DialogTitle>
                </DialogHeader>
                {editForm}
              </DialogContent>
            </Dialog>
          </>
        )
      })()}

      <Dialog open={logoutAllOpen} onOpenChange={setLogoutAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
              Sair de todos os dispositivos
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Isso encerrará todas as sessões ativas, incluindo a atual. Você precisará fazer login novamente em todos os dispositivos.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutAllOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleLogoutAll} disabled={loggingOut}>
              {loggingOut ? "Saindo..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
