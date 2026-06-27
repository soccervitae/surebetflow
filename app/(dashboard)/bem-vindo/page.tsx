"use client"

import Link from "next/link"
import { CheckCircle, Star, Zap, BookOpen, CreditCard, ArrowRight, Lock } from "lucide-react"
import Image from "next/image"

const PLANS = [
  {
    key: "trader",
    name: "Trader",
    price: "R$ 99",
    period: "/mês",
    icon: Star,
    highlight: false,
    features: [
      "Até 5 perfis de apostador",
      "Casas de apostas ilimitadas por perfil",
      "Calculadora de surebet 2-way e 3-way",
      "Dashboard financeiro completo",
      "Histórico completo de apostas",
      "Suporte prioritário por ticket",
    ],
  },
  {
    key: "trader_pro",
    name: "Trader Pro",
    price: "R$ 179",
    period: "/mês",
    icon: Zap,
    highlight: true,
    features: [
      "Até 20 perfis de apostador",
      "Casas de apostas ilimitadas por perfil",
      "Calculadora de surebet 2-way e 3-way",
      "Dashboard financeiro completo",
      "Histórico completo de apostas",
      "Suporte prioritário por ticket",
    ],
  },
]

const LOCKED_FEATURES = [
  "Dashboard com visão geral de todos os perfis",
  "Registro e gerenciamento de apostas",
  "Controle financeiro por casa de apostas",
  "Calculadora de surebet 2-way e 3-way",
  "Relatórios e histórico de desempenho",
  "Comparativo de lucro por casa de apostas",
]

export default function BemVindoPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-10">

      {/* Header de boas-vindas */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0f1e40] to-[#1e3a8a] flex items-center justify-center shadow-xl shadow-[#1e3a8a]/20">
              <CheckCircle className="w-10 h-10 text-[#a0f0c0]" />
            </div>
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">✓</span>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Conta verificada! 🎉</h1>
          <p className="text-[var(--text-secondary)] mt-2 text-base leading-relaxed max-w-md mx-auto">
            Bem-vindo ao <strong className="text-[var(--text-primary)]">SurebetFlow</strong>. Sua conta está ativa.
            Para usar todas as funcionalidades, escolha um plano abaixo.
          </p>
        </div>
      </div>

      {/* Funcionalidades bloqueadas */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
          <Lock className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Disponível com um plano ativo</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 divide-[var(--border)]">
          {LOCKED_FEATURES.map((f, i) => (
            <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i % 2 === 0 && i + 1 < LOCKED_FEATURES.length ? "sm:border-r border-[var(--border)]" : ""}`}>
              <div className="w-5 h-5 rounded-full bg-[#1e3a8a]/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-3 h-3 text-[#1e3a8a]" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cards de planos */}
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 text-center">Escolha seu plano</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
                  plan.highlight
                    ? "border-[#1e3a8a]/60 bg-gradient-to-b from-[#0f1e40] to-[var(--bg-surface)] shadow-lg shadow-[#1e3a8a]/10"
                    : "border-[var(--border)] bg-[var(--bg-surface)]"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1e3a8a] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    Mais popular
                  </span>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-[#1e3a8a]" />
                  <span className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</span>
                </div>

                <p className="text-4xl font-bold text-[var(--text-primary)] mb-1">
                  {plan.price}
                  <span className="text-lg font-normal text-[var(--text-muted)]">{plan.period}</span>
                </p>

                <ul className="space-y-2 my-5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                      <CheckCircle className="w-4 h-4 text-[#1e3a8a] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/assinatura/checkout?plan=${plan.key}`}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
                      : "border border-[#1e3a8a]/40 text-[var(--accent-text)] hover:bg-[#1e3a8a]/10"
                  }`}
                >
                  Assinar {plan.name}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Enquanto isso */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Enquanto isso, você pode acessar:
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tutorial"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 transition-all text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <BookOpen className="w-4 h-4" />
            Tutorial completo
          </Link>
          <Link
            href="/assinatura"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 transition-all text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <CreditCard className="w-4 h-4" />
            Página de assinatura
          </Link>
        </div>
      </div>

      <p className="text-xs text-center text-[var(--text-muted)]">
        Pagamento via cartão de crédito · Stripe · Cancele quando quiser
      </p>
    </div>
  )
}
