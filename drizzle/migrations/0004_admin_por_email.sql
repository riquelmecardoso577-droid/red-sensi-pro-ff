create table public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);
grant all on public.admin_emails to service_role;
alter table public.admin_emails enable row level security;

create or replace function public.conceder_admin_por_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null
     and exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email))
     and not exists (select 1 from public.user_roles r where r.user_id = new.id and r.role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
revoke execute on function public.conceder_admin_por_email() from public, anon, authenticated;

create trigger on_auth_user_admin_email
after insert or update of email_confirmed_at on auth.users
for each row execute function public.conceder_admin_por_email();