"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Wallet, ArrowRight, ArrowLeft, CheckCircle, LayoutDashboard } from "lucide-react"

const steps = [
  {
    title: "Bem-vindo ao SurebetFlow!",
    icon: TrendingUp,
    color: "text-[#1e3a8a]",
    bg: "bg-[#1e3a8a]/10",
    description: "O que é uma Surebet?",
    content: (
      <div className="space-y-4 text-[var(--text-secondary)] text-sm leading-relaxed">
        <p>
          Uma <strong className="text-[var(--text-primary)]">surebet</strong> (também chamada de arbitragem esportiva) é uma estratégia
          onde você aposta em todos os resultados possíveis de um evento em diferentes casas de apostas — garantindo lucro independente do resultado.
        </p>
        <div className="rounded-xl bg-[#1e3a8a]/10 border border-[#1e3a8a]/20 p-4 space-y-2">
          <p className="font-semibold text-[var(--text-primary)]">Como funciona?</p>
          <ul className="space-y-1.5 list-none">
            {[
              "Você encontra odds favoráveis em casas diferentes",
              "Distribui o investimento de forma calculada",
              "Garante lucro em qualquer resultado",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p>
          O SurebetFlow ajuda você a <strong className="text-[var(--text-primary)]">gerenciar perfis</strong>,{" "}
          <strong className="text-[var(--text-primary)]">calcular apostas</strong> e{" "}
          <strong className="text-[var(--text-primary)]">acompanhar o desempenho</strong> de cada casa de apostas.
        </p>
      </div>
    ),
  },
  {
    title: "Crie seu primeiro perfil",
    icon: Users,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    description: "Organize suas apostas por perfil",
    content: (
      <div className="space-y-4 text-[var(--text-secondary)] text-sm leading-relaxed">
        <p>
          Um <strong className="text-[var(--text-primary)]">perfil</strong> representa um apostador — pode ser você ou alguém que
          você gerencia. Cada perfil tem suas próprias casas de apostas e histórico financeiro.
        </p>
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 space-y-2">
          <p className="font-semibold text-[var(--text-primary)]">Para criar um perfil:</p>
          <ul className="space-y-1.5 list-none">
            {[
              "Vá para a seção Perfis no menu",
              "Clique em \"Novo Perfil\"",
              "Preencha nome, apelido e dados",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/perfis">
          <Button className="w-full" variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Ir para Perfis
          </Button>
        </Link>
      </div>
    ),
  },
  {
    title: "Adicione casas de apostas",
    icon: Wallet,
    color: "text-green-500",
    bg: "bg-green-500/10",
    description: "Conecte suas contas para calcular surebets",
    content: (
      <div className="space-y-4 text-[var(--text-secondary)] text-sm leading-relaxed">
        <p>
          Após criar um perfil, adicione as <strong className="text-[var(--text-primary)]">casas de apostas</strong> que você usa.
          Você precisará de pelo menos <strong className="text-[var(--text-primary)]">2 casas</strong> para calcular surebets.
        </p>
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 space-y-2">
          <p className="font-semibold text-[var(--text-primary)]">Passo a passo:</p>
          <ul className="space-y-1.5 list-none">
            {[
              "Abra um perfil criado",
              "Vá para a aba \"Bets\"",
              "Adicione suas casas de apostas",
              "Registre depósitos para controlar saldo",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/perfis">
          <Button className="w-full" variant="outline">
            <Wallet className="w-4 h-4 mr-2" />
            Ir para meu Perfil
          </Button>
        </Link>
      </div>
    ),
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const current = steps[step]
  const Icon = current.icon

  function handleFinish() {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_done", "1")
    }
    router.push("/dashboard")
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-[#1e3a8a]" : i < step ? "w-2 bg-[#1e3a8a]/50" : "w-2 bg-[var(--bg-elevated)]"
            }`}
          />
        ))}
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6 space-y-5">
          {/* Icon + title */}
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${current.bg}`}>
              <Icon className={`w-7 h-7 ${current.color}`} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Passo {step + 1} de {steps.length}</p>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">{current.title}</h1>
            </div>
          </div>

          {/* Content */}
          <div>{current.content}</div>

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="flex-1">
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish} className="flex-1 bg-[#1e3a8a] hover:bg-[#1e40af]">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Ir para o Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skip link */}
      <div className="text-center mt-4">
        <button
          onClick={handleFinish}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Pular introdução
        </button>
      </div>
    </div>
  )
}
