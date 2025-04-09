"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Book, ListFilter, BookOpen, Search, Loader2 } from "lucide-react"
import { BookButton, BookButtonGrid } from "@/Integration_modules/book-button"
import { UserPageButton } from "@/Integration_modules/user-page-button"
import { getAllBooks, getBookWordCount } from "@/services/vocabulary-service"
import type { VocabularyBook } from "@/types/vocabulary"
import { BookSelect } from '@/components/book-select'
import { BookList } from '@/components/book-list'
import { BookForm } from '@/components/book-form'
import { VocabularyList } from '@/components/vocabulary-list'
import { Plus } from 'lucide-react'

export default function BookSelectPage() {
  const [books, setBooks] = useState<VocabularyBook[]>([])
  const [filteredBooks, setFilteredBooks] = useState<VocabularyBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [bookWordCounts, setBookWordCounts] = useState<Record<string, number>>({})
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)

  // 获取词书列表
  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true)
      try {
        const data = await getAllBooks()
        setBooks(data)
        setFilteredBooks(data)

        // 获取每本词书的单词数量
        try {
          const counts: Record<string, number> = {}
          for (const book of data) {
            try {
              const count = await getBookWordCount(book.id)
              counts[book.id] = count
            } catch (countError) {
              console.error(`获取词书 ${book.id} 单词数量失败:`, countError)
              counts[book.id] = 0
            }
          }
          setBookWordCounts(counts)
        } catch (countError) {
          console.error("获取词书单词数量失败:", countError)
          // 如果获取单词数量失败，使用空对象
          setBookWordCounts({})
        }

        setError(null)
      } catch (err) {
        console.error("获取词书失败:", err)
        setError("加载词书列表时出现错误")
        setBooks([])
        setFilteredBooks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooks()
  }, [])

  // 处理搜索
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBooks(books)
    } else {
      const filtered = books.filter(
        (book) =>
          book.book_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredBooks(filtered)
    }
  }, [searchQuery, books])

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl bg-gray-50 min-h-screen">
      {/* 头部与用户按钮 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">VocabMaster</h1>
        <UserPageButton size="icon" buttonText="" variant="ghost" />
      </div>

      <div className="space-y-8">
        {/* 标准词汇数据部分 */}
        <Card className="bg-white shadow-sm border">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-center gap-2 text-xl font-semibold text-gray-800">
              <Book className="h-6 w-6 text-blue-600" />
              <h2>标准词汇数据</h2>
            </div>

            <div className="relative">
              <Input
                className="bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 pr-10"
                placeholder="搜索词书..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                <span className="ml-2 text-gray-600">加载词书中...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-md">
                <p>{error}</p>
              </div>
            ) : (
              <BookButtonGrid>
                {/* 我的单词本按钮始终显示 */}
                <BookButton
                  id="my-vocabulary"
                  title="我的单词本"
                  wordCount={bookWordCounts["my-vocabulary"] || 0}
                  description="您的个人词汇学习空间"
                  icon={BookOpen}
                  tagColor="bg-blue-500"
                  tagText="个人词库"
                  href="/word_list"
                />

                {/* 显示从后端获取的词书列表 */}
                {filteredBooks.map((book) => (
                  <BookButton
                    key={book.id}
                    id={book.id}
                    title={book.book_name}
                    wordCount={bookWordCounts[book.id] || 0}
                    description={book.description}
                    icon={Book}
                    tagColor="bg-green-500"
                    tagText="标准词库"
                    href={`/book/${book.id}`}
                  />
                ))}
              </BookButtonGrid>
            )}

            {/* 如果没有词书且不在加载状态，显示提示信息 */}
            {!isLoading && !error && filteredBooks.length === 0 && (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-500">{searchQuery ? "没有找到匹配的词书" : "暂无标准词书数据"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 自定义词汇列表部分 */}
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

      {/* 词汇列表 */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">词汇列表</h2>
        <VocabularyList bookId={selectedBookId} />
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500">
        思考 · 反馈 · 关于 | VocabMaster all rights reserved.
      </footer>
    </div>
  )
}

