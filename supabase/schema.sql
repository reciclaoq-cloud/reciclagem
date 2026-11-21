-- Schema SQL para o projeto ReciclaOQ no Supabase (PostgreSQL)
-- Execute este script no SQL Editor do seu painel Supabase.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  neighborhood text not null default 'Centro',
  initials text not null default 'RQ',
  created_at timestamptz not null default now()
);

create table if not exists public.eco_posts (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  author_handle text not null,
  author_neighborhood text not null,
  author_initials text not null,
  category text not null,
  material text not null,
  title text not null,
  summary text not null,
  materials_needed jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  estimated_time text not null default '20 min',
  difficulty text,
  waste_avoided_kg numeric not null default 0.5,
  illustration text not null default 'pet-planter',
  custom_image_url text,
  likes integer not null default 0,
  verified_count integer not null default 0,
  created_at timestamptz not null default now()
);

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

create table if not exists public.user_habits (
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id text not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, habit_id)
);

create table if not exists public.user_challenge_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_id text not null,
  joined boolean not null default true,
  completed_steps jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

-- Habilitar Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.eco_posts enable row level security;
alter table public.eco_comments enable row level security;
alter table public.user_habits enable row level security;
alter table public.user_challenge_progress enable row level security;

-- Políticas de acesso para profiles
create policy "Perfis visíveis para o próprio usuário"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário cria seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Usuário atualiza seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Políticas de acesso para eco_posts
create policy "Publicações visíveis para todos"
  on public.eco_posts for select
  using (true);

create policy "Usuários autenticados publicam dicas"
  on public.eco_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Autor ou membro autenticado atualiza contadores da dica"
  on public.eco_posts for update
  to authenticated
  using (true)
  with check (true);

create policy "Autor pode excluir sua publicação"
  on public.eco_posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Políticas de acesso para eco_comments
create policy "Comentários visíveis para todos"
  on public.eco_comments for select
  using (true);

create policy "Usuários autenticados comentam"
  on public.eco_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Políticas de acesso para user_habits
create policy "Usuário gerencia seus próprios hábitos"
  on public.user_habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas de acesso para user_challenge_progress
create policy "Usuário gerencia seu progresso em desafios"
  on public.user_challenge_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Interações individuais por usuário (curtir, testado, salvo)
create table if not exists public.user_post_interactions (
  user_id uuid not null references auth.users (id) on delete cascade,
  post_id text not null references public.eco_posts (id) on delete cascade,
  liked boolean not null default false,
  verified boolean not null default false,
  saved boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.user_post_interactions enable row level security;

create policy "Usuário gerencia suas interações em publicações"
  on public.user_post_interactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Publicações iniciais da comunidade ReciclaOQ
insert into public.eco_posts (
  id, author_name, author_handle, author_neighborhood, author_initials,
  category, material, title, summary, materials_needed, steps,
  estimated_time, difficulty, waste_avoided_kg, illustration, likes, verified_count
) values
(
  'post-1', 'Marina Vasconcelos', '@marina.oficina', 'Vila Mariana, SP', 'MV',
  'arte-sucata', 'Plástico PET',
  'Horta vertical autoirrigável com garrafas PET de 2 litros',
  'Transformei quatro garrafas PET transparentes e sobras de barbante de algodão em uma horta suspensa para temperos na janela da cozinha.',
  '["4 garrafas PET de 2L limpas","1,2 m de barbante 100% algodão","Tesoura ou estilete","Substrato leve e mudas"]'::jsonb,
  '["Corte cada garrafa ao meio.","Passe o barbante na tampinha para irrigação por capilaridade.","Preencha com terra e encaixe sobre o reservatório com água."]'::jsonb,
  '35 min', 'Fácil', 0.45, 'pet-planter', 84, 29
),
(
  'post-2', 'Rafael Nogueira', '@rafa.composta', 'Botafogo, RJ', 'RN',
  'reciclagem', 'Plástico PET',
  'Regra dos 15 segundos: higienize embalagens usando água da louça',
  'Usar a água ensaboada do enxágue final da pia limpa embalagens sem desperdiçar água tratada e evita contaminação na cooperativa.',
  '["Bacia pequena dentro da pia","Espátula de silicone","Escorredor separado"]'::jsonb,
  '["Raspe o excesso com espátula.","Enxágue na bacia com água da louça.","Seque de boca para baixo antes de descartar."]'::jsonb,
  '2 min/dia', 'Fácil', 1.80, 'water-rinse', 112, 47
),
(
  'post-3', 'Lucas Mendonça', '@lucasmend', 'Batel, PR', 'LM',
  'arte-sucata', 'Alumínio',
  'Luminária geométrica perfurada com latas de alumínio reutilizadas',
  'Latas grandes de leite em pó ou conservas viram luminárias de mesa com efeito de céu estrelado usando gelo interno para furar sem amassar.',
  '["1 lata limpa e sem rótulo","Martelo e prego fino","Água congelada dentro da lata","Vela LED"]'::jsonb,
  '["Congele água dentro da lata por 6 horas.","Fure o padrão desejado com prego e martelo.","Descongele, seque e coloque a vela LED."]'::jsonb,
  '45 min', 'Intermediário', 0.32, 'tin-lantern', 96, 31
),
(
  'post-4', 'Helena Tavares', '@helena.zerolixo', 'Savassi, MG', 'HT',
  'desperdicio', 'Orgânico',
  'Composteira compacta em baldes de cozinha para apartamentos pequenos',
  'Com dois baldes alimentícios de 15L e serragem limpa, reduzi em 55% o peso do lixo semanal sem cheiro.',
  '["2 baldes de 15L com tampa","Broca fina","Serragem ou folhas secas","Restos vegetais crus"]'::jsonb,
  '["Fure o fundo do balde superior para drenagem.","Faça microfuros na tampa para respiro.","Cubra cada camada orgânica com o dobro de serragem."]'::jsonb,
  '30 min', 'Fácil', 4.60, 'compost-bucket', 141, 62
),
(
  'post-5', 'Sofia Albuquerque', '@sofia.atelier', 'Boa Viagem, PE', 'SA',
  'arte-sucata', 'Papel e Papelão',
  'Organizador modular de mesa com caixas de entregas e jeans velho',
  'Caixas de papelão ondulado firme e pernas de calça jeans formam um organizador rígido de quatro divisórias.',
  '["2 caixas de papelão","1 perna de calça jeans usada","Cola branca PVA e pincel","Régua e estilete"]'::jsonb,
  '["Corte e cole as divisórias escalonadas.","Encape com jeans usando cola diluída.","Prenda as dobras internas até secar."]'::jsonb,
  '50 min', 'Intermediário', 0.78, 'cardboard-organizer', 69, 22
),
(
  'post-6', 'Thiago Ferraz', '@thiago.cozinha', 'Asa Norte, DF', 'TF',
  'desperdicio', 'Orgânico',
  'Congelador de aparas: caldo caseiro com cascas e talos da semana',
  'Pontas de cenoura, talos de salsinha e cascas limpas de cebola guardados no freezer viram caldo aromático no domingo.',
  '["1 pote grande para freezer","Aparas lavadas de legumes e talos","Água filtrada e louro"]'::jsonb,
  '["Lave os legumes e reserve aparas sadias no freezer.","Cozinhe em fogo baixo por 40 minutos.","Coe o caldo e leve o bagaço para a composteira."]'::jsonb,
  '45 min', 'Fácil', 1.35, 'kitchen-scraps', 127, 54
),
(
  'post-7', 'Beatriz Linhares', '@bialinhares', 'Pinheiros, SP', 'BL',
  'reciclagem', 'Papel e Papelão',
  'Caixa de pizza engordurada: recorte a tampa limpa e descarte só o fundo',
  'Destacar a tampa sem gordura dobra o papelão aproveitável na coleta seletiva sem contaminar o fardo.',
  '["Caixa de pizza usada","Tesoura doméstica"]'::jsonb,
  '["Destaque a tampa se estiver limpa e seca.","Envie a tampa para reciclagem de papelão.","Descarte apenas o fundo engordurado no rejeito."]'::jsonb,
  '1 min', 'Fácil', 0.25, 'sorting-guide', 158, 73
)
on conflict (id) do nothing;

