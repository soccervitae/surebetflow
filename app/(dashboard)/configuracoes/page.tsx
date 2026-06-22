"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Settings, Camera, Loader2 } from "lucide-react"

export default function ConfiguracoesPage() {
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "")
        setUserId(user.id)
        setAvatarUrl(user.user_metadata?.avatar_url ?? "")
      }
    })
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
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: url }
      })
      if (updateError) throw updateError
      setAvatarUrl(url)
    } catch (err) {
      console.error("Erro ao fazer upload:", err)
    } finally {
      setUploading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")
    if (newPassword.length < 8) { setPasswordError("A senha deve ter pelo menos 8 caracteres."); return }
    if (newPassword !== confirmPassword) { setPasswordError("As senhas não coincidem."); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPasswordError("Erro ao alterar senha. Tente novamente."); setSaving(false); return }
    setPasswordSuccess("Senha alterada com sucesso!")
    setNewPassword(""); setConfirmPassword("")
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Configurações</h1>
          <p className="text-sm text-[var(--text-secondary)]">Dados da sua conta</p>
        </div>
      </div>

      {/* Foto da conta */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Foto da conta</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="Foto da conta" />}
            <AvatarFallback className="text-xl">{email.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
                : <><Camera className="h-4 w-4 mr-2" />Alterar foto</>
              }
            </Button>
            <p className="text-xs text-[var(--text-muted)] mt-1">JPG, PNG ou WebP até 5MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">E-mail da conta</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={email} disabled className="bg-[var(--bg-muted)] text-[var(--text-secondary)]" />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">Para alterar o e-mail, entre em contato com o suporte.</p>
        </CardContent>
      </Card>

      {/* Senha */}
      <Card>
        <CardHeader><CardTitle className="text-base">Alterar senha</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" required />
            </div>
            {passwordError && <p className="text-sm text-[#DC2626] bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-lg px-3 py-2">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-[#16A34A] bg-[#16A34A]/5 border border-[#16A34A]/20 rounded-lg px-3 py-2">{passwordSuccess}</p>}
            <Button type="submit" className="bg-[#16A34A] hover:bg-[#15803D] text-white" disabled={saving}>
              {saving ? "Salvando..." : "Alterar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
