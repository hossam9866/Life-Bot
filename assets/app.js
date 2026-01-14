/* Assets Page
   - No jQuery
   - External libs loaded ONLY via JS injection
   - Local data.json
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

  function iconFor(asset) {
    const t = String(asset.type || "").toLowerCase();
    if (t.includes("uav")) return "fa-solid fa-satellite-dish";
    if (t.includes("medevac") || t.includes("helicopter"))
      return "fa-solid fa-helicopter";
    if (t.includes("field medic") || t.includes("medic"))
      return "fa-solid fa-user-doctor";
    return "fa-solid fa-truck-medical";
  }

  function statusClass(status) {
    const s = String(status || "").toLowerCase();
    return s === "available"
      ? "status status--available"
      : "status status--deployed";
  }

  function card(asset) {
    const isAvailable = String(asset.status).toLowerCase() === "available";
    const iconClass = isAvailable ? "icon icon--green" : "icon";
    const crew =
      (asset.crew || [])
        .map((x) => `<span class="chip">${x}</span>`)
        .join("") || `<span class="chip">—</span>`;

    const equip = (asset.equipment || [])
      .slice(0, 3)
      .map((x) => `<span class="chip">${x}</span>`)
      .join("");
    const more =
      asset.equipment && asset.equipment.length > 3
        ? `<span class="chip">+${asset.equipment.length - 3} more</span>`
        : "";

    const assign = asset.assignment
      ? `<div class="assign"><div><b>Mission:</b> ${asset.assignment.mission}</div><div><b>ETA:</b> ${asset.assignment.etaMin} minutes</div></div>`
      : "";

    return `
      <div class="card" role="listitem">
        <div class="row1">
          <div class="left">
            <div class="${iconClass}"><i class="${iconFor(asset)}"></i></div>
            <div style="min-width:0">
              <div class="name">${asset.code}</div>
              <div class="type">${asset.type}</div>
            </div>
          </div>
          <span class="${statusClass(asset.status)}">${String(
      asset.status
    ).toUpperCase()}</span>
        </div>

        <div class="hr"></div>

        <div class="body">
          <div class="label">CREW:</div>
          <div class="chips">${crew}</div>

          ${
            assign
              ? `<div class="hr" style="margin:12px 0"></div>${assign}`
              : ""
          }

          <div class="hr" style="margin:12px 0"></div>

          <div class="label">EQUIPMENT:</div>
          <div class="chips">${equip}${more}</div>

          <div class="loc"><i class="fa-solid fa-location-dot"></i>
            <span>Location: ${asset.coords.lat.toFixed(
              4
            )}, ${asset.coords.lon.toFixed(4)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function wireTelemedButton() {
    const btn = byId("btnTelemed");
    btn.addEventListener("click", () =>
      alert("Demo: Telemedicine call request sent (replace with workflow).")
    );
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

    // Render lists
    const ground = (data.assets || []).filter(
      (a) => String(a.group).toLowerCase() === "ground"
    );
    const air = (data.assets || []).filter(
      (a) => String(a.group).toLowerCase() === "air"
    );

    byId("groundList").innerHTML = ground.map(card).join("");
    byId("airList").innerHTML = air.map(card).join("");
  }

  bootstrap().catch((err) => {
    console.error(err);
    const msg = document.createElement("div");
    msg.style.padding = "14px";
    msg.style.margin = "14px";
    msg.style.border = "1px solid #fecaca";
    msg.style.background = "#fff1f2";
    msg.style.borderRadius = "12px";
    msg.innerHTML = `<b>Assets page failed.</b><div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${String(
      err.message || err
    )}</div>`;
    document.body.prepend(msg);
  });
})();
