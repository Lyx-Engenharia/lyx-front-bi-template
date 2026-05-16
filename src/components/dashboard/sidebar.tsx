"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { filterDashboardsByPermissions, categoryLabels } from "@/lib/dashboards"
import { useAuth } from "@/components/auth/auth-provider"
import { logoutAction } from "@/app/login/actions"
import type { DashboardCategory } from "@/types/dashboard"
import {
  LayoutDashboard,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const categories: DashboardCategory[] = ["financeiro", "comercial", "operacional", "marketing"]

interface NavItemProps {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  collapsed: boolean
}

function NavItem({ href, label, icon: Icon, active, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center rounded-lg text-[13px] font-medium transition-colors",
        collapsed ? "justify-center py-2.5" : "gap-2.5 px-2.5 py-2",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-[17px] w-[17px] shrink-0 transition-colors",
          active
            ? "text-sidebar-accent-foreground"
            : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, permissions } = useAuth()
  const visibleDashboards = filterDashboardsByPermissions(permissions)
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "transition-[width] duration-200 ease-out will-change-[width] motion-reduce:transition-none",
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-sm",
          collapsed ? "w-[72px]" : "w-[220px]",
          "lg:relative lg:z-auto",
          "overflow-visible"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center border-b border-sidebar-border",
            collapsed ? "px-2 py-4" : "px-4 py-5"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center leading-tight",
              collapsed ? "justify-center" : "gap-3"
            )}
          >
            <Image
              src="/lyx-logo.png"
              alt="Lyx"
              width={70}
              height={80}
              priority
              className={cn("w-auto object-contain", collapsed ? "h-12" : "h-10")}
            />
            {!collapsed && (
              <span className="text-[16px] font-bold tracking-tight text-foreground">
                Dashboard
              </span>
            )}
          </Link>
        </div>

        <button
          onClick={onToggle}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          style={{ right: "-12px", top: "20px" }}
          className={cn(
            "absolute z-10",
            "flex h-10 w-6 items-center justify-center rounded-full transition-all duration-200",
            "border border-sidebar-border bg-sidebar text-sidebar-foreground",
            "hover:border-primary/50 hover:bg-sidebar-accent hover:text-black",
            "shadow-sm cursor-pointer"
          )}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>

        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3">
          {!collapsed && (
            <p className="mb-2 mt-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/70">
              Geral
            </p>
          )}
          {collapsed && <div className="mx-auto my-3 h-px w-6 bg-sidebar-border" />}

          <div className="space-y-0.5">
            <NavItem
              href="/dashboard"
              label="Painel Geral"
              icon={LayoutDashboard}
              active={pathname === "/dashboard"}
              collapsed={collapsed}
            />
          </div>

          {categories.map((cat) => {
            const items = visibleDashboards.filter((d) => d.category === cat)
            if (items.length === 0) return null

            return (
              <div key={cat} className="mt-5">
                {!collapsed && (
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/70">
                    {categoryLabels[cat]}
                  </p>
                )}
                {collapsed && <div className="mx-auto my-3 h-px w-6 bg-sidebar-border" />}

                <div className="space-y-0.5">
                  {items.map((dash) => (
                    <NavItem
                      key={dash.id}
                      href={dash.route}
                      label={dash.name}
                      icon={dash.icon}
                      active={pathname === dash.route}
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-2.5 py-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#025864] to-[#065763] text-[10px] font-bold text-white">
                  {initials || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-foreground">{user.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </form>
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="text-[10px] font-medium text-sidebar-foreground/60">
                  © {new Date().getFullYear()} BI Hub
                </span>
                <span className="inline-flex h-5 items-center rounded-full bg-primary/10 px-2 text-[9px] font-bold uppercase tracking-wider text-black">
                  v1.0
                </span>
              </div>
            </div>
          ) : (
            <form action={logoutAction} className="flex justify-center">
              <button
                type="submit"
                title="Sair"
                aria-label="Sair"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </aside>
    </>
  )
}
