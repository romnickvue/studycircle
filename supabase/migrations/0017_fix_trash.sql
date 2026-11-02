-- ============================================================
-- Migration 0017: fix trash (0016 used wrong policy names, roles, columns)
-- ============================================================

-- 1. Trashed memberships no longer count as membership
CREATE OR REPLACE FUNCTION is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_id = p_group_id
      AND user_id = p_user_id
      AND trashed_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION is_group_admin(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_id = p_group_id
      AND user_id = p_user_id
      AND role = 'ADMIN'
      AND trashed_at IS NULL
  );
$$;

-- 2. Policies: remove 0016's extras, recreate the real ones with trash checks
DROP POLICY IF EXISTS "groups_select" ON groups;
DROP POLICY IF EXISTS "activities_select" ON academic_activities;
DROP POLICY IF EXISTS "memberships_select" ON group_memberships;

DROP POLICY IF EXISTS "groups_select_member" ON groups;
CREATE POLICY "groups_select_member" ON groups
  FOR SELECT
  USING (trashed_at IS NULL AND is_group_member(id, auth.uid()));

DROP POLICY IF EXISTS "activities_select_member" ON academic_activities;
CREATE POLICY "activities_select_member" ON academic_activities
  FOR SELECT
  USING (trashed_at IS NULL AND is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "memberships_select_fellow_member" ON group_memberships;
CREATE POLICY "memberships_select_fellow_member" ON group_memberships
  FOR SELECT
  USING (trashed_at IS NULL AND is_group_member(group_id, auth.uid()));

-- 3. Ownership lock: allow only one exception (detaching a trashed task to personal)
CREATE OR REPLACE FUNCTION prevent_activity_ownership_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF new.group_id IS DISTINCT FROM old.group_id THEN
    IF NOT (old.trashed_at IS NOT NULL AND new.group_id IS NULL AND new.trashed_at IS NULL) THEN
      RAISE EXCEPTION 'group_id cannot be changed';
    END IF;
  END IF;
  IF new.created_by IS DISTINCT FROM old.created_by THEN
    RAISE EXCEPTION 'created_by cannot be changed';
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS activities_lock_ownership ON academic_activities;
CREATE TRIGGER activities_lock_ownership
BEFORE UPDATE ON academic_activities
FOR EACH ROW EXECUTE FUNCTION prevent_activity_ownership_change();

-- 4. Leave group and join by code must respect trash
CREATE OR REPLACE FUNCTION leave_group(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role membership_role;
  admin_count int;
BEGIN
  SELECT role INTO caller_role
  FROM group_memberships
  WHERE group_id = p_group_id AND user_id = auth.uid() AND trashed_at IS NULL;

  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'You are not a member of this group';
  END IF;

  IF caller_role = 'ADMIN' THEN
    SELECT count(*) INTO admin_count
    FROM group_memberships
    WHERE group_id = p_group_id AND role = 'ADMIN' AND trashed_at IS NULL;

    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'You are the last Admin. Promote someone else before leaving.';
    END IF;
  END IF;

  DELETE FROM group_memberships
  WHERE group_id = p_group_id AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION accept_group_invitation(p_code text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
  already_member boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to accept an invitation';
  END IF;

  SELECT gi.group_id INTO inv
  FROM group_invitations gi
  JOIN groups g ON g.id = gi.group_id
  WHERE gi.code = p_code
    AND gi.revoked_at IS NULL
    AND gi.expires_at > now()
    AND g.trashed_at IS NULL;

  IF inv IS NULL THEN
    RETURN json_build_object('result', 'invalid');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_id = inv.group_id AND user_id = auth.uid()
  ) INTO already_member;

  IF already_member THEN
    RETURN json_build_object('result', 'already_member', 'group_id', inv.group_id);
  END IF;

  INSERT INTO group_memberships (group_id, user_id, role)
  VALUES (inv.group_id, auth.uid(), 'MEMBER');

  RETURN json_build_object('result', 'joined', 'group_id', inv.group_id);
END;
$$;

-- 5. archive_group: admins only; also revokes invitation codes
CREATE OR REPLACE FUNCTION archive_group(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_group_admin(p_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only a group admin can delete a group.';
  END IF;

  UPDATE groups SET trashed_at = now() WHERE id = p_group_id;
  UPDATE group_memberships SET trashed_at = now() WHERE group_id = p_group_id;
  UPDATE academic_activities SET trashed_at = now() WHERE group_id = p_group_id;
  UPDATE group_invitations SET revoked_at = now()
    WHERE group_id = p_group_id AND revoked_at IS NULL;
END;
$$;

-- 6. restore_group: only someone who was an admin
CREATE OR REPLACE FUNCTION restore_group(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM groups WHERE id = p_group_id AND trashed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Group is not in the trash.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_id = p_group_id AND user_id = auth.uid() AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only a former admin can restore a group.';
  END IF;

  UPDATE groups SET trashed_at = NULL WHERE id = p_group_id;
  UPDATE group_memberships SET trashed_at = NULL WHERE group_id = p_group_id;
  UPDATE academic_activities SET trashed_at = NULL WHERE group_id = p_group_id;
END;
$$;

-- 7. restore_tasks_as_personal: your own tasks only, detached from the group
CREATE OR REPLACE FUNCTION restore_tasks_as_personal(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM groups WHERE id = p_group_id AND trashed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Group is not in the trash.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_id = p_group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You were not a member of this group.';
  END IF;

  UPDATE academic_activities
  SET group_id = NULL, subject_id = NULL, trashed_at = NULL
  WHERE group_id = p_group_id
    AND created_by = auth.uid()
    AND trashed_at IS NOT NULL;
END;
$$;

-- 8. permanently_delete_group: only a former admin, only from the trash
CREATE OR REPLACE FUNCTION permanently_delete_group(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM groups WHERE id = p_group_id AND trashed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Group is not in the trash.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_id = p_group_id AND user_id = auth.uid() AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only a former admin can permanently delete a group.';
  END IF;

  DELETE FROM academic_activities WHERE group_id = p_group_id;
  DELETE FROM group_invitations WHERE group_id = p_group_id;
  DELETE FROM subjects WHERE group_id = p_group_id;
  DELETE FROM group_memberships WHERE group_id = p_group_id;
  DELETE FROM groups WHERE id = p_group_id;
END;
$$;

-- 9. The two list functions return different columns now, so recreate them
DROP FUNCTION IF EXISTS list_trashed_groups();
DROP FUNCTION IF EXISTS list_trashed_tasks();

CREATE FUNCTION list_trashed_groups()
RETURNS TABLE (id uuid, name text, description text, icon_name text, trashed_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT g.id, g.name::text, g.description::text, g.icon_name::text, g.trashed_at
  FROM groups g
  JOIN group_memberships gm
    ON gm.group_id = g.id AND gm.user_id = auth.uid() AND gm.role = 'ADMIN'
  WHERE g.trashed_at IS NOT NULL
  ORDER BY g.trashed_at DESC;
$$;

CREATE FUNCTION list_trashed_tasks()
RETURNS TABLE (
  id uuid, title text, due_at timestamptz, activity_type text,
  group_id uuid, group_name text, trashed_at timestamptz, is_mine boolean
)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT a.id, a.title::text, a.due_at, a.activity_type::text,
         a.group_id, g.name::text, a.trashed_at, (a.created_by = auth.uid())
  FROM academic_activities a
  JOIN groups g ON g.id = a.group_id AND g.trashed_at IS NOT NULL
  JOIN group_memberships gm ON gm.group_id = a.group_id AND gm.user_id = auth.uid()
  WHERE a.trashed_at IS NOT NULL
  ORDER BY a.trashed_at DESC, a.due_at;
$$;

-- 10. Only signed-in users can run any of these
REVOKE EXECUTE ON FUNCTION
  archive_group(uuid), restore_group(uuid), restore_tasks_as_personal(uuid),
  permanently_delete_group(uuid), list_trashed_groups(), list_trashed_tasks()
FROM public, anon;

GRANT EXECUTE ON FUNCTION
  archive_group(uuid), restore_group(uuid), restore_tasks_as_personal(uuid),
  permanently_delete_group(uuid), list_trashed_groups(), list_trashed_tasks()
TO authenticated;