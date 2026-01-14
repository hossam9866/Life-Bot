/* Hospitals Page (pixel-structured like screenshot)
   - No jQuery
   - External libs loaded ONLY via JS injection
   - JSON-driven
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

  function readinessStat(item) {
    const cls =
      item.color === "blue"
        ? "c-blue"
        : item.color === "green"
        ? "c-green"
        : item.color === "red"
        ? "c-red"
        : item.color === "purple"
        ? "c-purple"
        : "";

    return `
      <div class="rstat">
        <div class="rstat__label">${item.label}</div>
        <div class="rstat__value ${cls}">${item.value}</div>
        <div class="rstat__sub ${cls}">${item.sub}</div>
      </div>
    `;
  }

  function equipDot(state) {
    const s = String(state).toLowerCase();
    if (s === "ready") return `<span class="dotOk"></span>`;
    if (s === "offline") return `<span class="dotBad"></span>`;
    return `<span class="dotWarn"></span>`;
  }

  function equipChip(state) {
    const s = String(state).toLowerCase();
    if (s === "ready")
      return `<span class="stateChip state-ready">Ready</span>`;
    if (s === "offline")
      return `<span class="stateChip state-offline">Offline</span>`;
    return `<span class="stateChip state-maint">Maintenance</span>`;
  }

  function facilityCard(f) {
    const capPct = Math.max(
      0,
      Math.min(100, (f.capacity.used / f.capacity.total) * 100)
    );
    const icuPct = (f.icu.used / f.icu.total) * 100;

    const bloodRow = (f.blood?.groups || [])
      .map((g) => {
        const isNeg = String(g.type).includes("-");
        return `<span class="${isNeg ? "neg" : "pos"}">${g.type}<b> ${
          g.value
        }</b></span>`;
      })
      .join("");

    const avatars = Array.from({
      length: Math.min(4, Number(f.specialists.available || 0)),
    })
      .map(() => `<span class="av"><i class="fa-solid fa-user"></i></span>`)
      .join("");

    const equipList = (f.equipment || [])
      .map(
        (e) => `
      <div class="equipItem">
        <div class="equipName">
          ${equipDot(e.state)}
          <span>${e.name}</span>
        </div>
        ${equipChip(e.state)}
      </div>
    `
      )
      .join("");

    const caps = (f.capabilities || [])
      .map((c) => `<span class="capChip">${c}</span>`)
      .join("");

    return `
      <section class="facility">
        <div class="facHead">
          <div class="facLeft">
            <div class="facIcon"><i class="fa-solid fa-hospital-user"></i></div>
            <div style="min-width:0">
              <div class="facTitle">
                <span class="facName">${f.name}</span>
                <span class="badgeRole">${f.role}</span>
                <span class="dot"></span>
              </div>
              <div class="facSub">${f.type}</div>
            </div>
          </div>
        </div>

        <div class="capRow">
          <div class="capTop">
            <div class="capLabel">Overall Capacity</div>
            <div class="capVal">${f.capacity.used} / ${f.capacity.total}</div>
          </div>
          <div class="progress"><span style="width:${capPct}%"></span></div>
        </div>

        <div class="hr"></div>

        <div class="midGrid">
          <div class="mbox">
            <div class="k">ICU BEDS</div>
            <div class="v">${f.icu.used} <span class="smallmuted">/ ${f.icu.total}</span></div>
            <div class="icuMini">
              <div class="progress"><span style="width:${icuPct}%"></span></div>
            </div>
          </div>

          <div class="mbox">
            <div class="k">OPERATING ROOMS</div>
            <div class="v">${f.operatingRooms.available} <span class="smallmuted">Available</span></div>
          </div>

          <div class="mbox">
            <div class="k">BLOOD BANK</div>
            <div class="v">${f.blood.total} <span class="smallmuted">Units</span></div>
            <div class="bloodRow">${bloodRow}</div>
          </div>

          <div class="mbox">
            <div class="k">SPECIALISTS ON DUTY</div>
            <div class="v">${f.specialists.available} <span class="smallmuted">Available</span></div>
            <div class="avatars">${avatars}</div>
          </div>
        </div>

        <div class="hr"></div>

        <div class="lower">
          <div>
            <div class="secTitle"><i class="fa-solid fa-heart-pulse"></i> EQUIPMENT STATUS</div>
            <div class="equipList">${equipList}</div>
          </div>

          <div>
            <div class="secTitle"><i class="fa-regular fa-heart"></i> MEDICAL CAPABILITIES</div>
            <div class="capChips">${caps}</div>
          </div>
        </div>

        <div class="actionsRow">
          <button class="btn2 btn2--teal" type="button" data-action="full" data-id="${f.id}">
            VIEW FULL STATUS
          </button>
          <button class="btn2" type="button" data-action="bed" data-id="${f.id}">
            REQUEST BED
          </button>
          <button class="btn2" type="button" data-action="contact" data-id="${f.id}">
            CONTACT FACILITY
          </button>
        </div>
      </section>
    `;
  }

  function wireActions() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      alert(
        `Demo: ${action.toUpperCase()} on ${id} (replace with real flow later).`
      );
    });
  }

  function wireTelemedButton() {
    const btn = byId("btnTelemed");
    btn.addEventListener("click", () =>
      alert("Demo: Telemedicine request (replace later).")
    );
  }

  async function bootstrap() {
    await injectCss(LIBS.tajawal);
    await injectCss(LIBS.fontAwesome);

    wireTelemedButton();
    wireActions();

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

    // Readiness mini stats (top row)
    byId("readinessStats").innerHTML = (data.readinessStats || [])
      .map(readinessStat)
      .join("");

    // Facilities
    byId("facilityList").innerHTML = (data.facilities || [])
      .map(facilityCard)
      .join("");
  }

  bootstrap().catch((err) => {
    console.error(err);
    const msg = document.createElement("div");
    msg.style.padding = "14px";
    msg.style.margin = "14px";
    msg.style.border = "1px solid #fecaca";
    msg.style.background = "#fff1f2";
    msg.style.borderRadius = "12px";
    msg.innerHTML = `<b>Hospitals page failed.</b><div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${String(
      err.message || err
    )}</div>`;
    document.body.prepend(msg);
  });
})();
