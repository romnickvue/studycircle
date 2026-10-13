-- activity type enum
create type activity_type as enum (
  'QUIZ',
  'ASSIGNMENT',
  'EXAM',
  'PROJECT',
  'RECITATION',
  'PRESENTATION',
  'OTHER'
);

-- academic_activities table
create table academic_activities (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  created_by uuid not null references profiles(id),
  title text not null,
  description text,
  activity_type activity_type not null,
  starts_at timestamptz,
  due_at timestamptz,
  location text,
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_academic_activities_updated_at
before update on academic_activities
for each row
execute function set_updated_at();

-- Enforce that a linked subject belongs to the same group as the activity (DATABASE.md §18)
create or replace function check_activity_subject_same_group()
returns trigger as $$
begin
  if new.subject_id is not null then
    if not exists (
      select 1 from subjects
      where id = new.subject_id and group_id = new.group_id
    ) then
      raise exception 'Subject does not belong to the same group as this activity';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger enforce_activity_subject_same_group
before insert or update on academic_activities
for each row
execute function check_activity_subject_same_group();

-- Row Level Security
alter table academic_activities enable row level security;

create policy "activities_select_member"
on academic_activities for select
using (is_group_member(group_id, auth.uid()));

create policy "activities_insert_member"
on academic_activities for insert
with check (is_group_member(group_id, auth.uid()) and created_by = auth.uid());

create policy "activities_update_creator_or_admin"
on academic_activities for update
using (created_by = auth.uid() or is_group_admin(group_id, auth.uid()));

create policy "activities_delete_creator_or_admin"
on academic_activities for delete
using (created_by = auth.uid() or is_group_admin(group_id, auth.uid()));