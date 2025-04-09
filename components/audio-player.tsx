import { useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface AudioPlayerProps {
  audioPath?: string;
  word: string;
}

export function AudioPlayer({ audioPath, word }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = async () => {
    if (!audioPath) {
      setError('没有可用的音频文件');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 获取音频文件的公开访问 URL
      const { data } = supabase.storage
        .from('word-audio')
        .getPublicUrl(audioPath); // 直接使用 vedio 列中的路径

      if (!data?.publicUrl) {
        throw new Error('无法获取音频文件 URL');
      }

      console.log('音频文件 URL:', data.publicUrl); // 调试用

      // 预加载音频
      const audio = new Audio();
      audio.src = data.publicUrl;
      
      // 设置事件监听器
      audio.onloadeddata = async () => {
        audioRef.current = audio;
        setIsPlaying(true);
        try {
          await audio.play();
        } catch (err) {
          console.error(`播放 ${word} 的音频时出错:`, err);
          setError('播放音频时出错');
          setIsPlaying(false);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = (e) => {
        console.error(`加载 ${word} 的音频时出错:`, e);
        setError('加载音频时出错');
        setIsPlaying(false);
      };

    } catch (err) {
      console.error(`处理 ${word} 的音频时出错:`, err);
      setError('处理音频时出错');
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={isPlaying ? stopAudio : playAudio}
        disabled={isLoading || !audioPath}
        className="h-8 w-8"
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        ) : isPlaying ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </Button>
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
    </div>
  );
}
