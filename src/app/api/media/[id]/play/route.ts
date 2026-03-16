import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (error || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    const adminClient = createAdminClient()
    const { data: signedData, error: signError } = await adminClient.storage
      .from('media-files')
      .createSignedUrl(media.storage_path, 3600)

    if (signError || !signedData) {
      return NextResponse.json({ error: 'Could not generate URL' }, { status: 500 })
    }

    return NextResponse.json({ signedUrl: signedData.signedUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
