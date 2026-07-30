-- Momentum: friendships, opt-in leaderboard, workbooks, and co-op quests.
-- Run once in the Supabase SQL Editor, after 0001-0003.

-- ---------------------------------------------------------------------------
-- Profiles: leaderboard opt-in + a denormalized total_xp cache.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column leaderboard_opt_in boolean not null default false,
  add column total_xp integer not null default 0,
  add column email text;

update public.profiles p set email = u.email from auth.users u where p.id = u.id;

-- Keep new profiles' email in sync (0001's handle_new_user didn't set it).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Friend requests are sent by exact email match. This function is the only
-- way to resolve email -> user id: it runs as security definer and returns
-- nothing but a uuid, so a user's email is never exposed via a general
-- profiles SELECT (no RLS policy here grants that).
create or replace function public.find_user_id_by_email(lookup_email text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.profiles where email = lookup_email limit 1;
$$;

grant execute on function public.find_user_id_by_email(text) to authenticated;

create or replace function public.increment_profile_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set total_xp = total_xp + new.amount
  where id = new.user_id;
  return new;
end;
$$;

create trigger on_xp_event_insert
  after insert on public.xp_events
  for each row execute function public.increment_profile_xp();

-- ---------------------------------------------------------------------------
-- Friendships
-- ---------------------------------------------------------------------------

create type friendship_status as enum ('pending', 'accepted');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create index friendships_requester_idx on public.friendships (requester_id);
create index friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;

create policy "Users can view their own friendships" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can send friend requests as themselves" on public.friendships
  for insert with check (auth.uid() = requester_id);

create policy "Either side can update a friendship (accept)" on public.friendships
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Either side can delete a friendship (cancel/unfriend)" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Cross-user read access, in addition to each user's existing "own row"
-- policy from 0001/0002. Accepting a friend request is the consent gate for
-- seeing their basic profile (display name, streak) — leaderboard_opt_in is
-- a separate, narrower gate that only controls whether their XP specifically
-- (see the xp_events policy below) feeds into the competitive leaderboard.

create policy "Friends and pending requests can view each other's profile" on public.profiles
  for select using (
    exists (
      select 1 from public.friendships f
      where (f.requester_id = auth.uid() and f.addressee_id = profiles.id)
         or (f.addressee_id = auth.uid() and f.requester_id = profiles.id)
    )
  );

create policy "Friends can view an opted-in friend's xp events" on public.xp_events
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = xp_events.user_id and p.leaderboard_opt_in = true
    )
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = xp_events.user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = xp_events.user_id))
    )
  );

-- ---------------------------------------------------------------------------
-- Workbooks: publishable bundles of tasks/habits. Items are a snapshot, not a
-- live reference to the owner's real tasks/habits, so a published workbook
-- can't be corrupted by the owner later editing or deleting their own tasks.
-- ---------------------------------------------------------------------------

create type workbook_item_kind as enum ('task', 'habit');

create table public.workbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  is_published boolean not null default false,
  -- Snapshot of the creator's display name at publish time, so anyone
  -- browsing published workbooks can see an attribution without needing
  -- cross-user profile RLS (profiles are only readable by the owner or an
  -- opted-in accepted friend, and a workbook can be public to strangers).
  owner_display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workbooks_user_id_idx on public.workbooks (user_id);

alter table public.workbooks enable row level security;

create policy "Anyone can view published workbooks; owners can view their own"
  on public.workbooks for select
  using (is_published = true or auth.uid() = user_id);

create policy "Users can create their own workbooks" on public.workbooks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own workbooks" on public.workbooks
  for update using (auth.uid() = user_id);

create policy "Users can delete their own workbooks" on public.workbooks
  for delete using (auth.uid() = user_id);

create table public.workbook_items (
  id uuid primary key default gen_random_uuid(),
  workbook_id uuid not null references public.workbooks (id) on delete cascade,
  kind workbook_item_kind not null,
  title text not null,
  notes text,
  category text,
  importance smallint not null default 3 check (importance between 1 and 5),
  effort smallint not null default 3 check (effort between 1 and 5),
  cadence_type cadence_type,
  days_of_week smallint[] not null default '{}',
  position integer not null default 0
);

create index workbook_items_workbook_id_idx on public.workbook_items (workbook_id);

alter table public.workbook_items enable row level security;

create policy "Workbook items follow their workbook's visibility"
  on public.workbook_items for select
  using (
    exists (
      select 1 from public.workbooks w
      where w.id = workbook_items.workbook_id
        and (w.is_published = true or w.user_id = auth.uid())
    )
  );

create policy "Users can manage items on their own workbooks (insert)"
  on public.workbook_items for insert
  with check (
    exists (select 1 from public.workbooks w where w.id = workbook_id and w.user_id = auth.uid())
  );

create policy "Users can manage items on their own workbooks (update)"
  on public.workbook_items for update
  using (
    exists (select 1 from public.workbooks w where w.id = workbook_id and w.user_id = auth.uid())
  );

create policy "Users can manage items on their own workbooks (delete)"
  on public.workbook_items for delete
  using (
    exists (select 1 from public.workbooks w where w.id = workbook_id and w.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Co-op quests: a shared goal between friends with combined progress.
-- ---------------------------------------------------------------------------

create table public.co_op_quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target_count integer not null check (target_count > 0),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.co_op_quests enable row level security;

create table public.co_op_quest_members (
  quest_id uuid not null references public.co_op_quests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (quest_id, user_id)
);

alter table public.co_op_quest_members enable row level security;

create table public.co_op_quest_contributions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.co_op_quests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null default 1,
  created_at timestamptz not null default now()
);

create index co_op_quest_contributions_quest_id_idx on public.co_op_quest_contributions (quest_id);

alter table public.co_op_quest_contributions enable row level security;

create policy "Quest members can view their quests" on public.co_op_quests
  for select using (
    exists (
      select 1 from public.co_op_quest_members m
      where m.quest_id = co_op_quests.id and m.user_id = auth.uid()
    )
  );

create policy "Users can create a quest as themselves" on public.co_op_quests
  for insert with check (auth.uid() = created_by);

create policy "Quest members can view the member list" on public.co_op_quest_members
  for select using (
    exists (
      select 1 from public.co_op_quest_members m
      where m.quest_id = co_op_quest_members.quest_id and m.user_id = auth.uid()
    )
  );

create policy "Users can add themselves to a quest" on public.co_op_quest_members
  for insert with check (auth.uid() = user_id);

create policy "Users can leave a quest" on public.co_op_quest_members
  for delete using (auth.uid() = user_id);

create policy "Quest members can view all contributions to their quests"
  on public.co_op_quest_contributions for select
  using (
    exists (
      select 1 from public.co_op_quest_members m
      where m.quest_id = co_op_quest_contributions.quest_id and m.user_id = auth.uid()
    )
  );

create policy "Members can log their own contributions" on public.co_op_quest_contributions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.co_op_quest_members m
      where m.quest_id = co_op_quest_contributions.quest_id and m.user_id = auth.uid()
    )
  );
