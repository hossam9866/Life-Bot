/* Dispatch Page
   - No jQuery
   - External libs loaded ONLY via JS injection
   - Uses local data.json (ready to swap with API later)
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

  function byId(id) {
    return document.getElementById(id);
  }
  function setText(id, v) {
    const el = byId(id);
    if (el) el.textContent = v;
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

  async function loadData() {
    const res = await fetch("./data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load data.json");
    return res.json();
  }

  function severityClass(sev) {
    const s = String(sev || "").toLowerCase();
    if (s === "critical") return "";
    if (s === "high") return " mcard--high";
    if (s === "medium") return " mcard--medium";
    if (s === "low") return " mcard--low";
    return "";
  }

  function missionCard(m) {
    const status = String(m.status || "").toLowerCase();
    const isPending = status === "pending";
    const badge = isPending ? "badge badge--pending" : "badge badge--progress";
    const badgeText = isPending ? "PENDING" : "IN PROGRESS";

    const casualties = m.casualties || { red: 0, yellow: 0, green: 0 };
    const total =
      (casualties.red || 0) +
      (casualties.yellow || 0) +
      (casualties.green || 0);

    return `
      <div class="mcard${severityClass(m.severity)}" role="listitem">
        <div class="mtop">
          <div class="mleft">
            <span class="mdot" aria-hidden="true"></span>
            <span class="mcode">${m.code}</span>
            <span class="${badge}">${badgeText}</span>
          </div>
          <div class="mtime">${m.lastUpdateLabel || "—"}</div>
        </div>

        <div class="tag">${m.type}</div>

        <div class="mdesc">${m.description}</div>

        <div class="mmeta">
          <div class="metaItem"><i class="fa-regular fa-user"></i><span>${
            m.officer
          }</span></div>
          <div class="metaItem"><i class="fa-solid fa-location-dot"></i><span>${m.coords.lat.toFixed(
            4
          )}, ${m.coords.lon.toFixed(4)}</span></div>
        </div>

        <div class="counters">
          <span class="pillMini pillMini--red">RED: <b>${
            casualties.red
          }</b></span>
          <span class="pillMini pillMini--yel">YEL: <b>${
            casualties.yellow
          }</b></span>
          <span class="pillMini pillMini--grn">GRN: <b>${
            casualties.green
          }</b></span>
        </div>

        <div class="totalLine">Total Casualties<sup>${total}</sup></div>
      </div>
    `;
  }

  function assetIcon(type) {
    const t = String(type || "").toLowerCase();
    if (t.includes("medevac")) return "fa-solid fa-helicopter";
    return "fa-solid fa-truck-medical";
  }

  function assetStatusClass(status) {
    const s = String(status || "").toLowerCase();
    return s === "available"
      ? "astatus astatus--available"
      : "astatus astatus--deployed";
  }

  function assetCard(a) {
    const crew = (a.crew || [])
      .map((x) => `<span class="chip">${x}</span>`)
      .join("");
    const equip = (a.equipment || [])
      .slice(0, 3)
      .map((x) => `<span class="chip">${x}</span>`)
      .join("");
    const more =
      a.equipment && a.equipment.length > 3
        ? `<span class="chip">+${a.equipment.length - 3} more</span>`
        : "";

    const mission = a.assignment
      ? `<div class="missionBox"><div><b>Mission:</b> ${a.assignment.mission}</div><div><b>ETA:</b> ${a.assignment.etaMin} minutes</div></div>`
      : "";

    return `
      <div class="acard" role="listitem">
        <div class="atop">
          <div class="aid">
            <div class="aicon"><i class="${assetIcon(a.type)}"></i></div>
            <div>
              <div class="aname">${a.code}</div>
              <div class="asub">${a.type}</div>
            </div>
          </div>
          <span class="${assetStatusClass(a.status)}">${String(
      a.status || ""
    ).toUpperCase()}</span>
        </div>

        <div class="hr"></div>

        <div class="smallLabel">CREW:</div>
        <div class="chips">${crew || `<span class="chip">—</span>`}</div>

        <div class="hr"></div>

        ${
          mission
            ? `<div class="smallLabel">ASSIGNMENT:</div>${mission}<div class="hr"></div>`
            : ""
        }

        <div class="smallLabel">EQUIPMENT:</div>
        <div class="chips">${equip}${more}</div>

        <div class="hr"></div>

        <div class="muted" style="display:flex;gap:8px;align-items:center">
          <i class="fa-solid fa-location-dot"></i>
          <span>Location: ${a.coords.lat.toFixed(4)}, ${a.coords.lon.toFixed(
      4
    )}</span>
        </div>
      </div>
    `;
  }

  function wireTelemedButton() {
    const btn = byId("btnTelemed");
    btn.addEventListener("click", () => {
      alert(
        "Demo: Telemedicine call request sent (replace with real workflow)."
      );
    });
  }

  async function bootstrap() {
    await injectCss(LIBS.tajawal);
    await injectCss(LIBS.fontAwesome);

    wireTelemedButton();

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

    // Lists
    const missionEl = byId("missionList");
    const assetEl = byId("assetList");

    missionEl.innerHTML = (data.missions || []).map(missionCard).join("");
    assetEl.innerHTML = (data.assets || []).map(assetCard).join("");
  }

  bootstrap().catch((err) => {
    console.error(err);
    const msg = document.createElement("div");
    msg.style.padding = "14px";
    msg.style.margin = "14px";
    msg.style.border = "1px solid #fecaca";
    msg.style.background = "#fff1f2";
    msg.style.borderRadius = "12px";
    msg.innerHTML = `<b>Dispatch page failed.</b><div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${String(
      err.message || err
    )}</div>`;
    document.body.prepend(msg);
  });
})();
