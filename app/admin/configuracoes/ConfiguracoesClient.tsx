"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Settings, User, Key, Eye, EyeOff, Shield, AlertTriangle, LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ConfiguracoesClient({ settings: _settings }: { settings: Record<string, string> }) {
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [logoutAllOpen, setLogoutAllOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? "")
    })
  }, [])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")
    if (newPassword.length < 8) { setPasswordError("A senha deve ter pelo menos 8 caracteres."); return }
    if (newPassword !== confirmPassword) { setPasswordError("As senhas não coincidem."); return }
    setSavingPassword(true)
    const { error } = await createClient().auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordError("Erro ao alterar senha. Tente novamente.")
    } else {
      setPasswordSuccess("Senha alterada com sucesso!")
      setNewPassword("")
      setConfirmPassword("")
    }
    setSavingPassword(false)
  }

  async function handleLogoutAll() {
    setLoggingOut(true)
    await createClient().auth.signOut({ scope: "global" })
    router.push("/admin/login")
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie sua conta de administrador</p>
        </div>
      </div>

      {/* Conta */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <User className="h-4 w-4" /> Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300">E-mail</Label>
            <Input
              value={email}
              disabled
              className="bg-gray-800 border-gray-700 text-gray-400"
            />
            <p className="text-xs text-gray-500">Para alterar o e-mail entre em contato com o suporte técnico.</p>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <Key className="h-4 w-4" /> Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-gray-300">Nova senha</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 pr-10"
                  required
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 pr-10"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {passwordError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{passwordSuccess}</p>
            )}
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Shield className="w-4 h-4" />
              {savingPassword ? "Salvando..." : "Alterar senha"}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Sessão */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <LogOut className="h-4 w-4" /> Sessão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            onClick={() => setLogoutAllOpen(true)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair de todos os dispositivos
          </Button>
        </CardContent>
      </Card>

      <Dialog open={logoutAllOpen} onOpenChange={setLogoutAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Sair de todos os dispositivos
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Isso encerrará todas as sessões ativas. Você precisará fazer login novamente.
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
