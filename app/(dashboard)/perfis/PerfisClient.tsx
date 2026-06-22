"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProfileForm } from "@/components/ProfileForm"
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
          <span className="hidden sm:inline">Novo perfil</span>
          <span className="sm:hidden">Novo</span>
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
          {profiles.map(profile => {
            return (
              <Link key={profile.id} href={`/perfis/${profile.id}`}>
                <Card className="hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 transition-all cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        {profile.foto_url && <AvatarImage src={profile.foto_url} />}
                        <AvatarFallback>
                          {profile.nome.charAt(0)}{profile.sobrenome.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-[var(--text-primary)] truncate">
                            {profile.apelido || `${profile.nome} ${profile.sobrenome}`}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                            profile.ativo ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${profile.ativo ? "bg-green-500" : "bg-red-500"}`} />
                            {profile.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        {profile.email && (
                          <p className="text-sm text-[var(--text-secondary)] truncate">{profile.email}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
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
