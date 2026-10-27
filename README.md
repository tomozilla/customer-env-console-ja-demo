# customer-env-console-ja-demo

English | [日本語](README.ja.md)

A small learning demo for running **one Supabase project per customer**: a SQL template you apply to every project, a **schema fingerprint** query that tells you whether a project still matches the template, and a static console page that reads a registry of customer projects and flags which are current, behind, or changed by hand.

> **A personal learning project.** Not an official tool of any company. All customer names are fictional. The page never connects to any project: you run the fingerprint SQL yourself and paste the result into the registry.

This is the code for two Japanese articles on Qiita: a how-to (template, fingerprint, hand-over, costs) and a web-app article about the console.

Page/UI texts and comments are English. Japanese copies (Japanese comments and UI) are in [`ja/`](ja/).

## Files

| File | What it is |
|---|---|
| `sql/01_template_v1.sql`, `sql/02_template_v2.sql` | The template (idempotent) in its own `portal` schema |
| `sql/10_fingerprint.sql` | Returns the template version and a hash of the schema's shape (columns, RLS flags, policies; not data) |
| `sql/99_cleanup.sql` | Drops the `portal` schema |
| `app/registry.js` | Pure logic: parse the registry, judge each project, cost for the ones you own |
| `app/versions.json` | Known template versions with their fingerprints (dated). **Update when you release a version** |
| `app/index.html`, `app/app.js` | The console page |
| `app/test.js`, `app/package.json` | 15 checks (`node app/test.js`) |
| `sample/registry.sample.json` | A fictional registry (the fingerprints are real values from my test run) |
| `ja/` | The same with Japanese comments and UI |

## Cost

- Running the page and the SQL on free projects costs nothing.
- The page's monthly figure covers only projects **you own** that are running, in one paid organization: plan fee (Pro $25, pricing page, 2026-10-27) + $10 per running project (Micro) - $10 included. Paused projects and customer-owned projects are not counted. An estimate; not checked against an invoice.

## Run

```bash
# SQL: paste sql/01_template_v1.sql into the SQL editor of each project, then sql/10_fingerprint.sql
# Console, from the repository root (the sample button reads ../sample/):
python3 -m http.server 8000
# open http://localhost:8000/app/
node app/test.js
```

## Security notes

- The template's example policy ("any signed-in user can read and insert") is only safe because **each project serves one customer**. In a shared project, filter by a customer id with RLS.
- `portal.template_meta` has RLS enabled and no policy on purpose.
- The fingerprint reads only metadata. It sees no customer data.

## What was verified (2026-10-27) and what was not

- Verified on two free projects: template v1 applied to both gives the **same fingerprint**; adding one column by hand changes it; applying v2 to one project gives a different, expected fingerprint; the console page and `node app/test.js` in a clean copy.
- Not verified: applying the template with the Supabase CLI migrations, a real hand-over to a customer's organization, roles and scoped access (Team), more than a handful of projects, phone-width layout.

## Cleanup

Run `sql/99_cleanup.sql` in each project, and stop the local server.

## License

MIT (see `LICENSE`).
