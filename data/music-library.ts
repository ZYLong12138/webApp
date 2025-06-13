export interface MusicTrack {
    id: string
    title: string
    artist: string
    audioUrl: string
    coverUrl: string
    duration?: number
  }
  
  // 辅助函数：为Fifty Sounds网站生成链接
  export function generateFiftySoundsLinks(songTitle: string) {
    // 将歌曲名转换为URL格式：小写，空格替换为连字符，移除逗号
    const formattedTitle = songTitle.toLowerCase().replace(/,\s*/g, " ").replace(/\s+/g, "-")
  
    return {
      audioUrl: `https://www.fiftysounds.com/music/${formattedTitle}.mp3`,
      coverUrl: `https://www.fiftysounds.com/images/gallery/thumbnails/${formattedTitle}.jpg`,
    }
  }
  
  // 创建一个音乐曲目
  export function createMusicTrack(
    id: string,
    title: string,
    artist: string,
    audioUrl: string,
    coverUrl: string,
  ): MusicTrack {
    return {
      id,
      title,
      artist,
      audioUrl,
      coverUrl,
    }
  }
  
  // 默认播放列表
  export const defaultPlaylist: MusicTrack[] = [
    {
      id: "1",
      title: "Changes",
      artist: "Fifty Sounds",
      audioUrl: "https://www.fiftysounds.com/music/changes.mp3",
      coverUrl: "https://www.fiftysounds.com/images/gallery/thumbnails/changes.jpg",
    },
    {
      id: "2",
      title: "A Long Walk",
      artist: "Fifty Sounds",
      audioUrl: "https://www.fiftysounds.com/music/a-long-walk.mp3",
      coverUrl: "https://www.fiftysounds.com/images/gallery/thumbnails/a-long-walk.jpg",
    },
    {
      id: "3",
      title: "To You",
      artist: "Fifty Sounds",
      audioUrl: "https://www.fiftysounds.com/music/to-you.mp3",
      coverUrl: "https://www.fiftysounds.com/images/gallery/thumbnails/to-you.jpg",
    },
    {
      id: "4",
      title: "Never, Nowhere",
      artist: "Fifty Sounds",
      audioUrl: "https://www.fiftysounds.com/music/never-nowhere.mp3",
      coverUrl: "https://www.fiftysounds.com/images/gallery/thumbnails/never-nowhere.jpg",
    },
    {
      id: "5",
      title: "A Sea of Silence",
      artist: "Fifty Sounds",
      audioUrl: "https://www.fiftysounds.com/music/a-sea-of-silence.mp3",
      coverUrl: "https://www.fiftysounds.com/images/gallery/thumbnails/a-sea-of-silence.jpg",
    },
    {
      id: "6",
      title: "Before You Go",
      artist: "Fifty Sounds",
      audioUrl: "https://www.fiftysounds.com/music/before-you-go.mp3",
      coverUrl: "https://www.fiftysounds.com/images/gallery/thumbnails/before-you-go.jpg",
    },
    {
      id: "7",
      title: "The Perfect Moment",
      artist: "Fifty Sounds",
      audioUrl: "https://www.fiftysounds.com/music/the-perfect-moment.mp3",
      coverUrl: "https://www.fiftysounds.com/images/gallery/thumbnails/the-perfect-moment.jpg",
    },
    {
      id: "8",
      title: "Out of Time",
      artist: "Fifty Sounds",
      audioUrl: "https://www.fiftysounds.com/music/out-of-time.mp3",
      coverUrl: "https://www.fiftysounds.com/images/gallery/thumbnails/out-of-time.jpg",
    },
    {
      id: "9",
      title: "The Secrets We Kept",
      artist: "Fifty Sounds",
      audioUrl: "https://www.fiftysounds.com/music/the-secrets-we-kept.mp3",
      coverUrl: "https://www.fiftysounds.com/images/gallery/thumbnails/the-secrets-we-kept.jpg",
    },
  ]
  