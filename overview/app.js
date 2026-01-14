(function () {
  const LIBS = {
    tajawal: "https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap",
    fontAwesome: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
    arcgisCss: "https://js.arcgis.com/4.26/esri/themes/light/main.css",
    arcgisJs: "https://js.arcgis.com/4.26/init.js",
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
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load script: " + src));
      document.head.appendChild(script);
    });
  }

  async function waitForRequire(timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (typeof window.require === "function") return true;
      await new Promise(r => setTimeout(r, 50));
    }
    return false;
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    const month = d.toLocaleString(undefined, { month: "short" }).toUpperCase();
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return `${month} ${day}, ${year} · ${time}`;
  }

  const byId = (id) => document.getElementById(id);
  const setText = (id, v) => { const el = byId(id); if (el) el.textContent = v; };
  const setHtml = (el, html) => { el.innerHTML = html; };

  function deltaBadge(delta) {
    if (!delta) return "—";
    const arrow = delta.direction === "down" ? "↘" : "↗";
    const unit = delta.unit || "%";
    const val = Math.abs(delta.value);
    return `${arrow} ${val}${unit}`;
  }

  function queueCard(inc) {
    const status = String(inc.status || "").toLowerCase();
    const isPending = status === "pending";
    const sev = String(inc.severity || "").toLowerCase();

    const wrapClass = "qcard" + (isPending ? " qcard--pending" : "") + (sev ? ` qcard--${sev}` : "");
    const statusClass = isPending ? "qbadge qbadge--pending" : "qbadge qbadge--progress";

    const last = inc.lastUpdateLabel || "—";
    const casualties = inc.casualties || { red: 0, yellow: 0, green: 0 };

    return `
      <div class="${wrapClass}" role="listitem" data-incident-id="${inc.id}">
        <div class="qcard__top">
          <div class="qcard__left">
            <span class="qdot" aria-hidden="true"></span>
            <span class="qcode">${inc.code}</span>
            <span class="${statusClass}">${(isPending ? "PENDING" : "IN PROGRESS")}</span>
          </div>
          <div class="qtime">${last}</div>
        </div>

        <div class="qcard__body">
          <div class="qtag">${inc.type}</div>
          <div class="qdesc">${inc.description}</div>

          <div class="qmeta">
            <div class="qmeta__item">
              <i class="fa-regular fa-user"></i>
              <span>${inc.officer}</span>
            </div>
            <div class="qmeta__item">
              <i class="fa-solid fa-location-dot"></i>
              <span>${inc.coords.lat.toFixed(4)}, ${inc.coords.lon.toFixed(4)}</span>
            </div>
          </div>

          <div class="qcounters">
            <span class="qpill qpill--red">RED: <b>${casualties.red}</b></span>
            <span class="qpill qpill--yel">YEL: <b>${casualties.yellow}</b></span>
            <span class="qpill qpill--grn">GRN: <b>${casualties.green}</b></span>
          </div>

          <div class="qtotal">Total Casualties<sup>${casualties.red + casualties.yellow + casualties.green}</sup></div>
        </div>
      </div>
    `;
  }

  async function loadData() {
    const res = await fetch("./data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load data.json");
    return res.json();
  }

  async function initMap(data) {
    if (typeof window.require !== "function") throw new Error("ArcGIS loader not found");

    return new Promise((resolve, reject) => {
      window.require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "esri/layers/GraphicsLayer"
      ], function (Map, MapView, Graphic, GraphicsLayer) {
        try {
          const map = new Map({ basemap: "streets-vector" });

          const incidentsLayer = new GraphicsLayer({ title: "Incidents" });
          const assetsLayer = new GraphicsLayer({ title: "Medical Assets" });
          map.addMany([incidentsLayer, assetsLayer]);

          const view = new MapView({
            container: "viewDiv",
            map,
            center: data.map.center, // [lon, lat]
            zoom: data.map.zoom,
            constraints: { snapToZoom: false }
          });

          const severityColor = (sev) => {
            const s = String(sev || "").toLowerCase();
            if (s === "critical") return "#ff4d4f";
            if (s === "high") return "#ff8a3d";
            if (s === "medium") return "#ffd14a";
            return "#3ccf7e";
          };

          const incidentSymbol = (sev) => ({
            type: "simple-marker",
            style: "circle",
            color: severityColor(sev),
            size: 22,
            outline: { color: "white", width: 3 }
          });

          const assetSymbol = (status) => {
            const s = String(status || "").toLowerCase();
            const color = s === "deployed" ? "#3b82f6" : "#14b8a6";
            return {
              type: "simple-marker",
              style: "circle",
              color,
              size: 14,
              outline: { color: "white", width: 2 }
            };
          };

          const mkPoint = (lon, lat) => ({ type: "point", longitude: lon, latitude: lat });

          (data.incidents || []).forEach((inc) => {
            const g = new Graphic({
              geometry: mkPoint(inc.coords.lon, inc.coords.lat),
              symbol: incidentSymbol(inc.severity),
              attributes: inc,
              popupTemplate: {
                title: `${inc.code} · ${inc.type} · ${String(inc.status).toUpperCase()}`,
                content: `
                  <div style="font-size:13px">
                    <div><b>Severity:</b> ${inc.severity}</div>
                    <div style="margin-top:6px">${inc.description}</div>
                    <div style="margin-top:8px"><b>Officer:</b> ${inc.officer}</div>
                    <div><b>Casualties:</b> RED ${inc.casualties.red} · YEL ${inc.casualties.yellow} · GRN ${inc.casualties.green}</div>
                    <div><b>Updated:</b> ${inc.lastUpdateLabel || ""}</div>
                  </div>
                `
              }
            });
            incidentsLayer.add(g);
          });

          (data.assets || []).forEach((a) => {
            const g = new Graphic({
              geometry: mkPoint(a.coords.lon, a.coords.lat),
              symbol: assetSymbol(a.status),
              attributes: a,
              popupTemplate: {
                title: `${a.label} · ${String(a.status).toUpperCase()}`,
                content: `
                  <div style="font-size:13px">
                    <div><b>Type:</b> ${a.type}</div>
                    <div><b>Team:</b> ${a.team}</div>
                    <div><b>Status:</b> ${a.status}</div>
                    <div><b>ETA:</b> ${a.etaMin} min</div>
                  </div>
                `
              }
            });
            assetsLayer.add(g);
          });

          // Initial view: fit all incidents + assets
          view.when(() => {
            const all = []
              .concat(incidentsLayer.graphics.toArray())
              .concat(assetsLayer.graphics.toArray());
            if (all.length) view.goTo(all, { padding: 70, duration: 600 }).catch(() => {});
          });

          function focusIncidentById(id) {
            const g = incidentsLayer.graphics.find((x) => x.attributes && x.attributes.id === id);
            if (!g) return;
            view.goTo({ target: g.geometry, zoom: Math.max(view.zoom, 14) }, { duration: 600 }).catch(() => {});
            view.popup.open({ features: [g], location: g.geometry });
          }

          resolve({ focusIncidentById });
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  function renderUI(data) {
    setText("userName", data.header.userName);
    setText("notifBadge", String(data.header.notifications || 0));
    setText("headerTime", fmtTime(data.header.timestamp));
    setText("lastUpdate", "Last update: " + fmtTime(data.header.timestamp));

    setText("mActive", String(data.summary.activeIncidents));
    setText("mDeployed", String(data.summary.deployedAssets));
    setText("mAvailable", String(data.summary.availableAssets));
    setText("mTotal", String(data.summary.totalCasualties));
    setText("mResponse", String(data.summary.avgResponseMin));

    setText("activeMissionsNum", String(data.summary.activeMissions));
    setText("openCases", String(data.summary.openCases));
    setText("inProgress", String(data.summary.inProgressCases));
    setText("avgResp", String(data.summary.avgResponseMin));
    setText("hotZones", String(data.summary.hotZones));

    const queue = (data.dispatchQueue || []).slice();
    setText("queueActiveCount", String(queue.filter(x => String(x.status).toLowerCase() !== "resolved").length));
    const qEl = byId("queueList");
    setHtml(qEl, queue.map(queueCard).join(""));

    setText("kActiveIncidents", String(data.kpis.activeIncidents.value));
    setText("dActiveIncidents", deltaBadge(data.kpis.activeIncidents.delta));
    setText("kAvgResponse", String(data.kpis.avgResponseMin.value));
    setText("dAvgResponse", deltaBadge(data.kpis.avgResponseMin.delta));
    setText("kTargetResponse", String(data.kpis.avgResponseMin.target));
    setText("kAvailAssets", `${data.kpis.availableAssets.value}/${data.kpis.availableAssets.total}`);
    setText("dAvailAssets", deltaBadge(data.kpis.availableAssets.delta));
    setText("kEvacRate", String(data.kpis.evacSuccessRate.value));
    setText("dEvacRate", deltaBadge(data.kpis.evacSuccessRate.delta));
    setText("kTargetEvac", String(data.kpis.evacSuccessRate.target));
    setText("kTreated", String(data.kpis.treated24h.value));
    setText("dTreated", deltaBadge(data.kpis.treated24h.delta));
    setText("kBedsAvail", `${data.kpis.hospitalBeds.value}/${data.kpis.hospitalBeds.total}`);
    setText("dBedsAvail", deltaBadge(data.kpis.hospitalBeds.delta));

    if (data.kpis.avgResponseMin.delta?.direction === "up") byId("dAvgResponse")?.classList.add("is-bad");
  }

  function wireQueueClicks(focusFn) {
    const qEl = byId("queueList");
    qEl.addEventListener("click", (e) => {
      const card = e.target.closest("[data-incident-id]");
      if (!card) return;
      focusFn(card.getAttribute("data-incident-id"));
    });
  }

  function wireTelemedButton() {
    const btn = byId("btnTelemed");
    btn.addEventListener("click", () => alert("Demo: Telemedicine call request sent (replace with real workflow)."));
  }

  async function bootstrap() {
    await injectCss(LIBS.tajawal);
    await injectCss(LIBS.fontAwesome);
    await injectCss(LIBS.arcgisCss);
    await injectScript(LIBS.arcgisJs);
    const ok = await waitForRequire();
    if (!ok) throw new Error("ArcGIS loader (require) did not initialize. Make sure https://js.arcgis.com is reachable.");

    wireTelemedButton();

    const data = await loadData();
    renderUI(data);

    const mapApi = await initMap(data);
    wireQueueClicks(mapApi.focusIncidentById);
  }

  bootstrap().catch((err) => {
    console.error(err);
    const msg = document.createElement("div");
    msg.style.padding = "14px";
    msg.style.margin = "14px";
    msg.style.border = "1px solid #fecaca";
    msg.style.background = "#fff1f2";
    msg.style.borderRadius = "12px";
    msg.innerHTML = `<b>App failed to start.</b><div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${String(err.message || err)}</div>`;
    document.body.prepend(msg);
  });
})();