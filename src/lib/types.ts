export interface Profile {
  id: string
  username: string
  created_at: string
}

export interface MediaItem {
  id: string
  owner_id: string
  title: string
  description?: string
  media_type: 'audio' | 'video'
  storage_path: string
  file_size?: number
  duration_seconds?: number
  created_at: string
}

export interface Transfer {
  id: string
  sender_id: string
  recipient_id: string
  media_id: string
  status: 'pending' | 'accepted' | 'revoked'
  created_at: string
  updated_at: string
  media?: MediaItem
  sender?: Profile
  recipient?: Profile
}
