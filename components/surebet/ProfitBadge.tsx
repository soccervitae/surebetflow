interface Props {
  pct: number
}

export default function ProfitBadge({ pct }: Props) {
  const color =
    pct >= 2
      ? "bg-green-500/20 text-green-400 border-green-500/40"
      : pct >= 1
      ? "bg-green-600/15 text-green-500 border-green-600/30"
      : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md border text-sm font-bold font-mono tabular-nums ${color}`}
    >
      +{pct.toFixed(2)}%
    </span>
  )
}
