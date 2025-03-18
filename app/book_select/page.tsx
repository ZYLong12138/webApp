"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Book, ListFilter, BookOpen } from "lucide-react"
import { BookButton, BookButtonGrid } from "@/Integration_modules/book-button"

export default function BookSelectPage() {
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">VocabMaster</h1>

      <div className="space-y-8">
        {/* Standard Vocabulary Data Section */}
        <Card className="bg-slate-800 text-white">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-center gap-2 text-xl font-semibold">
              <Book className="h-6 w-6" />
              <h2>标准词汇数据</h2>
            </div>

            <div className="relative">
              <Input
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
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
                tagColor="bg-green-500"
                tagText="个人词库"
                href="/word_list"
              />
            </BookButtonGrid>

            {/* Empty grid message - only show if there are no other books */}
            {false && (
              <div className="bg-slate-700 rounded-lg p-8 text-center">
                <p className="text-slate-400">暂无标准词书数据</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Vocabulary Lists Section */}
        <Card className="bg-slate-800 text-white">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-center gap-2 text-xl font-semibold">
              <ListFilter className="h-6 w-6" />
              <h2>自定义单词表</h2>
            </div>

            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              <span className="mr-2">+</span> 创建新词书
            </Button>

            <p className="text-center text-slate-400 text-sm">您还没有创建自定义词书，点击上方按钮创建</p>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-8 text-center text-sm text-slate-500">
        思考 · 反馈 · 关于 | VocabMaster all rights reserved.
      </footer>
    </div>
  )
}

