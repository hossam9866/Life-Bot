/* Personnel Page
   - No jQuery
   - External libs loaded ONLY via JS injection
   - JSON-driven list cards with assignment + fatigue + certifications
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

  function statusBadge(status) {
    const s = String(status).toLowerCase();
    if (s === "on duty")
      return `<span class="statusBadge statusOnDuty">ON DUTY</span>`;
    return `<span class="statusBadge statusDeployed">DEPLOYED</span>`;
  }

  function certChip(c) {
    return `<span class="chip">${c}</span>`;
  }

  function personCard(p) {
    const fatigue = Math.max(0, Math.min(100, Number(p.fatigue || 0)));
    return `
      <section class="personCard">
        <div class="rowTop">
          <div class="leftMeta">
            <div class="avatar"><i class="fa-solid fa-user"></i></div>
            <div class="nameWrap">
              <div class="pName">${p.name}</div>
              <div class="pId">${p.id}</div>
            </div>
          </div>
          <div>${statusBadge(p.status)}</div>
        </div>

        <div class="roleRow">
          <div class="roleIcon"><i class="fa-regular fa-shield"></i></div>
          <div class="roleChip">${p.role}</div>
        </div>

        ${
          p.assignment
            ? `
          <div class="assignBar">
            <b>Current Assignment</b><span>${p.assignment}</span>
          </div>
        `
            : ""
        }

        <div class="block">
          <div class="blockHead">
            <div class="blockTitle">
              <i class="fa-regular fa-battery-half"></i>
              <span>Fatigue Level</span>
            </div>
            <div class="fatVal">${fatigue}<small>%</small></div>
          </div>
          <div class="fatTrack"><span style="width:${fatigue}%"></span></div>

          <div class="certTitle">
            <i class="fa-solid fa-certificate"></i>
            <span>CERTIFICATIONS</span>
          </div>
          <div class="chips">
            ${(p.certs || []).map(certChip).join("")}
          </div>
        </div>
      </section>
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

    // List
    byId("personList").innerHTML = (data.people || []).map(personCard).join("");

    // Buttons demo
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
    msg.innerHTML = `<b>Personnel page failed.</b><div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${String(
      err.message || err
    )}</div>`;
    document.body.prepend(msg);
  });
})();
