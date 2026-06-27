const BASE_URL = "https://www.surebetflow.bet"
const LOGO_URL = `${BASE_URL}/icons/logo-email-light.png`

export function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;max-width:520px;width:100%;">

          <!-- Header com logo -->
          <tr>
            <td style="background:#ffffff;padding:28px 36px;text-align:center;border-bottom:1px solid #e2e8f0;">
              <img src="${LOGO_URL}" alt="SurebetFlow" width="220" height="auto"
                   style="display:inline-block;max-width:220px;height:auto;border:0;"/>
            </td>
          </tr>

          <!-- Conteúdo -->
          <tr>
            <td style="padding:36px;background:#ffffff;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #e2e8f0;text-align:center;background:#f8fafc;">
              <p style="margin:0 0 6px;color:#64748b;font-size:12px;">
                © ${new Date().getFullYear()} SurebetFlow ·
                <a href="${BASE_URL}" style="color:#1e3a8a;text-decoration:none;">surebetflow.bet</a>
              </p>
              <p style="margin:0;color:#94a3b8;font-size:11px;">
                Você está recebendo este e-mail porque possui uma conta no SurebetFlow.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
