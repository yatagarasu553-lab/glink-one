-- GLINK ONE: initial Supabase schema for ONE team.
-- Run only in a company-approved project, as a project administrator.
-- Public anonymous access is never granted to team data.
create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','member')),
  primary key(team_id,user_id)
);
create table if not exists public.team_states (
  team_id uuid primary key references public.teams(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
create or replace function public.glink_is_member(p_team uuid)
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists(select 1 from public.team_members m
    where m.team_id = p_team and m.user_id = (select auth.uid()));
$$;
create or replace function public.glink_is_admin(p_team uuid)
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists(select 1 from public.team_members m
    where m.team_id = p_team and m.user_id = (select auth.uid())
      and m.role = 'admin');
$$;
revoke all on function public.glink_is_member(uuid), public.glink_is_admin(uuid) from public;
grant execute on function public.glink_is_member(uuid), public.glink_is_admin(uuid) to authenticated;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_states enable row level security;

drop policy if exists "glink_team_read" on public.teams;
create policy "glink_team_read" on public.teams for select to authenticated
using (public.glink_is_member(id));

drop policy if exists "glink_members_read" on public.team_members;
create policy "glink_members_read" on public.team_members for select to authenticated
using (public.glink_is_member(team_id));

drop policy if exists "glink_state_read" on public.team_states;
create policy "glink_state_read" on public.team_states for select to authenticated
using (public.glink_is_member(team_id));

drop policy if exists "glink_state_admin_update" on public.team_states;
create policy "glink_state_admin_update" on public.team_states for update to authenticated
using (public.glink_is_admin(team_id))
with check (public.glink_is_admin(team_id));

-- No browser INSERT or DELETE policies: team bootstrapping only through SQL editor.
revoke all on public.teams, public.team_members, public.team_states from anon;
grant usage on schema public to authenticated;
grant select on public.teams, public.team_members, public.team_states to authenticated;
grant update (payload, revision, updated_at) on public.team_states to authenticated;
