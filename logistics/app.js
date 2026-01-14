/* Logistics Page
   - No jQuery
   - External libs loaded ONLY via JS injection
   - JSON-driven inventory + alerts + KPI
   - Search + category filter
*/
(function () {
  const LIBS = {
    tajawal:
      "https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap",
    fontAwesome:
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
  };

  function injectCss(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = resolve;
      link.onerror = () => reject(new Error("Failed to load CSS: " + href));
      document.head.appendChild(link);
    });
  }

  const byId = (id) => document.getElementById(id);
  const setText = (id, v) => {
    const el = byId(id);
    if (el) el.textContent = v;
  };

  function fmtTime(ts) {
    const d = new Date(ts);
    const month = d.toLocaleString(undefined, { month: "short" }).toUpperCase();
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    const time = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `${month} ${day}, ${year} · ${time}`;
  }

  async function loadData() {
    const res = await fetch("./data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load data.json");
    return res.json();
  }

  function catBadge(cat) {
    const c = String(cat).toLowerCase();
    if (c === "trauma")
      return `<span class="badgeCat badgeTrauma">TRAUMA KIT</span>`;
    if (c === "drugs") return `<span class="badgeCat badgeDrugs">DRUGS</span>`;
    if (c === "equipment")
      return `<span class="badgeCat badgeEquipment">EQUIPMENT</span>`;
    return `<span class="badgeCat">OTHER</span>`;
  }

  function statusDot(status) {
    const s = String(status).toLowerCase();
    if (s === "ok") return `<span class="dotStatus dotOk"></span>`;
    if (s === "low") return `<span class="dotStatus dotWarn"></span>`;
    return `<span class="dotStatus dotBad"></span>`;
  }

  function itemIcon(cat) {
    const c = String(cat).toLowerCase();
    if (c === "trauma") return "fa-solid fa-kit-medical";
    if (c === "drugs") return "fa-solid fa-capsules";
    if (c === "equipment") return "fa-solid fa-suitcase-medical";
    return "fa-solid fa-box";
  }

  function rowHtml(it) {
    return `
      <tr>
        <td>
          <div class="itemCell">
            <div class="itemIcon"><i class="${itemIcon(it.category)}"></i></div>
            <div>
              <div style="font-weight:900">${it.name}</div>
              <div style="font-size:11px;color:#64748b;font-weight:800">${
                it.sku || ""
              }</div>
            </div>
          </div>
        </td>
        <td>${catBadge(it.category)}</td>
        <td style="color:#475569">${it.location}</td>
        <td>${it.qty}</td>
        <td style="color:#475569">${it.min}</td>
        <td>${statusDot(it.status)}</td>
        <td><button class="btnMini" data-action="details" data-id="${
          it.id
        }">Details</button></td>
      </tr>
    `;
  }

  function kpiHtml(k) {
    const trendCls =
      k.trend?.color === "green"
        ? "t-green"
        : k.trend?.color === "red"
        ? "t-red"
        : k.trend?.color === "orange"
        ? "t-orange"
        : "";

    return `
      <div class="kpi">
        <div class="k">${k.label}</div>
        <div class="v" style="color:${k.valueColor || "#0f172a"}">${
      k.value
    }</div>
        <div class="trend ${trendCls}">${k.trend?.text || ""}</div>
        <div class="sub">${k.sub || ""}</div>
      </div>
    `;
  }

  function alertLine(a) {
    return `<div class="alertLine">• ${a}</div>`;
  }

  function applyFilter(data, state) {
    const q = state.q.trim().toLowerCase();
    const f = state.filter;

    return (data.items || []).filter((it) => {
      const matchCat =
        f === "all" ? true : String(it.category).toLowerCase() === f;
      const matchQ = !q
        ? true
        : String(it.name).toLowerCase().includes(q) ||
          String(it.sku || "")
            .toLowerCase()
            .includes(q) ||
          String(it.location || "")
            .toLowerCase()
            .includes(q);
      return matchCat && matchQ;
    });
  }

  function wireActions(state, data) {
    // Filters
    document.querySelectorAll(".filters .pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".filters .pill")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.filter = btn.getAttribute("data-filter");
        render(state, data);
      });
    });

    // Search
    byId("q").addEventListener("input", (e) => {
      state.q = e.target.value || "";
      render(state, data);
    });

    // Buttons
    byId("btnExport").addEventListener("click", () =>
      alert("Demo: Export inventory (replace later).")
    );
    byId("btnResupply").addEventListener("click", () =>
      alert("Demo: Request resupply (replace later).")
    );
    byId("btnTelemed").addEventListener("click", () =>
      alert("Demo: Telemedicine request (replace later).")
    );

    // Table details
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action='details']");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      alert(`Demo: Open item details for ${id}`);
    });
  }

  function render(state, data) {
    // KPI row
    byId("kpiRow").innerHTML = (data.kpis || []).map(kpiHtml).join("");

    // Alerts
    const alerts = data.alerts || [];
    byId("alertsCount").textContent = `(${alerts.length})`;
    byId("alertsList").innerHTML = alerts.map(alertLine).join("");

    // Table
    const filtered = applyFilter(data, state);
    byId("rows").innerHTML = filtered.map(rowHtml).join("");
  }

  async function bootstrap() {
    await injectCss(LIBS.tajawal);
    await injectCss(LIBS.fontAwesome);

    const data = await loadData();
    const state = { q: "", filter: "all" };

    // Header
    setText("userName", data.header.userName);
    setText("notifBadge", String(data.header.notifications || 0));
    setText("headerTime", fmtTime(data.header.timestamp));
    setText("lastUpdate", "LAST UPDATE: " + fmtTime(data.header.timestamp));

    // Summary
    setText("mActive", String(data.summary.activeIncidents));
    setText("mDeployed", String(data.summary.deployedAssets));
    setText("mAvailable", String(data.summary.availableAssets));
    setText("mTotal", String(data.summary.totalCasualties));
    setText("mResponse", String(data.summary.avgResponseMin));

    wireActions(state, data);
    render(state, data);
  }

  bootstrap().catch((err) => {
    console.error(err);
    const msg = document.createElement("div");
    msg.style.padding = "14px";
    msg.style.margin = "14px";
    msg.style.border = "1px solid #fecaca";
    msg.style.background = "#fff1f2";
    msg.style.borderRadius = "12px";
    msg.innerHTML = `<b>Logistics page failed.</b><div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${String(
      err.message || err
    )}</div>`;
    document.body.prepend(msg);
  });
})();
