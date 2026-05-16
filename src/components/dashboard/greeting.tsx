"use client"

import { useSyncExternalStore } from "react"

function pickGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom dia"
  if (hour >= 12 && hour < 18) return "Boa tarde"
  return "Boa noite"
}

const subscribe = () => () => {}
const getClientSnapshot = (): string => pickGreeting(new Date().getHours())
const getServerSnapshot = (): string | null => null

interface GreetingProps {
  name: string
  className?: string
}

export function Greeting({ name, className }: GreetingProps) {
  const firstName = name.split(/\s+/)[0] || name
  const salutation = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)

  return (
    <h1 className={className}>
      {salutation ? `${salutation}, ${firstName}` : `Olá, ${firstName}`}
    </h1>
  )
}
