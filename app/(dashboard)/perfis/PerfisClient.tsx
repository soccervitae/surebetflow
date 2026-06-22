"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProfileForm } from "@/components/ProfileForm"
import { maskCPF, formatPhone } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { Plus, User } from "lucide-react"
import type { Profile } from "@/lib/types"

interface Props {
  profiles: Profile[]
  userId: string
}

export default function PerfisClient({ profiles: initialProfiles, userId }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [showCreate, setShowCreate] = useState(false)
  const { toast } = useToast()

  function handleCreated(profile: Profile) {
    setProfiles(prev => [profile, ...prev])
    setShowCreate(false)
    toast({ title: "Perfil criado com sucesso!" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Perfis</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Gerencie seus perfis de apostador</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo perfil
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-[var(--text-secondary)]">Nenhum perfil cadastrado</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro perfil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {profiles.map(profile => (
            <Link key={profile.id} href={`/perfis/${profile.id}`}>
              <Card className="hover:border-[#16A34A]/40 hover:bg-[#16A34A]/5 transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      {profile.foto_url && <AvatarImage src={profile.foto_url} />}
                      <AvatarFallback>
                        {profile.nome.charAt(0)}{profile.sobrenome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">
                        {profile.nome} {profile.sobrenome}
                      </h3>
                      {profile.apelido && (
                        <p className="text-sm text-[var(--text-secondary)] truncate">{profile.apelido}</p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-1">CPF: {maskCPF(profile.cpf)}</p>
                      {profile.telefone && (
                        <p className="text-xs text-[var(--text-muted)]">Tel: {formatPhone(profile.telefone)}</p>
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
