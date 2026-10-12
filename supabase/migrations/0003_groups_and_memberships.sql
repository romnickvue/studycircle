-- groups table
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_groups_updated_at
before update on groups
for each row
execute function set_updated_at();

-- group_memberships table
create table group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role membership_role not null default 'MEMBER',
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create trigger set_group_memberships_updated_at
before update on group_memberships
for each row
execute function set_updated_at();

-- Helper function: is the given user a member of the given group?
-- security definer + stable so it can be called safely from inside RLS
-- policies without triggering infinite recursion on group_memberships itself.
create or replace function is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from group_memberships
    where group_id = p_group_id and user_id = p_user_id
  );
$$ language sql stable security definer;

-- Helper function: is the given user an Admin of the given group?
create or replace function is_group_admin(p_group_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from group_memberships
    where group_id = p_group_id and user_id = p_user_id and role = 'ADMIN'
  );
$$ language sql stable security definer;

-- Atomic group creation: group + creator's ADMIN membership in one step
create or replace function create_group_with_owner(p_name text, p_description text)
returns uuid as $$
declare
  new_group_id uuid;
begin
  insert into groups (name, description, created_by)
  values (p_name, p_description, auth.uid())
  returning id into new_group_id;

  insert into group_memberships (group_id, user_id, role)
  values (new_group_id, auth.uid(), 'ADMIN');

  return new_group_id;
end;
$$ language plpgsql security definer;

-- Row Level Security: groups
alter table groups enable row level security;

create policy "groups_select_member"
on groups for select
using (is_group_member(id, auth.uid()));

create policy "groups_update_admin"
on groups for update
using (is_group_admin(id, auth.uid()));

-- Row Level Security: group_memberships
alter table group_memberships enable row level security;

create policy "memberships_select_fellow_member"
on group_memberships for select
using (is_group_member(group_id, auth.uid()));

-- Profiles: extend visibility to group-mates (parked from migration 0002)
create policy "profiles_select_groupmates"
on profiles for select
using (
  exists (
    select 1 from group_memberships gm1
    join group_memberships gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = auth.uid() and gm2.user_id = profiles.id
  )
);