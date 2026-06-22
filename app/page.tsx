import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  TrendingUp, ShieldCheck, Calculator, Wallet, Lock, BarChart3,
  CheckCircle, ArrowRight, Zap, Users, Target, RefreshCw
} from "lucide-react"

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-gray-900">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#E5E1D8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#16A34A] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SureBetFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="bg-[#16A34A] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#15803D] transition-colors">
              Assinar — R$ 97/mês
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#16A34A]/10 text-[#16A34A] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Zap className="w-4 h-4" />
          Lucro garantido sem risco — é matemática pura
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Gerencie suas <span className="text-[#16A34A]">Surebets</span><br />com total controle
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          O SureBetFlow é a plataforma completa para apostadores de arbitragem. Calcule, registre e acompanhe seus lucros garantidos em um só lugar — com senhas criptografadas e segurança total.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors">
            Assinar agora — R$ 97/mês <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 border border-[#E5E1D8] bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-3.5 rounded-xl text-base transition-colors">
            Já sou assinante
          </Link>
        </div>
      </section>

      {/* O que é Surebet */}
      <section className="bg-white border-y border-[#E5E1D8] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">O que é uma Surebet?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Uma surebet (ou arbitragem esportiva) acontece quando as odds de diferentes casas de apostas criam uma oportunidade de lucro garantido, independente do resultado do evento.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-[#FAFAF8] border border-[#E5E1D8]">
              <div className="w-12 h-12 bg-[#2563EB]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">1. Encontre a oportunidade</h3>
              <p className="text-sm text-gray-500">Duas ou mais casas de apostas oferecem odds altas o suficiente para que a soma das probabilidades implícitas seja menor que 100%.</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-[#FAFAF8] border border-[#E5E1D8]">
              <div className="w-12 h-12 bg-[#16A34A]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-6 h-6 text-[#16A34A]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">2. Calcule as stakes</h3>
              <p className="text-sm text-gray-500">Distribua o valor apostado entre todos os resultados possíveis de forma proporcional para garantir lucro em qualquer desfecho.</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-[#FAFAF8] border border-[#E5E1D8]">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">3. Lucro garantido</h3>
              <p className="text-sm text-gray-500">Independente do resultado do jogo, você recebe mais do que investiu. É matemática, não sorte.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Funcionalidades */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Tudo que você precisa em um lugar</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Do cálculo da arbitragem ao controle financeiro completo, o SureBetFlow tem tudo para profissionalizar sua operação.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Calculator,
              color: "bg-[#16A34A]/10",
              iconColor: "text-[#16A34A]",
              title: "Calculadora 2-way e 3-way",
              desc: "Detecta arbitragem em tempo real e calcula automaticamente a distribuição ideal das stakes para maximizar o lucro garantido."
            },
            {
              icon: Lock,
              color: "bg-[#2563EB]/10",
              iconColor: "text-[#2563EB]",
              title: "Senhas criptografadas AES-256",
              desc: "Suas credenciais das casas de apostas ficam protegidas com criptografia de nível militar. Nunca em texto puro, nunca expostas."
            },
            {
              icon: Users,
              color: "bg-purple-100",
              iconColor: "text-purple-600",
              title: "Perfis ilimitados e independentes",
              desc: "Crie perfis separados para você, familiares ou sócios. Cada perfil tem suas próprias casas de apostas, saldo, apostas e histórico — totalmente isolados."
            },
            {
              icon: Wallet,
              color: "bg-yellow-100",
              iconColor: "text-yellow-600",
              title: "Controle financeiro",
              desc: "Registre depósitos e saques por casa de apostas. Visualize saldo total, lucro realizado e lucro pendente em tempo real."
            },
            {
              icon: BarChart3,
              color: "bg-[#16A34A]/10",
              iconColor: "text-[#16A34A]",
              title: "Dashboard com gráficos",
              desc: "Acompanhe a evolução do seu lucro acumulado com gráficos claros. Veja ROI, total investido e apostas ativas."
            },
            {
              icon: RefreshCw,
              color: "bg-[#2563EB]/10",
              iconColor: "text-[#2563EB]",
              title: "Histórico completo",
              desc: "Todas as apostas registradas com legs detalhados, odds, stakes e resultado real. Filtre por perfil, status e período."
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-[#E5E1D8] p-6 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.iconColor}`} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Seção Múltiplos Perfis */}
      <section className="bg-white border-y border-[#E5E1D8] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <Users className="w-4 h-4" />
              Gestão por perfis
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Gerencie vários perfis separados<br className="hidden sm:block" /> na mesma conta
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Apostadores profissionais usam múltiplas identidades nas casas de apostas. Com o SureBetFlow, cada perfil é completamente independente — com seu próprio saldo, casas, apostas e histórico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              {[
                {
                  title: "Perfil próprio + perfis de familiares",
                  desc: "Opere na sua conta e em contas de familiares (cônjuge, pais, irmãos) com controle separado para cada um.",
                },
                {
                  title: "Dados totalmente isolados",
                  desc: "Cada perfil tem suas próprias casas de apostas cadastradas, com senhas criptografadas individualmente. Um perfil não acessa os dados do outro.",
                },
                {
                  title: "Saldo e lucro por perfil",
                  desc: "Acompanhe quanto cada perfil tem em cada casa de apostas, lucro realizado e pendente, ROI individual e histórico completo de movimentações.",
                },
                {
                  title: "Visão consolidada no dashboard",
                  desc: "Além do controle individual, o painel geral soma o desempenho de todos os perfis para você enxergar o resultado total da operação.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-[#FAFAF8] border border-[#E5E1D8]">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#FAFAF8] border border-[#E5E1D8] rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-4">Exemplo de uso</p>
              <div className="space-y-3">
                {[
                  { nome: "João Silva", apelido: "Conta Principal", casas: 5, saldo: "R$ 3.200,00", lucro: "+ R$ 420,50", cor: "bg-[#16A34A]" },
                  { nome: "Maria Silva", apelido: "Esposa", casas: 3, saldo: "R$ 1.800,00", lucro: "+ R$ 210,00", cor: "bg-[#2563EB]" },
                  { nome: "Carlos Silva", apelido: "Irmão", casas: 4, saldo: "R$ 2.500,00", lucro: "+ R$ 315,75", cor: "bg-purple-600" },
                ].map((p) => (
                  <div key={p.nome} className="bg-white rounded-xl border border-[#E5E1D8] p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 ${p.cor} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {p.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{p.nome}</p>
                      <p className="text-xs text-gray-400">{p.apelido} · {p.casas} casas</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{p.saldo}</p>
                      <p className="text-xs font-medium text-[#16A34A]">{p.lucro}</p>
                    </div>
                  </div>
                ))}
                <div className="bg-[#16A34A]/5 border border-[#16A34A]/20 rounded-xl p-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Total consolidado</p>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">R$ 7.500,00</p>
                    <p className="text-xs font-bold text-[#16A34A]">+ R$ 946,25</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/cadastro" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors">
              Criar minha conta e meus perfis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Por que surebet é seguro */}
      <section className="bg-white border-y border-[#E5E1D8] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Por que surebet é diferente das apostas comuns?</h2>
              <p className="text-gray-500 mb-8">
                Nas apostas tradicionais, você depende da sorte. Na arbitragem esportiva, você explora ineficiências do mercado — é puramente matemático.
              </p>
              <ul className="space-y-4">
                {[
                  { title: "Sem risco de perda", desc: "Se calculado corretamente, você lucra independente do resultado do jogo." },
                  { title: "Não é ilegal", desc: "Arbitragem é uma estratégia legítima de mercado, amplamente praticada no mundo todo." },
                  { title: "Escalável", desc: "Quanto mais capital e casas de apostas, maior o volume de operações e lucro mensal." },
                  { title: "Consistente", desc: "Diferente de apostas normais, o resultado positivo é recorrente e previsível." },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">{item.title}: </span>
                      <span className="text-gray-500">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <div className="bg-[#FAFAF8] border border-[#E5E1D8] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldCheck className="w-6 h-6 text-[#16A34A]" />
                  <span className="font-bold text-gray-900">Segurança total dos dados</span>
                </div>
                <p className="text-sm text-gray-500">Suas credenciais das casas de apostas são criptografadas com AES-256-GCM via Edge Function segura. Nem o banco de dados guarda sua senha em texto puro.</p>
              </div>
              <div className="bg-[#FAFAF8] border border-[#E5E1D8] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="w-6 h-6 text-[#2563EB]" />
                  <span className="font-bold text-gray-900">ROI típico de 1% a 5% por operação</span>
                </div>
                <p className="text-sm text-gray-500">Com volume consistente, apostadores profissionais conseguem retornos mensais de 10% a 30% sobre o capital alocado nas casas.</p>
              </div>
              <div className="bg-[#FAFAF8] border border-[#E5E1D8] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  <span className="font-bold text-gray-900">Velocidade é essencial</span>
                </div>
                <p className="text-sm text-gray-500">Oportunidades de arbitragem duram segundos a minutos. Com o SureBetFlow, você calcula e registra a operação em poucos cliques.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plano */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Um plano simples. Sem surpresas.</h2>
        <p className="text-gray-500 mb-12 max-w-xl mx-auto">Acesso completo a todas as funcionalidades por um valor fixo mensal.</p>
        <div className="max-w-sm mx-auto bg-white rounded-2xl border-2 border-[#16A34A] shadow-xl p-8">
          <div className="inline-flex items-center gap-1.5 bg-[#16A34A] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
            MAIS POPULAR
          </div>
          <p className="text-gray-500 text-sm mb-2">Plano Profissional</p>
          <div className="flex items-end justify-center gap-1 mb-6">
            <span className="text-gray-400 text-lg font-medium">R$</span>
            <span className="text-5xl font-extrabold text-gray-900">97</span>
            <span className="text-gray-400 text-lg font-medium mb-1">,90/mês</span>
          </div>
          <ul className="space-y-3 text-sm text-left mb-8">
            {[
              "Perfis ilimitados de apostador",
              "Casas de apostas ilimitadas",
              "Calculadora 2-way e 3-way",
              "Dashboard financeiro completo",
              "Histórico completo de apostas",
              "Senhas criptografadas AES-256-GCM",
              "Suporte por e-mail",
            ].map(f => (
              <li key={f} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                <span className="text-gray-700">{f}</span>
              </li>
            ))}
          </ul>
          <Link href="/cadastro" className="block w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3 rounded-xl transition-colors text-center">
            Assinar agora
          </Link>
          
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-[#16A34A] py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Pronto para lucrar com matemática?</h2>
          <p className="text-[#16A34A]/80 text-lg mb-8 text-white/80">
            Junte-se a apostadores que já profissionalizaram sua operação de surebet com o SureBetFlow.
          </p>
          <Link href="/cadastro" className="inline-flex items-center gap-2 bg-white text-[#16A34A] font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-base">
            Assinar agora <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E1D8] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#16A34A] rounded-md flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">SureBetFlow</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 SureBetFlow. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/login" className="text-xs text-gray-500 hover:text-gray-900">Entrar</Link>
            <Link href="/cadastro" className="text-xs text-gray-500 hover:text-gray-900">Cadastrar</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
