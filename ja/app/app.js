// 顧客環境コンソール：台帳を貼り、各プロジェクトの指紋を既知の版と比べる。
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
    if (r.skipped.length) $("msg").innerHTML = `<div class="warn">${r.skipped.length}行を飛ばしました：${esc(r.skipped.join("; "))}</div>`;
  } catch (e) {
    rows = [];
    $("msg").innerHTML = `<div class="warn err">${esc(e.message)}</div>`;
  }
  render();
}

const LABEL = { current: "最新", behind: "古い", drift: "手で変更", unchecked: "未確認", "unknown-version": "未知の版" };

function render() {
  if (!versions) return;
  if (!rows.length) { $("board").innerHTML = ""; return; }
  const ev = Registry.evaluate(rows, versions, new Date());
  const s = Registry.summary(ev);
  const c = Registry.cost(ev, versions.cost);
  let html = `<div class="tot">` +
    `<div class="box">プロジェクト<b>${ev.length}</b>自社${c.mine}・顧客${c.clientOwned}</div>` +
    `<div class="box">最新<b>${s.current}</b>テンプレートv${versions.latest}と一致</div>` +
    `<div class="box">要確認<b>${s.behind + s.drift + s["unknown-version"]}</b>古い${s.behind}・手で変更${s.drift}</div>` +
    `<div class="box">未確認<b>${s.unchecked}</b>指紋がまだない</div>` +
    `<div class="box">自社の月額<b>約$${c.total}</b>動いている自社分${c.running}件</div></div>`;
  html += `<section class="card"><table><tr><th>顧客</th><th>持ち主</th><th>状態</th><th>版</th><th>判定</th><th>印</th></tr>` +
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
    $("banner").innerHTML = `<div class="warn err">versions.json を読み込めません（${esc(e.message)}）。ローカルのWebサーバー経由で開いてください。</div>`;
    return;
  }
  $("foot").innerHTML = `既知の版の時点：${esc(versions.asOf)}。各プロジェクトで <code>sql/10_fingerprint.sql</code> を実行し、結果を台帳に書いてください。「手で変更」は、版の指紋と形が合わない、という意味で、誰がなぜ変えたかは分かりません。費用の前提：${esc(versions.cost.note)}。目安です。`;
  $("input").addEventListener("input", () => load($("input").value));
  $("clear").addEventListener("click", () => { $("input").value = ""; load(""); });
  $("load-sample").addEventListener("click", async () => {
    try {
      const r = await fetch("../sample/registry.sample.json");
      if (!r.ok) throw new Error("HTTP " + r.status);
      $("input").value = await r.text();
      load($("input").value);
    } catch (e) { $("msg").innerHTML = `<div class="warn err">サンプルを読み込めません（${esc(e.message)}）。app フォルダではなく、リポジトリのルートで配信してください。</div>`; }
  });
  render();
}
init();
