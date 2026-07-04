import { Card, CardContent } from "@/components/ui/card"

function SkeletonRow() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-[var(--bg-elevated)] rounded" />
              <div className="h-4 w-56 bg-[var(--bg-elevated)] rounded" />
              <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded" />
            </div>
            <div className="h-8 w-20 bg-[var(--bg-elevated)] rounded-md" />
          </div>
          <div className="h-3 w-40 bg-[var(--bg-elevated)] rounded" />
          <div className="flex gap-2">
            <div className="flex-1 h-20 bg-[var(--bg-elevated)] rounded-lg" />
            <div className="flex-1 h-20 bg-[var(--bg-elevated)] rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SurebetLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-7 w-36 bg-[var(--bg-elevated)] rounded animate-pulse" />
        <div className="h-4 w-64 bg-[var(--bg-elevated)] rounded animate-pulse" />
      </div>
      <div className="h-40 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}
