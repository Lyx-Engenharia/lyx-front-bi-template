import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function DashboardHeader({ title, description, children, className }: DashboardHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
