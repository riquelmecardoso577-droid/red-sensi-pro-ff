-- 1) Fim da auto-promoção a admin
drop function if exists public.reivindicar_admin();
drop function if exists public.existe_admin();

-- 2) Perfis: permissões por coluna de verdade
revoke all on public.usuarios from anon, authenticated;
grant select (id, nome, foto, idade, nick_ff, patente, capas_hoje, capas_dia, bio, verificado, created_at) on public.usuarios to authenticated;
grant update (nome, foto, patente, bio) on public.usuarios to authenticated;

alter table public.usuarios add column if not exists capas_pendentes integer not null default 0;
alter table public.usuarios add column if not exists capas_pendentes_dia date;
grant select (capas_pendentes, capas_pendentes_dia) on public.usuarios to authenticated;

create or replace function public.enviar_capas(_n integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'login necessario'; end if;
  if _n is null or _n < 0 or _n > 300 then raise exception 'valor de capas invalido'; end if;
  update public.usuarios
     set capas_pendentes = _n,
         capas_pendentes_dia = (now() at time zone 'America/Sao_Paulo')::date
   where id = auth.uid();
end $$;
revoke execute on function public.enviar_capas(integer) from public, anon;
grant execute on function public.enviar_capas(integer) to authenticated;

create or replace function public.admin_capas_pendentes()
returns table(id uuid, nome text, nick_ff text, foto text, capas_pendentes integer, capas_hoje integer, capas_dia date)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'acesso negado'; end if;
  return query select u.id, u.nome, u.nick_ff, u.foto, u.capas_pendentes, u.capas_hoje, u.capas_dia
    from public.usuarios u
   where u.capas_pendentes_dia = (now() at time zone 'America/Sao_Paulo')::date
   order by u.capas_pendentes desc;
end $$;
revoke execute on function public.admin_capas_pendentes() from public, anon;
grant execute on function public.admin_capas_pendentes() to authenticated;

create or replace function public.admin_decidir_capas(_usuario_id uuid, _aprovar boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'acesso negado'; end if;
  update public.usuarios
     set capas_hoje = case when _aprovar then capas_pendentes else capas_hoje end,
         capas_pendentes = 0,
         capas_pendentes_dia = null
   where id = _usuario_id
     and capas_pendentes_dia = (now() at time zone 'America/Sao_Paulo')::date;
end $$;
revoke execute on function public.admin_decidir_capas(uuid, boolean) from public, anon;
grant execute on function public.admin_decidir_capas(uuid, boolean) to authenticated;

-- 3) Sensis: só logados, valores bloqueados escondidos
revoke all on public.sensis from anon, authenticated;
grant select (id, marca, modelo, geral, preco, destaque, created_at) on public.sensis to authenticated;
grant insert, update, delete on public.sensis to authenticated;
drop policy if exists "sensis visiveis" on public.sensis;
create policy "sensis para logados" on public.sensis for select to authenticated
  using (auth.uid() is not null);

-- 4) Posts e vídeos: só de autores com cadastro completo
drop policy if exists "posts visiveis" on public.posts;
create policy "posts de perfis completos" on public.posts for select to authenticated
  using (
    usuario_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.usuarios u where u.id = posts.usuario_id and u.foto is not null)
  );

drop policy if exists "videos visiveis" on public.videos;
create policy "videos de perfis completos" on public.videos for select to authenticated
  using (
    usuario_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.usuarios u where u.id = videos.usuario_id and u.foto is not null)
  );

-- 5) Stories: só últimas 24h
drop policy if exists "stories visiveis" on public.stories;
create policy "stories das ultimas 24h" on public.stories for select to authenticated
  using (
    created_at > now() - interval '24 hours'
    or usuario_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
  );

-- 6) Clãs: só com líder ativo
drop policy if exists "clas visiveis" on public.clas;
create policy "clas com lider" on public.clas for select to authenticated
  using (lider_id is not null or public.has_role(auth.uid(), 'admin'));

-- 7) Desafios: somem 30 dias após o fim
drop policy if exists "desafios visiveis" on public.desafios;
create policy "desafios recentes" on public.desafios for select to authenticated
  using (
    termina_em is null
    or termina_em > now() - interval '30 days'
    or public.has_role(auth.uid(), 'admin')
  );