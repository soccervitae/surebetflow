import { SearchX } from "lucide-react"

interface Props {
  filtered?: boolean
}

export default function EmptyState({ filtered }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <SearchX className="h-12 w-12 text-[var(--text-muted)] mb-4" />
      <p className="text-base font-semibold text-[var(--text-primary)] mb-1">
        {filtered ? "Nenhuma surebet encontrada" : "Nenhuma surebet ativa no momento"}
      </p>
      <p className="text-sm text-[var(--text-secondary)] max-w-xs">
        {filtered
          ? "Ajuste os filtros para ver mais oportunidades."
          : "As oportunidades de arbitragem aparecerão aqui assim que forem detectadas."}
      </p>
    </div>
  )
}
