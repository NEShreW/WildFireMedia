import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()

    const { data: transfer, error: transferError } = await adminClient
      .from('transfers')
      .select('*, media:media_id(*)')
      .eq('id', id)
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .single()

    if (transferError || !transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    const media = transfer.media as {
      storage_path: string
      title: string
      description: string | null
      media_type: string
      file_size: number | null
      duration_seconds: number | null
    }
    const newMediaId = crypto.randomUUID()
    const filename = media.storage_path.split('/').pop()
    const newStoragePath = `${user.id}/${newMediaId}/${filename}`

    const { error: copyError } = await adminClient.storage
      .from('media-files')
      .copy(media.storage_path, newStoragePath)

    if (copyError) {
      return NextResponse.json({ error: copyError.message }, { status: 500 })
    }

    const { error: mediaError } = await adminClient
      .from('media')
      .insert({
        id: newMediaId,
        owner_id: user.id,
        title: media.title,
        description: media.description,
        media_type: media.media_type,
        storage_path: newStoragePath,
        file_size: media.file_size,
        duration_seconds: media.duration_seconds,
      })

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 })
    }

    const { error: updateError } = await adminClient
      .from('transfers')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
