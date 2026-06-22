"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CreditCard, CheckCircle, Star, AlertCircle, Clock, RefreshCw, Calendar, Hash, Activity } from "lucide-react"

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
  const searchParams = useSearchParams()
  const success = searchParams.get("success")
  const canceled = searchParams.get("canceled")

  const isActive = subscription?.status === "active" || subscription?.status === "trialing"
  const statusInfo = STATUS_INFO[subscription?.status ?? "inactive"]
  const StatusIcon = statusInfo.icon

  const paymentDetails = [
    {
      icon: Activity,
      label: "Status",
      value: (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusInfo.label}
        </span>
      ),
    },
    {
      icon: Star,
      label: "Plano",
      value: <span className="text-[var(--text-primary)] font-medium">Pro — R$ 99,00/mês</span>,
    },
    ...(subscription?.current_period_end ? [{
      icon: Calendar,
      label: subscription?.cancel_at_period_end ? "Cancela em" : "Próxima cobrança",
      value: (
        <span className={subscription?.cancel_at_period_end ? "text-red-400 font-medium" : "text-[var(--text-primary)] font-medium"}>
          {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
        </span>
      ),
    }] : []),
    ...(subscription?.stripe_subscription_id ? [{
      icon: Hash,
      label: "ID da assinatura",
      value: <span className="text-[var(--text-muted)] font-mono text-xs">{subscription.stripe_subscription_id}</span>,
    }] : []),
  ]

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
        </div>

        <p className="text-4xl font-bold text-[var(--text-primary)] mb-0.5">
          R$ 99<span className="text-xl font-normal text-[var(--text-muted)]">,00/mês</span>
        </p>

        <ul className="space-y-2 my-6">
          {PRO_FEATURES.map(f => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <CheckCircle className="w-4 h-4 text-[#1e3a8a] flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {isActive ? (
          <Link
            href="/assinatura/checkout"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-4 py-2.5 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar pagamento
          </Link>
        ) : (
          <Link
            href="/assinatura/checkout"
            className="block w-full py-3 rounded-xl text-sm font-semibold bg-[#1e3a8a] hover:bg-[#1e40af] text-white transition-colors text-center"
          >
            Assinar agora — R$ 99,00/mês
          </Link>
        )}
      </div>

      {/* Payment details list */}
      {subscription && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Detalhes da assinatura</h2>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {paymentDetails.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)] min-w-0">
                  <Icon className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                  {label}
                </div>
                <div className="text-sm text-right">{value}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isActive && (
        <p className="text-xs text-center text-[var(--text-muted)]">
          Pagamento via cartão de crédito · Cancele quando quiser
        </p>
      )}
    </div>
  )
}
