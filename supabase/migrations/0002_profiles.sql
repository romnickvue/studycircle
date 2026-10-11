-- profiles table: one row per auth user
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- keep updated_at current on every change
create trigger set_profiles_updated_at
before update on profiles
for each row
execute function set_updated_at();

-- auto-create a profile row whenever someone signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'New User'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function handle_new_user();

-- Row Level Security
alter table profiles enable row level security;

-- users can read their own profile
create policy "profiles_select_own"
on profiles for select
using (auth.uid() = id);

-- users can update their own profile
create policy "profiles_update_own"
on profiles for update
using (auth.uid() = id);