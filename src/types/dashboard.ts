import { type LucideIcon } from "lucide-react"

export interface DashboardConfig {
  id: string
  name: string
  description: string
  route: string
  icon: LucideIcon
  color: string
  category: DashboardCategory
  requiredPermission: string
}

export type DashboardCategory = "financeiro" | "comercial" | "operacional" | "marketing"

export interface KPIData {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: LucideIcon
}

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T & string
  label: string
  align?: "left" | "center" | "right"
  format?: (value: unknown) => string
}

export interface FilterOption {
  value: string
  label: string
}
