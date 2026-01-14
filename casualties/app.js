/* Casualties Page
   - No jQuery
   - External libs loaded ONLY via JS injection
   - Local data.json (easy to replace later)
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

  // --- UI builders ---
  function triageBadgeClass(level) {
    const x = String(level || "").toLowerCase();
    if (x === "immediate") return "ptrTag ptrTag--immediate";
    if (x === "delayed") return "ptrTag ptrTag--delayed";
    return "ptrTag ptrTag--minimal";
  }

  function triageTitle(level) {
    const x = String(level || "").toLowerCase();
    if (x === "immediate") return "IMMEDIATE";
    if (x === "delayed") return "DELAYED";
    return "MINIMAL";
  }

  function triageColorIcon(level) {
    const x = String(level || "").toLowerCase();
    if (x === "immediate") return "fa-solid fa-skull-crossbones";
    if (x === "delayed") return "fa-solid fa-triangle-exclamation";
    return "fa-solid fa-circle-check";
  }

  function valClassVital(key, val, patient) {
    // small demo rules (adjust later)
    const triage = String(patient.triage || "").toLowerCase();
    if (key === "spo2" && Number(val) < 90) return "is-bad";
    if (key === "hr" && Number(val) > 120) return "is-bad";
    if (triage === "immediate")
      return key === "tempC" && Number(val) >= 38 ? "is-bad" : "";
    return "";
  }

  function patientCard(p) {
    const triage = String(p.triage || "").toLowerCase();

    const tag = `
      <div class="${triageBadgeClass(triage)}">
        <small>${triageTitle(triage)}</small>
        <small>${
          triage === "immediate"
            ? "RED"
            : triage === "delayed"
            ? "YELLOW"
            : "GREEN"
        }</small>
      </div>
    `;

    const metaBadges = `
      <span class="badge badge--mono">${p.code}</span>
      <span class="pmeta">${p.age}yo ${p.sex} | ${p.blood}</span>
    `;

    const desc = `
      <div class="pdesc">
        <i class="fa-regular fa-circle-dot"></i>
        <span>${p.notes}</span>
        <span style="margin-left:auto;display:flex;gap:8px;align-items:center;color:#64748b">
          <i class="fa-regular fa-flag"></i>
          <span>Incident: ${p.incidentCode}</span>
        </span>
      </div>
    `;

    const vitals = p.vitals || {};
    const v = `
      <div class="pVitals">
        <div class="vBox">
          <div class="vL">
            <div class="vIcon"><i class="fa-regular fa-heart"></i></div>
            <div>
              <div class="vLabel">HR</div>
              <div class="vValue ${valClassVital("hr", vitals.hr, p)}">${
      vitals.hr
    } bpm</div>
            </div>
          </div>
        </div>

        <div class="vBox">
          <div class="vL">
            <div class="vIcon"><i class="fa-solid fa-wave-square"></i></div>
            <div>
              <div class="vLabel">BP</div>
              <div class="vValue">${vitals.bp}</div>
            </div>
          </div>
        </div>

        <div class="vBox">
          <div class="vL">
            <div class="vIcon"><i class="fa-solid fa-lungs"></i></div>
            <div>
              <div class="vLabel">SpO₂</div>
              <div class="vValue ${valClassVital("spo2", vitals.spo2, p)}">${
      vitals.spo2
    }%</div>
            </div>
          </div>
        </div>

        <div class="vBox">
          <div class="vL">
            <div class="vIcon"><i class="fa-solid fa-temperature-three-quarters"></i></div>
            <div>
              <div class="vLabel">Temp</div>
              <div class="vValue ${valClassVital("tempC", vitals.tempC, p)}">${
      vitals.tempC
    }°C</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const tags = `
      <div class="tags">
        ${
          p.assignedAsset
            ? `<span class="tag tag--blue"><i class="fa-solid fa-truck-medical"></i> Assigned: ${p.assignedAsset}</span>`
            : `<span class="tag tag--red"><i class="fa-solid fa-circle-exclamation"></i> Awaiting Transport Assignment</span>`
        }
        ${
          typeof p.etaMin === "number"
            ? `<span class="tag tag--green"><i class="fa-regular fa-clock"></i> ETA: ${p.etaMin}m</span>`
            : ""
        }
        ${
          p.targetHospital
            ? `<span class="tag tag--yel"><i class="fa-regular fa-hospital"></i> ${p.targetHospital}</span>`
            : ""
        }
      </div>
    `;

    return `
      <article class="pcard" role="listitem" data-triage="${triage}">
        <div class="phead">
          ${tag}
          <div class="pinfo">
            <div class="pLine1">
              <div class="pid">${p.id}</div>
              <div class="pmeta">${metaBadges}</div>
            </div>
            ${desc}
          </div>
        </div>
        ${v}
        <div class="pFooter">
          ${tags}
          <div class="actions">
            <button class="btn2 btn2--teal" data-action="details" data-id="${p.id}">VIEW DETAILS</button>
            <button class="btn2" data-action="status" data-id="${p.id}">UPDATE STATUS</button>
          </div>
        </div>
      </article>
    `;
  }

  function computeStats(patients) {
    const total = patients.length;
    const inTransit = patients.filter(
      (p) => String(p.transportStatus).toLowerCase() === "in_transit"
    ).length;
    const awaiting = patients.filter(
      (p) => String(p.transportStatus).toLowerCase() === "awaiting_transport"
    ).length;
    const critical = patients.filter(
      (p) => String(p.triage).toLowerCase() === "immediate"
    ).length;

    const avg = patients.length
      ? Math.round(
          patients.reduce((a, p) => a + Number(p.stabilizationMin || 0), 0) /
            patients.length
        )
      : 0;

    const counts = {
      immediate: critical,
      delayed: patients.filter(
        (p) => String(p.triage).toLowerCase() === "delayed"
      ).length,
      minimal: patients.filter(
        (p) => String(p.triage).toLowerCase() === "minimal"
      ).length,
    };

    return { total, inTransit, awaiting, critical, avg, counts };
  }

  function applyFilter(filterKey) {
    const list = byId("patientList");
    const cards = Array.from(list.querySelectorAll("[data-triage]"));
    cards.forEach((card) => {
      const triage = card.getAttribute("data-triage");
      const show = filterKey === "all" ? true : triage === filterKey;
      card.style.display = show ? "" : "none";
    });
  }

  function wireFilters() {
    const filters = Array.from(
      document.querySelectorAll(".filter[data-filter]")
    );
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        filters.forEach((x) => x.classList.remove("is-active"));
        btn.classList.add("is-active");
        applyFilter(btn.getAttribute("data-filter"));
      });
    });
  }

  function wireEvidence() {
    const btn = byId("btnEvidence");
    btn.addEventListener("click", () =>
      alert("Demo: open Evidence viewer (replace later).")
    );
  }

  function wirePatientActions() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-action]");
      if (!b) return;
      const action = b.getAttribute("data-action");
      const id = b.getAttribute("data-id");
      alert(
        `Demo: ${action.toUpperCase()} for ${id} (replace with modal/page).`
      );
    });
  }

  function wireTelemedButton() {
    const btn = byId("btnTelemed");
    btn.addEventListener("click", () =>
      alert(
        "Demo: Telemedicine call request sent (replace with real workflow)."
      )
    );
  }

  async function bootstrap() {
    await injectCss(LIBS.tajawal);
    await injectCss(LIBS.fontAwesome);

    wireTelemedButton();
    wireEvidence();
    wirePatientActions();

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

    // Patients render
    const patients = data.patients || [];
    const list = byId("patientList");
    list.innerHTML = patients.map(patientCard).join("");

    // Stats
    const stats = computeStats(patients);
    setText("sTotal", String(stats.total));
    setText("sTransit", String(stats.inTransit));
    setText("sAwaiting", String(stats.awaiting));
    setText("sCritical", String(stats.critical));
    setText("sAvgStab", `${stats.avg} min`);

    setText("cImmediate", String(stats.counts.immediate));
    setText("cDelayed", String(stats.counts.delayed));
    setText("cMinimal", String(stats.counts.minimal));

    wireFilters();
  }

  bootstrap().catch((err) => {
    console.error(err);
    const msg = document.createElement("div");
    msg.style.padding = "14px";
    msg.style.margin = "14px";
    msg.style.border = "1px solid #fecaca";
    msg.style.background = "#fff1f2";
    msg.style.borderRadius = "12px";
    msg.innerHTML = `<b>Casualties page failed.</b><div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${String(
      err.message || err
    )}</div>`;
    document.body.prepend(msg);
  });
})();
