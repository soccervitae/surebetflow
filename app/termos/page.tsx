import Link from "next/link"
import { FileText } from "lucide-react"

export const metadata = { title: "Termos de Uso — SurebetFlow" }

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-gray-300">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#1e3a8a]/20 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#5b7ec9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Termos de Uso</h1>
            <p className="text-sm text-gray-500">Última atualização: junho de 2025</p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Aceitação dos termos</h2>
            <p className="text-gray-400">
              Ao criar uma conta e utilizar a <strong className="text-white">SurebetFlow</strong>, você declara que leu, compreendeu e concorda com estes Termos de Uso. Caso não concorde com alguma condição, não utilize a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. Descrição do serviço</h2>
            <p className="text-gray-400">
              A SurebetFlow é uma plataforma de <strong className="text-white">gestão e organização de apostas esportivas</strong>. O serviço permite registrar perfis em casas de apostas, controlar movimentações financeiras, acompanhar resultados e visualizar estatísticas de desempenho. A plataforma é uma ferramenta de organização pessoal e não realiza apostas em nome do usuário.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Elegibilidade</h2>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>Você deve ter pelo menos 18 anos de idade para usar a plataforma.</li>
              <li>O uso da plataforma deve ser compatível com as leis do seu país ou região.</li>
              <li>Cada usuário pode manter apenas uma conta ativa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Cadastro e segurança da conta</h2>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>Você é responsável por manter a confidencialidade das suas credenciais de acesso.</li>
              <li>Notifique imediatamente o suporte caso suspeite de acesso não autorizado à sua conta.</li>
              <li>Informações falsas no cadastro podem resultar no cancelamento da conta.</li>
              <li>É proibida a transferência ou compartilhamento da sua conta com terceiros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Uso aceitável</h2>
            <p className="text-gray-400 mb-3">É <strong className="text-white">proibido</strong> utilizar a plataforma para:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>Atividades ilegais ou que violem leis brasileiras ou internacionais.</li>
              <li>Tentativas de acesso não autorizado a sistemas, dados de outros usuários ou à infraestrutura da plataforma.</li>
              <li>Engenharia reversa, scraping automatizado ou qualquer forma de extração massiva de dados.</li>
              <li>Compartilhar conteúdo falso, difamatório ou que infrinja direitos de terceiros.</li>
              <li>Criar contas com identidade falsa ou em nome de terceiros sem autorização.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Planos e pagamentos</h2>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>A SurebetFlow oferece planos pagos com funcionalidades distintas, descritos na página de assinatura.</li>
              <li>Os valores podem ser atualizados, com aviso prévio de pelo menos 30 dias aos usuários ativos.</li>
              <li>Pagamentos são processados por plataformas de terceiros e estão sujeitos aos termos desses provedores.</li>
              <li>Não há reembolso proporcional por cancelamento antecipado de planos mensais, salvo obrigação legal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Responsabilidade e isenções</h2>
            <p className="text-gray-400 mb-3">
              A SurebetFlow é uma ferramenta de organização. Não somos responsáveis por:
            </p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>Resultados financeiros decorrentes de apostas realizadas pelo usuário em casas de apostas.</li>
              <li>Decisões tomadas com base nas informações exibidas na plataforma.</li>
              <li>Indisponibilidade temporária do serviço por manutenção, falhas técnicas ou casos de força maior.</li>
              <li>Perda de dados causada por ação do próprio usuário.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Propriedade intelectual</h2>
            <p className="text-gray-400">
              Todo o conteúdo da plataforma — incluindo marca, logotipo, interface, textos e código — é de propriedade exclusiva da SurebetFlow e protegido por leis de propriedade intelectual. É proibida a reprodução, distribuição ou uso comercial sem autorização prévia e por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Suspensão e cancelamento</h2>
            <p className="text-gray-400">
              Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, sem aviso prévio em casos graves. O usuário pode cancelar sua conta a qualquer momento pelo canal de suporte. Após o cancelamento, os dados serão tratados conforme nossa Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">10. Modificações dos termos</h2>
            <p className="text-gray-400">
              Podemos atualizar estes Termos de Uso a qualquer momento. Alterações relevantes serão comunicadas por e-mail ou notificação na plataforma com pelo menos 15 dias de antecedência. O uso continuado após o prazo implica aceite das novas condições.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">11. Lei aplicável e foro</h2>
            <p className="text-gray-400">
              Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir eventuais conflitos, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">12. Contato</h2>
            <p className="text-gray-400">
              Dúvidas sobre estes termos podem ser enviadas pelo canal de suporte dentro da plataforma ou pelo e-mail <span className="text-[#5b7ec9]">surebetflow@gmail.com</span>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap gap-4 text-xs text-gray-600">
          <Link href="/" className="hover:text-gray-400 transition-colors">← Voltar ao início</Link>
          <Link href="/privacidade" className="hover:text-gray-400 transition-colors">Política de Privacidade</Link>
        </div>
      </div>
    </div>
  )
}
