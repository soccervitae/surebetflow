"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = "SheetOverlay"

function BottomSheetSwipeWrapper({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  const startY = React.useRef(0)
  const ref = React.useRef<HTMLDivElement>(null)

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY
    if (ref.current) ref.current.style.transition = "none"
  }

  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - startY.current
    if (delta < 0) return
    if (ref.current) ref.current.style.transform = `translateY(${delta}px)`
  }

  function onTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - startY.current
    if (ref.current) {
      ref.current.style.transition = "transform 0.2s ease"
      if (delta >= 72) {
        ref.current.style.transform = "translateY(100%)"
        setTimeout(onClose, 180)
      } else {
        ref.current.style.transform = "translateY(0)"
      }
    }
  }

  return (
    <div
      ref={ref}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="contents"
    >
      {children}
    </div>
  )
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: "bottom" | "top" | "left" | "right" }
>(({ className, children, side = "bottom", ...props }, ref) => {
  const closeRef = React.useRef<HTMLButtonElement>(null)

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 bg-[var(--bg-surface)] shadow-xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out",
          side === "bottom" && "inset-x-0 bottom-0 rounded-t-2xl border-t border-[var(--border)] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          side === "top" && "inset-x-0 top-0 rounded-b-2xl border-b border-[var(--border)] data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          className
        )}
        {...props}
      >
        {side === "bottom" ? (
          <BottomSheetSwipeWrapper onClose={() => closeRef.current?.click()}>
            {/* Drag handle */}
            <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-[var(--border)]" />
            {children}
          </BottomSheetSwipeWrapper>
        ) : (
          <>
            <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-[var(--border)]" />
            {children}
          </>
        )}
        <DialogPrimitive.Close
          ref={closeRef}
          className="absolute right-4 top-4 rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  )
})
SheetContent.displayName = "SheetContent"

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1 px-4 pb-2", className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-base font-semibold text-[var(--text-primary)]", className)} {...props} />
))
SheetTitle.displayName = "SheetTitle"

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse gap-2 px-4 pb-6 pt-2 sm:flex-row sm:justify-end", className)} {...props} />
)
SheetFooter.displayName = "SheetFooter"

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetFooter }
