-- Curtidas: cada um vê só as próprias
drop policy if exists "curtidas visiveis" on public.curtidas_posts;
create policy "ver proprias curtidas" on public.curtidas_posts for select to authenticated
  using (usuario_id = auth.uid());

drop policy if exists "curtidas videos visiveis" on public.curtidas_videos;
create policy "ver proprias curtidas videos" on public.curtidas_videos for select to authenticated
  using (usuario_id = auth.uid());

-- Seguidores: só relações em que o usuário participa
drop policy if exists "seguidores visiveis" on public.seguidores;
create policy "ver proprias relacoes" on public.seguidores for select to authenticated
  using (seguidor_id = auth.uid() or seguido_id = auth.uid());

create or replace function public.contagem_seguidores(_usuario_id uuid)
returns table(seguidores bigint, seguindo bigint)
language sql stable security definer set search_path = public
as $$
  select
    (select count(*) from public.seguidores s where s.seguido_id = _usuario_id),
    (select count(*) from public.seguidores s where s.seguidor_id = _usuario_id)
  where auth.uid() is not null
$$;
revoke execute on function public.contagem_seguidores(uuid) from public, anon;
grant execute on function public.contagem_seguidores(uuid) to authenticated;

-- Membros de clã: só a própria participação
drop policy if exists "membros visiveis" on public.cla_membros;
create policy "ver propria participacao" on public.cla_membros for select to authenticated
  using (usuario_id = auth.uid());

create or replace function public.membros_por_cla()
returns table(cla_id uuid, total bigint)
language sql stable security definer set search_path = public
as $$
  select m.cla_id, count(*) from public.cla_membros m
  where auth.uid() is not null
  group by m.cla_id
$$;
revoke execute on function public.membros_por_cla() from public, anon;
grant execute on function public.membros_por_cla() to authenticated;

-- Comentários: herdam a visibilidade do post
drop policy if exists "comentarios visiveis" on public.comentarios;
create policy "comentarios de posts visiveis" on public.comentarios for select to authenticated
  using (exists (select 1 from public.posts p where p.id = comentarios.post_id));

-- Perfis: próprio, admin ou cadastro completo
drop policy if exists "usuarios visiveis" on public.usuarios;
create policy "perfis completos visiveis" on public.usuarios for select to authenticated
  using (id = auth.uid() or foto is not null or public.has_role(auth.uid(), 'admin'));

-- Config: só admin lê a tabela; checkout via função
drop policy if exists "config visivel" on public.config;
create policy "admin ve config" on public.config for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
revoke select on public.config from anon;

create or replace function public.config_checkout()
returns table(chave_pix text, nome_recebedor text, cidade text, whatsapp text)
language sql stable security definer set search_path = public
as $$
  select c.chave_pix, c.nome_recebedor, c.cidade, c.whatsapp
  from public.config c
  where c.id = 1 and auth.uid() is not null
$$;
revoke execute on function public.config_checkout() from public, anon;
grant execute on function public.config_checkout() to authenticated;

-- Mídia: dono, admin ou arquivo publicado
create or replace function public.midia_publicada(_caminho text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.posts where foto_video = _caminho)
      or exists (select 1 from public.videos where video_url = _caminho)
      or exists (select 1 from public.stories where midia_url = _caminho)
      or exists (select 1 from public.usuarios where foto = _caminho)
$$;
revoke execute on function public.midia_publicada(text) from public, anon;
grant execute on function public.midia_publicada(text) to authenticated;

drop policy if exists "midia visivel para logados" on storage.objects;
create policy "midia propria ou publicada" on storage.objects for select to authenticated
  using (
    bucket_id = 'midia' and (
      (storage.foldername(name))[1] = (auth.uid())::text
      or public.has_role(auth.uid(), 'admin')
      or public.midia_publicada(name)
    )
  );