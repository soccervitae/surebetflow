import { Resend } from "resend"
import { getResendApiKey } from "./settings"
import { emailWrapper } from "./email-template"

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationEmail(email: string, nome: string, code: string) {
  const apiKey = await getResendApiKey()
  const resend = new Resend(apiKey)
  return resend.emails.send({
    from: "SurebetFlow <naoresponda@surebetflow.bet>",
    to: email,
    subject: `${code} é seu código de verificação — SurebetFlow`,
    html: emailWrapper(`
      <p style="margin:0 0 6px;color:#0f172a;font-size:20px;font-weight:700;">Olá, ${nome}! 👋</p>
      <p style="margin:0 0 28px;color:#64748b;font-size:14px;line-height:1.7;">
        Use o código abaixo para confirmar seu e-mail e ativar sua conta no SurebetFlow.
      </p>

      <!-- Código -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:600;">Seu código de verificação</p>
        <p style="margin:0;color:#1e3a8a;font-size:44px;font-weight:800;letter-spacing:14px;font-family:monospace;">${code}</p>
      </div>

      <div style="background:#eff6ff;border-left:3px solid #1e3a8a;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:20px;">
        <p style="margin:0;color:#475569;font-size:13px;line-height:1.5;">
          ⏱ Este código expira em <strong style="color:#0f172a;">15 minutos</strong>.<br/>
          Se você não criou uma conta no SurebetFlow, ignore este e-mail com segurança.
        </p>
      </div>
    `),
  })
}
