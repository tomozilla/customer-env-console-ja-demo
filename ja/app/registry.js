// 顧客環境コンソールの計算だけのファイル（画面に依存しない）。
// 入力：顧客プロジェクトの台帳（自分で書く）と、既知のテンプレートの版・指紋。
(function (root) {
  const DAY = 86400000;

  function parse(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error("JSONとして読めません：" + e.message); }
    const list = Array.isArray(data) ? data : data && data.customers;
    if (!Array.isArray(list)) throw new Error('{"customers":[...]} か配列が必要です');
    const skipped = [];
    const rows = list.filter((c, i) => {
      const ok = c && c.name && (c.owner === "us" || c.owner === "client");
      if (!ok) skipped.push(`#${i + 1}: name と、owner（"us" か "client"）が必要です`);
      return ok;
    });
    return { rows, skipped };
  }

  // status: current | behind | drift | unchecked | unknown-version | stale
  function evaluate(rows, versions, now, opts) {
    const o = Object.assign({ staleDays: 30 }, opts);
    const latest = String(versions.latest);
    return rows.map((c) => {
      const flags = [];
      let status;
      const v = (c.version || "").replace(/^v/, "");
      if (!c.fingerprint || !v) status = "unchecked";
      else if (!versions.versions[v]) status = "unknown-version";
      else if (c.fingerprint !== versions.versions[v].fingerprint) status = "drift";
      else status = v === latest ? "current" : "behind";
      if (c.checkedAt && (new Date(now) - new Date(c.checkedAt)) / DAY > o.staleDays) flags.push("確認が古い");
      if (c.state === "paused") flags.push("停止中");
      if (c.owner === "client" && c.handover !== "done") flags.push("引き渡し未完了");
      return Object.assign({}, c, { status, flags });
    });
  }

  // 自社が払う月額の目安：自社が持ち、動いているプロジェクトだけ（1つの有料組織の前提）。
  function cost(evaluated, cfg) {
    const mine = evaluated.filter((c) => c.owner === "us");
    const running = mine.filter((c) => c.state !== "paused").length;
    const clientOwned = evaluated.length - mine.length;
    const total = running === 0 ? 0 : cfg.plan + Math.max(0, running * cfg.perProject - cfg.included);
    return { total, running, mine: mine.length, clientOwned };
  }

  function summary(evaluated) {
    const s = { current: 0, behind: 0, drift: 0, unchecked: 0, "unknown-version": 0 };
    for (const c of evaluated) s[c.status]++;
    return s;
  }

  const api = { parse, evaluate, cost, summary };
  if (typeof module !== "undefined") module.exports = api; else root.Registry = api;
})(this);
