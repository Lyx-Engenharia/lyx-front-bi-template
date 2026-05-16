"use client"

import { createContext, useContext, useState, useCallback } from "react"

interface SidebarContextType {
  collapsed: boolean
  toggle: () => void
}

export const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
})

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false)
  const toggle = useCallback(() => setCollapsed((prev) => !prev), [])
  return { collapsed, toggle }
}

export function useSidebar() {
  return useContext(SidebarContext)
}
