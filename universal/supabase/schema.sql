-- ============================================================================
-- SEBAS-POS · Esquema Supabase multi-tenant (v2.2)
-- Aislamiento por tienda: cada fila lleva store_id y RLS la limita a los
-- miembros de esa tienda. Ejecutar completo en: Supabase > SQL Editor.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Tenancy ------------------------------------------------------------------
create table if not exists public.stores (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Mi tienda',
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  role     text not null default 'owner' check (role in ('owner','staff')),
  primary key (store_id, user_id)
);
create index if not exists store_members_user_idx on public.store_members(user_id);

-- 2. Entidades de negocio (documento JSONB + store_id) -------------------------
-- El payload `data` conserva exactamente el modelo del dominio (productos con
-- lotes, ventas con ítems y garantías, etc.), de modo que la UI no cambia.
create table if not exists public.suppliers (
  store_id uuid not null references public.stores(id) on delete cascade,
  id text not null, data jsonb not null, updated_at timestamptz not null default now(),
  primary key (store_id, id)
);
create table if not exists public.products (
  store_id uuid not null references public.stores(id) on delete cascade,
  id text not null, data jsonb not null, updated_at timestamptz not null default now(),
  primary key (store_id, id)
);
create table if not exists public.sales (
  store_id uuid not null references public.stores(id) on delete cascade,
  id text not null, data jsonb not null, updated_at timestamptz not null default now(),
  primary key (store_id, id)
);
create table if not exists public.closures (
  store_id uuid not null references public.stores(id) on delete cascade,
  id text not null, data jsonb not null, updated_at timestamptz not null default now(),
  primary key (store_id, id)
);
create table if not exists public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  last_supplier_id text,
  intentionally_empty boolean not null default false
);

-- 3. Helper RLS ----------------------------------------------------------------
create or replace function public.is_store_member(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.store_members m
    where m.store_id = sid and m.user_id = auth.uid()
  );
$$;

-- 4. Row Level Security ---------------------------------------------------------
alter table public.stores         enable row level security;
alter table public.store_members  enable row level security;
alter table public.suppliers      enable row level security;
alter table public.products       enable row level security;
alter table public.sales          enable row level security;
alter table public.closures       enable row level security;
alter table public.store_settings enable row level security;

create policy "stores: miembros leen"    on public.stores for select using (public.is_store_member(id));
create policy "stores: dueño actualiza"  on public.stores for update using (owner_id = auth.uid());
create policy "members: ver propios"     on public.store_members for select using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['suppliers','products','sales','closures','store_settings'] loop
    execute format('create policy "%1$s: aislamiento por tienda" on public.%1$s
                    for all using (public.is_store_member(store_id))
                    with check (public.is_store_member(store_id));', t);
  end loop;
end $$;

-- 5. Alta automática: cada usuario nuevo recibe su propia tienda ----------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  insert into public.stores(name, owner_id)
  values (coalesce(new.raw_user_meta_data->>'store_name', 'Mi tienda'), new.id)
  returning id into sid;
  insert into public.store_members(store_id, user_id, role) values (sid, new.id, 'owner');
  insert into public.store_settings(store_id) values (sid);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

