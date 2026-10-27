-- テンプレート v1：小さな「顧客ポータル」のスキーマ。全ての顧客プロジェクトに流す。
-- 何度流しても壊れない。専用のスキーマに作るので、他のテーブルには触らない。
create schema if not exists portal;

create table if not exists portal.template_meta (
  version    int primary key,
  applied_at timestamptz not null default now()
);

-- RLS有効・ポリシーなし：APIのロールからは読めない。（この1行を忘れたとき、ダッシュボードに警告された）
alter table portal.template_meta enable row level security;

create table if not exists portal.tickets (
  id         bigint generated always as identity primary key,
  title      text not null,
  status     text not null default 'open',
  created_at timestamptz not null default now()
);

alter table portal.tickets enable row level security;

-- デモ用ポリシー：このプロジェクトにログインした人は、チケットを読み・追加できる。
-- （1プロジェクト＝1顧客なので、「ログイン済み」は「この顧客の人」を意味する）
drop policy if exists "tickets read" on portal.tickets;
create policy "tickets read" on portal.tickets for select to authenticated using (true);
drop policy if exists "tickets insert" on portal.tickets;
create policy "tickets insert" on portal.tickets for insert to authenticated with check (true);

insert into portal.template_meta (version) values (1) on conflict do nothing;
