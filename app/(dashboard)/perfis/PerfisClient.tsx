"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ProfileForm } from "@/components/ProfileForm"
import { maskCPF, formatPhone } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { Plus, Pencil, Trash2, User } from "lucide-react"
import type { Profile } from "@/lib/types"

interface Props {
  profiles: Profile[]
  userId: string
}

export default function PerfisClient({ profiles: initialProfiles, userId }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [showCreate, setShowCreate] = useState(false)
  const { toast } = useToast()

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("profiles").delete().eq("id", id)
    if (error) {
      toast({ title: "Erro ao excluir perfil", variant: "destructive" })
      return
    }
    setProfiles(prev => prev.filter(p => p.id !== id))
    toast({ title: "Perfil excluído com sucesso", variant: "default" })
  }

  function handleCreated(profile: Profile) {
    setProfiles(prev => [profile, ...prev])
    setShowCreate(false)
    toast({ title: "Perfil criado com sucesso!" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfis</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie seus perfis de apostador</p>
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
            <p className="text-gray-500">Nenhum perfil cadastrado</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro perfil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {profiles.map(profile => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    {profile.foto_url && <AvatarImage src={profile.foto_url} />}
                    <AvatarFallback>
                      {profile.nome.charAt(0)}{profile.sobrenome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link href={`/perfis/${profile.id}`} className="hover:underline">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {profile.nome} {profile.sobrenome}
                      </h3>
                    </Link>
                    {profile.apelido && (
                      <p className="text-sm text-gray-500 truncate">{profile.apelido}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">CPF: {maskCPF(profile.cpf)}</p>
                    {profile.telefone && (
                      <p className="text-xs text-gray-400">Tel: {formatPhone(profile.telefone)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E5E1D8]">
                  <Link href={`/perfis/${profile.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Ver detalhes
                    </Button>
                  </Link>
                  <Link href={`/perfis/${profile.id}/editar`}>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-[#DC2626] hover:bg-[#DC2626]/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir perfil</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o perfil de <strong>{profile.nome} {profile.sobrenome}</strong>? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(profile.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
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
