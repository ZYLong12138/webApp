import type React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string
  isLoading?: boolean
  description?: string // 添加可选的描述字段
  icon?: React.ReactNode // 添加可选的图标
}

export function StatsCard({ title, value, isLoading = false, description, icon }: StatsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
            {isLoading ? (
              <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <div>
                <p className="text-xl font-semibold">{value}</p>
                {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
              </div>
            )}
          </div>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
