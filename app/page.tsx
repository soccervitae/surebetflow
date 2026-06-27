import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  ShieldCheck, Calculator, Wallet, Lock, BarChart3, TrendingUp,
  CheckCircle, ArrowRight, Zap, Users, Target, RefreshCw, ChevronDown, Gift,
  Sparkles, ClipboardPaste, ImageIcon, Bot
} from "lucide-react"
import Image from "next/image"

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SureBetFlow",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: "https://www.surebetflow.bet",
    description: "Plataforma completa para apostadores de arbitragem esportiva. Calcule surebets, gerencie perfis e controle finanças com segurança total.",
    offers: [
      { "@type": "Offer", price: "99.00", priceCurrency: "BRL", name: "Trader" },
      { "@type": "Offer", price: "179.00", priceCurrency: "BRL", name: "Trader Pro" },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "48",
    },
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/surebetflow-horizontal-vazada-branca%20(1).png" alt="SurebetFlow" height={36} className="h-9 w-auto" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="bg-[#1e3a8a] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1e40af] transition-colors">
              Começar agora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-28 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-400 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <Zap className="w-3.5 h-3.5" />
          Lucro garantido — é matemática pura
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
          Calcular vitórias nunca<br />
          foi tão <span className="text-[#1e3a8a]">simples</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
          A plataforma completa para apostadores de arbitragem. Calcule, registre e acompanhe seus lucros garantidos com segurança total e controle profissional.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors">
            Começar agora <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold px-8 py-3.5 rounded-xl text-base transition-colors">
            Já sou assinante
          </Link>
        </div>
      </section>

      {/* O que é Surebet */}
      <section className="border-y border-white/5 py-20 bg-[#0d1b3e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">O que é uma Surebet?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Uma surebet acontece quando as odds de diferentes casas criam uma oportunidade de lucro garantido, independente do resultado do evento.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Target, color: "bg-blue-500/10", iconColor: "text-blue-400",
                title: "1. Encontre a oportunidade",
                desc: "Duas ou mais casas oferecem odds altas o suficiente para que a soma das probabilidades implícitas seja menor que 100%."
              },
              {
                icon: Calculator, color: "bg-[#1e3a8a]/10", iconColor: "text-[#1e3a8a]",
                title: "2. Calcule as stakes",
                desc: "Distribua o valor apostado entre todos os resultados possíveis de forma proporcional para garantir lucro em qualquer desfecho."
              },
              {
                icon: TrendingUp, color: "bg-yellow-500/10", iconColor: "text-yellow-400",
                title: "3. Lucro garantido",
                desc: "Independente do resultado do jogo, você recebe mais do que investiu. É matemática, não sorte."
              },
            ].map((f) => (
              <div key={f.title} className="bg-[#0f172a] border border-white/5 rounded-2xl p-6 text-center">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-4">Tudo que você precisa em um lugar</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Do cálculo da arbitragem ao controle financeiro completo — tudo para profissionalizar sua operação.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: Calculator, color: "bg-[#1e3a8a]/10", iconColor: "text-[#1e3a8a]", title: "Calculadora 2-way e 3-way", desc: "Detecta arbitragem em tempo real e calcula automaticamente a distribuição ideal das stakes." },
            { icon: Gift, color: "bg-purple-500/10", iconColor: "text-purple-400", title: "Controle de bônus das bets", desc: "Registre os bônus em dinheiro que as casas concedem. O saldo de bônus fica separado do saldo real de cada bet." },
            { icon: Users, color: "bg-blue-500/10", iconColor: "text-blue-400", title: "Perfis ilimitados", desc: "Crie perfis separados para você, familiares ou sócios. Cada perfil é totalmente isolado." },
            { icon: Wallet, color: "bg-yellow-500/10", iconColor: "text-yellow-400", title: "Controle financeiro", desc: "Registre depósitos, saques e bônus por casa de apostas. Visualize saldo, lucro realizado e pendente." },
            { icon: BarChart3, color: "bg-[#1e3a8a]/10", iconColor: "text-[#1e3a8a]", title: "Dashboard com gráficos", desc: "Acompanhe a evolução do lucro acumulado. Veja ROI, total investido e apostas ativas." },
            { icon: RefreshCw, color: "bg-blue-500/10", iconColor: "text-blue-400", title: "Histórico completo", desc: "Todas as apostas com legs detalhados, odds, stakes e resultado real. Filtre por perfil e período." },
          ].map((f) => (
            <div key={f.title} className="bg-[#0d1b3e] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
              <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.iconColor}`} />
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* IA Section */}
      <section className="border-y border-white/5 py-20 bg-[#0d1b3e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Inteligência Artificial nativa
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Continue usando o localizador<br className="hidden sm:block" /> de surebets que você já usa
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              A IA da SurebetFlow lê o conteúdo do seu localizador — texto copiado ou print da tela — e preenche todos os campos automaticamente quando você for registrar a aposta.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Steps */}
            <div className="space-y-5">
              {[
                {
                  icon: Bot,
                  color: "bg-[#1e3a8a]/10 text-[#5b7ec9]",
                  title: "IA que entende surebets",
                  desc: "Nossa IA foi treinada para reconhecer oportunidades de arbitragem de qualquer localizador.",
                },
                {
                  icon: ClipboardPaste,
                  color: "bg-purple-500/10 text-purple-400",
                  title: "Cole o texto com um clique",
                  desc: "Copie os dados diretamente do localizador, cole no SurebetFlow e a IA identifica casas, odds, mercado e evento automaticamente.",
                },
                {
                  icon: ImageIcon,
                  color: "bg-yellow-500/10 text-yellow-400",
                  title: "Ou envie um print da tela",
                  desc: "Fez um screenshot do site? Basta enviar a imagem. A IA lê visualmente e extrai todas as informações para preencher os campos.",
                },
                {
                  icon: Sparkles,
                  color: "bg-blue-500/10 text-blue-400",
                  title: "Múltiplas surebets de uma vez",
                  desc: "Se o print contiver várias oportunidades, a IA lista todas e você escolhe qual usar — sem precisar digitar nada.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-4 rounded-2xl bg-[#0f172a] border border-white/5 hover:border-white/10 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">{item.title}</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual mockup */}
            <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600 ml-2">SurebetFlow — Nova Aposta</span>
              </div>

              {/* AI bar */}
              <div className="flex items-center justify-between bg-[#1e3a8a]/10 border border-[#1e3a8a]/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#5b7ec9]" />
                  <span className="text-sm font-medium text-[#5b7ec9]">Preencher com IA</span>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs text-[#5b7ec9] bg-[#1e3a8a]/20 px-2.5 py-1 rounded-lg border border-[#1e3a8a]/30">
                    <ClipboardPaste className="w-3 h-3" /> Colar texto
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#5b7ec9] bg-[#1e3a8a]/20 px-2.5 py-1 rounded-lg border border-[#1e3a8a]/30">
                    <ImageIcon className="w-3 h-3" /> Imagem
                  </span>
                </div>
              </div>

              {/* Filled fields */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Esporte", value: "Futebol", filled: true },
                  { label: "Evento", value: "Arsenal x Chelsea", filled: true },
                  { label: "Tipo", value: "2-way", filled: true },
                  { label: "Investimento", value: "R$ 500,00", filled: true },
                ].map(f => (
                  <div key={f.label} className="space-y-1">
                    <p className="text-xs text-gray-500">{f.label}</p>
                    <div className={`text-sm rounded-lg px-3 py-2 border ${f.filled ? "bg-[#1e3a8a]/5 border-[#1e3a8a]/20 text-white" : "bg-white/5 border-white/5 text-gray-600"}`}>
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Casa 1", bet: "Betano", odd: "2.15", market: "Arsenal" },
                  { label: "Casa 2", bet: "Bet365", odd: "2.20", market: "Chelsea" },
                ].map(leg => (
                  <div key={leg.label} className="bg-[#0d1b3e] border border-white/5 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-400">{leg.label}</p>
                    <div className="text-xs bg-[#1e3a8a]/5 border border-[#1e3a8a]/20 rounded-lg px-2 py-1.5 text-white">{leg.bet}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="text-xs bg-[#1e3a8a]/5 border border-[#1e3a8a]/20 rounded-lg px-2 py-1.5 text-white">{leg.market}</div>
                      <div className="text-xs bg-[#1e3a8a]/5 border border-[#1e3a8a]/20 rounded-lg px-2 py-1.5 text-white font-mono">{leg.odd}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#1e3a8a]/10 border border-[#1e3a8a]/20 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#5b7ec9]" />
                  <span className="text-sm font-semibold text-[#5b7ec9]">Arbitragem encontrada!</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">ROI</p>
                  <p className="text-sm font-bold text-white">2.4%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/cadastro" className="inline-flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold px-8 py-3.5 rounded-xl transition-colors">
              <Sparkles className="w-4 h-4" />
              Experimentar a IA grátis
            </Link>
          </div>
        </div>
      </section>

      {/* Múltiplos Perfis */}
      <section className="border-y border-white/5 py-20 bg-[#0f172a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-400 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <Users className="w-3.5 h-3.5" />
              Gestão por perfis
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Gerencie vários perfis separados<br className="hidden sm:block" /> na mesma conta
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Apostadores profissionais usam múltiplas identidades. Com o SureBetFlow, cada perfil é completamente independente — com seu próprio saldo, casas e histórico.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-3">
              {[
                { title: "Perfil próprio + perfis de familiares", desc: "Opere na sua conta e em contas de familiares com controle separado para cada um." },
                { title: "Dados totalmente isolados", desc: "Cada perfil tem suas próprias casas cadastradas com senhas criptografadas individualmente." },
                { title: "Saldo e lucro por perfil", desc: "Acompanhe quanto cada perfil tem em cada casa, lucro realizado, pendente e ROI individual." },
                { title: "Visão consolidada no dashboard", desc: "O painel geral soma o desempenho de todos os perfis para você enxergar o resultado total." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-[#0f172a] border border-white/5">
                  <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white text-sm">{item.title}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-4">Exemplo de uso</p>
              <div className="space-y-3">
                {[
                  { nome: "João Silva", apelido: "Conta Principal", casas: 5, saldo: "R$ 3.200,00", lucro: "+ R$ 420,50", cor: "bg-[#1e3a8a]" },
                  { nome: "Maria Silva", apelido: "Esposa", casas: 3, saldo: "R$ 1.800,00", lucro: "+ R$ 210,00", cor: "bg-blue-600" },
                  { nome: "Carlos Silva", apelido: "Irmão", casas: 4, saldo: "R$ 2.500,00", lucro: "+ R$ 315,75", cor: "bg-purple-600" },
                ].map((p) => (
                  <div key={p.nome} className="bg-[#0d1b3e] border border-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 ${p.cor} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {p.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{p.nome}</p>
                      <p className="text-xs text-gray-500">{p.apelido} · {p.casas} casas</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">{p.saldo}</p>
                      <p className="text-xs font-medium text-[#1e3a8a]">{p.lucro}</p>
                    </div>
                  </div>
                ))}
                <div className="bg-[#1e3a8a]/5 border border-[#1e3a8a]/20 rounded-xl p-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-300">Total consolidado</p>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">R$ 7.500,00</p>
                    <p className="text-xs font-bold text-[#1e3a8a]">+ R$ 946,25</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <Link href="/cadastro" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors">
              Criar minha conta <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Por que surebet é seguro */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Por que surebet é diferente das apostas comuns?</h2>
            <p className="text-gray-400 mb-8">Nas apostas tradicionais, você depende da sorte. Na arbitragem, você explora ineficiências do mercado — é puramente matemático.</p>
            <ul className="space-y-4">
              {[
                { title: "Sem risco de perda", desc: "Se calculado corretamente, você lucra independente do resultado." },
                { title: "Não é ilegal", desc: "Arbitragem é uma estratégia legítima, amplamente praticada no mundo todo." },
                { title: "Escalável", desc: "Quanto mais capital e casas, maior o volume de operações e lucro mensal." },
                { title: "Consistente", desc: "Diferente de apostas normais, o resultado positivo é recorrente e previsível." },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">{item.title}: </span>
                    <span className="text-gray-400">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            {[
              { icon: ShieldCheck, color: "text-[#1e3a8a]", title: "Segurança total dos dados", desc: "Suas credenciais são criptografadas com AES-256-GCM via Edge Function segura. Nunca em texto puro." },
              { icon: BarChart3, color: "text-blue-400", title: "ROI típico de 1% a 5% por operação", desc: "Com volume consistente, apostadores conseguem retornos mensais de 10% a 30% sobre o capital." },
              { icon: Zap, color: "text-yellow-400", title: "Velocidade é essencial", desc: "Oportunidades duram segundos. Com o SureBetFlow, você calcula e registra em poucos cliques." },
            ].map((item) => (
              <div key={item.title} className="bg-[#0d1b3e] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                  <span className="font-bold text-white">{item.title}</span>
                </div>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="border-y border-white/5 py-20 bg-[#0d1b3e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Escolha seu plano</h2>
          <p className="text-gray-400 mb-12 max-w-xl mx-auto">Sem taxas escondidas. Cancele quando quiser.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* Plano Pro */}
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 text-left relative flex flex-col">
              <div className="mb-4">
                <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full">TRADER</span>
              </div>
              <p className="text-gray-400 text-sm mb-2">Para apostadores individuais</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-gray-500 text-lg font-medium">R$</span>
                <span className="text-5xl font-extrabold text-white">99</span>
                <span className="text-gray-500 text-lg font-medium mb-1">,00/mês</span>
              </div>
              <p className="text-xs text-gray-500 mb-6">Cancele quando quiser, sem fidelidade</p>
              <ul className="space-y-3 text-sm mb-8 flex-1">
                {[
                  "Até 5 perfis de apostador",
                  "Casas de apostas ilimitadas",
                  "Calculadora 2-way e 3-way",
                  "Controle de bônus por casa de apostas",
                  "Dashboard financeiro completo",
                  "Histórico completo de apostas",
                  "Suporte por ticket",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-colors text-center">
                Começar agora
              </Link>
            </div>

            {/* Plano Pro Max */}
            <div className="bg-[#0f172a] border-2 border-[#1e3a8a] rounded-2xl p-8 text-left relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#1e3a8a] text-white text-xs font-bold px-3 py-1 rounded-full">MAIS POPULAR</span>
              </div>
              <div className="mb-4">
                <span className="bg-[#1e3a8a]/20 text-[#93c5fd] text-xs font-bold px-3 py-1 rounded-full border border-[#1e3a8a]/40">TRADER PRO</span>
              </div>
              <p className="text-gray-400 text-sm mb-2">Para grupos e operações maiores</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-gray-500 text-lg font-medium">R$</span>
                <span className="text-5xl font-extrabold text-white">179</span>
                <span className="text-gray-500 text-lg font-medium mb-1">,00/mês</span>
              </div>
              <p className="text-xs text-gray-500 mb-6">Cancele quando quiser, sem fidelidade</p>
              <ul className="space-y-3 text-sm mb-8 flex-1">
                {[
                  "Até 20 perfis de apostador",
                  "Casas de apostas ilimitadas",
                  "Calculadora 2-way e 3-way",
                  "Controle de bônus por casa de apostas",
                  "Dashboard financeiro completo",
                  "Histórico completo de apostas",
                  "Suporte prioritário por ticket",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1e3a8a] flex-shrink-0" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="block w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold py-3 rounded-xl transition-colors text-center">
                Começar agora
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Perguntas frequentes</h2>
        <div className="space-y-4">
          {[
            { q: "O que é surebet?", a: "Surebet (ou arbitragem esportiva) é quando você aposta em todos os resultados possíveis de um evento em casas diferentes, garantindo lucro independente do desfecho." },
            { q: "É legal fazer surebet?", a: "Sim. A arbitragem esportiva é completamente legal. Você está apenas aproveitando diferenças de odds entre casas de apostas, o que é uma prática comum no mercado financeiro." },
            { q: "Quanto posso lucrar por mês?", a: "Depende do capital disponível e do volume de operações. Apostadores profissionais conseguem de 10% a 30% ao mês sobre o capital alocado nas casas." },
            { q: "Minhas senhas ficam seguras?", a: "Sim. Todas as senhas das casas de apostas são criptografadas com AES-256-GCM via Edge Function segura. Nem o banco de dados guarda sua senha em texto puro." },
            { q: "Posso cancelar a qualquer momento?", a: "Sim, você pode cancelar sua assinatura a qualquer momento sem multa ou fidelidade. O acesso continua até o fim do período pago." },
          ].map((item) => (
            <details key={item.q} className="group bg-[#0d1b3e] border border-white/5 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                <span className="font-semibold text-white">{item.q}</span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
              </summary>
              <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="border-t border-white/5 py-20 bg-[#0d1b3e]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Pronto para lucrar com matemática?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Junte-se a apostadores que já profissionalizaram sua operação com o SureBetFlow.
          </p>
          <Link href="/cadastro" className="inline-flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-base">
            Começar agora <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0f1e]">
        {/* Desktop footer */}
        <div className="hidden md:block max-w-6xl mx-auto px-6 pt-14 pb-8">
          <div className="grid grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-1 space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/surebetflow-horizontal-vazada-branca%20(1).png" alt="SurebetFlow" className="h-8 w-auto" />
              <p className="text-sm text-gray-500 leading-relaxed">A plataforma completa para apostadores de arbitragem esportiva.</p>
            </div>
            {/* Plataforma */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Plataforma</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Perfis", href: "/perfis" },
                  { label: "Calculadora", href: "/calculadora" },
                  { label: "Apostas", href: "/apostas" },
                  { label: "Financeiro", href: "/financeiro" },
                ].map(({ label, href }) => (
                  <li key={label}><Link href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            {/* Conta */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conta</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Entrar", href: "/login" },
                  { label: "Cadastrar", href: "/cadastro" },
                  { label: "Assinatura", href: "/assinatura" },
                  { label: "Suporte", href: "/suporte" },
                  { label: "Tutorial", href: "/tutorial" },
                ].map(({ label, href }) => (
                  <li key={label}><Link href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            {/* Legal */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Legal</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Política de Privacidade", href: "/privacidade" },
                  { label: "Termos de Uso", href: "/termos" },
                ].map(({ label, href }) => (
                  <li key={label}><Link href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex items-center justify-between">
            <p className="text-xs text-gray-600">© 2026 SurebetFlow. Todos os direitos reservados.</p>
            <p className="text-xs text-gray-600">Feito para apostadores sérios 🇧🇷</p>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="md:hidden max-w-6xl mx-auto px-4 py-8 flex flex-col items-center gap-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/surebetflow-horizontal-vazada-branca%20(1).png" alt="SurebetFlow" className="h-8 w-auto" />
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/privacidade" className="text-xs text-gray-500 hover:text-white transition-colors">Privacidade</Link>
            <Link href="/termos" className="text-xs text-gray-500 hover:text-white transition-colors">Termos de Uso</Link>
            <Link href="/login" className="text-xs text-gray-500 hover:text-white transition-colors">Entrar</Link>
            <Link href="/cadastro" className="text-xs text-gray-500 hover:text-white transition-colors">Cadastrar</Link>
          </div>
          <p className="text-xs text-gray-600">© 2026 SurebetFlow. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  )
}
