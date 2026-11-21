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

-- 4. Tabela de Hábitos Diários de Sustentabilidade por Usuário
create table if not exists public.user_habits (
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id text not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, habit_id)
);

-- 5. Tabela de Progresso nos Desafios Comunitários por Usuário
create table if not exists public.user_challenge_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_id text not null,
  joined boolean not null default true,
  completed_steps jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

-- 6. Tabela de Interações Individuais por Publicação (Curtir, Testado na Prática, Salvo)
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
-- Índices para consultas rápidas do feed e interações
-- ============================================================================
create index if not exists idx_eco_posts_created_at
  on public.eco_posts (created_at desc);

create index if not exists idx_eco_posts_category
  on public.eco_posts (category);

create index if not exists idx_eco_comments_post_created
  on public.eco_comments (post_id, created_at asc);

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

-- ============================================================================
-- Dados iniciais da comunidade ReciclaOQ (Seed)
-- ============================================================================
insert into public.eco_posts (
  id, author_name, author_handle, author_neighborhood, author_initials,
  category, material, title, summary, materials_needed, steps,
  estimated_time, difficulty, waste_avoided_kg, illustration, likes, verified_count
) values
(
  'post-1', 'Marina Vasconcelos', '@marina.oficina', 'Vila Mariana, SP', 'MV',
  'arte-sucata', 'Plástico PET',
  'Horta vertical autoirrigável com garrafas PET de 2 litros',
  'Transformei quatro garrafas PET transparentes e sobras de barbante de algodão em uma horta suspensa para temperos na janela da cozinha. O reservatório inferior mantém a umidade por até cinco dias.',
  '["4 garrafas PET de 2L limpas e sem rótulo","1,2 m de barbante 100% algodão","Tesoura ou estilete e ferro de solda (ou prego aquecido)","Substrato leve com composto orgânico e mudas de manjericão"]'::jsonb,
  '["Corte cada garrafa ao meio. A parte superior com o gargalo funcionará invertida sobre a base inferior.","Faça um furo na tampinha e passe um pedaço de barbante dobrado ao meio para atuar como pavio de irrigação por capilaridade.","Preencha a parte superior invertida com terra adubada, encaixe o barbante em contato com a raiz e coloque água no reservatório da base.","Perfure duas alças laterais na borda superior para suspender em gancho de varanda ou janela bem iluminada."]'::jsonb,
  '35 min', 'Fácil', 0.45, 'pet-planter', 84, 29
),
(
  'post-2', 'Rafael Nogueira', '@rafa.composta', 'Botafogo, RJ', 'RN',
  'reciclagem', 'Plástico PET',
  'Regra dos 15 segundos: higienize embalagens usando água da louça',
  'Muita gente deixa de lavar potes de iogurte ou frascos de molho para não gastar água limpa, ou joga sujo e contamina o fardo inteiro da cooperativa. Usar a água ensaboada do enxágue final da pia resolve os dois problemas.',
  '["Bacia pequena dentro da cuba da pia","Espátula de silicone (pão-duro) para raspar resíduos antes","Escorredor separado para secar embalagens"]'::jsonb,
  '["Passe uma espátula ou folha de guardanapo usado para remover o excesso de creme, molho ou óleo antes de molhar.","Posicione a embalagem usada dentro da bacia enquanto lava os pratos do almoço para aproveitar a água com detergente que já cairia no ralo.","Agite rapidamente com a tampa fechada por 10 segundos, escorra e deixe secar de boca para baixo antes de ir ao saco reciclável."]'::jsonb,
  '2 min/dia', 'Fácil', 1.80, 'water-rinse', 112, 47
),
(
  'post-3', 'Lucas Mendonça', '@lucasmend', 'Batel, PR', 'LM',
  'arte-sucata', 'Alumínio',
  'Luminária geométrica perfurada com latas de alumínio reutilizadas',
  'Latas grandes de leite em pó ou conservas viram luminárias de mesa com efeito de céu estrelado na parede. Usei um molde pontilhado em papel reutilizado e prego fino para furar sem amassar.',
  '["1 lata de aço ou alumínio grande limpa e sem rótulo","Martelo, prego fino e marcador permanente","Congelador + água (truque para não amassar a lata)","Vela LED recarregável ou soquete bivolt de baixa temperatura"]'::jsonb,
  '["Encha a lata limpa com água até a borda e leve ao freezer por 6 horas. O bloco de gelo interno sustenta a parede metálica durante os furos.","Envolva a lata congelada com um desenho pontilhado e bata o prego nos pontos marcados usando um pano dobrado embaixo para firmar.","Deixe o gelo derreter completamente, seque bem e aplique uma demão fina de verniz fosco ou tinta à base de água.","Posicione uma vela LED interna para projetar os padrões de luz no ambiente com segurança térmica."]'::jsonb,
  '45 min', 'Intermediário', 0.32, 'tin-lantern', 96, 31
),
(
  'post-4', 'Helena Tavares', '@helena.zerolixo', 'Savassi, MG', 'HT',
  'desperdicio', 'Orgânico',
  'Composteira compacta em baldes de cozinha para apartamentos pequenos',
  'Com dois baldes alimentícios de 15L obtidos em padarias locais e serragem sem verniz, consegui reduzir em 55% o peso do saco de lixo semanal sem cheiro nem moscas.',
  '["2 baldes plásticos com tampa hermética (reaproveitados de confeitaria)","Broca fina ou prego aquecido para drenagem e respiro","Serragem limpa ou folhas secas picadas","Restos vegetais crus (cascas, talos, borra de café)"]'::jsonb,
  '["Faça pequenos furos no fundo do balde superior (digestor) para o biofertilizante líquido escorrer para o balde inferior (coletor).","Na tampa do balde superior, faça microfuros de 2 mm ou cole um pedaço de tecido fino para permitir ventilação sem entrada de insetos.","A cada camada de restos de frutas e legumes, cubra com o dobro do volume em serragem ou folhas secas para manter o equilíbrio carbono-nitrogênio."]'::jsonb,
  '30 min', 'Fácil', 4.60, 'compost-bucket', 141, 62
),
(
  'post-5', 'Sofia Albuquerque', '@sofia.atelier', 'Boa Viagem, PE', 'SA',
  'arte-sucata', 'Papel e Papelão',
  'Organizador modular de mesa com caixas de entregas e jeans velho',
  'Caixas de papelão ondulado firme e pernas de calças jeans que não tinham mais conserto formaram um organizador rígido de quatro divisórias para lápis, cabos e cadernos.',
  '["2 caixas de papelão de parede dupla","1 perna de calça jeans usada","Cola branca PVA + pincel largo + fita crepe de papel","Régua metálica e estilete"]'::jsonb,
  '["Corte as abas das caixas em alturas escalonadas (8 cm, 12 cm e 18 cm) e una as peças com cola branca e fita crepe nas quinas.","Recorte o jeans deixando 2 cm de sobra em todas as bordas para fazer o acabamento dobrado para dentro.","Aplique cola branca diluída em 10% de água no papelão, estique o tecido com as mãos e prenda as dobras internas com prendedores até secar."]'::jsonb,
  '50 min', 'Intermediário', 0.78, 'cardboard-organizer', 69, 22
),
(
  'post-6', 'Thiago Ferraz', '@thiago.cozinha', 'Asa Norte, DF', 'TF',
  'desperdicio', 'Orgânico',
  'Congelador de aparas: caldo caseiro com cascas e talos da semana',
  'Guardo pontas de cenoura, talos de salsinha, cascas limpas de cebola e alho em um pote reutilizado no freezer. No domingo, tudo vira 2 litros de caldo aromático sem desperdício.',
  '["1 pote de vidro ou plástico grande para acumular no freezer","Aparas lavadas de cenoura, cebola, alho-poró, salsão e talos de ervas","Água filtrada e louro"]'::jsonb,
  '["Lave os legumes antes de descascar e reserve apenas as partes sadias no pote do freezer (evite folhas amargas como couve em excesso).","Quando o pote encher, leve as aparas congeladas direto para a panela cobertas com água em fogo baixo por 40 minutos.","Coe o líquido para sopas e risotos; o bagaço cozido já esfriado vai direto para a composteira."]'::jsonb,
  '45 min', 'Fácil', 1.35, 'kitchen-scraps', 127, 54
),
(
  'post-7', 'Beatriz Linhares', '@bialinhares', 'Pinheiros, SP', 'BL',
  'reciclagem', 'Papel e Papelão',
  'Caixa de pizza engordurada: recorte a tampa limpa e descarte só o fundo',
  'Um erro comum é descartar a caixa inteira no lixo comum ou jogar a parte manchada de óleo na reciclagem. Cortar a tampa limpa dobra o papelão aproveitável sem contaminar a triagem.',
  '["Caixa de pizza usada","Tesoura doméstica"]'::jsonb,
  '["Inspecione a tampa: se ela não tiver manchas de óleo ou queijo aderido, destaque na dobra traseira.","Dobre a tampa limpa e encaminhe normalmente na coleta seletiva de papel e papelão.","A base engordurada pode ser picada em tiras pequenas para compostagem seca (sem excesso de queijo) ou ir para o rejeito comum."]'::jsonb,
  '1 min', 'Fácil', 0.25, 'sorting-guide', 158, 73
)
on conflict (id) do nothing;

insert into public.eco_comments (
  id, post_id, author_name, author_handle, author_role, content
) values
(
  'c-101', 'post-1', 'Rafael Nogueira', '@rafa.composta', 'Horta Urbana',
  'Dica extra: envolver a base com uma faixa de juta ou tinta fosca impede a entrada de luz direta na água e evita formação de algas.'
),
(
  'c-102', 'post-1', 'Camila Prado', '@camilaprado', 'Membro da comunidade',
  'Fiz aqui em casa com garrafas de água com gás e o manjericão durou todo o feriado sem precisar regar!'
),
(
  'c-201', 'post-2', 'Beatriz Linhares', '@bialinhares', 'Triadora voluntária',
  'Na cooperativa do bairro, embalagens secas e sem restos orgânicos aumentam em quase 40% o aproveitamento do plástico flexível e rígido.'
),
(
  'c-301', 'post-3', 'Marina Vasconcelos', '@marina.oficina', 'Artesã circular',
  'O truque do gelo dentro da lata é infalível! Fiz três modelos diferentes para a varanda e nenhuma amassou.'
)
on conflict (id) do nothing;
