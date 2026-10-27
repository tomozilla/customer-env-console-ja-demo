// Customer environment console: paste a registry, compare each project's template fingerprint with the known versions.
const $ = (id) => document.getElementById(id);
let versions = null;
let rows = [];

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function load(text) {
  $("msg").innerHTML = "";
  if (!text.trim()) { rows = []; render(); return; }
  try {
    const r = Registry.parse(text);
    rows = r.rows;
    if (r.skipped.length) $("msg").innerHTML = `<div class="warn">Skipped ${r.skipped.length} row(s): ${esc(r.skipped.join("; "))}</div>`;
  } catch (e) {
    rows = [];
    $("msg").innerHTML = `<div class="warn err">${esc(e.message)}</div>`;
  }
  render();
}

const LABEL = { current: "current", behind: "behind the template", drift: "changed by hand", unchecked: "not checked", "unknown-version": "unknown version" };

function render() {
  if (!versions) return;
  if (!rows.length) { $("board").innerHTML = ""; return; }
  const ev = Registry.evaluate(rows, versions, new Date());
  const s = Registry.summary(ev);
  const c = Registry.cost(ev, versions.cost);
  let html = `<div class="tot">` +
    `<div class="box">Projects<b>${ev.length}</b>${c.mine} yours, ${c.clientOwned} owned by clients</div>` +
    `<div class="box">Current<b>${s.current}</b>match template v${versions.latest}</div>` +
    `<div class="box">Need attention<b>${s.behind + s.drift + s["unknown-version"]}</b>${s.behind} behind, ${s.drift} changed by hand</div>` +
    `<div class="box">Not checked<b>${s.unchecked}</b>no fingerprint yet</div>` +
    `<div class="box">Your monthly cost<b>about $${c.total}</b>${c.running} running, yours only</div></div>`;
  html += `<section class="card"><table><tr><th>Customer</th><th>Owner</th><th>State</th><th>Template</th><th>Check</th><th>Notes</th></tr>` +
    ev.map((x) => `<tr><td>${esc(x.name)}</td><td>${esc(x.owner)}</td><td>${esc(x.state || "")}</td><td>${esc(x.version || "-")}</td><td><span class="chip ${x.status}">${LABEL[x.status]}</span></td><td>${x.flags.map((f) => `<span class="chip">${esc(f)}</span>`).join("")}</td></tr>`).join("") +
    `</table></section>`;
  $("board").innerHTML = html;
}

async function init() {
  try {
    const res = await fetch("versions.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    versions = await res.json();
  } catch (e) {
    $("banner").innerHTML = `<div class="warn err">Could not load versions.json (${esc(e.message)}). Open this page through a local web server.</div>`;
    return;
  }
  $("foot").innerHTML = `Known template versions as of ${esc(versions.asOf)}: run <code>sql/10_fingerprint.sql</code> in each project and put the result into the registry. "Changed by hand" means the schema no longer matches the fingerprint of its own version: it does not say who changed it or why. Cost: ${esc(versions.cost.note)}; estimate only.`;
  $("input").addEventListener("input", () => load($("input").value));
  $("clear").addEventListener("click", () => { $("input").value = ""; load(""); });
  $("load-sample").addEventListener("click", async () => {
    try {
      const r = await fetch("../sample/registry.sample.json");
      if (!r.ok) throw new Error("HTTP " + r.status);
      $("input").value = await r.text();
      load($("input").value);
    } catch (e) { $("msg").innerHTML = `<div class="warn err">Could not load the sample (${esc(e.message)}). Serve the repository root, not the app folder.</div>`; }
  });
  render();
}
init();
