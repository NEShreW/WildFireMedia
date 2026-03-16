import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { mediaId, recipientUsername } = await request.json()
    if (!mediaId || !recipientUsername) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('id')
      .eq('id', mediaId)
      .eq('owner_id', user.id)
      .single()

    if (mediaError || !media) {
      return NextResponse.json({ error: 'Media not found or not owned by you' }, { status: 404 })
    }

    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', recipientUsername.trim().toLowerCase())
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    if (recipient.id === user.id) {
      return NextResponse.json({ error: 'Cannot send to yourself' }, { status: 400 })
    }

    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .insert({
        sender_id: user.id,
        recipient_id: recipient.id,
        media_id: mediaId,
        status: 'pending',
      })
      .select()
      .single()

    if (transferError) {
      return NextResponse.json({ error: transferError.message }, { status: 500 })
    }

    return NextResponse.json(transfer)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
