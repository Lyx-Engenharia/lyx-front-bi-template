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
import { TrendingUp, Users, Percent, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

/* Cores semânticas — alinhado com lyx-bi-principal */
const PRIMARY_COLOR = "#065763";
const PRIMARY_LIGHT = "#0a8295";
const PRIMARY_MUTED = "#2fa8b8";

const PIE_COLORS = [PRIMARY_COLOR, PRIMARY_LIGHT, PRIMARY_MUTED, "#7ecfdb"];

const TOOLTIP_STYLE = {
  background: "var(--color-card, #ffffff)",
  border: "1px solid var(--color-border, #e2e8ec)",
  borderRadius: 8,
  color: "var(--color-foreground, #0b1f24)",
  fontSize: "0.8rem",
};

const GRID_STROKE = "var(--color-border, #e2e8ec)";
const AXIS_TICK = { fill: "var(--color-muted-foreground, #55707a)", fontSize: 12 };
const AXIS_LINE = { stroke: "var(--color-border, #e2e8ec)" };

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

const kpiCards = [
  {
    label: "Receita Total",
    value: "R$ 1.2M",
    delta: "+12,4%",
    sub: "vs período anterior",
    icon: DollarSign,
  },
  {
    label: "Ticket Médio",
    value: "R$ 8.4k",
    delta: "+5,1%",
    sub: "vs período anterior",
    icon: TrendingUp,
  },
  {
    label: "Conversão",
    value: "3,8%",
    delta: "-0,2%",
    sub: "vs período anterior",
    icon: Percent,
    deltaNegative: true,
  },
  {
    label: "Novos Clientes",
    value: "142",
    delta: "+18%",
    sub: "vs período anterior",
    icon: Users,
  },
];

export default function BIDashboard() {
  const [periodo, setPeriodo] = useState("30d");

  return (
    <div className="space-y-6">
      {/* Cabeçalho com filtro de período */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral de indicadores</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Período:
          </span>
          <select
            className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          >
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI cards — 4 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, delta, sub, icon: Icon, deltaNegative }) => (
          <Card
            key={label}
            className="group transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
                {delta && (
                  <p
                    className={`text-xs font-medium mt-1 ${
                      deltaNegative ? "text-destructive" : "text-primary"
                    }`}
                  >
                    {delta}{" "}
                    <span className="text-muted-foreground font-normal">{sub}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos — linha superior */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evolução de Receita — AreaChart */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Evolução de Receita
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={mockSerie}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY_COLOR} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={PRIMARY_COLOR} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="mes" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="valor"
                  name="Receita"
                  stroke={PRIMARY_COLOR}
                  fill="url(#gradReceita)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: PRIMARY_COLOR, strokeWidth: 2, stroke: "var(--color-card, #ffffff)" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Categoria — PieChart */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Distribuição por Categoria
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {PERIODOS.find((p) => p.value === periodo)?.label ?? periodo}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={mockCategoria}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  strokeWidth={2}
                  stroke="var(--color-card, #ffffff)"
                >
                  {mockCategoria.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos — linha inferior */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tendência Mensal — LineChart */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Tendência Mensal
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Linha temporal</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mockSerie}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="mes" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="valor"
                  name="Valor"
                  stroke={PRIMARY_COLOR}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: PRIMARY_COLOR, strokeWidth: 2, stroke: "var(--color-card, #ffffff)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Clientes — BarChart horizontal */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Top Clientes
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Por receita acumulada</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockRanking} layout="vertical" barCategoryGap={8}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
                <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
                <YAxis
                  dataKey="nome"
                  type="category"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="valor" name="Receita" fill={PRIMARY_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela analítica */}
      <Card className="transition-shadow duration-200 hover:shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Detalhamento
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Tabela analítica — substitua pela query do Supabase
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Receita
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pedidos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ticket Médio
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockRanking.map((r) => (
                  <tr
                    key={r.nome}
                    className="border-b border-border/60 transition-colors hover:bg-muted/30 last:border-0"
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{r.nome}</td>
                    <td className="px-4 py-3 text-sm text-right text-foreground">
                      R$ {r.valor.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                      {Math.round(r.valor / 8400)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">R$ 8,4k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
