import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { MediaItem } from '@/lib/types'
import MediaPlayer from '@/components/MediaPlayer'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/profile/setup')

  const { data: mediaItems } = await supabase
    .from('media')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
          <p className="text-gray-500 text-sm">@{profile.username}</p>
        </div>
        <Link
          href="/library/upload"
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 font-medium"
        >
          + Upload Media
        </Link>
      </div>

      {(!mediaItems || mediaItems.length === 0) ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎵</p>
          <p className="text-lg font-medium">No media yet</p>
          <p className="text-sm mt-1">Upload your first audio or video file</p>
          <Link
            href="/library/upload"
            className="inline-block mt-4 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Upload Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {(mediaItems as MediaItem[]).map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{item.title}</h2>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  )}
                  <span className="inline-block mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {item.media_type}
                  </span>
                </div>
                <Link
                  href={`/transfers/send?mediaId=${item.id}`}
                  className="text-sm text-orange-600 hover:underline ml-4 shrink-0"
                >
                  Send Copy
                </Link>
              </div>
              <MediaPlayer mediaId={item.id} mediaType={item.media_type} title={item.title} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
