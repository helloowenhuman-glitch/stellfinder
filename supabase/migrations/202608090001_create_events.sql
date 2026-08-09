create extension if not exists pgcrypto;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 160),
  category text not null check (category in ('performance', 'goods', 'collaboration', 'offline')),
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default true,
  participants text[] not null check (cardinality(participants) > 0),
  display_color text not null check (display_color ~ '^#[0-9A-Fa-f]{6}$'),
  location text,
  summary text not null default '',
  source_url text not null unique,
  source_channel text not null check (source_channel in ('official-site', 'official-x')),
  source_published_at timestamptz,
  status text not null default 'needs_review' check (status in ('verified', 'needs_review')),
  external_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or end_at >= start_at)
);

create index events_start_at_idx on public.events (start_at);
create index events_status_start_at_idx on public.events (status, start_at);

alter table public.events enable row level security;

create policy "Verified events are public"
on public.events
for select
to anon, authenticated
using (status = 'verified');
