"use client"

import { useRef, useCallback } from "react"

export function useSwipeToDismiss(onDismiss: () => void, threshold = 72) {
  const startY = useRef(0)
  const currentY = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    currentY.current = 0
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none"
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startY.current
    if (delta < 0) return // só permite arrastar para baixo
    currentY.current = delta
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 0.2s ease"
      if (currentY.current >= threshold) {
        sheetRef.current.style.transform = `translateY(100%)`
        setTimeout(onDismiss, 180)
      } else {
        sheetRef.current.style.transform = "translateY(0)"
      }
    }
  }, [onDismiss, threshold])

  return { sheetRef, onTouchStart, onTouchMove, onTouchEnd }
}
