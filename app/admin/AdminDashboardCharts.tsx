"use client"

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

type ChartPoint = { mes: string; usuarios: number; mrr: number }

function formatBRL(v: number) {
  return `R$ ${v.toLocaleString("pt-BR")}`
}

export default function AdminDashboardCharts({ data }: { data: ChartPoint[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Novos usuários por mês */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-sm font-semibold text-white mb-1">Novos Usuários / Mês</p>
        <p className="text-xs text-gray-500 mb-4">Cadastros por mês nos últimos 12 meses</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="mes" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#fff", fontSize: 11 }}
              itemStyle={{ color: "#60a5fa", fontSize: 11 }}
              formatter={(v: number) => [v, "usuários"]}
            />
            <Bar dataKey="usuarios" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* MRR acumulado */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-sm font-semibold text-white mb-1">MRR Acumulado</p>
        <p className="text-xs text-gray-500 mb-4">Receita mensal recorrente ao longo do tempo</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 0, right: 4, left: -4, bottom: 0 }}>
            <defs>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="mes" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#fff", fontSize: 11 }}
              itemStyle={{ color: "#22c55e", fontSize: 11 }}
              formatter={(v: number) => [formatBRL(v), "MRR"]}
            />
            <Area type="monotone" dataKey="mrr" stroke="#22c55e" strokeWidth={2} fill="url(#mrrGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
