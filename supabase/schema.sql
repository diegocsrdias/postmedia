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
  metrics_updated_at timestamptz
);

create index if not exists posts_client_idx      on public.posts (client);
create index if not exists posts_published_idx   on public.posts (published_at desc);
create index if not exists posts_ig_media_idx     on public.posts (ig_media_id);

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
