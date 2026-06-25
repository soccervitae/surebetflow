import type { Metadata } from "next"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/ThemeProvider"
import CookieBanner from "@/components/CookieBanner"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["400","500","600","700"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400","500","700"] })

const BASE_URL = "https://www.surebetflow.bet"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SurebetFlow — Calculadora e Gerenciador de Surebet",
    template: "%s | SurebetFlow",
  },
  description:
    "A plataforma completa para apostadores de arbitragem esportiva. Calcule surebets 2-way e 3-way, gerencie perfis, controle finanças e acompanhe lucros garantidos com segurança total.",
  keywords: [
    "surebet",
    "arbitragem esportiva",
    "calculadora surebet",
    "apostas seguras",
    "lucro garantido",
    "gerenciador de apostas",
    "arbitragem",
    "surebet brasil",
    "calculadora arbitragem",
    "apostas esportivas",
  ],
  authors: [{ name: "SurebetFlow", url: BASE_URL }],
  creator: "SurebetFlow",
  publisher: "SurebetFlow",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: BASE_URL,
    siteName: "SurebetFlow",
    title: "SurebetFlow — Calculadora e Gerenciador de Surebet",
    description:
      "Calcule surebets, gerencie perfis de apostador, controle finanças e acompanhe lucros garantidos. Senhas criptografadas AES-256.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SurebetFlow — Calculadora e Gerenciador de Surebet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SurebetFlow — Calculadora e Gerenciador de Surebet",
    description:
      "Calcule surebets, gerencie perfis de apostador e acompanhe lucros garantidos com segurança total.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster />
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
