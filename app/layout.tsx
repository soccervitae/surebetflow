import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/ThemeProvider"
import CookieBanner from "@/components/CookieBanner"
import PWAProvider from "@/components/PWAProvider"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["400","500","600","700"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400","500","700"] })

const BASE_URL = "https://www.surebetflow.bet"

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#1e3a8a" },
    { media: "(prefers-color-scheme: light)", color: "#1e3a8a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

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
  manifest: "/manifest.json",
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
  icons: {
    icon: [
      { url: "https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/surebetflow-icone-app.png", sizes: "any", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png",  sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/surebetflow-icone-app.png", sizes: "180x180", type: "image/png" },
    ],
  },
  alternates: {
    canonical: BASE_URL,
  },
  appleWebApp: {
    capable: true,
    title: "SurebetFlow",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#1e3a8a",
    "msapplication-TileImage": "/icons/icon-144x144.png",
    "msapplication-config": "none",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* iOS PWA Splash Screens */}
        <link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" href="/splash/splash-640x1136.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/splash/splash-750x1334.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" href="/splash/splash-1242x2208.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/splash/splash-828x1792.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" href="/splash/splash-1242x2688.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/splash/splash-1125x2436.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/splash/splash-1170x2532.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/splash/splash-1179x2556.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" href="/splash/splash-1284x2778.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/splash/splash-1290x2796.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" href="/splash/splash-1536x2048.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" href="/splash/splash-1668x2388.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" href="/splash/splash-2048x2732.png" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster />
          <CookieBanner />
          <PWAProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}
