/* Audit Page
   - No jQuery
   - Load Tajawal + FontAwesome via JS injection
   - Export to Excel (.xlsx) using SheetJS injected via JS
*/
(function () {
  const LIBS = {
    tajawal:
      "https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap",
    fontAwesome:
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
    sheetjs: "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
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

  function injectScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load script: " + src));
      document.head.appendChild(s);
    });
  }

  const byId = (id) => document.getElementById(id);
  const setText = (id, v) => {
    const el = byId(id);
    if (el) el.textContent = v;
  };

  async function loadData() {
    const res = await fetch("./data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load data.json");
    return res.json();
  }

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

  function catHtml(c, activeKey) {
    const active = c.key === activeKey ? "is-active" : "";
    return `
      <button class="cat ${active}" type="button" data-key="${c.key}">
        <i class="${c.icon}"></i>
        <div class="cat__name">${c.label}</div>
        <div class="cat__count">${c.count}</div>
      </button>
    `;
  }

  function pillHtml(p) {
    const cls = p.type ? `pill--${p.type}` : "";
    const icon = p.icon ? `<i class="${p.icon}"></i>` : "";
    return `<span class="pill ${cls}">${icon}${p.text}</span>`;
  }

  function reportHtml(r) {
    const pills = (r.pills || []).map(pillHtml).join("");
    return `
      <article class="report" data-id="${r.id}" data-type="${r.type}">
        <div class="reportTop">
          <div class="reportLeft">
            <div class="reportIdRow">
              <div class="reportId">${r.id}</div>
              ${pills}
            </div>
          </div>
        </div>

        <div class="reportMeta">
          <div class="metaItem">
            <div class="metaLabel">Casualties</div>
            <div class="metaVal">${r.casualties}</div>
          </div>
          <div class="metaItem">
            <div class="metaLabel">Duration</div>
            <div class="metaVal">${r.duration}</div>
          </div>
          <div class="metaItem">
            <div class="metaLabel">Closed by</div>
            <div class="metaVal">${r.closedBy}</div>
          </div>
          <div class="metaItem">
            <div class="metaLabel">Closed at</div>
            <div class="metaVal">${r.closedAt}</div>
          </div>
        </div>

        <div class="reportBody">
          <div class="afterAction">
            <div class="afterLabel">After Action Report</div>
            <div class="afterText">${r.afterAction}</div>
          </div>
        </div>

        <div class="reportFooter">
          <div><i class="fa-regular fa-user"></i> CMD: ${r.cmd}</div>
          <div><i class="fa-regular fa-user"></i> MED: ${r.med}</div>
        </div>
      </article>
    `;
  }

  function applyFilters(state) {
    const { data, activeCat, q } = state;

    const list = (data.reports || []).filter((r) => {
      const matchCat = activeCat === "all" ? true : r.type === activeCat;
      if (!matchCat) return false;

      if (!q) return true;

      const hay = [
        r.id,
        r.casualties,
        r.duration,
        r.closedBy,
        r.closedAt,
        r.afterAction,
        r.cmd,
        r.med,
        ...(r.pills || []).map((p) => p.text),
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q.toLowerCase());
    });

    byId("reportList").innerHTML = list.map(reportHtml).join("");
  }

  function buildExcel(data) {
    if (!window.XLSX) throw new Error("XLSX library not loaded");

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryRows = [
      ["Metric", "Value"],
      ["Active Incidents", data.summary.activeIncidents],
      ["Deployed Assets", data.summary.deployedAssets],
      ["Available Assets", data.summary.availableAssets],
      ["Total Casualties", data.summary.totalCasualties],
      ["Avg Response (min)", data.summary.avgResponseMin],
      ["Timestamp", data.header.timestamp],
      ["User", data.header.userName],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sheet 2: Categories
    const catRows = (data.categories.items || []).map((c) => ({
      key: c.key,
      label: c.label,
      count: c.count,
    }));
    const wsCats = XLSX.utils.json_to_sheet(catRows);
    XLSX.utils.book_append_sheet(wb, wsCats, "Categories");

    // Sheet 3: Reports
    const repRows = (data.reports || []).map((r) => ({
      id: r.id,
      type: r.type,
      pills: (r.pills || []).map((p) => p.text).join(" | "),
      casualties: r.casualties,
      duration: r.duration,
      closedBy: r.closedBy,
      closedAt: r.closedAt,
      afterAction: r.afterAction,
      cmd: r.cmd,
      med: r.med,
    }));
    const wsReports = XLSX.utils.json_to_sheet(repRows);
    XLSX.utils.book_append_sheet(wb, wsReports, "Reports");

    // Save
    const safeTime = new Date(data.header.timestamp)
      .toISOString()
      .replace(/[:.]/g, "-");
    XLSX.writeFile(wb, `audit_export_${safeTime}.xlsx`);
  }

  async function bootstrap() {
    await injectCss(LIBS.tajawal);
    await injectCss(LIBS.fontAwesome);
    await injectScript(LIBS.sheetjs);

    const data = await loadData();

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

    const state = {
      data,
      activeCat: data.categories.defaultKey || "all",
      q: "",
    };

    // categories
    const cats = data.categories.items || [];
    byId("catTabs").innerHTML = cats
      .map((c) => catHtml(c, state.activeCat))
      .join("");

    // category click
    byId("catTabs")
      .querySelectorAll(".cat")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.key || "all";
          state.activeCat = key;

          byId("catTabs")
            .querySelectorAll(".cat")
            .forEach((b) =>
              b.classList.toggle("is-active", b.dataset.key === key)
            );

          applyFilters(state);
        });
      });

    // search
    const searchInput = byId("searchInput");
    searchInput.addEventListener("input", () => {
      state.q = searchInput.value.trim();
      applyFilters(state);
    });

    // buttons
    byId("btnTelemed").addEventListener("click", () =>
      alert("Demo: Telemedicine request (replace later).")
    );
    byId("btnFilter").addEventListener("click", () =>
      alert("Demo: filter UI (add later).")
    );

    // EXPORT => Excel (.xlsx)
    byId("btnExport").addEventListener("click", () => {
      buildExcel(data);
    });

    // initial render
    applyFilters(state);
  }

  bootstrap().catch((err) => {
    console.error(err);
    const msg = document.createElement("div");
    msg.style.padding = "14px";
    msg.style.margin = "14px";
    msg.style.border = "1px solid #fecaca";
    msg.style.background = "#fff1f2";
    msg.style.borderRadius = "12px";
    msg.innerHTML = `<b>Audit page failed.</b><div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${String(
      err.message || err
    )}</div>`;
    document.body.prepend(msg);
  });
})();
