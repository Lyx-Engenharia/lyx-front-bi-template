// ─── Stub de autenticação — Approach A (standalone, sem sessão compartilhada) ──
//
// Este módulo expõe a mesma API de `lyx-bi-principal/src/lib/auth/current-user`
// mas retorna um usuário mock para desenvolvimento.
//
// Para conectar ao seu provedor real (Better Auth, Clerk, NextAuth, etc.):
//   1. Substitua `getMockUser()` pela leitura real de sessão.
//   2. Mapeie o papel/role para permissões usando `permissionsForRole` de role-permissions.ts.
//   3. Se usar Better Auth: copie `session.ts` do lyx-bi-principal e ajuste AUTH_API_URL.
//
// A assinatura de `requireUser()` é intencionalmente idêntica ao projeto principal
// para que os componentes de sidebar e layouts não precisem de ajuste.

import { redirect } from "next/navigation"
import { permissionsForRole } from "./role-permissions"

export interface UserWithAccess {
  id: string
  email: string
  name: string
  role: string
  organizationId: string
  permissions: ReadonlySet<string>
}

// ─── Mock user ────────────────────────────────────────────────────────────────
// Substitua por leitura real de sessão em produção.

function getMockUser(): UserWithAccess {
  const role = "bi_admin"
  return {
    id: "dev-local",
    email: "dev@local",
    name: "Dev Local",
    role,
    organizationId: "org-local",
    permissions: new Set(permissionsForRole(role)),
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<UserWithAccess | null> {
  // TODO: substituir pelo provedor real
  return getMockUser()
}

export async function requireUser(): Promise<UserWithAccess> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function requirePermission(key: string): Promise<UserWithAccess> {
  const user = await requireUser()
  const { hasPermission } = await import("./role-permissions")
  if (!hasPermission(user.permissions, key)) redirect("/forbidden")
  return user
}

export async function requireAnyPermission(
  keys: ReadonlyArray<string>,
): Promise<UserWithAccess> {
  const user = await requireUser()
  const { hasAnyPermission } = await import("./role-permissions")
  if (!hasAnyPermission(user.permissions, keys)) redirect("/forbidden")
  return user
}
