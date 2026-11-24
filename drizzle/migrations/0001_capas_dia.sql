alter table public.usuarios add column capas_dia date not null default ((now() at time zone 'America/Sao_Paulo')::date);
grant select (capas_dia) on public.usuarios to authenticated;

create or replace function public.usuarios_marcar_capas_dia()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.capas_hoje is distinct from old.capas_hoje then
    new.capas_dia := (now() at time zone 'America/Sao_Paulo')::date;
  end if;
  return new;
end $$;
create trigger trg_usuarios_capas_dia before update of capas_hoje on public.usuarios
for each row execute function public.usuarios_marcar_capas_dia();
