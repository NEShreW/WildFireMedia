'use client'

import { useState } from 'react'

interface MediaPlayerProps {
  mediaId: string
  mediaType: 'audio' | 'video'
  title: string
}

export default function MediaPlayer({ mediaId, mediaType, title }: MediaPlayerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMedia = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/media/${mediaId}/play`)
      if (!res.ok) throw new Error('Failed to get media URL')
      const { signedUrl } = await res.json()
      setSignedUrl(signedUrl)
    } catch {
      setError('Could not load media')
    } finally {
      setLoading(false)
    }
  }

  if (error) return <p className="text-red-500 text-sm">{error}</p>

  if (!signedUrl) {
    return (
      <button
        onClick={loadMedia}
        disabled={loading}
        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
      >
        {loading ? 'Loading...' : '▶ Play'}
      </button>
    )
  }

  if (mediaType === 'video') {
    return (
      <video
        src={signedUrl}
        controls
        className="w-full max-w-xl rounded shadow"
        title={title}
      />
    )
  }

  return (
    <audio
      src={signedUrl}
      controls
      className="w-full max-w-xl"
      title={title}
    />
  )
}
