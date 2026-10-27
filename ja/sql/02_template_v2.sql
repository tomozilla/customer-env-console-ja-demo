-- テンプレート v2：ticketsに priority 列を足す。v1のあとに流す。
alter table portal.tickets add column if not exists priority text not null default 'normal';
insert into portal.template_meta (version) values (2) on conflict do nothing;
