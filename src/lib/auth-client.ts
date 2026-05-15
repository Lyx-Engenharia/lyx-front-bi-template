import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

// BI usa Better Auth do monolith só para login/sessão.
// Dados de BI vêm do Supabase self-host (lib/supabase.ts).
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3000",
  plugins: [organizationClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Checa se user é membro da org `bi`
export async function isMembroBI(): Promise<boolean> {
  const { data: orgs } = await authClient.organization.list();
  return orgs?.some((o) => o.slug === "bi") ?? false;
}
