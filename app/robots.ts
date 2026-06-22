import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/cadastro"],
        disallow: ["/dashboard", "/perfis", "/apostas", "/financeiro", "/admin", "/configuracoes", "/assinatura", "/onboarding"],
      },
    ],
    sitemap: "https://www.surebetflow.bet/sitemap.xml",
  }
}
