drop policy "subjects_update_member" on subjects;
drop policy "subjects_delete_member" on subjects;

create policy "subjects_update_creator_or_admin"
on subjects for update
using (
  (created_by = auth.uid() and is_group_member(group_id, auth.uid()))
  or is_group_admin(group_id, auth.uid())
)
with check (
  (created_by = auth.uid() and is_group_member(group_id, auth.uid()))
  or is_group_admin(group_id, auth.uid())
);

create policy "subjects_delete_creator_or_admin"
on subjects for delete
using (
  (created_by = auth.uid() and is_group_member(group_id, auth.uid()))
  or is_group_admin(group_id, auth.uid())
);