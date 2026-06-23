"use client"

import { useTheme } from "@/components/ThemeProvider"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

// Símbolo isolado (ícone)
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

// Logo completa: ícone + wordmark, adapta cor ao tema
export default function Logo({ size = "md", showText = true }: LogoProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const textColor = isDark ? "#E8EDF4" : "#1e3a8a"
  const fontSize = size === "sm" ? 14 : size === "lg" ? 22 : 17
  const iconPx = size === "sm" ? 24 : size === "lg" ? 40 : 32

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
