-- group_invitations table
create table group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

-- Row Level Security
alter table group_invitations enable row level security;

create policy "invitations_select_admin"
on group_invitations for select
using (is_group_admin(group_id, auth.uid()));

create policy "invitations_update_revoke_admin"
on group_invitations for update
using (is_group_admin(group_id, auth.uid()));

-- Generate (or regenerate) an invitation for a group. Admin-only.
-- Revokes the previous active invitation, if any, then creates a new one.
create or replace function generate_group_invitation(p_group_id uuid)
returns text as $$
declare
  new_code text;
begin
  if not is_group_admin(p_group_id, auth.uid()) then
    raise exception 'Only Admins can generate an invitation link';
  end if;

  update group_invitations
  set revoked_at = now()
  where group_id = p_group_id
    and revoked_at is null
    and expires_at > now();

  new_code := encode(gen_random_bytes(16), 'hex');

  insert into group_invitations (group_id, code, created_by, expires_at)
  values (p_group_id, new_code, auth.uid(), now() + interval '3 days');

  return new_code;
end;
$$ language plpgsql security definer;

-- Preview an invitation without authentication. Returns only { valid, group_name }.
create or replace function preview_invitation(p_code text)
returns json as $$
declare
  inv record;
begin
  select gi.group_id, g.name as group_name
  into inv
  from group_invitations gi
  join groups g on g.id = gi.group_id
  where gi.code = p_code
    and gi.revoked_at is null
    and gi.expires_at > now();

  if inv is null then
    return json_build_object('valid', false);
  end if;

  return json_build_object('valid', true, 'group_name', inv.group_name);
end;
$$ language plpgsql security definer;

-- Accept an invitation. Must be authenticated. Idempotent if already a member.
create or replace function accept_group_invitation(p_code text)
returns json as $$
declare
  inv record;
  already_member boolean;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to accept an invitation';
  end if;

  select gi.group_id into inv
  from group_invitations gi
  where gi.code = p_code
    and gi.revoked_at is null
    and gi.expires_at > now();

  if inv is null then
    return json_build_object('result', 'invalid');
  end if;

  select exists (
    select 1 from group_memberships
    where group_id = inv.group_id and user_id = auth.uid()
  ) into already_member;

  if already_member then
    return json_build_object('result', 'already_member', 'group_id', inv.group_id);
  end if;

  insert into group_memberships (group_id, user_id, role)
  values (inv.group_id, auth.uid(), 'MEMBER');

  return json_build_object('result', 'joined', 'group_id', inv.group_id);
end;
$$ language plpgsql security definer;