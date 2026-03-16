'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { MediaItem } from '@/lib/types'

function SendTransferForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [selectedMedia, setSelectedMedia] = useState('')
  const [recipientUsername, setRecipientUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const loadMedia = useCallback(async () => {
    const preselected = searchParams.get('mediaId')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data } = await supabase
      .from('media')
      .select('*')
      .eq('owner_id', user.id)
    setMediaItems(data ?? [])
    if (preselected) setSelectedMedia(preselected)
  }, [supabase, router, searchParams])

  useEffect(() => { loadMedia() }, [loadMedia])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: selectedMedia, recipientUsername }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send transfer')
      }
      setSuccess(true)
      setTimeout(() => router.push('/transfers'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send transfer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Send Media</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">Transfer sent! Redirecting...</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Media *</label>
          <select
            value={selectedMedia}
            onChange={(e) => setSelectedMedia(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Choose a file...</option>
            {mediaItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.media_type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Username *</label>
          <input
            type="text"
            value={recipientUsername}
            onChange={(e) => setRecipientUsername(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="username"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !selectedMedia || !recipientUsername}
            className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Sending...' : 'Send Transfer'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 px-6 py-2 rounded border hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default function SendTransferPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}>
      <SendTransferForm />
    </Suspense>
  )
}
