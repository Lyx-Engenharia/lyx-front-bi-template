"use server"

// ─── Stub de logout — Approach A (standalone) ────────────────────────────────
//
// Para integrar com Better Auth ou outro provedor:
//   Copie a implementação completa de lyx-bi-principal/src/app/login/actions.ts
//   e ajuste AUTH_API_URL e SESSION_COOKIE_NAMES conforme o seu projeto.

import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export async function logoutAction(): Promise<void> {
  // Limpa cookies de sessão conhecidos (Better Auth)
  const store = await cookies()
  const sessionCookies = [
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
  ]
  for (const name of sessionCookies) {
    store.set(name, "", { path: "/", maxAge: 0 })
  }

  redirect("/login")
}
