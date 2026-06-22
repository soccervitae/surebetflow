"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/useToast"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"
import type { Bet } from "@/lib/types"

export default function AdminCasasClient({ bets: initial }: { bets: Bet[] }) {
  const [bets, setBets] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  function openNew() { setShowForm(true); setEditingId(null); setNome(""); setLogoUrl("") }
  function openEdit(bet: Bet) { setShowForm(true); setEditingId(bet.id); setNome(bet.nome); setLogoUrl(bet.logo_url ?? "") }
  function cancel() { setShowForm(false); setEditingId(null); setNome(""); setLogoUrl("") }

  async function handleSave() {
    if (!nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return }
    setSaving(true)
    if (editingId) {
      const { data, error } = await supabase.from("bets").update({ nome: nome.trim(), logo_url: logoUrl.trim() || null }).eq("id", editingId).select().single()
      if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }) }
      else { setBets(prev => prev.map(b => b.id === editingId ? data : b)); toast({ title: "Casa atualizada!" }); cancel() }
    } else {
      const { data, error } = await supabase.from("bets").insert({ nome: nome.trim(), logo_url: logoUrl.trim() || null }).select().single()
      if (error) { toast({ title: "Erro ao criar", variant: "destructive" }) }
      else { setBets(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome))); toast({ title: "Casa criada!" }); cancel() }
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const { error } = await supabase.from("bets").delete().eq("id", id)
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }) }
    else { setBets(prev => prev.filter(b => b.id !== id)); toast({ title: "Casa excluída" }) }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Casas de Apostas</h1>
          <p className="text-gray-400 text-sm mt-1">{bets.length} casas cadastradas</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> Nova Casa
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-white">{editingId ? "Editar Casa" : "Nova Bet"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Nome *</label>
              <input
                className="w-full h-10 px-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#1e3a8a]"
                placeholder="Ex: Betano"
                value={nome}
                onChange={e => setNome(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">URL do Logo (opcional)</label>
              <input
                className="w-full h-10 px-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#1e3a8a]"
                placeholder="https://..."
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              <Check className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={cancel} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors">
              <X className="h-4 w-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Logo URL</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Criada em</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {bets.map(bet => (
              <tr key={bet.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {bet.logo_url && <img src={bet.logo_url} alt={bet.nome} className="w-5 h-5 object-contain rounded" />}
                    <span className="font-medium text-white">{bet.nome}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[200px]">{bet.logo_url ?? "—"}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(bet.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(bet)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(bet.id)} disabled={deletingId === bet.id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!bets.length && <p className="text-center text-gray-500 py-10">Nenhuma casa cadastrada</p>}
      </div>
    </div>
  )
}
