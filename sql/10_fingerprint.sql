-- Fingerprint of the template schema in THIS project.
-- Run it in every customer project and compare the result with the registry.
-- It hashes columns, RLS flags and policies of the "portal" schema (not the data).
select
  'v' || coalesce((select max(version) from portal.template_meta), 0) as template_version,
  left(md5(coalesce(string_agg(x, '|' order by x), '')), 10) as fingerprint,
  count(*) as parts
from (
  select 'col:' || table_name || '.' || column_name || ':' || data_type || ':' || is_nullable as x
    from information_schema.columns where table_schema = 'portal'
  union all
  select 'rls:' || c.relname || ':' || c.relrowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'portal' and c.relkind = 'r'
  union all
  select 'pol:' || tablename || ':' || policyname || ':' || cmd
    from pg_policies where schemaname = 'portal'
) t;
