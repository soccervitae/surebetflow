"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ProfileForm } from "@/components/ProfileForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/useToast"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Power, Loader2 } from "lucide-react"
import type { Profile } from "@/lib/types"

export default function EditarPerfilClient({ profile }: { profile: Profile }) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [ativo, setAtivo] = useState(profile.ativo)
  const [togglingAtivo, setTogglingAtivo] = useState(false)

  function handleSuccess() {
    toast({ title: "Perfil atualizado com sucesso!" })
    router.push(`/perfis/${profile.id}`)
  }

  async function handleToggleAtivo() {
    setTogglingAtivo(true)
    const novoAtivo = !ativo
    const { error } = await supabase
      .from("profiles")
      .update({ ativo: novoAtivo })
      .eq("id", profile.id)
    if (error) {
      toast({ title: "Erro ao alterar status do perfil", variant: "destructive" })
    } else {
      setAtivo(novoAtivo)
      toast({ title: novoAtivo ? "Perfil ativado" : "Perfil desativado" })
    }
    setTogglingAtivo(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={`/perfis/${profile.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Editar Perfil</h1>
          <p className="text-[var(--text-secondary)] text-sm">{profile.nome} {profile.sobrenome}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} userId={profile.user_id} onSuccess={handleSuccess} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status do Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Perfil {ativo ? "ativo" : "desativado"}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {ativo
                  ? "Este perfil aparece nas apostas e relatórios."
                  : "Este perfil está oculto e não pode receber novas apostas."}
              </p>
            </div>
            <button
              onClick={handleToggleAtivo}
              disabled={togglingAtivo}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-60 ${
                ativo
                  ? "bg-red-600/10 hover:bg-red-600/20 border-red-500/30 text-red-400"
                  : "bg-green-600/10 hover:bg-green-600/20 border-green-500/30 text-green-400"
              }`}
            >
              {togglingAtivo
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Power className="w-4 h-4" />}
              {ativo ? "Desativar perfil" : "Ativar perfil"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
