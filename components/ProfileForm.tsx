"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { formatCPF, formatPhone, validateCPF } from "@/lib/utils"
import type { Profile } from "@/lib/types"
import { Camera, Loader2 } from "lucide-react"

interface ProfileFormProps {
  profile?: Profile
  onSuccess: (profile: Profile) => void
  userId: string
}

export function ProfileForm({ profile, onSuccess, userId }: ProfileFormProps) {
  const [nome, setNome] = useState(profile?.nome ?? "")
  const [sobrenome, setSobrenome] = useState(profile?.sobrenome ?? "")
  const [apelido, setApelido] = useState(profile?.apelido ?? "")
  const [cpf, setCpf] = useState(profile?.cpf ? formatCPF(profile.cpf) : "")
  const [telefone, setTelefone] = useState(profile?.telefone ? formatPhone(profile.telefone) : "")
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ? formatPhone(profile.whatsapp) : "")
  const [fotoUrl, setFotoUrl] = useState(profile?.foto_url ?? "")
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function getInitials() {
    return `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase()
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11)
    let formatted = digits
    if (digits.length > 9) {
      formatted = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    } else if (digits.length > 6) {
      formatted = digits.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3")
    } else if (digits.length > 3) {
      formatted = digits.replace(/(\d{3})(\d{3})/, "$1.$2")
    }
    setCpf(formatted)
  }

  function handlePhoneChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "").slice(0, 11)
      let formatted = digits
      if (digits.length === 11) {
        formatted = digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
      } else if (digits.length === 10) {
        formatted = digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
      }
      setter(formatted)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from("profile-photos").upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(fileName)
      setFotoUrl(data.publicUrl)
    } catch (err) {
      console.error("Erro ao fazer upload:", err)
    } finally {
      setUploading(false)
    }
  }

  function validate() {
    const newErrors: Record<string, string> = {}
    if (!nome.trim()) newErrors.nome = "Nome é obrigatório"
    if (!sobrenome.trim()) newErrors.sobrenome = "Sobrenome é obrigatório"
    const cpfDigits = cpf.replace(/\D/g, "")
    if (!cpfDigits) {
      newErrors.cpf = "CPF é obrigatório"
    } else if (!validateCPF(cpfDigits)) {
      newErrors.cpf = "CPF inválido"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const cpfDigits = cpf.replace(/\D/g, "")
    const telefoneDigits = telefone.replace(/\D/g, "") || null
    const whatsappDigits = whatsapp.replace(/\D/g, "") || null

    try {
      if (profile) {
        const { data, error } = await supabase
          .from("profiles")
          .update({
            nome: nome.trim(),
            sobrenome: sobrenome.trim(),
            apelido: apelido.trim() || null,
            cpf: cpfDigits,
            telefone: telefoneDigits,
            whatsapp: whatsappDigits,
            foto_url: fotoUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id)
          .select()
          .single()
        if (error) throw error
        onSuccess(data)
      } else {
        const { data, error } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            nome: nome.trim(),
            sobrenome: sobrenome.trim(),
            apelido: apelido.trim() || null,
            cpf: cpfDigits,
            telefone: telefoneDigits,
            whatsapp: whatsappDigits,
            foto_url: fotoUrl || null,
          })
          .select()
          .single()
        if (error) throw error
        onSuccess(data)
      }
    } catch (err) {
      console.error("Erro ao salvar perfil:", err)
      setErrors({ submit: "Erro ao salvar perfil. Tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo */}
      <div className="flex flex-col items-center gap-3">
        <Avatar className="h-20 w-20">
          {fotoUrl ? <AvatarImage src={fotoUrl} alt="Foto do perfil" /> : null}
          <AvatarFallback className="text-2xl">{getInitials() || "?"}</AvatarFallback>
        </Avatar>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : <><Camera className="h-4 w-4 mr-2" />Alterar foto</>}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="João" />
          {errors.nome && <p className="text-xs text-[#DC2626]">{errors.nome}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sobrenome">Sobrenome *</Label>
          <Input id="sobrenome" value={sobrenome} onChange={e => setSobrenome(e.target.value)} placeholder="Silva" />
          {errors.sobrenome && <p className="text-xs text-[#DC2626]">{errors.sobrenome}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="apelido">Apelido (opcional)</Label>
          <Input id="apelido" value={apelido} onChange={e => setApelido(e.target.value)} placeholder="Ex: Principal" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF *</Label>
          <Input id="cpf" value={cpf} onChange={handleCpfChange} placeholder="000.000.000-00" maxLength={14} />
          {errors.cpf && <p className="text-xs text-[#DC2626]">{errors.cpf}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone (opcional)</Label>
          <Input id="telefone" value={telefone} onChange={handlePhoneChange(setTelefone)} placeholder="(11) 99999-9999" maxLength={15} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
          <Input id="whatsapp" value={whatsapp} onChange={handlePhoneChange(setWhatsapp)} placeholder="(11) 99999-9999" maxLength={15} />
        </div>
      </div>

      {errors.submit && (
        <p className="text-sm text-[#DC2626] bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-lg px-3 py-2">
          {errors.submit}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{profile ? "Salvando..." : "Criando perfil..."}</> : profile ? "Salvar alterações" : "Criar perfil"}
      </Button>
    </form>
  )
}
