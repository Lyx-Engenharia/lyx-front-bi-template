"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Placeholder BI dashboard ──────────────────────────────────
// Substitua os mocks por hooks de `lib/queries.ts` que consultam
// suas views/tabelas no Supabase self-host.
// ───────────────────────────────────────────────────────────────

const PERIODOS = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "ytd", label: "No ano (YTD)" },
];

const tooltipStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  fontSize: "0.8rem",
};

const mockSerie = [
  { mes: "Jan", valor: 4200 },
  { mes: "Fev", valor: 5100 },
  { mes: "Mar", valor: 6300 },
  { mes: "Abr", valor: 5800 },
  { mes: "Mai", valor: 7200 },
  { mes: "Jun", valor: 8100 },
];

const mockCategoria = [
  { nome: "Produto A", valor: 35 },
  { nome: "Produto B", valor: 28 },
  { nome: "Produto C", valor: 22 },
  { nome: "Produto D", valor: 15 },
];

const mockRanking = [
  { nome: "Cliente X", valor: 124000 },
  { nome: "Cliente Y", valor: 98500 },
  { nome: "Cliente Z", valor: 87200 },
  { nome: "Cliente W", valor: 65300 },
  { nome: "Cliente V", valor: 54100 },
];

const CHART_COLORS = [
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--text-muted)",
];

export default function BIDashboard() {
  const [periodo, setPeriodo] = useState("30d");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
          Período:
        </span>
        <select
          className="form-select"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          style={{ width: "auto", minWidth: 180 }}
        >
          {PERIODOS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <button className="btn btn-secondary btn-sm">📅 Personalizado</button>
      </div>

      <div className="card-grid card-grid-4">
        <KpiCard destaque label="Receita Total" value="R$ 1.2M" delta="+12.4%" sub="vs período anterior" />
        <KpiCard label="Ticket Médio" value="R$ 8.4k" delta="+5.1%" />
        <KpiCard label="Conversão" value="3.8%" delta="-0.2%" deltaNegative />
        <KpiCard label="Novos Clientes" value="142" delta="+18%" />
      </div>

      <div className="card-grid card-grid-2">
        <ChartCard title="Evolução de Receita" subtitle="Últimos 6 meses">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mockSerie}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="valor" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição por Categoria" subtitle={periodo}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={mockCategoria} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={90} label>
                {mockCategoria.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card-grid card-grid-2">
        <ChartCard title="Tendência Mensal" subtitle="Linha temporal">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mockSerie}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="valor" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Clientes" subtitle="Por receita acumulada">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockRanking} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
              <YAxis dataKey="nome" type="category" stroke="var(--text-muted)" fontSize={11} width={80} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="valor" fill="var(--accent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="lyx-card">
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Detalhamento</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
            Tabela analítica — substitua pela query do Supabase
          </p>
        </div>
        <table className="lyx-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th style={{ textAlign: "right" }}>Receita</th>
              <th style={{ textAlign: "right" }}>Pedidos</th>
              <th style={{ textAlign: "right" }}>Ticket Médio</th>
            </tr>
          </thead>
          <tbody>
            {mockRanking.map((r) => (
              <tr key={r.nome}>
                <td style={{ fontWeight: 600 }}>{r.nome}</td>
                <td style={{ textAlign: "right" }}>R$ {r.valor.toLocaleString("pt-BR")}</td>
                <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{Math.round(r.valor / 8400)}</td>
                <td style={{ textAlign: "right", color: "var(--text-muted)" }}>R$ 8.4k</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  sub,
  destaque,
  deltaNegative,
}: {
  label: string;
  value: string;
  delta?: string;
  sub?: string;
  destaque?: boolean;
  deltaNegative?: boolean;
}) {
  if (destaque) {
    return (
      <div className="stat-card" style={{ background: "var(--accent)", color: "#fff", border: "none", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -32, bottom: -32, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", right: -16, top: -16, width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 600, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>{value}</div>
          {delta && <div style={{ fontSize: "0.78rem", fontWeight: 600 }}>{delta} <span style={{ opacity: 0.7 }}>{sub}</span></div>}
        </div>
      </div>
    );
  }
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <div className="stat-value">{value}</div>
      {delta && (
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: deltaNegative ? "var(--danger)" : "var(--success)" }}>
          {delta} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{sub}</span>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="lyx-card">
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
