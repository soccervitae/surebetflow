"use client"

import { useEffect } from "react"

export default function ForceLight() {
  useEffect(() => {
    const html = document.documentElement
    const hadDark = html.classList.contains("dark")
    html.classList.remove("dark")
    return () => {
      if (hadDark) html.classList.add("dark")
    }
  }, [])

  return null
}
