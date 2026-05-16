import {
  BarChart3,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import type { DashboardConfig, DashboardCategory } from "@/types/dashboard"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dash(
  id: string,
  config: Omit<DashboardConfig, "id" | "route" | "requiredPermission">,
): DashboardConfig {
  return {
    id,
    route: `/dashboard/${id}`,
    requiredPermission: `dashboard:${id}`,
    ...config,
  }
}

// ─── Dashboards disponíveis ───────────────────────────────────────────────────
// Substitua estas entradas pelos dashboards reais do seu BI.

export const dashboards: DashboardConfig[] = [
  dash("visao-geral", {
    name: "Visão Geral",
    description: "Painel principal com indicadores consolidados",
    icon: BarChart3,
    color: "text-[#025864]",
    category: "operacional",
  }),
  dash("comercial", {
    name: "Comercial",
    description: "Performance de vendas e metas",
    icon: TrendingUp,
    color: "text-cyan-600",
    category: "comercial",
  }),
  dash("financeiro", {
    name: "Financeiro",
    description: "Receitas, despesas e fluxo de caixa",
    icon: DollarSign,
    color: "text-emerald-600",
    category: "financeiro",
  }),
]

// ─── Labels de categoria ──────────────────────────────────────────────────────

export const categoryLabels: Record<DashboardCategory, string> = {
  financeiro: "Financeiro",
  comercial: "Comercial",
  operacional: "Operacional",
  marketing: "Marketing",
}

// ─── Filtro por permissão ─────────────────────────────────────────────────────

export function filterDashboardsByPermissions(
  permissions: ReadonlySet<string> | readonly string[],
): DashboardConfig[] {
  const set = permissions instanceof Set ? permissions : new Set(permissions)
  if (set.has("*")) return dashboards
  return dashboards.filter((d) => set.has(d.requiredPermission))
}
