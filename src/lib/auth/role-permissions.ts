import { dashboards } from "@/lib/dashboards"

const ALL_DASHBOARDS = dashboards.map((d) => d.requiredPermission)

// ─── Mapeamento de papel → permissões ─────────────────────────────────────────
// Adapte os papéis conforme a estrutura do seu projeto (Better Auth, Clerk, etc.).

export const BI_ROLE_PERMISSIONS: Record<string, ReadonlyArray<string>> = {
  bi_admin: ["*"],
  bi_diretor: ALL_DASHBOARDS,
  bi_gerente: ALL_DASHBOARDS,
  bi_analista: ALL_DASHBOARDS,
  bi_financeiro: ALL_DASHBOARDS,
  bi_marketing: ALL_DASHBOARDS,
  // Papéis do core da organização
  owner: ["*"],
  admin: ["*"],
  member: ALL_DASHBOARDS,
}

export function permissionsForRole(role: string): ReadonlyArray<string> {
  return BI_ROLE_PERMISSIONS[role] ?? []
}

export function hasPermission(perms: ReadonlySet<string>, key: string): boolean {
  return perms.has("*") || perms.has(key)
}

export function hasAnyPermission(
  perms: ReadonlySet<string>,
  keys: ReadonlyArray<string>,
): boolean {
  if (perms.has("*")) return true
  return keys.some((k) => perms.has(k))
}
