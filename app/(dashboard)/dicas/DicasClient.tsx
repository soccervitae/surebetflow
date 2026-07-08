"use client"

import { useState } from "react"
import {
  Lightbulb, Users, ShieldCheck, TrendingUp, AlertTriangle,
  ChevronDown, ChevronRight, Zap, Target, BarChart2, RefreshCw,
  UserPlus, Wallet, CheckCircle, Star, BookOpen
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Section {
  id: string
  icon: React.ElementType
  color: string
  bg: string
  title: string
  subtitle: string
  items: Topic[]
}

interface Topic {
  title: string
  content: React.ReactNode
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-[#1e3a8a]/10 border border-[#1e3a8a]/20 rounded-xl px-4 py-3">
      <Zap className="w-4 h-4 text-[var(--accent-text)] shrink-0 mt-0.5" />
      <p className="text-sm text-[var(--text-secondary)]">{text}</p>
    </div>
  )
}

function Warn({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-sm text-[var(--text-secondary)]">{text}</p>
    </div>
  )
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-[#1e3a8a]/20 border border-[#1e3a8a]/40 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[var(--accent-text)] text-xs font-bold">{num}</span>
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{text}</p>
    </div>
  )
}

const SECTIONS: Section[] = [
  {
    id: "parceria",
    icon: ShieldCheck,
    color: "text-[#10b981]",
    bg: "bg-[#10b981]/10 border-[#10b981]/20",
    title: "Parceria",
    subtitle: "Como verificar e iniciar uma parceria com segurança",
    items: [
      {
        title: "Passo 1 — Descubra quais casas o parceiro tem conta",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Antes de qualquer coisa, pergunte à pessoa quais casas de apostas ela já possui cadastro. Isso determina quais surebets vocês poderão operar juntos e se vale a pena avançar na parceria.
            </p>
            <Tip text="Quanto mais casas o parceiro tiver, maior o leque de surebets disponíveis para vocês explorarem juntos." />
          </div>
        ),
      },
      {
        title: "Passo 2 — Verifique se a conta está em ordem",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Peça para o parceiro acessar a conta dele em cada casa e verificar a área de informações pessoais ou perfil. Os dados abaixo são obrigatórios e precisam estar confirmados pela casa antes de qualquer operação:
            </p>
            <div className="space-y-2">
              {[
                { icon: CheckCircle, color: "text-green-500", label: "E-mail verificado", desc: "A casa envia um link de confirmação. Se não confirmou, pode ter limitações de saque." },
                { icon: CheckCircle, color: "text-green-500", label: "Telefone confirmado", desc: "Geralmente via código SMS. Contas sem telefone são frequentemente bloqueadas em saques." },
                { icon: CheckCircle, color: "text-green-500", label: "Endereço cadastrado", desc: "Algumas casas exigem comprovante de residência para liberar saques acima de certos valores." },
              ].map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                  <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{label}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Warn text="Não opere com uma conta que ainda não confirmou e-mail, telefone ou endereço. Se a casa bloquear um saque por dados incompletos, você perde tempo e corre risco de perder o dinheiro apostado." />
          </div>
        ),
      },
      {
        title: "Passo 3 — Troque o e-mail de cadastro por um que só você controla",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Após confirmar que a conta está em ordem, o próximo passo é trocar o e-mail de cadastro da casa por um e-mail que <strong className="text-[var(--text-primary)]">somente você tem acesso</strong>. Isso é fundamental para manter o controle da operação.
            </p>

            <div className="space-y-2">
              <Step num={1} text="Crie um e-mail novo exclusivo para esse parceiro. Use o nome ou apelido da pessoa para identificar facilmente — ex: joao.apostas@gmail.com ou roger.bets@gmail.com." />
              <Step num={2} text="Acesse a conta do parceiro na casa de apostas e vá até as configurações de perfil ou segurança." />
              <Step num={3} text="Troque o e-mail cadastrado para o novo e-mail criado por você e confirme a alteração." />
              <Step num={4} text="Guarde o acesso a esse e-mail em local seguro. Ele será usado para receber notificações da casa, recuperar senha e fazer login quando necessário." />
            </div>

            <div className="p-3 rounded-xl border border-[#1e3a8a]/20 bg-[#1e3a8a]/5 space-y-2">
              <p className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wide">Por que fazer isso?</p>
              <ul className="space-y-1.5">
                {[
                  "Você recebe todas as notificações importantes da casa (promoções, alertas de saque, verificações).",
                  "Consegue fazer login e acompanhar o saldo sem precisar acionar o parceiro a todo momento.",
                  "Mantém o controle mesmo se o parceiro não estiver disponível.",
                  "O parceiro só precisa ser acionado quando a casa exigir reconhecimento facial ou biometria.",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-[var(--text-secondary)]">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Warn text="Nunca use o e-mail pessoal do parceiro como e-mail da conta. Se o parceiro sair da operação, você perde o acesso e o controle da conta." />
            <Tip text="Use o Gmail e ative a verificação em duas etapas no e-mail criado para garantir que ninguém mais acesse além de você." />
          </div>
        ),
      },
      {
        title: "Passo 4 — A parte financeira: conta bancária e saques",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Quando o parceiro criou a conta na casa de apostas, ele cadastrou uma conta bancária própria para depósitos e saques. Esse é o ponto mais crítico de toda a parceria e precisa ser tratado com muito cuidado.
            </p>

            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> O risco real
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Se o saque cair na conta bancária do parceiro e você depender da boa vontade dele para repassar o valor, está correndo um risco sério. Infelizmente já houve casos em que parceiros retiveram o dinheiro, atrasaram os repasses ou simplesmente sumiram após receber os saques.
              </p>
            </div>

            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Suas opções</p>

            <div className="space-y-2">
              {[
                {
                  icon: AlertTriangle,
                  color: "text-amber-500",
                  border: "border-amber-500/20",
                  bg: "bg-amber-500/5",
                  label: "Trocar a conta bancária — atenção à regra do CPF",
                  desc: "As casas de apostas só aceitam conta bancária com o mesmo CPF do titular do cadastro. Ou seja, não é possível colocar uma conta sua — o saque sempre vai para uma conta no nome do parceiro. A troca só é útil se o parceiro tiver mais de uma conta bancária e quiser usar uma específica.",
                },
                {
                  icon: AlertTriangle,
                  color: "text-amber-500",
                  border: "border-amber-500/20",
                  bg: "bg-amber-500/5",
                  label: "Opção intermediária — Confiar no parceiro com regras claras",
                  desc: "Se não for possível trocar a conta, estabeleça regras claras por escrito: prazo máximo de repasse após cada saque, valor mínimo para acionar o saque, e forma de comprovação do pagamento.",
                },
                {
                  icon: AlertTriangle,
                  color: "text-red-400",
                  border: "border-red-400/20",
                  bg: "bg-red-400/5",
                  label: "Opção arriscada — Manter a conta do parceiro sem acordo formal",
                  desc: "Operar sem nenhum acordo documentado é o maior erro. Se algo der errado, você não tem como provar que o dinheiro é seu ou cobrar de volta.",
                },
              ].map(({ icon: Icon, color, border, bg, label, desc }) => (
                <div key={label} className={`flex items-start gap-3 p-3 rounded-lg border ${border} ${bg}`}>
                  <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                  <div>
                    <p className={`text-xs font-semibold ${color}`}>{label}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pulo do gato */}
            <div className="p-4 rounded-xl border border-[#a855f7]/30 bg-[#a855f7]/8 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#a855f7]" />
                <p className="text-xs font-bold text-[#a855f7] uppercase tracking-wide">O pulo do gato — crie a conta bancária você mesmo</p>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Peça para o parceiro abrir conta em um banco digital (Nubank, Inter, PicPay, etc.), mas <strong className="text-[var(--text-primary)]">você mesmo faz o cadastro no seu celular</strong>. Dessa forma todos os dados de acesso ficam sob o seu controle desde o início.
              </p>
              <div className="space-y-2">
                <Step num={1} text="Baixe o aplicativo do banco no seu celular e inicie o cadastro com os dados do parceiro (nome, CPF, data de nascimento)." />
                <Step num={2} text="Use o e-mail criado por você para essa parceria — o mesmo do passo 3. Assim o acesso ao banco e à bet ficam centralizados no mesmo e-mail que só você controla." />
                <Step num={3} text="Crie a senha do banco você mesmo e guarde em local seguro. O parceiro não precisa saber a senha." />
                <Step num={4} text="A única participação do parceiro será o reconhecimento facial, necessário para validar a abertura da conta e para autorizar transferências quando solicitado." />
                <Step num={5} text="Após a conta aberta, troque a conta bancária cadastrada na bet para essa nova conta. Quando o saque cair, você mesmo faz a transferência pelo app do banco." />
              </div>
              <div className="flex items-start gap-2 pt-1">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Com isso você tem acesso total: ao e-mail, ao banco e à bet. O parceiro só é acionado quando a casa exige reconhecimento facial — e nada mais.
                </p>
              </div>
            </div>

            <Warn text="Nunca coloque saldo alto em uma conta cujo saque vai para a conta do parceiro sem ter estabelecido antes um acordo claro e de preferência registrado." />
          </div>
        ),
      },
      {
        title: "Passo 5 — Como remunerar o parceiro pela conta",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              O parceiro está cedendo o acesso à conta da bet dele para você operar. Por isso é justo combinar uma remuneração — e existem duas formas principais de fazer isso.
            </p>

            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Formas de remuneração</p>

            <div className="space-y-2">
              {[
                {
                  icon: Wallet,
                  color: "text-[#3b82f6]",
                  border: "border-[#3b82f6]/20",
                  bg: "bg-[#3b82f6]/5",
                  label: "Valor fixo pelo acesso",
                  desc: "Você combina um valor mensal fixo pelo uso da conta, independente do resultado das apostas. Bom para o parceiro pois garante uma renda fixa. Bom para você se o volume de apostas for alto.",
                },
                {
                  icon: TrendingUp,
                  color: "text-[#a855f7]",
                  border: "border-[#a855f7]/20",
                  bg: "bg-[#a855f7]/5",
                  label: "Porcentagem sobre o lucro (recomendado)",
                  desc: "Você repassa ao parceiro uma porcentagem do lucro gerado pelas apostas na conta dele. Mais justo para ambos: se não houver lucro, ninguém perde. A sugestão é entre 10% e 30% do lucro líquido.",
                },
              ].map(({ icon: Icon, color, border, bg, label, desc }) => (
                <div key={label} className={`flex items-start gap-3 p-3 rounded-lg border ${border} ${bg}`}>
                  <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                  <div>
                    <p className={`text-xs font-semibold ${color}`}>{label}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Referência de porcentagem</p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { faixa: "10% – 15%", desc: "Parceiro pouco envolvido, conta com acesso total seu e conta bancária já na sua titularidade.", color: "text-green-500", border: "border-green-500/20", bg: "bg-green-500/5" },
                { faixa: "15% – 25%", desc: "Parceiro que ainda recebe o saque na conta dele e repassa para você após cada operação.", color: "text-amber-500", border: "border-amber-500/20", bg: "bg-amber-500/5" },
                { faixa: "25% – 30%", desc: "Parceiro muito envolvido: precisa estar disponível com frequência para reconhecimento facial ou validações.", color: "text-[#3b82f6]", border: "border-[#3b82f6]/20", bg: "bg-[#3b82f6]/5" },
              ].map(({ faixa, desc, color, border, bg }) => (
                <div key={faixa} className={`p-3 rounded-lg border ${border} ${bg} flex flex-col gap-1`}>
                  <p className={`text-sm font-bold ${color}`}>{faixa}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <Tip text="Registre o acordo por escrito, mesmo que seja via mensagem no WhatsApp. Isso evita desentendimentos futuros sobre o valor combinado." />
            <Warn text="Evite porcentagens acima de 30%. Se o custo da parceria for muito alto, o lucro líquido para você deixa de compensar o trabalho de operar a conta." />
          </div>
        ),
      },
    ],
  },
  {
    id: "parcerias",
    icon: UserPlus,
    color: "text-[#3b82f6]",
    bg: "bg-[#3b82f6]/10 border-[#3b82f6]/20",
    title: "Como encontrar novas parcerias",
    subtitle: "Estratégias para expandir seus perfis de apostas",
    items: [
      {
        title: "Por que diversificar casas de apostas?",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Com o tempo, as casas de apostas identificam apostadores profissionais e limitam ou bloqueiam suas contas. Por isso, ter múltiplos perfis ativos é essencial para manter o volume de apostas e continuar lucrando.
            </p>
            <Tip text="Quanto mais perfis ativos você tiver, mais oportunidades de surebet você consegue explorar simultaneamente." />
            <Warn text="Nunca dependa de apenas uma ou duas casas. Se forem limitadas ao mesmo tempo, sua operação para." />
          </div>
        ),
      },
      {
        title: "Onde encontrar novas casas de apostas",
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              <Step num={1} text="Pesquise em grupos e fóruns especializados em apostas esportivas — comunidades no Telegram e Discord costumam indicar casas com boas odds e menos restrições." />
              <Step num={2} text="Acompanhe afiliados e streamers de apostas: eles frequentemente testam casas novas e reportam a experiência do usuário." />
              <Step num={3} text="Verifique sites de comparação de odds (oddschecker, betcris comparador) para descobrir casas que ainda não estão na sua lista." />
              <Step num={4} text="Observe quais casas aparecem nas surebets que você já encontra — se uma casa oferece odds boas com frequência, vale cadastrar." />
            </div>
            <Tip text="Priorize casas que oferecem bônus de boas-vindas. Use esse bônus a favor antes de começar a apostar com volume alto." />
          </div>
        ),
      },
      {
        title: "Como avaliar uma nova casa antes de depositar",
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              <Step num={1} text="Verifique o tempo de saque: casas que demoram mais de 3 dias úteis para pagar são um sinal de alerta." />
              <Step num={2} text="Teste o suporte ao cliente antes de depositar. Uma casa que não responde mensagens também não vai resolver seu saque." />
              <Step num={3} text="Comece com um depósito pequeno para testar o processo de saque antes de colocar saldo alto." />
              <Step num={4} text="Leia os termos de rollover do bônus. Bônus com rollover alto podem travar seu saldo por muito tempo." />
            </div>
            <Warn text="Evite casas sem licença regulatória. Prefira sempre casas regulamentadas no Brasil ou com reputação comprovada internacionalmente." />
          </div>
        ),
      },
    ],
  },
  {
    id: "controle",
    icon: BarChart2,
    color: "text-[#a855f7]",
    bg: "bg-[#a855f7]/10 border-[#a855f7]/20",
    title: "Controle de perfis",
    subtitle: "Como organizar e monitorar seus perfis no SurebetFlow",
    items: [
      {
        title: "Como estruturar seus perfis",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              No SurebetFlow, cada perfil representa uma identidade de apostador — pode ser você mesmo operando contas em diferentes casas, ou parceiros com quem você divide a operação.
            </p>
            <div className="space-y-2">
              <Step num={1} text="Crie um perfil para cada operador (você, um sócio, um familiar de confiança). Isso separa os resultados e facilita a divisão de lucros." />
              <Step num={2} text="Dentro de cada perfil, adicione as casas de apostas (Bets) que aquele operador usa. Cada casa tem seu próprio saldo e histórico." />
              <Step num={3} text="Registre todas as apostas no perfil correto. Isso garante que o ROI e lucro de cada operador estejam sempre precisos." />
            </div>
            <Tip text="Use o apelido do perfil para identificar facilmente quem é o operador — ex: 'Roger - Conta 1', 'João - Principal'." />
          </div>
        ),
      },
      {
        title: "Monitorando a saúde de cada perfil",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              O dashboard de cada perfil mostra os indicadores mais importantes. Veja como interpretar cada um:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "Saldo total", color: "text-[#3b82f6]", desc: "Quanto está disponível em todas as casas deste perfil para apostar agora." },
                { label: "Lucro realizado", color: "text-green-500", desc: "Resultado líquido das apostas já finalizadas. É o número que importa no final do mês." },
                { label: "ROI %", color: "text-[#a855f7]", desc: "Retorno sobre investimento. Um ROI acima de 3% já é excelente para surebet." },
                { label: "Apostas pendentes", color: "text-yellow-500", desc: "Apostas que ainda não foram finalizadas. Acompanhe para não esquecer de registrar os resultados." },
              ].map(({ label, color, desc }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                  <CheckCircle className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                  <div>
                    <p className={`text-xs font-semibold ${color}`}>{label}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        title: "Quando desativar ou substituir um perfil",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Nem todo perfil precisa ficar ativo para sempre. Saber quando pausar é parte do controle profissional.
            </p>
            <div className="space-y-2">
              <Step num={1} text="Se a maioria das casas de um perfil foi limitada, marque o perfil como Inativo para não confundir com perfis operacionais." />
              <Step num={2} text="Antes de desativar, certifique-se de registrar e finalizar todas as apostas pendentes do perfil." />
              <Step num={3} text="Crie um novo perfil para substituir — adicione as novas casas nele e mantenha o histórico do anterior preservado no sistema." />
            </div>
            <Tip text="Perfis inativos continuam com todo o histórico preservado. Você pode reativá-los a qualquer momento se as contas voltarem a funcionar." />
          </div>
        ),
      },
    ],
  },
  {
    id: "banca",
    icon: Wallet,
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/20",
    title: "Gestão de banca",
    subtitle: "Como distribuir e proteger seu capital",
    items: [
      {
        title: "Como dividir a banca entre perfis",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Uma boa distribuição de banca reduz o risco e maximiza as oportunidades. Não coloque todo o capital em um único perfil ou casa.
            </p>
            <div className="space-y-2">
              <Step num={1} text="Defina um valor total disponível para operar. Esse é o seu 'capital de operação'." />
              <Step num={2} text="Distribua entre perfis de forma proporcional — perfis com mais casas ativas recebem mais capital." />
              <Step num={3} text="Reserve sempre 20% do capital fora das casas de apostas como reserva de emergência para novas oportunidades." />
            </div>
            <Tip text="Com saldo distribuído em várias casas simultaneamente, você consegue cobrir mais surebets sem esperar saques entre apostas." />
          </div>
        ),
      },
      {
        title: "Controlando depósitos e saques",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Use a aba Financeiro de cada perfil para registrar toda movimentação de capital. Isso mantém o saldo sempre preciso e facilita o controle de lucros reais.
            </p>
            <div className="space-y-2">
              <Step num={1} text="Registre cada depósito em uma casa como uma movimentação do tipo 'Depósito' na aba Financeiro." />
              <Step num={2} text="Ao sacar, registre como 'Saque'. O sistema ajusta o saldo automaticamente." />
              <Step num={3} text="Bônus recebidos de casas devem ser registrados como 'Bônus' — assim o lucro real não fica inflado." />
            </div>
            <Warn text="Nunca misture capital pessoal com capital de operação nos registros. Isso distorce o ROI e dificulta a análise de desempenho." />
          </div>
        ),
      },
    ],
  },
  {
    id: "crescimento",
    icon: TrendingUp,
    color: "text-[#f97316]",
    bg: "bg-[#f97316]/10 border-[#f97316]/20",
    title: "Crescendo a operação",
    subtitle: "Dicas para escalar seus resultados com mais perfis",
    items: [
      {
        title: "Como escalar sem aumentar o risco",
        content: (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Escalar a operação de surebet significa adicionar mais casas e perfis — não aumentar o valor apostado de forma irresponsável.
            </p>
            <div className="space-y-2">
              <Step num={1} text="Adicione um novo perfil/casa por vez. Teste durante 2 semanas antes de colocar capital alto." />
              <Step num={2} text="Acompanhe o ROI de cada perfil mensalmente. Desative perfis com ROI negativo recorrente." />
              <Step num={3} text="Reinvista parte do lucro mensal em novas contas — isso aumenta o capital total em operação sem tirar dinheiro do bolso." />
              <Step num={4} text="Documente as casas que funcionam melhor para o seu estilo de operação e priorize expandir nelas." />
            </div>
            <Tip text="O SurebetFlow permite gerenciar múltiplos perfis com ROI e lucro separados — use os relatórios para identificar quais perfis são mais rentáveis." />
          </div>
        ),
      },
      {
        title: "Sinais de alerta para ficar atento",
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              {[
                "Odds máximas reduzidas em certas modalidades — sinal de que a casa está te identificando.",
                "Apostas aceitas somente em valores baixos (R$ 5, R$ 10) mesmo com histórico de apostas maiores.",
                "Demora incomum para aceitar apostas (bet delay alto) em mercados que antes eram instantâneos.",
                "Solicitação de documentos sem motivo claro — pode preceder um bloqueio da conta.",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text-secondary)]">{text}</p>
                </div>
              ))}
            </div>
            <Tip text="Ao perceber qualquer sinal de limitação, saque o saldo imediatamente e abra uma nova conta em outra casa para substituir." />
          </div>
        ),
      },
    ],
  },
]

function TopicAccordion({ topic }: { topic: Topic }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[var(--bg-elevated)] transition-colors"
      >
        <span className="text-sm font-medium text-[var(--text-primary)]">{topic.title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 space-y-3">
          {topic.content}
        </div>
      )}
    </div>
  )
}

export default function DicasClient() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dicas</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Como encontrar novas parcerias e ter controle total dos seus perfis
        </p>
      </div>

      {/* Highlight card */}
      <div className="p-4 rounded-xl bg-[#1e3a8a]/10 border border-[#1e3a8a]/20 flex items-start gap-3">
        <Star className="w-5 h-5 text-[var(--accent-text)] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Operação profissional começa com organização</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Casas de apostas limitam contas lucrativas ao longo do tempo. Quem sobrevive no longo prazo é quem mantém múltiplos perfis ativos, controla cada centavo e sabe quando abrir novas parcerias.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map(section => {
          const Icon = section.icon
          const isOpen = activeSection === section.id
          return (
            <Card key={section.id} className="overflow-hidden">
              <button
                onClick={() => setActiveSection(isOpen ? null : section.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${section.bg}`}>
                  <Icon className={`w-4 h-4 ${section.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{section.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{section.subtitle}</p>
                </div>
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />}
              </button>

              {isOpen && (
                <CardContent className="p-4 pt-0 space-y-2">
                  <div className="h-px bg-[var(--border-subtle)] mb-3" />
                  {section.items.map(topic => (
                    <TopicAccordion key={topic.title} topic={topic} />
                  ))}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] pb-4">
        Tem alguma dúvida? Use o <span className="text-[var(--accent-text)] font-medium">SureBet AI</span> no menu lateral para obter ajuda personalizada.
      </p>
    </div>
  )
}
