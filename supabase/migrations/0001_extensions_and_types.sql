-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Shared role enum for group membership
create type membership_role as enum ('ADMIN', 'MEMBER');

-- Shared status enum for personal progress on activities
create type progress_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- Reusable trigger function: keeps an `updated_at` column current on every update
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;