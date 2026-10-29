-- A personal task is an activity with no group
alter table academic_activities
  alter column group_id drop not null;

-- Personal tasks can't have a subject (subjects belong to groups)
alter table academic_activities
  add constraint personal_task_has_no_subject
  check (group_id is not null or subject_id is null);

-- Only the creator can see their personal tasks
create policy "activities_select_personal"
on academic_activities for select
using (group_id is null and created_by = auth.uid());

-- Only the creator can create their personal tasks
create policy "activities_insert_personal"
on academic_activities for insert
with check (group_id is null and created_by = auth.uid());