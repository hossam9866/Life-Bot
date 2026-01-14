/* Messages Page
   - No jQuery
   - External libs loaded ONLY via JS injection
   - JSON driven channels / feed / templates / active units / evidence repository
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

  function chanBtnHtml(c, active) {
    return `<button class="chanBtn ${active ? "is-active" : ""}" data-chan="${
      c.key
    }" type="button">${c.label}</button>`;
  }

  function tagClass(t) {
    const x = String(t || "").toLowerCase();
    if (x === "urgent") return "tag tagUrgent";
    if (x === "flash") return "tag tagFlash";
    if (x === "priority") return "tag tagPriority";
    return "tag";
  }

  function msgHtml(m) {
    const tone = m.tone === "blue" ? "is-blue" : "";
    return `
      <div class="msg ${tone}">
        <div class="msgTop">
          <div class="msgFrom">
            <div class="msgIcon"><i class="fa-regular fa-message"></i></div>
            <div>
              <div class="msgName">${m.from}</div>
              <div class="msgTo">To: ${m.to}</div>
            </div>
          </div>
          <div class="${tagClass(m.tag)}">${m.tag}</div>
        </div>

        <div class="msgBody">${m.text}</div>
        <div class="msgTime">${m.time}</div>
        <div class="msgLock" title="Encrypted"><i class="fa-solid fa-lock"></i></div>
      </div>
    `;
  }

  function chipClass(k) {
    const x = String(k).toLowerCase();
    if (x === "medical") return "chip chipMedical";
    if (x === "tactical") return "chip chipTactical";
    if (x === "logistics") return "chip chipLogistics";
    return "chip";
  }

  function tplHtml(t) {
    return `
      <div class="tpl">
        <div class="tplTop">
          <div class="tplName">${t.title}</div>
          <div class="${tagClass(t.badge)}">${t.badge}</div>
        </div>
        <div class="tplBody">${t.body}</div>
        <div class="tplChips">
          ${(t.tags || [])
            .map((x) => `<span class="${chipClass(x)}">${x}</span>`)
            .join("")}
        </div>
      </div>
    `;
  }

  function unitHtml(u) {
    return `
      <div class="unit">
        <div class="unitLeft">
          <div class="unitName">${u.name}</div>
          <div class="unitRole">${u.role}</div>
        </div>
        <span class="unitDot" title="Active"></span>
      </div>
    `;
  }

  function statHtml(s) {
    const cls = s.color ? ` ${s.color}` : "";
    return `
      <div class="stat">
        <div class="k">${s.label}</div>
        <div class="v${cls}">${s.value}</div>
      </div>
    `;
  }

  function evTypeIcon(type) {
    const t = String(type).toLowerCase();
    if (t === "photo") return "fa-regular fa-image";
    if (t === "video") return "fa-regular fa-circle-play";
    if (t === "document") return "fa-regular fa-file-lines";
    return "fa-regular fa-file";
  }

  function evTagClass(t) {
    const x = String(t).toLowerCase();
    if (x === "photo") return "evTag evTagPhoto";
    if (x === "medical report") return "evTag evTagReport";
    if (x === "reviewed") return "evTag evTagReviewed";
    if (x === "confidential") return "evTag evTagConf";
    return "evTag";
  }

  function evItemHtml(e) {
    return `
      <div class="evItem">
        <div class="evTop">
          <div class="evFile">
            <div class="evIcon"><i class="${evTypeIcon(e.type)}"></i></div>
            <div>
              <div class="evName">${e.fileName}</div>
              <div class="evDesc">${e.description}</div>
            </div>
          </div>

          <div class="evActions">
            <button class="iconBtn" data-action="view" data-id="${
              e.id
            }" title="View"><i class="fa-regular fa-eye"></i></button>
            <button class="iconBtn" data-action="download" data-id="${
              e.id
            }" title="Download"><i class="fa-solid fa-arrow-down"></i></button>
          </div>
        </div>

        <div class="evMeta">
          <div>Incident: <b>${e.incident}</b></div>
          <div>Casualty: <b>${e.casualty}</b></div>
          <div>Owner: <b>${e.owner}</b></div>
          <div>Size: <b>${e.size}</b></div>
          <div>${e.datetime}</div>
        </div>

        <div class="evTags">
          ${(e.tags || [])
            .map((t) => `<span class="${evTagClass(t)}">${t}</span>`)
            .join("")}
        </div>
      </div>
    `;
  }

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  function applyEvidenceFilter(items, state) {
    return items.filter((e) => {
      const typeOk =
        state.type === "all"
          ? true
          : String(e.type).toLowerCase() === state.type;
      const statusOk =
        state.status === "all"
          ? true
          : (e.tags || [])
              .map((x) => String(x).toLowerCase())
              .includes(state.status);
      return typeOk && statusOk;
    });
  }

  function bootstrapFilters(data, state) {
    const types = uniq(
      (data.evidence.items || []).map((x) => String(x.type).toLowerCase())
    );
    const statuses = uniq(
      (data.evidence.items || []).flatMap((x) =>
        (x.tags || []).map((t) => String(t).toLowerCase())
      )
    );

    const fType = byId("fType");
    const fStatus = byId("fStatus");

    types.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t.toUpperCase();
      fType.appendChild(opt);
    });

    // keep only meaningful statuses to match screenshot vibe
    const prefer = ["reviewed", "confidential", "photo", "medical report"];
    const ordered = [
      ...prefer.filter((p) => statuses.includes(p)),
      ...statuses.filter((s) => !prefer.includes(s)),
    ];

    ordered.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s.toUpperCase();
      fStatus.appendChild(opt);
    });

    fType.addEventListener("change", () => {
      state.type = fType.value;
      renderEvidence(data, state);
    });

    fStatus.addEventListener("change", () => {
      state.status = fStatus.value;
      renderEvidence(data, state);
    });
  }

  function renderEvidence(data, state) {
    const items = data.evidence.items || [];
    const filtered = applyEvidenceFilter(items, state);
    byId("evCount").textContent = `(${filtered.length})`;
    byId("evList").innerHTML = filtered.map(evItemHtml).join("");
  }

  function renderFeed(data, state) {
    const all = data.messaging.feed || [];
    const filtered =
      state.channel === "all"
        ? all
        : all.filter((m) => String(m.channel).toLowerCase() === state.channel);

    byId("feed").innerHTML = filtered.map(msgHtml).join("");
  }

  async function bootstrap() {
    await injectCss(LIBS.tajawal);
    await injectCss(LIBS.fontAwesome);

    const data = await loadData();
    const state = { channel: "all", type: "all", status: "all" };

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

    // Channels
    setText("newCount", `${data.messaging.newCount} New`);
    byId("channelTabs").innerHTML = data.messaging.channels
      .map((c, i) => chanBtnHtml(c, i === 0))
      .join("");
    byId("channelTabs").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-chan]");
      if (!btn) return;
      document
        .querySelectorAll(".chanBtn")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.channel = btn.getAttribute("data-chan");
      renderFeed(data, state);
    });

    // Feed
    renderFeed(data, state);

    // Templates + Units
    byId("templates").innerHTML = (data.messaging.templates || [])
      .map(tplHtml)
      .join("");
    byId("units").innerHTML = (data.messaging.activeUnits || [])
      .map(unitHtml)
      .join("");

    // Evidence stats
    byId("evStats").innerHTML = (data.evidence.stats || [])
      .map(statHtml)
      .join("");

    // Evidence filters + list
    bootstrapFilters(data, state);
    renderEvidence(data, state);

    // Actions demo
    byId("btnTelemed").addEventListener("click", () =>
      alert("Demo: Telemedicine request (replace later).")
    );
    document.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-action]");
      if (!b) return;
      alert(
        `Demo: ${b.getAttribute("data-action")} evidence ${b.getAttribute(
          "data-id"
        )}`
      );
    });
  }

  bootstrap().catch((err) => {
    console.error(err);
    const msg = document.createElement("div");
    msg.style.padding = "14px";
    msg.style.margin = "14px";
    msg.style.border = "1px solid #fecaca";
    msg.style.background = "#fff1f2";
    msg.style.borderRadius = "12px";
    msg.innerHTML = `<b>Messages page failed.</b><div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${String(
      err.message || err
    )}</div>`;
    document.body.prepend(msg);
  });
})();
