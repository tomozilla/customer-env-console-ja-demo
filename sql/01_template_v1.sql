-- Template v1: a tiny "client portal" schema, applied to EVERY customer project.
-- Idempotent: safe to run twice. Lives in its own schema so it never touches other tables.
create schema if not exists portal;

create table if not exists portal.template_meta (
  version    int primary key,
  applied_at timestamptz not null default now()
);

-- RLS on, no policy: the API roles can't read it. (The dashboard warned me when I forgot this line.)
alter table portal.template_meta enable row level security;

create table if not exists portal.tickets (
  id         bigint generated always as identity primary key,
  title      text not null,
  status     text not null default 'open',
  created_at timestamptz not null default now()
);

alter table portal.tickets enable row level security;

-- Demo policy: any signed-in user of THIS project may read and add tickets.
-- (One project per customer means "signed in" already means "belongs to this customer".)
drop policy if exists "tickets read" on portal.tickets;
create policy "tickets read" on portal.tickets for select to authenticated using (true);
drop policy if exists "tickets insert" on portal.tickets;
create policy "tickets insert" on portal.tickets for insert to authenticated with check (true);

insert into portal.template_meta (version) values (1) on conflict do nothing;
