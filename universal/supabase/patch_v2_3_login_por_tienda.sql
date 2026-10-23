-- ============================================================================
-- SEBAS-POS · Parche v2.3 — Inicio de sesión por nombre de tienda
-- Ejecutar UNA VEZ en Supabase > SQL Editor (después de schema.sql). Es idempotente.
-- ============================================================================

-- 1. Nombres de tienda únicos (sin distinguir mayúsculas) ----------------------
-- Primero se renombran duplicados existentes para poder crear el índice único.
with d as (
  select id, row_number() over (partition by lower(name) order by created_at, id) as rn
  from public.stores
)
update public.stores s
   set name = s.name || ' ' || substr(s.id::text, 1, 4)
  from d
 where d.id = s.id and d.rn > 1;

create unique index if not exists stores_name_unique on public.stores (lower(name));

-- 2. Resolver correo a partir del nombre de tienda -----------------------------
-- IMPORTANTE (privacidad): esta función es invocable sin sesión; devuelve el correo del
-- dueño de una tienda si se conoce su nombre exacto. Es el costo de permitir
-- "entrar con el nombre de la tienda". Si prefieres evitarlo, elimina esta función y
-- la app seguirá funcionando solo con correo.
create or replace function public.email_for_store(store_name text)
returns text
language sql stable security definer
set search_path = public, auth
as $$
  select u.email::text
    from public.stores s
    join auth.users u on u.id = s.owner_id
   where lower(s.name) = lower(trim(store_name))
   limit 1;
$$;
revoke all on function public.email_for_store(text) from public;
grant execute on function public.email_for_store(text) to anon, authenticated;

-- 3. Disponibilidad de nombre al registrarse (no revela correos) ----------------
create or replace function public.store_name_available(store_name text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.stores where lower(name) = lower(trim(store_name))
  );
$$;
revoke all on function public.store_name_available(text) from public;
grant execute on function public.store_name_available(text) to anon, authenticated;

-- 4. Alta de usuario: respeta la unicidad del nombre (carrera / valores por defecto) ---
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  sid  uuid;
  base text := coalesce(nullif(trim(new.raw_user_meta_data->>'store_name'), ''), 'Mi tienda');
  nm   text := base;
begin
  if exists (select 1 from public.stores where lower(name) = lower(nm)) then
    nm := base || ' ' || substr(new.id::text, 1, 4);
  end if;
  insert into public.stores(name, owner_id) values (nm, new.id) returning id into sid;
  insert into public.store_members(store_id, user_id, role) values (sid, new.id, 'owner');
  insert into public.store_settings(store_id) values (sid);
  return new;
end $$;

