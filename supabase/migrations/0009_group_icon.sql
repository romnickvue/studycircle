-- Optional custom icon for a group, chosen by an Admin.
-- Null means "use the default icon" (handled in the app, not the database).
alter table groups add column icon_name text;