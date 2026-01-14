/* Security Page
   - No jQuery
   - External libs loaded ONLY via JS injection
   - JSON-driven stats, regions, alerts
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

  function miniHtml(x) {
    return `
      <div class="mini">
        <div class="k">${x.label}</div>
        <div class="v ${x.color || ""}">${x.value}</div>
      </div>
    `;
  }

  function regionHtml(r) {
    return `
      <div class="regionCard">
        <div class="rIcon ${r.levelColor}">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div class="rBody">
          <div class="rTitleRow">
            <div class="rTitle">${r.name}</div>
            <span class="rBadge ${r.levelColor}">${r.level}</span>
          </div>
          <div class="rDesc">${r.description}</div>
          <div class="rTime">Last update: ${r.lastUpdate}</div>
        </div>
      </div>
    `;
  }

  function alertBadgeClass(sev) {
    const s = String(sev).toLowerCase();
    if (s === "critical") return "aBadge critical";
    if (s === "high") return "aBadge high";
    return "aBadge medium";
  }
  function alertIconClass(sev) {
    const s = String(sev).toLowerCase();
    if (s === "critical") return "aIcon red";
    if (s === "high") return "aIcon orange";
    return "aIcon yellow";
  }

  function alertHtml(a) {
    return `
      <div class="alertRow">
        <div class="aLeft">
          <div class="${alertIconClass(a.severity)}">
            <i class="fa-solid fa-skull-crossbones"></i>
          </div>
          <div class="aMain">
            <div class="aTop">
              <div class="aCode">${a.code}</div>
              <span class="${alertBadgeClass(a.severity)}">${a.severity}</span>
            </div>
            <div class="aDesc">${a.description}</div>
            <div class="aMeta">${a.type}</div>
          </div>
        </div>
        <div class="aRight">
          <i class="fa-regular fa-clock"></i>
          <span>${a.when}</span>
        </div>
      </div>
    `;
  }

  async function bootstrap() {
    await injectCss(LIBS.tajawal);
    await injectCss(LIBS.fontAwesome);

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

    // Security stats row
    byId("secStats").innerHTML = (data.security.stats || [])
      .map(miniHtml)
      .join("");

    // Regions
    byId("regions").innerHTML = (data.security.regions || [])
      .map(regionHtml)
      .join("");

    // Alerts list
    byId("alerts").innerHTML = (data.security.alerts || [])
      .map(alertHtml)
      .join("");

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
    msg.innerHTML = `<b>Security page failed.</b><div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${String(
      err.message || err
    )}</div>`;
    document.body.prepend(msg);
  });
})();
