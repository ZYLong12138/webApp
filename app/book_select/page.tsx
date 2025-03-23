"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Book, ListFilter, BookOpen } from "lucide-react"
import { BookButton, BookButtonGrid } from "@/Integration_modules/book-button"
import { UserPageButton } from "@/Integration_modules/user-page-button"

export default function BookSelectPage() {
  return (
    <div className="container mx-auto py-8 max-w-6xl bg-gray-50 min-h-screen">
      {/* Add header with user button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">VocabMaster</h1>
        <UserPageButton size="icon" buttonText="" variant="ghost" />
      </div>

      {/* Remove the existing h1 since we've moved it to the header */}

      <div className="space-y-8">
        {/* Standard Vocabulary Data Section */}
        <Card className="bg-white shadow-sm border">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-center gap-2 text-xl font-semibold text-gray-800">
              <Book className="h-6 w-6 text-blue-600" />
              <h2>标准词汇数据</h2>
            </div>

            <div className="relative">
              <Input
                className="bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400"
                placeholder="搜索词书..."
              />
            </div>

            {/* Add BookButton that connects to app/page */}
            <BookButtonGrid>
              <BookButton
                id="my-vocabulary"
                title="我的单词本"
                wordCount={0}
                description="您的个人词汇学习空间"
                icon={BookOpen}
                tagColor="bg-blue-500"
                tagText="个人词库"
                href="/word_list"
              />
            </BookButtonGrid>

            {/* Empty grid message - only show if there are no other books */}
            {false && (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-500">暂无标准词书数据</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Vocabulary Lists Section */}
        <Card className="bg-white shadow-sm border">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-center gap-2 text-xl font-semibold text-gray-800">
              <ListFilter className="h-6 w-6 text-blue-600" />
              <h2>自定义单词表</h2>
            </div>

            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              <span className="mr-2">+</span> 创建新词书
            </Button>

            <p className="text-center text-gray-500 text-sm">您还没有创建自定义词书，点击上方按钮创建</p>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500">
        思考 · 反馈 · 关于 | VocabMaster all rights reserved.
      </footer>
    </div>
  )
}

