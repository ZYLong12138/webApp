import { Card, CardContent } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string
  isLoading?: boolean
}

export function StatsCard({ title, value, isLoading = false }: StatsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
        {isLoading ? (
          <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <p className="text-xl font-semibold">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}
