-- ================================================================
-- ESQUEMA DE LA BASE DE DATOS DEL CATÁLOGO
-- Cópialo completo en Supabase → SQL Editor → New query → Run
-- ================================================================

-- 1. Productos ------------------------------------------------------
create table if not exists public.productos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text default '',
  precio      integer not null check (precio >= 0),
  medida      text default '',
  categoria   text default 'mujer',
  etiqueta    text default '',
  imagen_url  text default '',
  visible     boolean not null default true,
  orden       integer not null default 0,
  created_at  timestamptz not null default now()
);

-- 2. Ajustes de la tienda (una sola fila) ----------------------------
create table if not exists public.ajustes (
  id              integer primary key default 1 check (id = 1),
  marca           text,
  whatsapp        text,
  mensaje_general text,
  instagram       text,
  facebook        text,
  tiktok          text,
  imagen_portada  text
);
insert into public.ajustes (id, marca, whatsapp)
values (1, 'TU MARCA', '573000000000')
on conflict (id) do nothing;

-- 3. Administradores (solo estos usuarios pueden editar) -------------
create table if not exists public.administradores (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.administradores where user_id = auth.uid());
$$;

-- 4. Reglas de seguridad --------------------------------------------
alter table public.productos       enable row level security;
alter table public.ajustes         enable row level security;
alter table public.administradores enable row level security;

-- Cualquier visitante ve los productos visibles; el admin ve todos
drop policy if exists "ver productos" on public.productos;
create policy "ver productos" on public.productos
  for select using (visible or public.es_admin());

drop policy if exists "admin gestiona productos" on public.productos;
create policy "admin gestiona productos" on public.productos
  for all using (public.es_admin()) with check (public.es_admin());

-- Cualquier visitante ve los ajustes; solo el admin los cambia
drop policy if exists "ver ajustes" on public.ajustes;
create policy "ver ajustes" on public.ajustes
  for select using (true);

drop policy if exists "admin gestiona ajustes" on public.ajustes;
create policy "admin gestiona ajustes" on public.ajustes
  for all using (public.es_admin()) with check (public.es_admin());

-- 5. Carpeta pública para las fotos ---------------------------------
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "admin sube fotos" on storage.objects;
create policy "admin sube fotos" on storage.objects
  for insert with check (bucket_id = 'productos' and public.es_admin());

drop policy if exists "admin cambia fotos" on storage.objects;
create policy "admin cambia fotos" on storage.objects
  for update using (bucket_id = 'productos' and public.es_admin());

drop policy if exists "admin borra fotos" on storage.objects;
create policy "admin borra fotos" on storage.objects
  for delete using (bucket_id = 'productos' and public.es_admin());

-- ================================================================
-- ÚLTIMO PASO (después de crear tu usuario en Authentication → Users):
-- reemplaza el correo y ejecuta solo esta línea para volverte admin.
--
-- insert into public.administradores (user_id)
-- select id from auth.users where email = 'tucorreo@gmail.com';
-- ================================================================
