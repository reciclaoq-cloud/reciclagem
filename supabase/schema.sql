-- ============================================================================
-- ReciclaOQ - Estrutura SQL completa para Supabase (PostgreSQL)
-- Copie e cole este script no SQL Editor do Supabase e clique em "Run".
-- O script é idempotente: pode ser executado novamente sem gerar erros.
-- ============================================================================

-- 1. Tabela de Perfis dos Usuários
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  neighborhood text not null default 'Centro',
  initials text not null default 'RQ',
  created_at timestamptz not null default now()
);

-- 2. Tabela de Publicações (Dicas de Reciclagem, Desperdício Zero e Arte com Sucata)
create table if not exists public.eco_posts (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  author_handle text not null,
  author_neighborhood text not null,
  author_initials text not null,
  category text not null,
  craft_subcategory text,
  material text not null,
  title text not null,
  summary text not null,
  materials_needed jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  estimated_time text not null default '20 min',
  difficulty text,
  waste_avoided_kg numeric not null default 0.5,
  illustration text not null default 'craft-artesanato',
  custom_image_url text,
  likes integer not null default 0,
  verified_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.eco_posts
  add column if not exists craft_subcategory text;

-- 3. Tabela de Comentários nas Publicações
create table if not exists public.eco_comments (
  id text primary key,
  post_id text not null references public.eco_posts (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  author_handle text not null,
  author_role text not null default 'Comunidade',
  content text not null,
  created_at timestamptz not null default now()
);

-- 4. Tabela de Fotos por Categoria (Artesanato, Jogos e Brinquedos, Decoração, Instrumentos)
create table if not exists public.category_photos (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  author_neighborhood text not null,
  craft_category text not null,
  material text not null,
  title text not null,
  image_url text not null,
  created_at timestamptz not null default now()
);

-- 5. Tabela Banco de Dados "Antes e Depois"
create table if not exists public.before_after_entries (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  author_handle text not null,
  author_neighborhood text not null,
  author_initials text not null,
  craft_category text not null,
  material text not null,
  title text not null,
  description text not null default '',
  before_image_url text not null,
  after_image_url text not null default '',
  steps jsonb not null default '[]'::jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.before_after_entries
  alter column user_id drop not null;

alter table public.before_after_entries
  alter column after_image_url set default '';

alter table public.before_after_entries
  add column if not exists steps jsonb not null default '[]'::jsonb;

alter table public.before_after_entries
  add column if not exists suggestions jsonb not null default '[]'::jsonb;

-- 6. Tabela de Hábitos Diários de Sustentabilidade por Usuário
create table if not exists public.user_habits (
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id text not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, habit_id)
);

-- 7. Tabela de Progresso nos Desafios Comunitários por Usuário
create table if not exists public.user_challenge_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_id text not null,
  joined boolean not null default true,
  completed_steps jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

-- 8. Tabela de Interações Individuais por Publicação (Curtir, Testado na Prática, Salvo)
create table if not exists public.user_post_interactions (
  user_id uuid not null references auth.users (id) on delete cascade,
  post_id text not null references public.eco_posts (id) on delete cascade,
  liked boolean not null default false,
  verified boolean not null default false,
  saved boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ============================================================================
-- Índices para consultas rápidas do feed, categorias e Antes e Depois
-- ============================================================================
create index if not exists idx_eco_posts_created_at
  on public.eco_posts (created_at desc);

create index if not exists idx_eco_posts_category
  on public.eco_posts (category);

create index if not exists idx_eco_posts_craft_sub
  on public.eco_posts (craft_subcategory);

create index if not exists idx_eco_comments_post_created
  on public.eco_comments (post_id, created_at asc);

create index if not exists idx_category_photos_craft
  on public.category_photos (craft_category, created_at desc);

create index if not exists idx_before_after_craft
  on public.before_after_entries (craft_category, created_at desc);

create index if not exists idx_user_post_interactions_user
  on public.user_post_interactions (user_id);

-- ============================================================================
-- Trigger automático: cria o perfil em public.profiles ao cadastrar em auth.users
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_name text;
  raw_neighborhood text;
  computed_initials text;
  name_parts text[];
begin
  raw_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(new.email, 'usuario@reciclaoq.local'), '@', 1)
  );
  raw_neighborhood := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'neighborhood'), ''),
    'Comunidade Local'
  );

  name_parts := regexp_split_to_array(trim(raw_name), '\s+');
  if array_length(name_parts, 1) >= 2 then
    computed_initials := upper(substr(name_parts[1], 1, 1) || substr(name_parts[2], 1, 1));
  else
    computed_initials := upper(substr(raw_name, 1, 2));
  end if;

  insert into public.profiles (id, name, email, neighborhood, initials)
  values (
    new.id,
    raw_name,
    coalesce(new.email, ''),
    raw_neighborhood,
    coalesce(nullif(computed_initials, ''), 'RQ')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security (RLS) e Políticas de Acesso
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.eco_posts enable row level security;
alter table public.eco_comments enable row level security;
alter table public.category_photos enable row level security;
alter table public.before_after_entries enable row level security;
alter table public.user_habits enable row level security;
alter table public.user_challenge_progress enable row level security;
alter table public.user_post_interactions enable row level security;

-- Políticas para profiles
drop policy if exists "Perfis visíveis para o próprio usuário" on public.profiles;
create policy "Perfis visíveis para o próprio usuário"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Usuário cria seu próprio perfil" on public.profiles;
create policy "Usuário cria seu próprio perfil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Usuário atualiza seu próprio perfil" on public.profiles;
create policy "Usuário atualiza seu próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Políticas para eco_posts
drop policy if exists "Publicações visíveis para todos" on public.eco_posts;
create policy "Publicações visíveis para todos"
  on public.eco_posts for select
  using (true);

drop policy if exists "Usuários autenticados publicam dicas" on public.eco_posts;
create policy "Usuários autenticados publicam dicas"
  on public.eco_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Autor ou membro autenticado atualiza contadores da dica" on public.eco_posts;
create policy "Autor ou membro autenticado atualiza contadores da dica"
  on public.eco_posts for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Autor pode excluir sua publicação" on public.eco_posts;
create policy "Autor pode excluir sua publicação"
  on public.eco_posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Políticas para eco_comments
drop policy if exists "Comentários visíveis para todos" on public.eco_comments;
create policy "Comentários visíveis para todos"
  on public.eco_comments for select
  using (true);

drop policy if exists "Usuários autenticados comentam" on public.eco_comments;
create policy "Usuários autenticados comentam"
  on public.eco_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Autor pode excluir seu comentário" on public.eco_comments;
create policy "Autor pode excluir seu comentário"
  on public.eco_comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- Políticas para category_photos
drop policy if exists "Fotos de categoria visíveis para todos" on public.category_photos;
create policy "Fotos de categoria visíveis para todos"
  on public.category_photos for select
  using (true);

drop policy if exists "Usuários autenticados enviam fotos nas categorias" on public.category_photos;
create policy "Usuários autenticados enviam fotos nas categorias"
  on public.category_photos for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Autor pode excluir sua foto da categoria" on public.category_photos;
create policy "Autor pode excluir sua foto da categoria"
  on public.category_photos for delete
  to authenticated
  using (auth.uid() = user_id);

-- Políticas para before_after_entries
drop policy if exists "Registros Antes e Depois visíveis para todos" on public.before_after_entries;
create policy "Registros Antes e Depois visíveis para todos"
  on public.before_after_entries for select
  using (true);

drop policy if exists "Usuários autenticados registram Antes e Depois" on public.before_after_entries;
drop policy if exists "Comunidade registra Antes e Depois" on public.before_after_entries;
create policy "Comunidade registra Antes e Depois"
  on public.before_after_entries for insert
  with check (user_id is null or auth.uid() = user_id);

drop policy if exists "Autor pode excluir seu registro Antes e Depois" on public.before_after_entries;
create policy "Autor pode excluir seu registro Antes e Depois"
  on public.before_after_entries for delete
  using (user_id is null or auth.uid() = user_id);

-- Políticas para user_habits
drop policy if exists "Usuário gerencia seus próprios hábitos" on public.user_habits;
create policy "Usuário gerencia seus próprios hábitos"
  on public.user_habits for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas para user_challenge_progress
drop policy if exists "Usuário gerencia seu progresso em desafios" on public.user_challenge_progress;
create policy "Usuário gerencia seu progresso em desafios"
  on public.user_challenge_progress for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas para user_post_interactions
drop policy if exists "Usuário gerencia suas interações em publicações" on public.user_post_interactions;
create policy "Usuário gerencia suas interações em publicações"
  on public.user_post_interactions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
