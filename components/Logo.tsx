"use client"

import Image from "next/image"
import { useTheme } from "@/components/ThemeProvider"

const LOGO_DARK = "https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/surebetflow-horizontal-vazada-branca.png"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

// Símbolo isolado (ícone) — sempre o mesmo em ambos os temas
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

// Logo completa: dark mode usa wordmark neon, light mode usa ícone + texto navy
export default function Logo({ size = "md", showText = true }: LogoProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const logoH = size === "sm" ? 28 : size === "lg" ? 44 : 34
  const logoW = Math.round(logoH * (620 / 160))

  const textColor = "#1e3a8a"
  const fontSize = size === "sm" ? 14 : size === "lg" ? 22 : 17
  const iconPx = size === "sm" ? 24 : size === "lg" ? 40 : 32

  if (isDark && showText) {
    return (
      <div className="select-none flex items-center">
        <Image
          src={LOGO_DARK}
          alt="SurebetFlow"
          width={logoW}
          height={logoH}
          priority
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={iconPx} height={iconPx} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="7" fill="#1e3a8a"/>
        <path d="M7 9 L16 16 L7 23" stroke="#E8EDF4" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M25 9 L16 16 L25 23" stroke="#E8EDF4" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="16" cy="16" r="2.3" fill="#10B981"/>
      </svg>
      {showText && (
        <span
          style={{ color: textColor, fontSize, fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "var(--font-display, var(--font-inter))" }}
        >
          SurebetFlow
        </span>
      )}
    </div>
  )
}
