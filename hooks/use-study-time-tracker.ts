"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function useStudyTimeTracker(sessionType: string, bookId?: string) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)

  // 开始跟踪学习时间
  const startTracking = async () => {
    try {
      // 获取当前用户
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // 创建新的学习会话
      const { data, error } = await supabase
        .from("study_sessions")
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          session_type: sessionType,
          book_id: bookId || null,
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error starting study session:", error)
        return
      }

      setSessionId(data.id)
      setStartTime(new Date())
      setIsTracking(true)

      console.log("Started tracking study time:", sessionType, bookId)
    } catch (error) {
      console.error("Error starting study session:", error)
    }
  }

  // 结束跟踪学习时间
  const stopTracking = async () => {
    if (!sessionId || !startTime) return

    try {
      const endTime = new Date()
      const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      // 更新学习会话
      const { error } = await supabase
        .from("study_sessions")
        .update({
          end_time: endTime.toISOString(),
          duration: durationInSeconds,
        })
        .eq("id", sessionId)

      if (error) {
        console.error("Error stopping study session:", error)
        return
      }

      console.log("Stopped tracking study time. Duration:", durationInSeconds, "seconds")

      setIsTracking(false)
      setSessionId(null)
      setStartTime(null)
    } catch (error) {
      console.error("Error stopping study session:", error)
    }
  }

  // 自动清理：组件卸载时停止跟踪
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking()
      }
    }
  }, [isTracking])

  return { isTracking, startTracking, stopTracking }
}
