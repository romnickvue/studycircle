-- ============================================================
-- Migration 0016: Trash (Delete Group)
-- ============================================================

-- 1. Add trashed_at columns
-- ============================================================

ALTER TABLE groups
  ADD COLUMN trashed_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE academic_activities
  ADD COLUMN trashed_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE group_memberships
  ADD COLUMN trashed_at TIMESTAMPTZ DEFAULT NULL;


-- 2. Update RLS policies to exclude trashed rows
-- ============================================================

-- groups: exclude trashed from normal select
DROP POLICY IF EXISTS "groups_select" ON groups;
CREATE POLICY "groups_select" ON groups
  FOR SELECT TO authenticated
  USING (
    trashed_at IS NULL
    AND (
      created_by = auth.uid()
      OR is_group_member(id, auth.uid())
    )
  );

-- academic_activities: exclude trashed
DROP POLICY IF EXISTS "activities_select" ON academic_activities;
CREATE POLICY "activities_select" ON academic_activities
  FOR SELECT TO authenticated
  USING (
    trashed_at IS NULL
    AND (
      group_id IS NULL AND created_by = auth.uid()
      OR group_id IS NOT NULL AND is_group_member(group_id, auth.uid())
    )
  );

-- group_memberships: exclude trashed
DROP POLICY IF EXISTS "memberships_select" ON group_memberships;
CREATE POLICY "memberships_select" ON group_memberships
  FOR SELECT TO authenticated
  USING (
    trashed_at IS NULL
    AND (
      user_id = auth.uid()
      OR is_group_member(group_id, auth.uid())
    )
  );


-- 3. RPC: archive_group
-- Sets trashed_at on the group, its memberships, and its tasks.
-- Caller must be owner or admin.
-- ============================================================

CREATE OR REPLACE FUNCTION archive_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check caller is owner or admin
  SELECT role INTO v_role
  FROM group_memberships
  WHERE group_id = p_group_id
    AND user_id = auth.uid()
    AND trashed_at IS NULL;

  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only the group owner or admin can delete a group.';
  END IF;

  -- Trash the group
  UPDATE groups
  SET trashed_at = NOW()
  WHERE id = p_group_id;

  -- Trash all memberships
  UPDATE group_memberships
  SET trashed_at = NOW()
  WHERE group_id = p_group_id;

  -- Trash all tasks belonging to this group
  UPDATE academic_activities
  SET trashed_at = NOW()
  WHERE group_id = p_group_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION archive_group(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION archive_group(UUID) TO authenticated;


-- 4. RPC: list_trashed_groups
-- Returns groups the caller trashed or was admin of.
-- ============================================================

CREATE OR REPLACE FUNCTION list_trashed_groups()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  icon_name TEXT,
  trashed_at TIMESTAMPTZ,
  user_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.description,
    g.icon_name,
    g.trashed_at,
    gm.role AS user_role
  FROM groups g
  JOIN group_memberships gm
    ON gm.group_id = g.id
    AND gm.user_id = auth.uid()
    AND gm.role IN ('owner', 'admin')
  WHERE g.trashed_at IS NOT NULL
  ORDER BY g.trashed_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION list_trashed_groups() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION list_trashed_groups() TO authenticated;


-- 5. RPC: list_trashed_tasks
-- Returns tasks from trashed groups where the caller was a member.
-- ============================================================

CREATE OR REPLACE FUNCTION list_trashed_tasks()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  due_date DATE,
  status TEXT,
  activity_type TEXT,
  group_id UUID,
  group_name TEXT,
  trashed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.description,
    a.due_date,
    a.status,
    a.activity_type,
    a.group_id,
    g.name AS group_name,
    a.trashed_at
  FROM academic_activities a
  JOIN groups g ON g.id = a.group_id
  JOIN group_memberships gm
    ON gm.group_id = a.group_id
    AND gm.user_id = auth.uid()
  WHERE a.trashed_at IS NOT NULL
    AND g.trashed_at IS NOT NULL
  ORDER BY a.trashed_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION list_trashed_tasks() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION list_trashed_tasks() TO authenticated;


-- 6. RPC: restore_group
-- Clears trashed_at on group + memberships + tasks.
-- Caller must have been owner or admin.
-- ============================================================

CREATE OR REPLACE FUNCTION restore_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check caller was owner or admin (membership may be trashed)
  SELECT role INTO v_role
  FROM group_memberships
  WHERE group_id = p_group_id
    AND user_id = auth.uid();

  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only a former owner or admin can restore a group.';
  END IF;

  -- Restore group
  UPDATE groups
  SET trashed_at = NULL
  WHERE id = p_group_id;

  -- Restore memberships
  UPDATE group_memberships
  SET trashed_at = NULL
  WHERE group_id = p_group_id;

  -- Restore tasks
  UPDATE academic_activities
  SET trashed_at = NULL
  WHERE group_id = p_group_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION restore_group(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION restore_group(UUID) TO authenticated;


-- 7. RPC: restore_tasks_as_personal
-- Detaches the caller's trashed tasks from the group (makes them personal).
-- Any former member can call this.
-- ============================================================

CREATE OR REPLACE FUNCTION restore_tasks_as_personal(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_was_member BOOLEAN;
BEGIN
  -- Confirm caller was a member of this group
  SELECT EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
  ) INTO v_was_member;

  IF NOT v_was_member THEN
    RAISE EXCEPTION 'You were not a member of this group.';
  END IF;

  -- Detach caller's tasks: clear group_id and trashed_at
  UPDATE academic_activities
  SET group_id = NULL,
      trashed_at = NULL
  WHERE group_id = p_group_id
    AND created_by = auth.uid()
    AND trashed_at IS NOT NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION restore_tasks_as_personal(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION restore_tasks_as_personal(UUID) TO authenticated;


-- 8. RPC: permanently_delete_group
-- Hard-deletes the trashed group and all its data.
-- Caller must have been owner or admin.
-- ============================================================

CREATE OR REPLACE FUNCTION permanently_delete_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_trashed BOOLEAN;
BEGIN
  -- Confirm group is trashed
  SELECT (trashed_at IS NOT NULL) INTO v_trashed
  FROM groups WHERE id = p_group_id;

  IF NOT v_trashed THEN
    RAISE EXCEPTION 'Group is not in trash.';
  END IF;

  -- Check caller was owner or admin
  SELECT role INTO v_role
  FROM group_memberships
  WHERE group_id = p_group_id
    AND user_id = auth.uid();

  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only a former owner or admin can permanently delete a group.';
  END IF;

  -- Hard-delete tasks first (FK constraint)
  DELETE FROM academic_activities
  WHERE group_id = p_group_id;

  -- Hard-delete memberships
  DELETE FROM group_memberships
  WHERE group_id = p_group_id;

  -- Hard-delete invitations
  DELETE FROM group_invitations
  WHERE group_id = p_group_id;

  -- Hard-delete subjects
  DELETE FROM subjects
  WHERE group_id = p_group_id;

  -- Hard-delete the group
  DELETE FROM groups
  WHERE id = p_group_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION permanently_delete_group(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION permanently_delete_group(UUID) TO authenticated;