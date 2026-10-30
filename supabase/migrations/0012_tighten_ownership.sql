-- A: a creator can only edit/delete their activities while still a member (or if personal)
drop policy "activities_update_creator_or_admin" on academic_activities;
drop policy "activities_delete_creator_or_admin" on academic_activities;

create policy "activities_update_creator_or_admin"
on academic_activities for update
using (
  (created_by = auth.uid() and (group_id is null or is_group_member(group_id, auth.uid())))
  or is_group_admin(group_id, auth.uid())
)
with check (
  (created_by = auth.uid() and (group_id is null or is_group_member(group_id, auth.uid())))
  or is_group_admin(group_id, auth.uid())
);

create policy "activities_delete_creator_or_admin"
on academic_activities for delete
using (
  (created_by = auth.uid() and (group_id is null or is_group_member(group_id, auth.uid())))
  or is_group_admin(group_id, auth.uid())
);

-- B: group_id and created_by can never change after creation
create or replace function prevent_ownership_change()
returns trigger as $$
begin
  if new.group_id is distinct from old.group_id then
    raise exception 'group_id cannot be changed';
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed';
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger activities_lock_ownership
before update on academic_activities
for each row execute function prevent_ownership_change();

create trigger subjects_lock_ownership
before update on subjects
for each row execute function prevent_ownership_change();