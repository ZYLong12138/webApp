"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, Star, Trophy } from "lucide-react"

// Define the props interface for the UserForm component
interface UserFormProps {
  userData: {
    email: string
    name?: string
    avatarUrl?: string
    isMember?: boolean
    currentBook?: {
      id: string
      title: string
      wordCount: number
    }
    streakDays?: number
    joinDate?: string
  }
}

export function UserForm({ userData }: UserFormProps) {
  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // 使用默认值，以防某些属性不存在
  const {
    name = userData.email?.split("@")[0] || "用户",
    avatarUrl,
    isMember = false,
    currentBook,
    streakDays = 0,
    joinDate = new Date().toLocaleDateString("zh-CN"),
  } = userData

  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-bold text-center">{name}</CardTitle>
          <div className="mt-2 text-sm text-gray-500">{userData.email}</div>
          <div className="mt-2">
            {isMember ? (
              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                <Star className="h-3 w-3 mr-1" />
                会员用户
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500 border-gray-300">
                普通用户
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* User Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 flex flex-col items-center">
            <div className="flex items-center text-blue-600 mb-1">
              <Trophy className="h-5 w-5 mr-1" />
              <span className="font-medium">连续打卡</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{streakDays} 天</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 flex flex-col items-center">
            <div className="flex items-center text-green-600 mb-1">
              <Calendar className="h-5 w-5 mr-1" />
              <span className="font-medium">加入时间</span>
            </div>
            <p className="text-sm font-medium text-gray-800">{joinDate}</p>
          </div>
        </div>

        {/* Current Book */}
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
            <BookOpen className="h-4 w-4 mr-1 text-blue-600" />
            正在背诵的词书
          </h3>
          {currentBook ? (
            <div>
              <p className="font-medium text-gray-800">{currentBook.title}</p>
              <p className="text-sm text-gray-500">词汇量: {currentBook.wordCount}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">暂无正在背诵的词书</p>
          )}
        </div>

        {/* Member Benefits (only shown for members) */}
        {isMember && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-700 mb-2 flex items-center">
              <Star className="h-4 w-4 mr-1" />
              会员特权
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 无限词书访问权限</li>
              <li>• 高级学习数据分析</li>
              <li>• 自定义学习计划</li>
              <li>• 优先获取新功能</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

