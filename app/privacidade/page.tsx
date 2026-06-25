import Link from "next/link"
import { Shield } from "lucide-react"

export const metadata = { title: "Política de Privacidade — SurebetFlow" }

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-secondary)]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#1e3a8a]/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#5b7ec9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Política de Privacidade</h1>
            <p className="text-sm text-[var(--text-muted)]">Última atualização: junho de 2025</p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">1. Quem somos</h2>
            <p>
              A <strong className="text-[var(--text-primary)]">SurebetFlow</strong> é uma plataforma de gestão de apostas esportivas que permite ao usuário organizar perfis, acompanhar resultados e controlar o desempenho financeiro em casas de apostas. Nosso compromisso é com a transparência e a segurança dos seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">2. Dados que coletamos</h2>
            <ul className="space-y-2 list-disc list-inside text-[var(--text-secondary)]">
              <li><span className="text-[var(--text-primary)]">Dados de cadastro:</span> nome, sobrenome, e-mail e data de nascimento fornecidos no momento do registro.</li>
              <li><span className="text-[var(--text-primary)]">Dados de uso:</span> apostas registradas, perfis criados, movimentações financeiras inseridas pelo próprio usuário.</li>
              <li><span className="text-[var(--text-primary)]">Dados técnicos:</span> endereço IP, tipo de dispositivo e navegador, coletados automaticamente para fins de segurança e diagnóstico.</li>
              <li><span className="text-[var(--text-primary)]">Foto de perfil:</span> imagem enviada voluntariamente pelo usuário.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">3. Como usamos seus dados</h2>
            <ul className="space-y-2 list-disc list-inside text-[var(--text-secondary)]">
              <li>Autenticação e acesso seguro à plataforma.</li>
              <li>Personalização da experiência e exibição das informações corretas para cada conta.</li>
              <li>Comunicação sobre atualizações, manutenções e novidades do serviço.</li>
              <li>Suporte ao cliente, quando você entra em contato conosco.</li>
              <li>Análise agregada e anônima para melhoria contínua da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">4. Compartilhamento de dados</h2>
            <p className="text-[var(--text-secondary)]">
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Podemos compartilhar informações apenas com prestadores de serviço essenciais ao funcionamento da plataforma (como infraestrutura de banco de dados e autenticação), sempre sob acordos de confidencialidade e em conformidade com a LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">5. Armazenamento e segurança</h2>
            <p className="text-[var(--text-secondary)]">
              Seus dados são armazenados em servidores seguros com controle de acesso, criptografia em trânsito (HTTPS/TLS) e em repouso. Utilizamos autenticação robusta e políticas de acesso baseadas em funções (RLS) para garantir que cada usuário acesse somente os seus próprios dados.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">6. Seus direitos (LGPD)</h2>
            <p className="text-[var(--text-secondary)] mb-3">Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
            <ul className="space-y-2 list-disc list-inside text-[var(--text-secondary)]">
              <li>Confirmar a existência e acessar seus dados pessoais.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Solicitar a portabilidade dos seus dados.</li>
              <li>Revogar o consentimento dado, quando aplicável.</li>
            </ul>
            <p className="text-[var(--text-secondary)] mt-3">Para exercer esses direitos, entre em contato pelo suporte da plataforma.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">7. Cookies e rastreamento</h2>
            <p className="text-[var(--text-secondary)]">
              Utilizamos cookies estritamente necessários para manter sua sessão ativa e preferências de tema. Não utilizamos cookies de rastreamento ou publicidade de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">8. Retenção de dados</h2>
            <p className="text-[var(--text-secondary)]">
              Seus dados são mantidos enquanto sua conta estiver ativa. Após o cancelamento da conta, os dados poderão ser retidos por até 90 dias para fins de segurança e conformidade legal, sendo então eliminados definitivamente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">9. Alterações nesta política</h2>
            <p className="text-[var(--text-secondary)]">
              Esta política pode ser atualizada periodicamente. Notificaremos os usuários por e-mail ou aviso na plataforma em caso de alterações relevantes. O uso continuado da plataforma após a notificação implica aceite das novas condições.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">10. Contato</h2>
            <p className="text-[var(--text-secondary)]">
              Dúvidas sobre esta política podem ser enviadas pelo canal de suporte dentro da plataforma ou pelo e-mail <span className="text-[#5b7ec9]">surebetflow@gmail.com</span>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--text-secondary)] transition-colors">← Voltar ao início</Link>
          <Link href="/termos" className="hover:text-[var(--text-secondary)] transition-colors">Termos de Uso</Link>
        </div>
      </div>
    </div>
  )
}
