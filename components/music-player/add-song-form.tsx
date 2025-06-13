"use client"

import type React from "react"

import { useState } from "react"
import { useMusic } from "@/contexts/music-context"
import { createMusicTrack } from "@/data/music-library"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AddSongForm() {
  const { addSong } = useMusic()
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [audioUrl, setAudioUrl] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !audioUrl) {
      alert("请至少填写歌曲名称和音频链接")
      return
    }

    setIsSubmitting(true)

    try {
      // 创建新的音乐轨道
      const newTrack = createMusicTrack(
        title,
        artist || "未知艺术家",
        audioUrl,
        coverUrl || "/diverse-group-making-music.png",
      )

      // 添加到播放列表
      addSong(newTrack)

      // 重置表单
      setTitle("")
      setArtist("")
      setAudioUrl("")
      setCoverUrl("")

      alert("歌曲已添加到播放列表")
    } catch (error) {
      console.error("添加歌曲失败:", error)
      alert("添加歌曲失败，请检查链接是否有效")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">添加新歌曲</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">歌曲名称 *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入歌曲名称"
            required
          />
        </div>

        <div>
          <Label htmlFor="artist">艺术家</Label>
          <Input id="artist" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="输入艺术家名称" />
        </div>

        <div>
          <Label htmlFor="audioUrl">音频链接 *</Label>
          <Input
            id="audioUrl"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="输入音频文件的URL"
            required
          />
        </div>

        <div>
          <Label htmlFor="coverUrl">封面图片链接</Label>
          <Input
            id="coverUrl"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="输入封面图片的URL"
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "添加中..." : "添加歌曲"}
        </Button>
      </form>
    </div>
  )
}
