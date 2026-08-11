-- ==========================================================
-- Esquema de base de datos para "Familia Conectada"
-- ==========================================================

-- 1. Tabla de perfiles (uno por familiar registrado)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Cualquier usuario autenticado puede ver todos los perfiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Un usuario puede crear su propio perfil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Un usuario puede editar su propio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- 2. Tabla de estado actual (tablero: bien / necesito ayuda / sin noticias)
create table if not exists public.statuses (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  status text not null default 'sin_noticias' check (status in ('bien', 'ayuda', 'sin_noticias')),
  message text,
  location_text text,
  lat double precision,
  lng double precision,
  updated_at timestamptz not null default now()
);

alter table public.statuses enable row level security;

create policy "Cualquier usuario autenticado puede ver todos los estados"
  on public.statuses for select
  to authenticated
  using (true);

create policy "Un usuario puede crear su propio estado"
  on public.statuses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Un usuario puede actualizar su propio estado"
  on public.statuses for update
  to authenticated
  using (auth.uid() = user_id);

-- 3. Tabla de mensajes (chat familiar)
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Cualquier usuario autenticado puede ver los mensajes"
  on public.messages for select
  to authenticated
  using (true);

create policy "Un usuario puede enviar mensajes"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 4. Habilitar Realtime (para que el tablero, el mapa y el chat se
--    actualicen solos, sin recargar la página)
alter publication supabase_realtime add table public.statuses;
alter publication supabase_realtime add table public.messages;

-- 5. Índices útiles
create index if not exists messages_created_at_idx on public.messages (created_at);
