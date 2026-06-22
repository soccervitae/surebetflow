import { Resend } from "resend"
import { getResendApiKey } from "./settings"

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationEmail(email: string, nome: string, code: string) {
  const apiKey = await getResendApiKey()
  const resend = new Resend(apiKey)

  return resend.emails.send({
    from: "SureBetFlow <no-reply@surebetflow.bet>",
    to: email,
    subject: `${code} é seu código de verificação — SureBetFlow`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
                  <tr>
                    <td style="background:#1e3a8a;padding:24px 32px;">
                      <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">SureBetFlow</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <p style="margin:0 0 8px;color:#fff;font-size:18px;font-weight:600;">Olá, ${nome}!</p>
                      <p style="margin:0 0 24px;color:#aaa;font-size:14px;line-height:1.6;">
                        Use o código abaixo para confirmar seu e-mail e ativar sua conta.
                      </p>
                      <div style="background:#0a0a0a;border:1px solid #333;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                        <p style="margin:0 0 4px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Seu código</p>
                        <p style="margin:0;color:#fff;font-size:40px;font-weight:800;letter-spacing:12px;">${code}</p>
                      </div>
                      <p style="margin:0 0 8px;color:#666;font-size:12px;">⏱ Este código expira em <strong style="color:#aaa;">15 minutos</strong>.</p>
                      <p style="margin:0;color:#666;font-size:12px;">Se você não criou uma conta no SureBetFlow, ignore este e-mail.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 32px;border-top:1px solid #222;">
                      <p style="margin:0;color:#555;font-size:11px;text-align:center;">© ${new Date().getFullYear()} SureBetFlow · surebetflow.bet</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  })
}
