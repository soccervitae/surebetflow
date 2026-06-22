"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { CreditCard, CheckCircle, Star, ExternalLink, AlertCircle, Clock } from "lucide-react"

type Subscription = {
  status: string
  plan: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_subscription_id: string | null
} | null

const PRO_FEATURES = [
  "Perfis ilimitados de apostador",
  "Casas de apostas ilimitadas por perfil",
  "Calculadora de surebet 2-way e 3-way",
  "Dashboard financeiro completo",
  "Histórico completo de apostas",
  "Suporte prioritário por ticket",
]

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:     { label: "Ativa",      color: "text-green-400", bg: "bg-green-500/10",  icon: CheckCircle },
  trialing:   { label: "Trial",      color: "text-blue-400",  bg: "bg-blue-500/10",   icon: Clock },
  past_due:   { label: "Vencida",    color: "text-red-400",   bg: "bg-red-500/10",    icon: AlertCircle },
  canceled:   { label: "Cancelada",  color: "text-gray-400",  bg: "bg-gray-500/10",   icon: AlertCircle },
  incomplete: { label: "Pendente",   color: "text-yellow-400",bg: "bg-yellow-500/10", icon: Clock },
  inactive:   { label: "Inativa",    color: "text-gray-400",  bg: "bg-gray-500/10",   icon: AlertCircle },
}

export default function AssinaturaClient({ subscription }: { subscription: Subscription }) {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const success = searchParams.get("success")
  const canceled = searchParams.get("canceled")

  const isActive = subscription?.status === "active" || subscription?.status === "trialing"
  const statusInfo = STATUS_INFO[subscription?.status ?? "inactive"]
  const StatusIcon = statusInfo.icon

  async function handleCheckout() {
    setLoading(true)
    const res = await fetch("/api/mp/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "pro" }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#1e3a8a]/10 rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-[#1e3a8a]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assinatura</h1>
          <p className="text-sm text-[var(--text-secondary)]">Gerencie seu plano do SureBetFlow</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Pagamento confirmado! Sua assinatura está ativa.
        </div>
      )}
      {canceled && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Pagamento cancelado. Assine para ter acesso completo.
        </div>
      )}

      {/* Plan card */}
      <div className={`bg-[var(--bg-surface)] border rounded-2xl p-6 relative overflow-hidden ${isActive ? "border-[#1e3a8a]/40" : "border-[var(--border)]"}`}>
        <div className="absolute top-4 right-4">
          <span className="text-xs bg-[#1e3a8a]/20 text-[#1e3a8a] px-2.5 py-1 rounded-full font-medium">Plano único</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-[#1e3a8a]" />
          <span className="text-lg font-bold text-[var(--text-primary)]">Pro</span>
          {isActive && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ml-auto ${statusInfo.bg} ${statusInfo.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </span>
          )}
        </div>

        <p className="text-4xl font-bold text-[var(--text-primary)] mb-0.5">
          R$ 99<span className="text-xl font-normal text-[var(--text-muted)]">,00/mês</span>
        </p>

        {isActive && subscription?.current_period_end && (
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {subscription.cancel_at_period_end
              ? <span className="text-red-400">Cancela em {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}</span>
              : <>Próxima cobrança em <strong className="text-[var(--text-primary)]">{new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}</strong></>
            }
          </p>
        )}

        <ul className="space-y-2 my-6">
          {PRO_FEATURES.map(f => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <CheckCircle className="w-4 h-4 text-[#1e3a8a] flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {isActive ? (
          <button
            onClick={() => window.location.href = "/suporte"}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[#1e3a8a]/30 px-4 py-2.5 rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Cancelar / Gerenciar via Suporte
          </button>
        ) : (
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-[#1e3a8a] hover:bg-[#1e40af] text-white transition-colors disabled:opacity-50"
          >
            {loading ? "Redirecionando para pagamento..." : "Assinar agora — R$ 99,00/mês"}
          </button>
        )}
      </div>

      {!isActive && (
        <p className="text-xs text-center text-[var(--text-muted)]">
          Pagamento via cartão de crédito ou PIX · Cancele quando quiser
        </p>
      )}
    </div>
  )
}
