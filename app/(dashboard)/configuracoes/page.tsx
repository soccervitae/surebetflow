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
import {
  Settings, Camera, Loader2, Shield, Monitor, Smartphone,
  MapPin, Clock, LogOut, Key, User, AlertTriangle, Sun, Moon,
  FileText, Lock, ExternalLink
} from "lucide-react"

interface GeoInfo {
  city: string
  region: string
  country_name: string
  ip: string
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
  const [tab, setTab] = useState<"conta" | "configuracoes">("conta")

  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [lastSignIn, setLastSignIn] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [geo, setGeo] = useState<GeoInfo | null>(null)
  const [loadingGeo, setLoadingGeo] = useState(true)
  const [device, setDevice] = useState<{ nome: string; icone: "monitor" | "smartphone" } | null>(null)
  const [browser, setBrowser] = useState("")

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
  const [logoutAllOpen, setLogoutAllOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

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
      }
    })

    const ua = navigator.userAgent
    setDevice(parseDevice(ua))
    setBrowser(parseBrowser(ua))

    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then((data: GeoInfo) => setGeo(data))
      .catch(() => setGeo(null))
      .finally(() => setLoadingGeo(false))
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

  const tabs = [
    { key: "conta" as const,         label: "Minha Conta",   icon: User },
    { key: "configuracoes" as const,  label: "Configurações", icon: Settings },
  ]

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

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl">
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

      {/* ── ABA: MINHA CONTA ── */}
      {tab === "conta" && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Dados pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Foto da conta" />}
                    <AvatarFallback className="text-xl">{email.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center hover:bg-[#1e40af] transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">{email}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Conta criada em {formatDate(createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input value={email} disabled className="bg-[var(--bg-muted)] text-[var(--text-secondary)]" />
                <p className="text-xs text-[var(--text-muted)]">Para alterar o e-mail, entre em contato com o suporte.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sobrenome">Sobrenome</Label>
                    <Input id="sobrenome" value={sobrenome} onChange={e => setSobrenome(e.target.value)} placeholder="Seu sobrenome" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dataNascimento">Data de nascimento</Label>
                  <Input id="dataNascimento" type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} />
                </div>
                {profileSuccess && (
                  <p className="text-sm text-[var(--accent-text)] bg-[#1e3a8a]/5 border border-[#1e3a8a]/20 rounded-lg px-3 py-2">
                    {profileSuccess}
                  </p>
                )}
                <Button type="submit" className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white" disabled={savingProfile}>
                  <User className="h-4 w-4 mr-2" />
                  {savingProfile ? "Salvando..." : "Salvar alterações"}
                </Button>
              </form>
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
                <Monitor className="h-4 w-4" /> Sessão atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                      Ativa agora
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {loadingGeo ? (
                      <span className="text-xs text-[var(--text-muted)]">Detectando localização...</span>
                    ) : geo ? (
                      <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <MapPin className="w-3 h-3" />
                        {geo.city}, {geo.region} — {geo.country_name} ({geo.ip})
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">Localização não disponível</span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                      <Clock className="w-3 h-3" />
                      Último acesso: {formatDate(lastSignIn)}
                    </span>
                  </div>
                </div>
              </div>
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
