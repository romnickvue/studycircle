create or replace function generate_group_invitation(p_group_id uuid)
returns text as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  i int;
begin
  if not is_group_admin(p_group_id, auth.uid()) then
    raise exception 'Only Admins can generate an invitation code';
  end if;

  update group_invitations
  set revoked_at = now()
  where group_id = p_group_id
    and revoked_at is null
    and expires_at > now();

  loop
    new_code := '';
    for i in 1..8 loop
      new_code := new_code || substr(alphabet, (get_byte(gen_random_bytes(1), 0) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from group_invitations where code = new_code);
  end loop;

  insert into group_invitations (group_id, code, created_by, expires_at)
  values (p_group_id, new_code, auth.uid(), now() + interval '3 days');

  return new_code;
end;
$$ language plpgsql security definer;