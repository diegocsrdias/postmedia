-- ============================================================
-- Schema do Gerador de Criativos — base do aprendizado.
-- Rode no Supabase: Dashboard → SQL Editor → New query → cole → Run.
-- ============================================================

-- Cada linha = um criativo publicado no Instagram, com seus dados estruturados
-- e (preenchidas depois, pela sync de insights) as métricas de desempenho.
-- Com o tempo, cruzamos ângulo/layout/gancho com o que teve mais alcance para
-- enviesar a geração dos próximos posts na direção do que funciona.
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  published_at  timestamptz,

  -- identidade do post
  client        text not null,            -- 'dindin', 'rachel', ...
  ig_media_id   text,                     -- id do post no Instagram
  permalink     text,                     -- link público do post
  media_url     text,                     -- imagem no bucket (registro do que foi ao ar)

  -- conteúdo do criativo (o "DNA" para o aprendizado)
  format        text,                     -- 'feed' | 'story'
  layout        text,                     -- estilo/estrutura do card
  angle         text,                     -- ângulo estratégico
  headline      text,                     -- título principal (atalho de busca)
  caption       text,
  hashtags      text,
  fields        jsonb,                    -- todos os campos editáveis do card

  -- desempenho (preenchido pela sync de insights; nulo até lá)
  like_count         integer,
  comments_count     integer,
  reach              integer,
  impressions        integer,
  saved              integer,
  shares             integer,
  metrics_updated_at timestamptz,

  -- histórico: distingue o que foi ao ar do que foi só baixado.
  --   'published'  → publicado no Instagram (tem ig_media_id/permalink)
  --   'downloaded' → só baixado pelo usuário (sem ig_media_id; não entra na análise)
  status        text not null default 'published',
  media_kind    text                                -- 'image' | 'video' | 'carousel'
);

create index if not exists posts_client_idx      on public.posts (client);
create index if not exists posts_published_idx   on public.posts (published_at desc);
create index if not exists posts_ig_media_idx     on public.posts (ig_media_id);
create index if not exists posts_status_idx       on public.posts (status);

-- Migração incremental: se a tabela já existia antes destas colunas, adiciona-as.
alter table public.posts add column if not exists status     text not null default 'published';
alter table public.posts add column if not exists media_kind text;

-- RLS ligado, sem policies: só a service_role (usada pelo backend) acessa.
-- A anon key do navegador NÃO consegue ler nem escrever aqui.
alter table public.posts enable row level security;

-- ============================================================
-- Storage: bucket público 'creatives' para as mídias.
-- Se preferir criar pela UI (Storage → New bucket → Public), pode pular isto.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('creatives', 'creatives', true)
on conflict (id) do nothing;

-- ============================================================
-- Fila do agendador (autopilot). Cada linha = um post agendado que o runner
-- (api/run-scheduler) vai GERAR + RENDERIZAR (Chromium headless) + PUBLICAR
-- sozinho no horário. Só o backend (service_role) acessa.
-- ============================================================
create table if not exists public.schedule (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  client         text not null,

  -- quando publicar e o que publicar
  scheduled_for  timestamptz not null,
  format         text not null default 'feed',   -- 'feed' | 'carousel'
  slides         integer not null default 1,     -- nº de telas (carrossel)
  theme          text,                            -- tema opcional (newsjacking)
  angle          text,                            -- ângulo preferido opcional
  layout         text,                            -- layout preferido opcional
  image_mode     text,                            -- 'none' | 'editorial' | 'promo'

  -- ciclo de vida
  status         text not null default 'pending', -- pending|processing|done|error|canceled
  attempts       integer not null default 0,
  last_error     text,
  result_post_id uuid,                            -- id em public.posts quando publicado
  ran_at         timestamptz
);

create index if not exists schedule_due_idx on public.schedule (status, scheduled_for);
create index if not exists schedule_client_idx on public.schedule (client, scheduled_for desc);

alter table public.schedule enable row level security;

-- ============================================================
-- Regras de RECORRÊNCIA. Cada linha = um padrão ("toda segunda às 9h e 18h").
-- O runner (api/run-scheduler) MATERIALIZA cada regra ativa nas próximas
-- ocorrências concretas em public.schedule, e a execução segue igual.
-- ============================================================
create table if not exists public.schedule_rules (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  client        text not null,
  active        boolean not null default true,

  -- o que publicar (mesmos campos de um job)
  format        text not null default 'feed',   -- 'feed' | 'carousel'
  slides        integer not null default 1,
  theme         text,
  angle         text,
  layout        text,
  image_mode    text default 'none',

  -- quando: dias da semana (0=dom … 6=sáb; vazio = todo dia) + horários 'HH:MM'
  weekdays      integer[] not null default '{}',
  times         text[]    not null default '{}',
  timezone      text not null default 'America/Sao_Paulo'
);

create index if not exists schedule_rules_client_idx on public.schedule_rules (client);
alter table public.schedule_rules enable row level security;

-- Liga cada job materializado à sua regra e evita duplicar a mesma ocorrência.
alter table public.schedule add column if not exists rule_id uuid;
create unique index if not exists schedule_rule_slot_idx
  on public.schedule (rule_id, scheduled_for) where rule_id is not null;

-- ============================================================
-- Memória de desempenho por cliente — o "aprendizado" que realimenta a IA.
-- Reconstruída periodicamente por api/build-learnings a partir de `posts`.
-- `brief` é um texto curto (PT-BR) e `stats` guarda os rankings estruturados.
-- ============================================================
create table if not exists public.learnings (
  client      text primary key,
  updated_at  timestamptz not null default now(),
  brief       text,
  stats       jsonb
);

alter table public.learnings enable row level security;
