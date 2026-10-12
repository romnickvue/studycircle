-- Promote a member to Admin. Caller must already be an Admin of the group.
create or replace function promote_member(p_group_id uuid, p_user_id uuid)
returns void as $$
begin
  if not is_group_admin(p_group_id, auth.uid()) then
    raise exception 'Only Admins can promote members';
  end if;

  update group_memberships
  set role = 'ADMIN'
  where group_id = p_group_id and user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- Demote an Admin to Member. Caller must be an Admin. Cannot demote the last Admin.
create or replace function demote_member(p_group_id uuid, p_user_id uuid)
returns void as $$
declare
  admin_count int;
begin
  if not is_group_admin(p_group_id, auth.uid()) then
    raise exception 'Only Admins can demote members';
  end if;

  select count(*) into admin_count
  from group_memberships
  where group_id = p_group_id and role = 'ADMIN';

  if admin_count <= 1 then
    raise exception 'Cannot demote the last Admin of a group';
  end if;

  update group_memberships
  set role = 'MEMBER'
  where group_id = p_group_id and user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- Remove a member from a group. Caller must be an Admin. Cannot remove the last Admin.
create or replace function remove_member(p_group_id uuid, p_user_id uuid)
returns void as $$
declare
  target_role membership_role;
  admin_count int;
begin
  if not is_group_admin(p_group_id, auth.uid()) then
    raise exception 'Only Admins can remove members';
  end if;

  select role into target_role
  from group_memberships
  where group_id = p_group_id and user_id = p_user_id;

  if target_role = 'ADMIN' then
    select count(*) into admin_count
    from group_memberships
    where group_id = p_group_id and role = 'ADMIN';

    if admin_count <= 1 then
      raise exception 'Cannot remove the last Admin of a group';
    end if;
  end if;

  delete from group_memberships
  where group_id = p_group_id and user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- Leave a group voluntarily. Any member can call this for themselves.
-- Blocked if the caller is the last Admin.
create or replace function leave_group(p_group_id uuid)
returns void as $$
declare
  caller_role membership_role;
  admin_count int;
begin
  select role into caller_role
  from group_memberships
  where group_id = p_group_id and user_id = auth.uid();

  if caller_role is null then
    raise exception 'You are not a member of this group';
  end if;

  if caller_role = 'ADMIN' then
    select count(*) into admin_count
    from group_memberships
    where group_id = p_group_id and role = 'ADMIN';

    if admin_count <= 1 then
      raise exception 'You are the last Admin. Promote someone else before leaving.';
    end if;
  end if;

  delete from group_memberships
  where group_id = p_group_id and user_id = auth.uid();
end;
$$ language plpgsql security definer;