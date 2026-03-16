'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TransferRow {
  id: string
  status: string
  media?: { title: string; media_type: string }
  sender?: { username: string }
  recipient?: { username: string }
}

export default function TransfersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [incoming, setIncoming] = useState<TransferRow[]>([])
  const [outgoing, setOutgoing] = useState<TransferRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransfers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const [{ data: inc }, { data: out }] = await Promise.all([
      supabase
        .from('transfers')
        .select('*, media:media_id(title, media_type), sender:sender_id(username)')
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('transfers')
        .select('*, media:media_id(title, media_type), recipient:recipient_id(username)')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    setIncoming(inc ?? [])
    setOutgoing(out ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTransfers() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const acceptTransfer = async (id: string) => {
    const res = await fetch(`/api/transfers/${id}/accept`, { method: 'POST' })
    if (res.ok) fetchTransfers()
  }

  const revokeTransfer = async (id: string) => {
    const res = await fetch(`/api/transfers/${id}/revoke`, { method: 'POST' })
    if (res.ok) fetchTransfers()
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    revoked: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
        <Link
          href="/transfers/send"
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 font-medium"
        >
          + Send Media
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Incoming</h2>
            {incoming.length === 0 ? (
              <p className="text-gray-400 text-sm">No pending incoming transfers</p>
            ) : (
              <div className="space-y-3">
                {incoming.map((t) => (
                  <div key={t.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{t.media?.title}</p>
                      <p className="text-sm text-gray-500">
                        From @{t.sender?.username} · {t.media?.media_type}
                      </p>
                    </div>
                    <button
                      onClick={() => acceptTransfer(t.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Outgoing</h2>
            {outgoing.length === 0 ? (
              <p className="text-gray-400 text-sm">No outgoing transfers</p>
            ) : (
              <div className="space-y-3">
                {outgoing.map((t) => (
                  <div key={t.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{t.media?.title}</p>
                      <p className="text-sm text-gray-500">
                        To @{t.recipient?.username} · {t.media?.media_type}
                      </p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${statusColor[t.status] ?? ''}`}>
                        {t.status}
                      </span>
                    </div>
                    {t.status === 'pending' && (
                      <button
                        onClick={() => revokeTransfer(t.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
