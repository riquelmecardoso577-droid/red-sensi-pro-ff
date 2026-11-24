
-- ===== PAPÉIS =====
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "ver proprio papel" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.existe_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'admin')
$$;

create or replace function public.reivindicar_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  perform pg_advisory_xact_lock(424242);
  if exists (select 1 from public.user_roles where role = 'admin') then
    return public.has_role(auth.uid(), 'admin');
  end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin');
  return true;
end $$;
revoke execute on function public.reivindicar_admin() from public, anon;
grant execute on function public.reivindicar_admin() to authenticated;

-- ===== USUARIOS =====
create table public.usuarios (
  id uuid primary key,
  nome text not null default '',
  foto text,
  data_nascimento date,
  idade int not null default 0,
  nick_ff text not null default '',
  whatsapp text not null default '',
  patente text not null default 'Bronze',
  capas_hoje int not null default 0 check (capas_hoje between 0 and 9999),
  bio text not null default '' check (char_length(bio) <= 300),
  verificado boolean not null default false,
  created_at timestamptz not null default now()
);
grant select (id, nome, foto, idade, nick_ff, patente, capas_hoje, bio, verificado, created_at) on public.usuarios to authenticated;
grant update (nome, foto, patente, capas_hoje, bio) on public.usuarios to authenticated;
grant all on public.usuarios to service_role;
alter table public.usuarios enable row level security;
create policy "usuarios visiveis" on public.usuarios for select to authenticated using (true);
create policy "editar proprio perfil" on public.usuarios for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.usuarios_calc_idade()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.data_nascimento is not null then
    new.idade := extract(year from age(current_date, new.data_nascimento))::int;
    if new.idade < 13 then
      raise exception 'Cadastro bloqueado: idade minima de 13 anos';
    end if;
  end if;
  return new;
end $$;
create trigger trg_usuarios_idade before insert or update of data_nascimento on public.usuarios
for each row execute function public.usuarios_calc_idade();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare dn date;
begin
  begin
    dn := nullif(new.raw_user_meta_data->>'data_nascimento', '')::date;
  exception when others then dn := null;
  end;
  insert into public.usuarios (id, nome, data_nascimento, nick_ff, whatsapp)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'nome', ''), 80),
    dn,
    left(coalesce(new.raw_user_meta_data->>'nick_ff', ''), 40),
    left(coalesce(new.raw_user_meta_data->>'whatsapp', ''), 20)
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.meus_dados_privados()
returns table (data_nascimento date, whatsapp text)
language sql stable security definer set search_path = public as $$
  select u.data_nascimento, u.whatsapp from public.usuarios u where u.id = auth.uid()
$$;

create or replace function public.admin_listar_usuarios()
returns table (id uuid, nome text, foto text, idade int, data_nascimento date, nick_ff text, whatsapp text, verificado boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'acesso negado'; end if;
  return query select u.id, u.nome, u.foto, u.idade, u.data_nascimento, u.nick_ff, u.whatsapp, u.verificado, u.created_at
    from public.usuarios u order by u.created_at desc;
end $$;

-- ===== SENSIS =====
create table public.sensis (
  id uuid primary key default gen_random_uuid(),
  marca text not null,
  modelo text not null,
  geral int not null default 0,
  vermelho int not null default 0,
  mira2x int not null default 0,
  mira4x int not null default 0,
  awm int not null default 0,
  olhadinha int not null default 0,
  botao int not null default 0,
  dpi int not null default 0,
  preco numeric(10,2) not null default 7.90,
  destaque boolean not null default false,
  created_at timestamptz not null default now()
);
grant select (id, marca, modelo, geral, preco, destaque, created_at) on public.sensis to anon, authenticated;
grant insert, update, delete on public.sensis to authenticated;
grant all on public.sensis to service_role;
alter table public.sensis enable row level security;
create policy "sensis visiveis" on public.sensis for select to anon, authenticated using (true);
create policy "admin cria sensi" on public.sensis for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "admin edita sensi" on public.sensis for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin apaga sensi" on public.sensis for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ===== PEDIDOS =====
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  sensi_id uuid not null references public.sensis(id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.usuarios(id) on delete cascade,
  whatsapp_cliente text not null check (char_length(whatsapp_cliente) between 8 and 20),
  valor numeric(10,2) not null default 7.90,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'reprovado')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.pedidos to authenticated;
grant all on public.pedidos to service_role;
alter table public.pedidos enable row level security;
create policy "ver pedidos" on public.pedidos for select to authenticated using (usuario_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "criar pedido" on public.pedidos for insert to authenticated with check (usuario_id = auth.uid() and status = 'pendente');
create policy "admin atualiza pedido" on public.pedidos for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin apaga pedido" on public.pedidos for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.pedidos_antes_inserir()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select s.preco into new.valor from public.sensis s where s.id = new.sensi_id;
  new.status := 'pendente';
  return new;
end $$;
create trigger trg_pedidos_inserir before insert on public.pedidos
for each row execute function public.pedidos_antes_inserir();

create or replace function public.sensi_valores(_sensi_id uuid)
returns table (geral int, vermelho int, mira2x int, mira4x int, awm int, olhadinha int, botao int, dpi int)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  if public.has_role(auth.uid(), 'admin') or exists (
    select 1 from public.pedidos p where p.sensi_id = _sensi_id and p.usuario_id = auth.uid() and p.status = 'aprovado'
  ) then
    return query select s.geral, s.vermelho, s.mira2x, s.mira4x, s.awm, s.olhadinha, s.botao, s.dpi
      from public.sensis s where s.id = _sensi_id;
  end if;
end $$;

create or replace function public.admin_listar_sensis()
returns setof public.sensis language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'acesso negado'; end if;
  return query select * from public.sensis order by created_at;
end $$;

-- ===== VERIFICADOS =====
create table public.verificados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.usuarios(id) on delete cascade,
  id_ff text not null check (char_length(id_ff) between 3 and 20),
  print_url text not null,
  rede_social text not null check (rede_social in ('TikTok', 'Kwai', 'Instagram', 'YouTube')),
  arroba text not null check (char_length(arroba) between 2 and 60),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'reprovado')),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.verificados to authenticated;
grant all on public.verificados to service_role;
alter table public.verificados enable row level security;
create policy "ver verificacoes" on public.verificados for select to authenticated using (usuario_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "pedir verificacao" on public.verificados for insert to authenticated with check (usuario_id = auth.uid() and status = 'pendente');
create policy "admin decide verificacao" on public.verificados for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.verificados_aplicar_selo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'aprovado' then
    update public.usuarios set verificado = true where id = new.usuario_id;
  elsif new.status = 'reprovado' and old.status = 'aprovado' then
    update public.usuarios set verificado = false where id = new.usuario_id;
  end if;
  return new;
end $$;
create trigger trg_verificados_selo after update of status on public.verificados
for each row execute function public.verificados_aplicar_selo();

-- ===== CONFIG =====
create table public.config (
  id int primary key default 1 check (id = 1),
  chave_pix text not null default '',
  nome_recebedor text not null default 'RED SENSI PRO FF',
  cidade text not null default 'SAO PAULO',
  whatsapp text not null default '',
  updated_at timestamptz not null default now()
);
grant select on public.config to anon, authenticated;
grant update on public.config to authenticated;
grant all on public.config to service_role;
alter table public.config enable row level security;
create policy "config visivel" on public.config for select to anon, authenticated using (true);
create policy "admin edita config" on public.config for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
insert into public.config (id) values (1);

-- ===== POSTS =====
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.usuarios(id) on delete cascade,
  foto_video text not null,
  tipo text not null default 'foto' check (tipo in ('foto', 'video')),
  legenda text not null default '' check (char_length(legenda) <= 1000),
  curtidas int not null default 0,
  created_at timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
grant select, delete on public.posts to authenticated;
grant insert (usuario_id, foto_video, tipo, legenda) on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "posts visiveis" on public.posts for select to authenticated using (true);
create policy "criar post" on public.posts for insert to authenticated with check (usuario_id = auth.uid());
create policy "apagar post" on public.posts for delete to authenticated using (usuario_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.curtidas_posts (
  post_id uuid not null references public.posts(id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, usuario_id)
);
grant select, insert, delete on public.curtidas_posts to authenticated;
grant all on public.curtidas_posts to service_role;
alter table public.curtidas_posts enable row level security;
create policy "curtidas visiveis" on public.curtidas_posts for select to authenticated using (true);
create policy "curtir" on public.curtidas_posts for insert to authenticated with check (usuario_id = auth.uid());
create policy "descurtir" on public.curtidas_posts for delete to authenticated using (usuario_id = auth.uid());

create or replace function public.contar_curtidas_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set curtidas = curtidas + 1 where id = new.post_id;
  else
    update public.posts set curtidas = greatest(curtidas - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;
create trigger trg_curtidas_post after insert or delete on public.curtidas_posts
for each row execute function public.contar_curtidas_post();

create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.usuarios(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 500),
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.comentarios to authenticated;
grant all on public.comentarios to service_role;
alter table public.comentarios enable row level security;
create policy "comentarios visiveis" on public.comentarios for select to authenticated using (true);
create policy "comentar" on public.comentarios for insert to authenticated with check (usuario_id = auth.uid());
create policy "apagar comentario" on public.comentarios for delete to authenticated using (usuario_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.seguidores (
  seguidor_id uuid not null default auth.uid() references public.usuarios(id) on delete cascade,
  seguido_id uuid not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (seguidor_id, seguido_id),
  check (seguidor_id <> seguido_id)
);
grant select, insert, delete on public.seguidores to authenticated;
grant all on public.seguidores to service_role;
alter table public.seguidores enable row level security;
create policy "seguidores visiveis" on public.seguidores for select to authenticated using (true);
create policy "seguir" on public.seguidores for insert to authenticated with check (seguidor_id = auth.uid());
create policy "deixar de seguir" on public.seguidores for delete to authenticated using (seguidor_id = auth.uid());

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.usuarios(id) on delete cascade,
  midia_url text not null,
  created_at timestamptz not null default now()
);
grant select, delete on public.stories to authenticated;
grant insert (usuario_id, midia_url) on public.stories to authenticated;
grant all on public.stories to service_role;
alter table public.stories enable row level security;
create policy "stories visiveis" on public.stories for select to authenticated using (true);
create policy "criar story" on public.stories for insert to authenticated with check (usuario_id = auth.uid());
create policy "apagar story" on public.stories for delete to authenticated using (usuario_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- ===== VIDEOS =====
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.usuarios(id) on delete cascade,
  video_url text not null,
  legenda text not null default '' check (char_length(legenda) <= 500),
  curtidas int not null default 0,
  sensi_id uuid references public.sensis(id) on delete set null,
  created_at timestamptz not null default now()
);
create index videos_created_idx on public.videos (created_at desc);
grant select, delete on public.videos to authenticated;
grant insert (usuario_id, video_url, legenda, sensi_id) on public.videos to authenticated;
grant all on public.videos to service_role;
alter table public.videos enable row level security;
create policy "videos visiveis" on public.videos for select to authenticated using (true);
create policy "criar video" on public.videos for insert to authenticated with check (usuario_id = auth.uid());
create policy "apagar video" on public.videos for delete to authenticated using (usuario_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.curtidas_videos (
  video_id uuid not null references public.videos(id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (video_id, usuario_id)
);
grant select, insert, delete on public.curtidas_videos to authenticated;
grant all on public.curtidas_videos to service_role;
alter table public.curtidas_videos enable row level security;
create policy "curtidas videos visiveis" on public.curtidas_videos for select to authenticated using (true);
create policy "curtir video" on public.curtidas_videos for insert to authenticated with check (usuario_id = auth.uid());
create policy "descurtir video" on public.curtidas_videos for delete to authenticated using (usuario_id = auth.uid());

create or replace function public.contar_curtidas_video()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.videos set curtidas = curtidas + 1 where id = new.video_id;
  else
    update public.videos set curtidas = greatest(curtidas - 1, 0) where id = old.video_id;
  end if;
  return null;
end $$;
create trigger trg_curtidas_video after insert or delete on public.curtidas_videos
for each row execute function public.contar_curtidas_video();

-- ===== COMUNIDADE =====
create table public.clas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique check (char_length(nome) between 2 and 40),
  tag text not null default '' check (char_length(tag) <= 6),
  descricao text not null default '' check (char_length(descricao) <= 300),
  lider_id uuid default auth.uid() references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, delete on public.clas to authenticated;
grant insert (nome, tag, descricao, lider_id) on public.clas to authenticated;
grant all on public.clas to service_role;
alter table public.clas enable row level security;
create policy "clas visiveis" on public.clas for select to authenticated using (true);
create policy "criar cla" on public.clas for insert to authenticated with check (lider_id = auth.uid());
create policy "apagar cla" on public.clas for delete to authenticated using (lider_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.cla_membros (
  usuario_id uuid primary key default auth.uid() references public.usuarios(id) on delete cascade,
  cla_id uuid not null references public.clas(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.cla_membros to authenticated;
grant all on public.cla_membros to service_role;
alter table public.cla_membros enable row level security;
create policy "membros visiveis" on public.cla_membros for select to authenticated using (true);
create policy "entrar no cla" on public.cla_membros for insert to authenticated with check (usuario_id = auth.uid());
create policy "sair do cla" on public.cla_membros for delete to authenticated using (usuario_id = auth.uid());

create or replace function public.lider_entra_no_cla()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.lider_id is not null then
    insert into public.cla_membros (usuario_id, cla_id) values (new.lider_id, new.id)
    on conflict (usuario_id) do update set cla_id = excluded.cla_id;
  end if;
  return new;
end $$;
create trigger trg_lider_cla after insert on public.clas
for each row execute function public.lider_entra_no_cla();

create table public.desafios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  premio text not null default '',
  termina_em timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.desafios to authenticated;
grant all on public.desafios to service_role;
alter table public.desafios enable row level security;
create policy "desafios visiveis" on public.desafios for select to authenticated using (true);
create policy "admin cria desafio" on public.desafios for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "admin edita desafio" on public.desafios for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin apaga desafio" on public.desafios for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ===== ARQUIVOS =====
create policy "midia visivel para logados" on storage.objects for select to authenticated using (bucket_id = 'midia');
create policy "enviar midia propria" on storage.objects for insert to authenticated
  with check (bucket_id = 'midia' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "apagar midia propria" on storage.objects for delete to authenticated
  using (bucket_id = 'midia' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "ver print proprio ou admin" on storage.objects for select to authenticated
  using (bucket_id = 'prints' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin')));
create policy "enviar print proprio" on storage.objects for insert to authenticated
  with check (bucket_id = 'prints' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== DADOS INICIAIS =====
insert into public.sensis (marca, modelo, geral, vermelho, mira2x, mira4x, awm, olhadinha, botao, dpi, preco, destaque) values
('Samsung', 'Samsung Padrão', 184, 190, 175, 160, 90, 150, 50, 520, 7.90, true),
('Samsung', 'Samsung A17', 194, 195, 182, 170, 85, 160, 48, 560, 7.90, false),
('Universal', 'Universal', 190, 188, 180, 165, 80, 155, 52, 540, 7.90, false),
('Universal', 'Universal V2', 177, 180, 170, 158, 75, 140, 50, 500, 7.90, false),
('Xit', 'Só Capa', 200, 200, 195, 185, 95, 180, 45, 620, 7.90, true),
('Universal', 'Verificado', 189, 192, 178, 166, 88, 150, 50, 550, 7.90, false),
('Xiaomi', 'Meta', 198, 196, 188, 175, 90, 165, 47, 600, 7.90, false),
('Motorola', 'DPI 721', 200, 198, 190, 180, 92, 170, 46, 721, 7.90, true),
('Motorola', 'Balanceada', 180, 182, 172, 160, 78, 145, 52, 480, 7.90, false),
('iPhone', 'Felpsz', 175, 178, 168, 155, 70, 135, 55, 460, 7.90, false),
('Xiaomi', 'Chataco', 198, 199, 190, 178, 94, 170, 46, 610, 7.90, false),
('iPhone', 'Mikasa', 184, 186, 176, 164, 82, 150, 50, 520, 7.90, false),
('Universal', 'Universal V3', 177, 179, 171, 159, 76, 142, 51, 505, 7.90, false),
('Motorola', 'sadx', 177, 181, 169, 157, 74, 138, 53, 495, 7.90, false),
('Xit', 'Ponto Vermelho', 200, 200, 198, 188, 96, 185, 44, 640, 7.90, true),
('Xiaomi', 'Equilibrada', 157, 165, 150, 140, 65, 120, 56, 420, 7.90, false),
('Xit', 'Caveira', 165, 172, 160, 148, 70, 130, 54, 450, 7.90, false),
('iPhone', 'Laranja', 128, 140, 120, 110, 55, 100, 58, 400, 7.90, false);

insert into public.desafios (titulo, descricao, premio, termina_em) values
('Rei da Capa', 'Quem fizer mais capas hoje no ranking leva.', 'Sensi grátis + destaque no feed', now() + interval '1 day'),
('Clipe da Semana', 'Poste seu melhor clipe na aba Vídeos com a legenda #REDSENSI.', 'Selo de destaque por 7 dias', now() + interval '7 days'),
('1v4 Insano', 'Mostre um clutch 1v4 em vídeo.', 'Sensi Ponto Vermelho grátis', now() + interval '14 days');

insert into public.clas (nome, tag, descricao, lider_id) values
('RED SQUAD', 'RED', 'Clã oficial da comunidade RED SENSI. Capa, rush e respeito.', null),
('CAPA DIÁRIA', 'CAPA', 'Treino de capa todo dia às 20h.', null),
('SENSI FAMILY', 'SFAM', 'Galera que troca sensi e evolui junto.', null);
