-- 1. Pin search_path on SECURITY DEFINER functions
alter function accept_group_invitation(text) set search_path = public;
alter function create_group_with_owner(text, text) set search_path = public;
alter function demote_member(uuid, uuid) set search_path = public;
alter function generate_group_invitation(uuid) set search_path = public, extensions;
alter function handle_new_user() set search_path = public;
alter function is_group_admin(uuid, uuid) set search_path = public;
alter function is_group_member(uuid, uuid) set search_path = public;
alter function leave_group(uuid) set search_path = public;
alter function preview_invitation(text) set search_path = public;
alter function promote_member(uuid, uuid) set search_path = public;
alter function remove_member(uuid, uuid) set search_path = public;

-- trigger helpers
alter function check_activity_subject_same_group() set search_path = public;
alter function set_updated_at() set search_path = public;
alter function sync_progress_completed_at() set search_path = public;

-- 2. Only signed-in users can run the app's functions
revoke execute on function
  accept_group_invitation(text),
  create_group_with_owner(text, text),
  demote_member(uuid, uuid),
  generate_group_invitation(uuid),
  leave_group(uuid),
  promote_member(uuid, uuid),
  remove_member(uuid, uuid),
  preview_invitation(text),
  is_group_admin(uuid, uuid),
  is_group_member(uuid, uuid)
from public, anon;

grant execute on function
  accept_group_invitation(text),
  create_group_with_owner(text, text),
  demote_member(uuid, uuid),
  generate_group_invitation(uuid),
  leave_group(uuid),
  promote_member(uuid, uuid),
  remove_member(uuid, uuid),
  preview_invitation(text),
  is_group_admin(uuid, uuid),
  is_group_member(uuid, uuid)
to authenticated;