import { requireUser } from "@/lib/auth"
import { AuthProvider } from "@/components/auth/auth-provider"
import { SidebarProvider } from "@/components/dashboard/sidebar-provider"
import { AppShell } from "@/components/dashboard/app-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <AuthProvider
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: Array.from(user.permissions),
      }}
    >
      <SidebarProvider>
        <AppShell>
          {children}
        </AppShell>
      </SidebarProvider>
    </AuthProvider>
  )
}
