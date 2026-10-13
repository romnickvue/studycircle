-- subjects table
create table subjects (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  code text,
  description text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, name)
);

create trigger set_subjects_updated_at
before update on subjects
for each row
execute function set_updated_at();

-- Row Level Security
alter table subjects enable row level security;

create policy "subjects_select_member"
on subjects for select
using (is_group_member(group_id, auth.uid()));

create policy "subjects_insert_member"
on subjects for insert
with check (is_group_member(group_id, auth.uid()) and created_by = auth.uid());

create policy "subjects_update_member"
on subjects for update
using (is_group_member(group_id, auth.uid()));

create policy "subjects_delete_member"
on subjects for delete
using (is_group_member(group_id, auth.uid()));