// Pure logic for the customer environment console (no DOM).
// Input: a registry of customer projects (you fill it) and the known template versions with their fingerprints.
(function (root) {
  const DAY = 86400000;

  function parse(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error("Not valid JSON: " + e.message); }
    const list = Array.isArray(data) ? data : data && data.customers;
    if (!Array.isArray(list)) throw new Error('Expected {"customers":[...]} or an array');
    const skipped = [];
    const rows = list.filter((c, i) => {
      const ok = c && c.name && (c.owner === "us" || c.owner === "client");
      if (!ok) skipped.push(`#${i + 1}: needs a name and owner "us" or "client"`);
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
      if (c.checkedAt && (new Date(now) - new Date(c.checkedAt)) / DAY > o.staleDays) flags.push("stale check");
      if (c.state === "paused") flags.push("paused");
      if (c.owner === "client" && c.handover !== "done") flags.push("handover open");
      return Object.assign({}, c, { status, flags });
    });
  }

  // Rough monthly cost to YOU: only projects you own and that are running, in one paid organization.
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
