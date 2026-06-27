const BASE_URL = "https://www.surebetflow.bet"
const LOGO_URL = `${BASE_URL}/icons/logo-email.png`

export function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="dark"/>
</head>
<body style="margin:0;padding:0;background:#060d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#0d1829;border:1px solid #1e3a8a33;border-radius:20px;overflow:hidden;max-width:520px;width:100%;">

          <!-- Header com logo -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f1e40 0%,#1e3a8a 100%);padding:28px 36px;text-align:center;">
              <img src="${LOGO_URL}" alt="SurebetFlow" width="220" height="auto"
                   style="display:inline-block;max-width:220px;height:auto;border:0;"/>
            </td>
          </tr>

          <!-- Conteúdo -->
          <tr>
            <td style="padding:36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #1e3a8a22;text-align:center;">
              <p style="margin:0 0 6px;color:#475569;font-size:12px;">
                © ${new Date().getFullYear()} SurebetFlow ·
                <a href="${BASE_URL}" style="color:#7de8e8;text-decoration:none;">surebetflow.bet</a>
              </p>
              <p style="margin:0;color:#334155;font-size:11px;">
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
