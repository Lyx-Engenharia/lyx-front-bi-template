"use client"

import { createContext, useContext, useMemo } from "react"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

interface AuthContextValue {
  user: AuthUser
  permissions: ReadonlySet<string>
  hasPermission(key: string): boolean
  hasRole(name: string): boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  const value = useMemo<AuthContextValue>(() => {
    const permissions = new Set(user.permissions)
    const isAdmin = permissions.has("*")
    return {
      user,
      permissions,
      hasPermission: (key) => isAdmin || permissions.has(key),
      hasRole: (name) => user.role === name,
    }
  }, [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  return ctx
}
