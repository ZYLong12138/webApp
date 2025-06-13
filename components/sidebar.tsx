"use client"

import { useRouter, usePathname } from "next/navigation"
import { Home, BarChart2, Book, Settings, User } from "lucide-react"

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { name: "首页", icon: Home, path: "/" },
    { name: "仪表盘", icon: BarChart2, path: "/statistics" },
    { name: "我的内容", icon: User, path: "/personal-vocabulary" },
    { name: "词典", icon: Book, path: "/word_list" },
    { name: "设置", icon: Settings, path: "/settings" },
  ]

  return (
    <aside className="w-48 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-4">
        <h2 className="text-xl font-bold text-blue-600">VocabMaster</h2>
      </div>
      <nav className="mt-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <li key={item.path}>
                <button
                  onClick={() => router.push(item.path)}
                  className={`flex items-center w-full px-4 py-2 text-left transition-colors ${
                    isActive ? "text-blue-600 bg-blue-50 border-r-4 border-blue-600" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className={`h-4 w-4 mr-2 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
