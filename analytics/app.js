/* Analytics Page
   - No jQuery
   - Load FontAwesome + Tajawal + ECharts via JS injection
   - Render KPI cards + charts + lists from JSON
*/
(function () {
  const LIBS = {
    tajawal:
      "https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap",
    fontAwesome:
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
    echarts: "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js",
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
      document.body.appendChild(s);
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

  function kpiHtml(k) {
    const prog =
      typeof k.progress === "number"
        ? Math.max(0, Math.min(100, k.progress))
        : null;
    const metaL = k.metaLeft
      ? `<div class="kpiMeta">${k.metaLeft}</div>`
      : `<div class="kpiMeta">&nbsp;</div>`;
    const metaR = k.metaRight
      ? `<div class="kpiMeta">${k.metaRight}</div>`
      : `<div class="kpiMeta">&nbsp;</div>`;

    return `
      <div class="kpi">
        <div class="kpiLeft">
          <div class="kpiTop">
            <div class="kpiIcon"><i class="${k.icon}"></i></div>
            <div class="kpiName">${k.title}</div>
          </div>
          <div class="kpiVal">${k.value}</div>
          ${metaL}
        </div>

        <div class="kpiRight">
          ${
            k.delta
              ? `<div class="kpiDelta"><i class="fa-solid fa-arrow-trend-up"></i> ${k.delta}</div>`
              : `<div class="kpiDelta" style="opacity:.0">—</div>`
          }
          ${
            k.dot
              ? `<div class="kpiDot"></div>`
              : `<div style="height:14px"></div>`
          }
          ${
            prog === null
              ? metaR
              : `
            <div class="kpiProg" title="${prog}%">
              <span style="width:${prog}%"></span>
            </div>
            ${metaR}
          `
          }
        </div>
      </div>
    `;
  }

  function triageRowHtml(t) {
    const pct = Math.max(0, Math.min(100, t.percent));
    return `
      <div class="row">
        <div class="badge"><span class="dot ${t.color}"></span>${t.label}</div>
        <div class="bar"><span class="${t.color}" style="width:${pct}%"></span></div>
        <div class="val">${t.count} <span style="color:#94a3b8">(${t.percent}%)</span></div>
      </div>
    `;
  }

  function utilItemHtml(u) {
    const pct = Math.max(0, Math.min(100, u.percent));
    return `
      <div class="utilItem">
        <div class="utilTop">
          <div class="utilName">${u.name}</div>
          <div class="utilPct">${pct}% deployed</div>
        </div>
        <div class="utilBar"><span style="width:${pct}%"></span></div>
      </div>
    `;
  }

  function missionHtml(m) {
    return `
      <div class="mStat">
        <div class="mNum">${m.value}</div>
        <div class="mLbl">${m.label}</div>
        <div class="mDelta">${m.delta || ""}</div>
      </div>
    `;
  }

  function renderCharts(rangeData) {
    const echarts = window.echarts;
    if (!echarts) return;

    // Chart 1: Response trend
    const el1 = byId("chartResponseTrend");
    const c1 = echarts.init(el1, null, { renderer: "canvas" });

    c1.setOption({
      grid: { left: 44, right: 16, top: 20, bottom: 30 },
      xAxis: {
        type: "category",
        data: rangeData.responseTrend.labels,
        axisLine: { lineStyle: { color: "#e5e7eb" } },
        axisTick: { show: false },
        axisLabel: { color: "#64748b", fontWeight: 700 },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#64748b", fontWeight: 700 },
        splitLine: { lineStyle: { color: "#eef2f7" } },
      },
      tooltip: { trigger: "axis" },
      series: [
        {
          name: "Avg Minutes",
          type: "line",
          data: rangeData.responseTrend.values,
          smooth: true,
          symbol: "circle",
          symbolSize: 7,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.06 },
        },
        {
          name: "Target",
          type: "line",
          data: new Array(rangeData.responseTrend.labels.length).fill(
            rangeData.responseTrend.target
          ),
          symbol: "none",
          lineStyle: { type: "dashed", width: 2 },
          tooltip: { show: false },
        },
      ],
    });

    // Chart 2: Incidents + Evacs
    const el2 = byId("chartIncidents");
    const c2 = echarts.init(el2, null, { renderer: "canvas" });

    c2.setOption({
      grid: { left: 44, right: 16, top: 20, bottom: 30 },
      xAxis: {
        type: "category",
        data: rangeData.incidentVolume.labels,
        axisLine: { lineStyle: { color: "#e5e7eb" } },
        axisTick: { show: false },
        axisLabel: { color: "#64748b", fontWeight: 700 },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#64748b", fontWeight: 700 },
        splitLine: { lineStyle: { color: "#eef2f7" } },
      },
      tooltip: { trigger: "axis" },
      legend: {
        top: 0,
        right: 10,
        textStyle: { color: "#64748b", fontWeight: 800 },
      },
      series: [
        {
          name: "Incidents",
          type: "bar",
          data: rangeData.incidentVolume.incidents,
          barWidth: 26,
        },
        {
          name: "Evacuations",
          type: "bar",
          data: rangeData.incidentVolume.evacuations,
          barWidth: 26,
        },
      ],
    });

    function resizeAll() {
      c1.resize();
      c2.resize();
    }
    window.addEventListener("resize", resizeAll);

    // return for updates if needed
    return { c1, c2, resizeAll };
  }

  function applyRange(data, rangeKey) {
    const range = data.analytics.ranges[rangeKey];
    if (!range) return;

    // update header "Incident Volume & Evacuations (xx)"
    setText("rangeTitle", rangeKey);

    // KPI cards
    byId("kpiGrid").innerHTML = (range.kpis || []).map(kpiHtml).join("");

    // Triage
    byId("triageList").innerHTML = (range.triage || [])
      .map(triageRowHtml)
      .join("");

    // Utilization
    byId("utilList").innerHTML = (range.utilization || [])
      .map(utilItemHtml)
      .join("");

    // Mission
    byId("missionGrid").innerHTML = (range.mission || [])
      .map(missionHtml)
      .join("");

    // Charts
    // dispose old instances (avoid overlay)
    if (window.__charts) {
      try {
        window.__charts.c1.dispose();
      } catch {}
      try {
        window.__charts.c2.dispose();
      } catch {}
      window.__charts = null;
    }
    window.__charts = renderCharts(range);
  }

  async function bootstrap() {
    await injectCss(LIBS.tajawal);
    await injectCss(LIBS.fontAwesome);
    await injectScript(LIBS.echarts);

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

    // Range buttons
    const btns = Array.from(document.querySelectorAll(".rangeBtn"));
    let currentRange = data.analytics.defaultRange || "7d";

    function setActiveBtn(key) {
      btns.forEach((b) =>
        b.classList.toggle("is-active", b.dataset.range === key)
      );
    }

    btns.forEach((b) => {
      b.addEventListener("click", () => {
        const key = b.dataset.range;
        if (!key) return;
        currentRange = key;
        setActiveBtn(key);
        applyRange(data, key);
      });
    });

    // initial
    setActiveBtn(currentRange);
    applyRange(data, currentRange);

    byId("btnTelemed").addEventListener("click", () =>
      alert("Demo: Telemedicine request (replace later).")
    );
  }

  bootstrap().catch((err) => {
    console.error(err);
    const msg = document.createElement("div");
    msg.style.padding = "14px";
    msg.style.margin = "14px";
    msg.style.border = "1px solid #fecaca";
    msg.style.background = "#fff1f2";
    msg.style.borderRadius = "12px";
    msg.innerHTML = `<b>Analytics page failed.</b><div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${String(
      err.message || err
    )}</div>`;
    document.body.prepend(msg);
  });
})();
