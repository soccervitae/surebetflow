"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ProfileForm } from "@/components/ProfileForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/useToast"
import { ArrowLeft } from "lucide-react"
import type { Profile } from "@/lib/types"

export default function EditarPerfilClient({ profile }: { profile: Profile }) {
  const router = useRouter()
  const { toast } = useToast()

  function handleSuccess() {
    toast({ title: "Perfil atualizado com sucesso!" })
    router.push(`/perfis/${profile.id}`)
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
    </div>
  )
}
