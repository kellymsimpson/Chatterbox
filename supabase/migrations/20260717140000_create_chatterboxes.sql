-- Chatterbox — chatterboxes table (PLAN.md / PRD §15 / OQ2)
-- Applied as Step 2 of the build plan (2026-07-17).

create table if not exists public.chatterboxes (
  id uuid default gen_random_uuid() primary key,
  maker_name text,
  maker_token text not null,
  vibe text not null,
  flap_colors jsonb not null,     -- { top_left, top_right, bottom_left, bottom_right } (or PRD aliases)
  stickers jsonb not null,        -- [{ sticker_id | id, flap, u, v, scale? }]
  fortunes jsonb not null,        -- { "1": "...", ..., "8": "..." }
  created_at timestamptz default now()
);

create index if not exists chatterboxes_created_at_idx
  on public.chatterboxes (created_at desc);

create index if not exists chatterboxes_maker_token_idx
  on public.chatterboxes (maker_token);

alter table public.chatterboxes enable row level security;

-- Schoolyard + play-by-id: anyone can read saved chatterboxes.
drop policy if exists "chatterboxes_select_public" on public.chatterboxes;
create policy "chatterboxes_select_public"
  on public.chatterboxes
  for select
  to anon, authenticated
  using (true);

-- Decorate save: anyone with the anon key can insert (identity is maker_token).
drop policy if exists "chatterboxes_insert_public" on public.chatterboxes;
create policy "chatterboxes_insert_public"
  on public.chatterboxes
  for insert
  to anon, authenticated
  with check (true);

-- No update/delete policies in v1 — makers cannot edit or remove after release.
