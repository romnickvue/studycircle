-- activity_progress table
create table activity_progress (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references academic_activities(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status progress_status not null default 'NOT_STARTED',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create trigger set_activity_progress_updated_at
before update on activity_progress
for each row
execute function set_updated_at();

-- Automatically manage completed_at based on status (DATABASE.md §24)
create or replace function sync_progress_completed_at()
returns trigger as $$
begin
  if new.status = 'COMPLETED' then
    new.completed_at := now();
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_progress_completed_at
before insert or update on activity_progress
for each row
execute function sync_progress_completed_at();

-- Row Level Security: only the owning user can see or modify their own progress
alter table activity_progress enable row level security;

create policy "progress_select_own"
on activity_progress for select
using (user_id = auth.uid());

create policy "progress_insert_own"
on activity_progress for insert
with check (user_id = auth.uid());

create policy "progress_update_own"
on activity_progress for update
using (user_id = auth.uid());