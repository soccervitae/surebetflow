"use client"

import { useState } from "react"
import { Bot, Save, CheckCircle } from "lucide-react"

export default function AgenteClient({ initialPrompt }: { initialPrompt: string }) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    setSaving(true)
    setError("")
    setSaved(false)

    const res = await fetch("/api/admin/agente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system_prompt: prompt }),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError("Erro ao salvar. Tente novamente.")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e3a8a]/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Agente IA</h1>
            <p className="text-gray-400 text-sm">Configure o prompt do assistente virtual do Suporte</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar"}
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">System Prompt</label>
          <span className="text-xs text-gray-500">{prompt.length} caracteres</span>
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={28}
          className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-blue-600/50 transition-colors resize-y"
          placeholder="Digite o prompt do sistema aqui..."
          spellCheck={false}
        />
        <p className="text-xs text-gray-500">
          Este prompt define como o assistente responde as dúvidas dos usuários. Alterações entram em vigor imediatamente para novas conversas.
        </p>
      </div>
    </div>
  )
}
