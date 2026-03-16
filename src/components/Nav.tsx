'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Nav() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
    })
  }, [supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="bg-orange-600 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl tracking-tight">
            🔥 WildFire Media
          </Link>
          {email && (
            <>
              <Link href="/library" className="hover:underline text-sm">
                Library
              </Link>
              <Link href="/transfers" className="hover:underline text-sm">
                Transfers
              </Link>
            </>
          )}
        </div>
        {email && (
          <div className="flex items-center gap-4 text-sm">
            <span className="opacity-80">{email}</span>
            <button
              onClick={signOut}
              className="bg-white text-orange-600 px-3 py-1 rounded hover:bg-orange-50 font-medium"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
