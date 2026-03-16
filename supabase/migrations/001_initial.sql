-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now() not null
);

-- Media table
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  media_type text not null check (media_type in ('audio', 'video')),
  storage_path text not null,
  file_size bigint,
  duration_seconds integer,
  created_at timestamptz default now() not null
);

-- Transfers table
create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.media enable row level security;
alter table public.transfers enable row level security;

-- Profiles policies
create policy "Users can view all profiles" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Media policies
create policy "Users can view their own media" on public.media
  for select using (auth.uid() = owner_id);

create policy "Users can insert their own media" on public.media
  for insert with check (auth.uid() = owner_id);

create policy "Users can delete their own media" on public.media
  for delete using (auth.uid() = owner_id);

-- Transfers policies
create policy "Users can view their own transfers" on public.transfers
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users can insert transfers they send" on public.transfers
  for insert with check (auth.uid() = sender_id);

create policy "Users can update transfers they are involved in" on public.transfers
  for update using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Storage bucket (run this in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('media-files', 'media-files', false);

-- Storage policies for media-files bucket
-- These need to be created via Supabase dashboard or storage API
-- Policy: Users can upload to their own folder (user_id/*)
-- Policy: Users can read files they own
-- Policy: Service role has full access (for signed URLs and copy operations)
