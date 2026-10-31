-- Helper: run one statement as a given user/role, then roll everything back
create or replace function pg_temp.as_role(uid uuid, role_name text, stmt text)
returns text
language plpgsql
as $$
declare
  n int;
begin
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid, 'role', role_name)::text, true);
    perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
    execute format('set local role %I', role_name);
    execute stmt;
    get diagnostics n = row_count;
    raise exception 'ROLLBACK_TEST:%', n;
  exception when others then
    if sqlerrm like 'ROLLBACK_TEST:%' then
      return 'rows=' || split_part(sqlerrm, ':', 2);
    end if;
    return 'error: ' || sqlerrm;
  end;
end;
$$;

-- Helper: the four test accounts
create or replace function pg_temp.u(n text)
returns uuid
language sql
as $$
  select (case n
    when 'romnick'  then '5972b6bf-b193-421c-a7e1-92e6f9e1d765'
    when 'jazel'    then 'da4d6006-d278-45b2-92e4-4de65f611f94'
    when 'karl'     then '2bb120eb-17e9-40aa-bda4-ca6e27e67c65'
    when 'princess' then 'ce71823d-e03e-4468-9506-2785332760e6'
  end)::uuid
$$;

select n, test, expected, result,
  case
    when expected = 'deny' and (result like 'error%' or result = 'rows=0') then 'PASS'
    when expected = 'allow' and result like 'rows=%' and result <> 'rows=0' then 'PASS'
    else 'FAIL'
  end as verdict
from (values
  -- READING
  (1,  'Outsider cannot read group tasks', 'deny',
       pg_temp.as_role(pg_temp.u('princess'), 'authenticated', $q$select * from academic_activities where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133'$q$)),
  (2,  'Outsider cannot read subjects', 'deny',
       pg_temp.as_role(pg_temp.u('princess'), 'authenticated', $q$select * from subjects where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133'$q$)),
  (3,  'Outsider cannot read the member list', 'deny',
       pg_temp.as_role(pg_temp.u('princess'), 'authenticated', $q$select * from group_memberships where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133'$q$)),
  (4,  'Outsider cannot read the group itself', 'deny',
       pg_temp.as_role(pg_temp.u('princess'), 'authenticated', $q$select * from groups where id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133'$q$)),
  (5,  'Outsider cannot read a stranger profile', 'deny',
       pg_temp.as_role(pg_temp.u('princess'), 'authenticated', $q$select * from profiles where id = 'da4d6006-d278-45b2-92e4-4de65f611f94'$q$)),
  (6,  'Member can read group tasks', 'allow',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$select * from academic_activities where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133'$q$)),
  (7,  'Member can read the member list', 'allow',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$select * from group_memberships where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133'$q$)),
  (8,  'Member cannot read invitations', 'deny',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$select * from group_invitations where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133'$q$)),
  (9,  'Cannot read another person progress', 'deny',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$select * from activity_progress where user_id = '5972b6bf-b193-421c-a7e1-92e6f9e1d765'$q$)),
  (10, 'Cannot read another person personal tasks', 'deny',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$select * from academic_activities where group_id is null and created_by = '5972b6bf-b193-421c-a7e1-92e6f9e1d765'$q$)),
  (11, 'Signed-out visitor cannot read tasks', 'deny',
       pg_temp.as_role(null, 'anon', $q$select * from academic_activities$q$)),
  (12, 'Signed-out visitor cannot preview a code', 'deny',
       pg_temp.as_role(null, 'anon', $q$select preview_invitation('ABCDEFGH')$q$)),

  -- WRITING TASKS AND SUBJECTS
  (13, 'Outsider cannot add a task to the group', 'deny',
       pg_temp.as_role(pg_temp.u('princess'), 'authenticated', $q$insert into academic_activities (group_id, created_by, title, activity_type) values ('b29136e2-6bb9-4662-b5b5-1fdd539fb133', 'ce71823d-e03e-4468-9506-2785332760e6', 'rls test', 'OTHER')$q$)),
  (14, 'Member cannot add a task as someone else', 'deny',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$insert into academic_activities (group_id, created_by, title, activity_type) values ('b29136e2-6bb9-4662-b5b5-1fdd539fb133', '5972b6bf-b193-421c-a7e1-92e6f9e1d765', 'rls test', 'OTHER')$q$)),
  (15, 'Member cannot edit others tasks', 'deny',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$update academic_activities set title = 'x' where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133' and created_by <> 'da4d6006-d278-45b2-92e4-4de65f611f94'$q$)),
  (16, 'Member cannot delete others tasks', 'deny',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$delete from academic_activities where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133' and created_by <> 'da4d6006-d278-45b2-92e4-4de65f611f94'$q$)),
  (17, 'Admin can edit any task in own group', 'allow',
       pg_temp.as_role(pg_temp.u('romnick'), 'authenticated', $q$update academic_activities set title = title where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133'$q$)),
  (18, 'Task cannot be moved to another group', 'deny',
       pg_temp.as_role(pg_temp.u('romnick'), 'authenticated', $q$update academic_activities set group_id = 'a402d133-8d58-4802-8e49-2088053ffdb0' where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133'$q$)),
  (19, 'Member cannot edit others subjects', 'deny',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$update subjects set name = 'x' where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133' and created_by <> 'da4d6006-d278-45b2-92e4-4de65f611f94'$q$)),
  (20, 'Member cannot delete others subjects', 'deny',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$delete from subjects where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133' and created_by <> 'da4d6006-d278-45b2-92e4-4de65f611f94'$q$)),
  (21, 'Admin can edit a subject in own group', 'allow',
       pg_temp.as_role(pg_temp.u('romnick'), 'authenticated', $q$update subjects set name = name where group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133'$q$)),
  (22, 'Cannot add a personal task as someone else', 'deny',
       pg_temp.as_role(pg_temp.u('karl'), 'authenticated', $q$insert into academic_activities (group_id, created_by, title, activity_type) values (null, '5972b6bf-b193-421c-a7e1-92e6f9e1d765', 'rls test', 'OTHER')$q$)),

  -- MEMBERSHIP AND INVITATIONS
  (23, 'Member cannot self-promote with a direct update', 'deny',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$update group_memberships set role = 'ADMIN' where user_id = 'da4d6006-d278-45b2-92e4-4de65f611f94' and group_id = 'b29136e2-6bb9-4662-b5b5-1fdd539fb133'$q$)),
  (24, 'Outsider cannot add self to a group directly', 'deny',
       pg_temp.as_role(pg_temp.u('princess'), 'authenticated', $q$insert into group_memberships (group_id, user_id, role) values ('b29136e2-6bb9-4662-b5b5-1fdd539fb133', 'ce71823d-e03e-4468-9506-2785332760e6', 'MEMBER')$q$)),
  (25, 'Member cannot promote someone', 'deny',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$select promote_member('b29136e2-6bb9-4662-b5b5-1fdd539fb133', '2bb120eb-17e9-40aa-bda4-ca6e27e67c65')$q$)),
  (26, 'Member cannot remove someone', 'deny',
       pg_temp.as_role(pg_temp.u('jazel'), 'authenticated', $q$select remove_member('b29136e2-6bb9-4662-b5b5-1fdd539fb133', '2bb120eb-17e9-40aa-bda4-ca6e27e67c65')$q$)),
  (27, 'Outsider cannot generate a code', 'deny',
       pg_temp.as_role(pg_temp.u('princess'), 'authenticated', $q$select generate_group_invitation('b29136e2-6bb9-4662-b5b5-1fdd539fb133')$q$)),
  (28, 'Admin can promote a member', 'allow',
       pg_temp.as_role(pg_temp.u('romnick'), 'authenticated', $q$select promote_member('b29136e2-6bb9-4662-b5b5-1fdd539fb133', '2bb120eb-17e9-40aa-bda4-ca6e27e67c65')$q$)),
  (29, 'Last admin cannot be demoted', 'deny',
       pg_temp.as_role(pg_temp.u('romnick'), 'authenticated', $q$select demote_member('b29136e2-6bb9-4662-b5b5-1fdd539fb133', '5972b6bf-b193-421c-a7e1-92e6f9e1d765')$q$)),
  (30, 'Last admin cannot leave the group', 'deny',
       pg_temp.as_role(pg_temp.u('romnick'), 'authenticated', $q$select leave_group('b29136e2-6bb9-4662-b5b5-1fdd539fb133')$q$)),
  (31, 'Admin can generate a code', 'allow',
       pg_temp.as_role(pg_temp.u('romnick'), 'authenticated', $q$select generate_group_invitation('b29136e2-6bb9-4662-b5b5-1fdd539fb133')$q$))
) as t(n, test, expected, result)
order by n;