-- Template v2: adds a priority column to tickets. Run AFTER v1.
alter table portal.tickets add column if not exists priority text not null default 'normal';
insert into portal.template_meta (version) values (2) on conflict do nothing;
