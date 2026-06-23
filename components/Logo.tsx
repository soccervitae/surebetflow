"use client"

import Image from "next/image"
import { useTheme } from "@/components/ThemeProvider"

const LOGO_DARK  = "https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/surebetflow-horizontal-vazada-branca.png"
const LOGO_LIGHT = "https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/surebetflow-horizontal-vazada-navy.png"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

// Símbolo isolado (ícone) — mantido para uso pontual
export function LogoIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 28 : size === "lg" ? 48 : 36
  return (
    <svg width={px} height={px} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#1e3a8a"/>
      <path d="M7 9 L16 16 L7 23" stroke="#E8EDF4" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M25 9 L16 16 L25 23" stroke="#E8EDF4" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="16" cy="16" r="2.3" fill="#10B981"/>
    </svg>
  )
}

// Logo completa: adapta ao tema automaticamente
export default function Logo({ size = "md", showText = true }: LogoProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const logoH = size === "sm" ? 36 : size === "lg" ? 56 : 44
  const logoW = Math.round(logoH * (620 / 160))

  if (!showText) return <LogoIcon size={size} />

  return (
    <div className="select-none flex items-center">
      <Image
        src={isDark ? LOGO_DARK : LOGO_LIGHT}
        alt="SurebetFlow"
        width={logoW}
        height={logoH}
        priority
      />
    </div>
  )
}
