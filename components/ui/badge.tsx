import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#1e3a8a]/10 text-[var(--accent-text)]",
        secondary: "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
        destructive: "bg-[#DC2626]/10 text-[#DC2626]",
        outline: "border border-[var(--border)] text-[var(--text-secondary)]",
        blue: "bg-[#2563EB]/10 text-[#2563EB]",
        yellow: "bg-yellow-500/15 text-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
