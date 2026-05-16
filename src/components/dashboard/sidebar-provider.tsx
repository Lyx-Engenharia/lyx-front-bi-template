"use client"

import { SidebarContext, useSidebarState } from "@/hooks/use-sidebar"

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const sidebar = useSidebarState()

  return (
    <SidebarContext.Provider value={sidebar}>
      {children}
    </SidebarContext.Provider>
  )
}
