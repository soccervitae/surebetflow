"use client"

import { useState } from "react"
import { Settings, Eye, EyeOff, Save, CheckCircle, AlertCircle } from "lucide-react"

const FIELDS = [
  {
    key: "mp_access_token",
    label: "Access Token",
    description: "MercadoPago → Seu negócio → Credenciais → Access Token (produção)",
    placeholder: "APP_USR-...",
    secret: true,
  },
  {
    key: "mp_public_key",
    label: "Public Key",
    description: "MercadoPago → Credenciais → Public Key (produção)",
    placeholder: "APP_USR-...",
    secret: true,
  },
  {
    key: "mp_plan_pro",
    label: "ID do Plano Pro",
    description: "MercadoPago → Assinaturas → ID do plano criado",
    placeholder: "f202a0dd...",
    secret: false,
  },
  {
    key: "mp_webhook_secret",
    label: "Assinatura Secreta do Webhook",
    description: "MercadoPago → Webhooks → Assinatura secreta (gerada automaticamente)",
    placeholder: "599f3ac3...",
    secret: true,
  },
  {
    key: "resend_api_key",
    label: "Resend API Key",
    description: "Resend → API Keys → Chave para envio de e-mails transacionais",
    placeholder: "re_...",
    secret: true,
  },
]

export default function ConfiguracoesClient({ settings: initial }: { settings: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus("idle")

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    setSaving(false)
    setStatus(res.ok ? "success" : "error")
    setTimeout(() => setStatus("idle"), 4000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-gray-400 text-sm mt-1">Credenciais e integrações da plataforma</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-[#1e3a8a]" />
          <h2 className="font-semibold text-white">MercadoPago</h2>
          <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Checkout Transparente</span>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {FIELDS.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
              <p className="text-xs text-gray-500 mb-2">{field.description}</p>
              <div className="relative">
                <input
                  type={field.secret && !show[field.key] ? "password" : "text"}
                  value={values[field.key] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#1e3a8a]/50 transition-colors pr-10"
                />
                {field.secret && (
                  <button
                    type="button"
                    onClick={() => setShow(s => ({ ...s, [field.key]: !s[field.key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {show[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {status === "success" && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Configurações salvas com sucesso!
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Erro ao salvar. Tente novamente.
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      </div>
    </div>
  )
}
