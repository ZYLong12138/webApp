"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ExternalLink } from "lucide-react"
import { Sidebar } from "@/components/sidebar"

// 辅助函数：移除HTML标签和超链接
function stripHtml(html: string): string {
  // 创建一个临时的DOM元素
  const temp = document.createElement("div")
  temp.innerHTML = html
  // 获取纯文本内容
  return temp.textContent || temp.innerText || ""
}

export default function DictionaryPage() {
  const [word, setWord] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [definitions, setDefinitions] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    // 加载最近的搜索记录
    const savedSearches = localStorage.getItem("recentDictionarySearches")
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches))
    }
  }, [])

  const saveRecentSearch = (term: string) => {
    const updatedSearches = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 10)
    setRecentSearches(updatedSearches)
    localStorage.setItem("recentDictionarySearches", JSON.stringify(updatedSearches))
  }

  const fetchDefinition = async (term: string) => {
    if (!term.trim()) return

    setLoading(true)
    setError(null)

    try {
      // 使用维基词典API，只获取英文定义
      const response = await fetch(
        `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(term.toLowerCase())}`,
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`未找到"${term}"的定义`)
        }
        throw new Error("获取定义失败")
      }

      const data = await response.json()

      // 只保留英文定义
      if (data.en) {
        // 处理定义，移除HTML标签和超链接
        const cleanedData = {
          en: data.en.map((partOfSpeech: any) => ({
            ...partOfSpeech,
            definitions: partOfSpeech.definitions.map((def: any) => ({
              ...def,
              definition: stripHtml(def.definition),
              examples: def.examples ? def.examples.map((ex: string) => stripHtml(ex)) : [],
            })),
          })),
        }
        setDefinitions(cleanedData)
        setWord(term)
        saveRecentSearch(term)
      } else {
        throw new Error(`未找到"${term}"的英文定义`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生未知错误")
      setDefinitions(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDefinition(searchTerm)
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">词典</h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <Input
            type="text"
            placeholder="输入单词查询..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "查询中..." : <Search className="h-4 w-4 mr-2" />}
            查询
          </Button>
        </form>

        {recentSearches.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">最近查询</h2>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm(term)
                    fetchDefinition(term)
                  }}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/4 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">查询错误</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
              <p className="mt-2 text-sm">请尝试其他单词或检查拼写。</p>
            </CardContent>
          </Card>
        )}

        {definitions && !loading && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">{word}</CardTitle>
                <CardDescription>
                  来源：
                  <a
                    href={`https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    维基词典 <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {definitions.en.map((partOfSpeech: any, index: number) => (
                  <div key={index} className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">{partOfSpeech.partOfSpeech}</h3>
                    <ol className="list-decimal pl-5 space-y-2">
                      {partOfSpeech.definitions.map((def: any, defIndex: number) => (
                        <li key={defIndex}>
                          <div>{def.definition}</div>

                          {def.examples && def.examples.length > 0 && (
                            <ul className="list-disc pl-5 mt-1 text-gray-600">
                              {def.examples.map((example: string, exIndex: number) => (
                                <li key={exIndex}>{example}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="text-sm text-gray-500">数据由维基词典提供，根据 CC BY-SA 3.0 许可使用</CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
