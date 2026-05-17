// EcoCycle shared client logic
const API_BASE = (window.EcoCycle_API || "http://localhost:4000") + "/api";

// Auto-inject premium CSS + JS so every page gets Charts/Invoice/Receipt/CSV
(function bootstrapPremium() {
  try {
    const here = document.currentScript && document.currentScript.src;
    const baseAssets = here ? here.replace(/\/js\/app\.js.*$/, "") : "../assets";
    if (!document.querySelector('link[data-ec-premium]')) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = baseAssets + "/css/premium.css"; l.dataset.ecPremium = "1";
      document.head.appendChild(l);
    }
    if (!document.querySelector('script[data-ec-premium]')) {
      const s = document.createElement("script");
      s.src = baseAssets + "/js/premium.js"; s.async = true; s.dataset.ecPremium = "1";
      document.head.appendChild(s);
    }
  } catch (e) { console.warn("[premium bootstrap]", e); }
})();

const Auth = {
  get user(){ try{return JSON.parse(localStorage.getItem("riq_user"))}catch{return null} },
  set user(u){ u ? localStorage.setItem("riq_user", JSON.stringify(u)) : localStorage.removeItem("riq_user") },
  get token(){ return localStorage.getItem("riq_token") },
  set token(t){ t ? localStorage.setItem("riq_token", t) : localStorage.removeItem("riq_token") },
  logout(){ this.user=null; this.token=null; location.href="../AuthScreens/LoginPage.html"; },
  requireRole(roles){
    const u = this.user;
    if(!u){ location.href = "../AuthScreens/LoginPage.html"; return false; }
    if(roles && !roles.includes(u.role)){ alert("Access denied"); location.href = "../AuthScreens/LoginPage.html"; return false; }
    return true;
  }
};

async function api(path, opts={}){
  const headers = {"Content-Type":"application/json", ...(opts.headers||{})};
  if(Auth.token) headers["Authorization"] = "Bearer "+Auth.token;
  try{
    const res = await fetch(API_BASE+path, {...opts, headers, body: opts.body?JSON.stringify(opts.body):undefined});
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error || ("HTTP "+res.status));
    return data;
  }catch(e){
    console.warn("API error", path, e.message);
    throw e;
  }
}

function toast(msg){
  let t = document.querySelector(".toast");
  if(!t){ t=document.createElement("div"); t.className="toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 2400);
}

function openModal(id){ const m=document.getElementById(id); if(m) m.classList.add("open"); }
function closeModal(id){ const m=document.getElementById(id); if(m) m.classList.remove("open"); }
document.addEventListener("click",(e)=>{
  if(e.target.classList.contains("modal-backdrop")) e.target.classList.remove("open");
  if(e.target.dataset.modalOpen) openModal(e.target.dataset.modalOpen);
  if(e.target.dataset.modalClose) closeModal(e.target.dataset.modalClose);
});

// Sidebar definitions per role
const NAV = {
  user: [
    {section:"Workspace"},
    {label:"Dashboard", href:"Dashboard.html", ico:"layout-dashboard"},
    {label:"Waste Pickers", href:"WastePickerManagement.html", ico:"users"},
    {label:"Picker Profile", href:"PickerProfile&ID.html", ico:"user-circle"},
    {label:"QR Scan", href:"QRScanFlow.html", ico:"qr-code"},
    {label:"New Transaction", href:"TransactionFlow(Wizard).html", ico:"plus-circle"},
    {label:"Ledger", href:"TransactionLogs&Ledger.html", ico:"book-open"},
    {label:"Income & Rewards", href:"Income&Rewards.html", ico:"wallet"},
    {label:"Insights & Impact", href:"Insights&Impact.html", ico:"leaf"},
    {label:"Inventory", href:"MaterialInventory&Stock.html", ico:"package"},
    {label:"Marketplace", href:"Marketplace&Sales.html", ico:"shopping-cart"},
    {label:"Logistics Map", href:"LogisticsMap.html", ico:"map"},
    {section:"Account"},
    {label:"Help & Support", href:"Help&SupportCenter.html", ico:"message-square"},
    {label:"Settings", href:"Settings&Status.html", ico:"settings"},
  ],
  admin: [
    {section:"Operations"},
    {label:"Dashboard Hub", href:"AdminDashboardHub.html", ico:"layout-dashboard"},
    {label:"Picker Oversight", href:"AdminPickerOversight.html", ico:"users"},
    {label:"Transaction Ledger", href:"AdminTransactionLedger.html", ico:"book-open"},
    {label:"Price Management", href:"AdminPriceManagement.html", ico:"dollar-sign"},
    {label:"Inventory", href:"AdminInventoryDashboard.html", ico:"package"},
    {label:"Sales & Marketplace", href:"AdminSales&Marketplace.html", ico:"shopping-cart"},
    {section:"Intelligence"},
    {label:"Analytics", href:"AdminAnalytics&Performance.html", ico:"bar-chart-3"},
    {label:"Environmental", href:"AdminEnvironmentalDashboard.html", ico:"globe"},
    {label:"Smart Insights", href:"AdminSmartInsightsHub.html", ico:"brain"},
    {section:"Management"},
    {label:"Staff", href:"AdminStaffOversight.html", ico:"users-2"},
    {label:"Support", href:"AdminSupportManagement.html", ico:"message-square"},
    {label:"Reports", href:"AdminReportsCenter.html", ico:"file-text"},
  ],
  superadmin: [
    {section:"Executive"},
    {label:"Executive Hub", href:"SuperAdminExecutiveHub.html", ico:"landmark"},
    {label:"Branch Governance", href:"SuperAdminBranchGovernance.html", ico:"building-2"},
    {label:"User Governance", href:"SuperAdminUserGovernance.html", ico:"users-2"},
    {section:"Intelligence"},
    {label:"Global Analytics", href:"SuperAdminGlobalAnalytics.html", ico:"bar-chart-3"},
    {label:"Global Impact", href:"SuperAdminGlobalImpact.html", ico:"globe"},
    {label:"AI Insights", href:"SuperAdminAIInsightsHub.html", ico:"brain"},
    {label:"Geo Map", href:"SuperAdminStrategicGeoMap.html", ico:"map"},
    {label:"System Ranking", href:"SuperAdminSystemRanking.html", ico:"award"},
    {section:"Governance"},
    {label:"Audit & Governance", href:"SuperAdminAudit&Governance.html", ico:"shield-check"},
    {label:"Reports", href:"SuperAdminReportsCenter.html", ico:"file-text"},
    {label:"System Settings", href:"SuperAdminSystemSettings.html", ico:"settings"},
    {label:"Global Alerts", href:"SuperAdminGlobalAlerts.html", ico:"bell"},
    {label:"Escalated Support", href:"SuperAdminEscalatedSupport.html", ico:"alert-triangle"},
  ],
};

function renderShell(role){
  const u = Auth.user || {name:"Demo User", role:role, email:"demo@EcoCycle.app"};
  const items = NAV[role] || [];
  const here = location.pathname.split("/").pop();
  const navHtml = items.map(it => it.section
    ? `<div class="nav-section">${it.section}</div>`
    : `<a href="${it.href}" class="${decodeURIComponent(here)===it.href?'active':''}"><i data-lucide="${it.ico}" class="ico"></i>${it.label}</a>`
  ).join("");

  const sidebar = document.querySelector(".sidebar");
  if(sidebar) sidebar.innerHTML = `
    <div class="brand">EcoCycle<span>.</span></div>
    <nav>${navHtml}</nav>
    <div style="margin-top:auto; padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.1)">
      <div style="font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 8px">POWERED BY</div>
      <div style="font-size: 14px; font-weight: 800; color: #fff">EcoCycle v2.0</div>
    </div>
  `;
  const topbar = document.querySelector(".topbar");
  if(topbar) topbar.innerHTML = `
    <div class="search"><input placeholder="Quick search transactions or pickers…"/></div>
    <div class="actions">
      <button class="icon-btn" title="Notifications"><i data-lucide="bell"></i></button>
      <div style="height: 32px; width: 1px; background: var(--border); margin: 0 8px"></div>
      <div style="text-align: right">
        <div style="font-size: 14px; font-weight: 700; color: var(--secondary)">${u.name}</div>
        <div style="font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em">${role}</div>
      </div>
      <div class="avatar">${(u.name||"U").charAt(0).toUpperCase()}</div>
      <button class="btn btn-ghost btn-sm" onclick="Auth.logout()" style="color: var(--danger)">Sign Out</button>
    </div>
  `;
  
  // Initialize Lucide icons
  if(window.lucide) window.lucide.createIcons();
}

// Tab helper
function bindTabs(container){
  const tabs = container.querySelectorAll(".tab");
  tabs.forEach(t=>t.addEventListener("click",()=>{
    tabs.forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    const target = t.dataset.tab;
    container.querySelectorAll("[data-tab-panel]").forEach(p=>{
      p.style.display = p.dataset.tabPanel===target ? "" : "none";
    });
  }));
}

/* ============================================================
   PREMIUM COMPONENTS — EcoCycle v2.0
   ============================================================ */

/** Animate numeric counters (KPI values) */
function animateCounters(){
  document.querySelectorAll(".kpi .value").forEach(el => {
    if(el.dataset.animated) return;
    const raw = el.textContent.trim();
    const match = raw.match(/([^\d.]*)([\d,.]+)(.*)/);
    if(!match) return;
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(/,/g, ""));
    if(isNaN(target)) return;
    el.dataset.animated = "1";
    const duration = 900;
    const start = performance.now();
    const fmt = n => prefix + (Math.round(n)).toLocaleString() + suffix;
    function tick(now){
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      el.textContent = fmt(target * eased);
      if(t < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + numStr + suffix;
    }
    requestAnimationFrame(tick);
  });
}

/** Render a smooth area+line SVG chart from numeric array
 *  Usage: renderLineChart('#myChart', [12,18,9,30,22,40,38])
 */
function renderLineChart(selector, data, opts={}){
  const el = typeof selector === "string" ? document.querySelector(selector) : selector;
  if(!el || !data || !data.length) return;
  const W = 600, H = 200, P = 24;
  const max = Math.max(...data) * 1.15 || 1;
  const stepX = (W - P*2) / (data.length - 1 || 1);
  const pts = data.map((v,i) => [P + i*stepX, H - P - (v/max)*(H - P*2)]);
  const path = pts.map((p,i) => (i===0 ? "M" : "L") + p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
  const area = path + ` L${pts[pts.length-1][0].toFixed(1)},${H-P} L${pts[0][0].toFixed(1)},${H-P} Z`;
  const grid = [0.25,0.5,0.75,1].map(f =>
    `<line class="grid-line" x1="${P}" x2="${W-P}" y1="${P + (H-P*2)*f}" y2="${P + (H-P*2)*f}"/>`
  ).join("");
  el.innerHTML = `
    <svg class="svg-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad-${Math.random().toString(36).slice(2,7)}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="${opts.color||'#10B981'}" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="${opts.color||'#10B981'}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${grid}
      <path d="${area}" fill="${opts.color||'#10B981'}" opacity="0.15"/>
      <path d="${path}" fill="none" stroke="${opts.color||'#10B981'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 2px 4px rgba(16,185,129,0.3))"/>
      ${pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="#fff" stroke="${opts.color||'#10B981'}" stroke-width="2.5"/>`).join("")}
    </svg>`;
}

/** Render donut chart with center label
 *  Usage: renderDonut('#d', [{label:'Plastic', value:45, color:'#10B981'}, ...], {centerValue:'8.4t', centerLabel:'Total'})
 */
function renderDonut(selector, segments, opts={}){
  const el = typeof selector === "string" ? document.querySelector(selector) : selector;
  if(!el) return;
  const total = segments.reduce((s,x)=>s+x.value, 0) || 1;
  let acc = 0;
  const stops = segments.map(s => {
    const start = (acc/total)*100;
    acc += s.value;
    const end = (acc/total)*100;
    return `${s.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
  }).join(", ");
  el.innerHTML = `
    <div class="donut-wrap">
      <div class="donut" style="background: conic-gradient(${stops})"></div>
      <div class="donut-center">
        <div class="v">${opts.centerValue || total}</div>
        <div class="l">${opts.centerLabel || "Total"}</div>
      </div>
    </div>
    <div class="legend">
      ${segments.map(s => `<span><span class="dot" style="background:${s.color}"></span>${s.label} ${Math.round((s.value/total)*100)}%</span>`).join("")}
    </div>`;
}

/** Toast helper with type */
function showToast(msg, type){
  let t = document.querySelector(".toast");
  if(!t){ t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.className = "toast" + (type ? " " + type : "");
  t.innerHTML = `<i data-lucide="${type==='error'?'x-circle':type==='warn'?'alert-triangle':'check-circle'}" style="color:var(--${type==='error'?'danger':type==='warn'?'warn':'primary'})"></i><span>${msg}</span>`;
  setTimeout(()=>t.classList.add("show"), 10);
  setTimeout(()=>t.classList.remove("show"), 3000);
  if(window.lucide) window.lucide.createIcons();
}
// Backward-compat alias
window.toast = showToast;

/** Command palette (Cmd/Ctrl+K) */
function initCommandPalette(){
  if(document.querySelector(".cmdk-backdrop")) return;
  const role = (Auth.user && Auth.user.role) || "user";
  const items = (NAV[role]||[]).filter(i => !i.section);
  const dirMap = {user:"UserScreens", admin:"AdminScreens", superadmin:"SuperAdminScreens"};
  const dir = dirMap[role];
  const html = `
    <div class="cmdk-backdrop" onclick="if(event.target===this)this.classList.remove('open')">
      <div class="cmdk">
        <input type="text" id="cmdk-input" placeholder="Search pages, actions..." autofocus />
        <div class="cmdk-list" id="cmdk-list">
          <div class="cmdk-section">Navigate</div>
          ${items.map((i,idx) => `
            <div class="cmdk-item ${idx===0?'active':''}" data-href="../${dir}/${i.href}">
              <i data-lucide="${i.ico}"></i>
              <span>${i.label}</span>
              <span class="kbd">↵</span>
            </div>
          `).join("")}
          <div class="cmdk-section">Account</div>
          <div class="cmdk-item" data-action="logout">
            <i data-lucide="log-out"></i>
            <span>Sign out</span>
          </div>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  if(window.lucide) window.lucide.createIcons();
  const backdrop = document.querySelector(".cmdk-backdrop");
  const input = document.getElementById("cmdk-input");
  const list = document.getElementById("cmdk-list");
  function visible(){ return Array.from(list.querySelectorAll(".cmdk-item")).filter(x => x.style.display !== "none"); }
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    list.querySelectorAll(".cmdk-item").forEach(it => {
      it.style.display = it.textContent.toLowerCase().includes(q) ? "" : "none";
    });
    list.querySelectorAll(".cmdk-item.active").forEach(x => x.classList.remove("active"));
    const v = visible(); if(v[0]) v[0].classList.add("active");
  });
  list.addEventListener("click", e => {
    const it = e.target.closest(".cmdk-item"); if(!it) return;
    if(it.dataset.href) location.href = it.dataset.href;
    if(it.dataset.action === "logout") Auth.logout();
  });
  document.addEventListener("keydown", e => {
    const open = backdrop.classList.contains("open");
    if((e.metaKey||e.ctrlKey) && e.key.toLowerCase() === "k"){
      e.preventDefault(); backdrop.classList.toggle("open");
      if(backdrop.classList.contains("open")) setTimeout(()=>input.focus(), 50);
    }
    if(!open) return;
    const v = visible(); const cur = list.querySelector(".cmdk-item.active");
    if(e.key === "Escape"){ backdrop.classList.remove("open"); }
    if(e.key === "ArrowDown"){ e.preventDefault(); const i = v.indexOf(cur); if(v[i+1]){ cur && cur.classList.remove("active"); v[i+1].classList.add("active"); v[i+1].scrollIntoView({block:"nearest"});} }
    if(e.key === "ArrowUp"){ e.preventDefault(); const i = v.indexOf(cur); if(v[i-1]){ cur && cur.classList.remove("active"); v[i-1].classList.add("active"); v[i-1].scrollIntoView({block:"nearest"});} }
    if(e.key === "Enter"){ e.preventDefault(); cur && cur.click(); }
  });
}

/** Mobile sidebar toggle */
function initMobileMenu(){
  const topbar = document.querySelector(".topbar");
  const sidebar = document.querySelector(".sidebar");
  if(!topbar || !sidebar || document.querySelector(".mobile-menu-btn")) return;
  const btn = document.createElement("button");
  btn.className = "mobile-menu-btn";
  btn.innerHTML = '<i data-lucide="menu"></i>';
  btn.style.marginRight = "12px";
  btn.onclick = () => sidebar.classList.toggle("open-mobile");
  topbar.insertBefore(btn, topbar.firstChild);
}

/** Auto-init on load (called after renderShell) */
const _origRenderShell = renderShell;
renderShell = function(role){
  _origRenderShell(role);
  setTimeout(() => {
    animateCounters();
    initCommandPalette();
    initMobileMenu();
    if(window.lucide) window.lucide.createIcons();
  }, 50);
};

// Auto-init lucide icons on any page (auth pages don't call renderShell)
document.addEventListener("DOMContentLoaded", () => {
  if(window.lucide) window.lucide.createIcons();
});

/* ============================================================
   LIVE DATA ENGINE — every page reads real Supabase data.
   Use these attributes in any HTML page:

   <span data-live="kpi.totalRevenue"></span>             — single value
   <span data-live="kpi.totalKg" data-fmt="kg"></span>    — formatted
   <span data-live="kpi.activePickers"></span>
   <tbody data-live-table="transactions"></tbody>         — auto rendered rows
   <tbody data-live-table="sales"></tbody>
   <tbody data-live-table="payouts"></tbody>
   <tbody data-live-table="pickers"></tbody>
   <tbody data-live-table="branches"></tbody>
   <tbody data-live-table="alerts"></tbody>
   <tbody data-live-table="tickets"></tbody>
   <tbody data-live-table="prices"></tbody>
   <tbody data-live-table="inventory"></tbody>
   <tbody data-live-table="audit"></tbody>
   <ul   data-live-list="insights"></ul>                  — bulleted insights

   Pages can also define filters/limits via:
   <tbody data-live-table="transactions" data-limit="10"></tbody>
   ============================================================ */
const LiveData = (function(){
  const ZAR = (n, dec) => "R " + Number(n||0).toLocaleString(undefined, { minimumFractionDigits: dec==null?2:dec, maximumFractionDigits: dec==null?2:dec });
  const fmtKg = (n) => Number(n||0).toLocaleString(undefined, { maximumFractionDigits: 1 }) + " kg";
  const fmtT  = (n) => (Number(n||0)/1000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " t";
  const fmtPct = (n) => (Number(n||0)*100).toLocaleString(undefined, { maximumFractionDigits: 0 }) + "%";
  const fmtNum = (n) => Number(n||0).toLocaleString();
  const fmtDate = (s) => { try { return new Date(s).toISOString().slice(0,10); } catch { return s||""; } };
  const statusPill = (s) => { const cls=(s||"").toString().toLowerCase().replace(/[^a-z]/g,""); return `<span class="status ${cls}">${s||"—"}</span>`; };

  const FORMATTERS = { money: ZAR, kg: fmtKg, ton: fmtT, pct: fmtPct, num: fmtNum, date: fmtDate, raw: (v)=>v };
  function fmt(value, kind) { return (FORMATTERS[kind]||FORMATTERS.raw)(value); }

  const ROW_RENDERERS = {
    transactions: (t) => `<tr>
      <td><strong>${t.id||""}</strong></td>
      <td>${t.picker_name||t.picker_id||"—"}</td>
      <td>${t.material||"—"}</td>
      <td>${t.weight||0} kg</td>
      <td>${ZAR(t.amount,2)}</td>
      <td>${statusPill(t.status)}</td>
      <td class="muted">${fmtDate(t.created_at)}</td>
    </tr>`,
    sales: (s) => `<tr>
      <td><strong>${s.id||""}</strong></td>
      <td>${s.buyer||"—"}</td>
      <td>${s.material||"—"}</td>
      <td>${s.qty||0} kg</td>
      <td>${ZAR(s.total,2)}</td>
      <td>${statusPill(s.status)}</td>
    </tr>`,
    payouts: (p) => `<tr>
      <td><strong>${p.id||""}</strong></td>
      <td>${p.picker_id||"—"}</td>
      <td>${ZAR(p.amount,2)}</td>
      <td>${p.method||"—"}</td>
      <td>${statusPill(p.status)}</td>
      <td class="muted">${fmtDate(p.created_at)}</td>
    </tr>`,
    pickers: (p) => `<tr>
      <td><strong>${p.id||""}</strong></td>
      <td>${p.name||"—"}</td>
      <td>${p.phone||"—"}</td>
      <td>${p.branch||"—"}</td>
      <td>${(p.total_kg||0)} kg</td>
      <td>${statusPill(p.status)}</td>
    </tr>`,
    branches: (b) => `<tr>
      <td>${b.name||"—"}</td>
      <td>${b.country||"—"}</td>
      <td>${b.manager||"—"}</td>
      <td>${statusPill(b.status)}</td>
    </tr>`,
    alerts: (a) => `<tr>
      <td>${statusPill(a.level||"info")}</td>
      <td>${a.message||""}</td>
      <td class="muted">${fmtDate(a.created_at)}</td>
    </tr>`,
    tickets: (t) => `<tr>
      <td><strong>${t.id||""}</strong></td>
      <td>${t.user_email||"—"}</td>
      <td>${t.subject||"—"}</td>
      <td>${statusPill(t.status)}</td>
      <td class="muted">${fmtDate(t.created_at)}</td>
    </tr>`,
    prices: (p) => `<tr>
      <td>${p.material||"—"}</td>
      <td>${ZAR(p.price_per_kg,2)}/kg</td>
      <td class="muted">${fmtDate(p.updated_at)}</td>
    </tr>`,
    inventory: (i) => `<tr>
      <td>${i.material||"—"}</td>
      <td>${(i.stock_kg||0)} kg</td>
      <td>${(i.threshold_kg||0)} kg</td>
      <td>${Number(i.stock_kg||0) < Number(i.threshold_kg||0) ? statusPill("low") : statusPill("ok")}</td>
    </tr>`,
    audit: (a) => `<tr>
      <td class="muted">${fmtDate(a.created_at)}</td>
      <td>${a.actor||""}</td>
      <td>${a.action||""}</td>
      <td>${a.resource||""}</td>
    </tr>`,
  };

  // Cache so multiple widgets sharing a table only fetch once.
  const cache = {};
  async function fetchOnce(key, url) {
    if (cache[key]) return cache[key];
    cache[key] = api(url).catch((e) => { console.warn("[LiveData]", key, e.message); return {}; });
    return cache[key];
  }
  function bust() { for (const k in cache) delete cache[k]; }

  async function loadKPIs() {
    const [a, imp, inc] = await Promise.all([
      fetchOnce("analytics", "/analytics"),
      fetchOnce("impact",    "/impact"),
      fetchOnce("income",    "/income"),
    ]);
    return {
      totalKg:        a.totalKg,
      totalRevenue:   a.totalRevenue,
      txCount:        a.txCount,
      activePickers:  a.activePickers,
      co2:            imp.co2,
      trees:          imp.trees,
      water:          imp.water,
      landfill:       imp.landfill,
      totalPaid:      inc.totalPaid,
      pendingPayouts: inc.pending,
    };
  }

  async function loadTable(name) {
    const map = {
      transactions: ["/transactions",     "transactions"],
      sales:        ["/sales",            "sales"],
      payouts:      ["/payouts",          "payouts"],
      pickers:      ["/pickers",          "pickers"],
      branches:     ["/branches",         "branches"],
      alerts:       ["/alerts",           "alerts"],
      tickets:      ["/support",          "tickets"],
      prices:       ["/prices",           "list"],
      inventory:    ["/inventory",        "list"],
      audit:        ["/audit",            "audit"],
    };
    if (!map[name]) return [];
    const [url, key] = map[name];
    const r = await fetchOnce("table_" + name, url);
    return r[key] || [];
  }

  function setText(el, val) {
    if (val == null || val === "") { el.textContent = "—"; return; }
    el.textContent = val;
  }

  async function paint(root) {
    root = root || document;

    // KPIs
    const kpiEls = root.querySelectorAll("[data-live^='kpi.']");
    if (kpiEls.length) {
      const kpis = await loadKPIs();
      kpiEls.forEach((el) => {
        const key = el.dataset.live.split(".")[1];
        const kind = el.dataset.fmt || (["totalKg","landfill","water"].includes(key) ? "kg"
                    : ["co2"].includes(key) ? "kg"
                    : ["totalRevenue","totalPaid","pendingPayouts"].includes(key) ? "money"
                    : "num");
        setText(el, fmt(kpis[key], kind));
        el.dataset.ecCur = "1"; // prevent the legacy $→R swap from touching it
      });
    }

    // Tables
    const tables = root.querySelectorAll("[data-live-table]");
    await Promise.all(Array.from(tables).map(async (tb) => {
      const name = tb.dataset.liveTable;
      const limit = parseInt(tb.dataset.limit) || null;
      let rows = await loadTable(name);
      if (limit) rows = rows.slice(0, limit);
      const rdr = ROW_RENDERERS[name];
      if (!rdr) return;
      tb.innerHTML = rows.length
        ? rows.map(rdr).join("")
        : `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--muted)">No ${name} yet</td></tr>`;
      Array.from(tb.querySelectorAll("[data-ec-cur]")).forEach((n) => n.dataset.ecCur = "1");
    }));

    // Insights list
    const insightLists = root.querySelectorAll("[data-live-list='insights']");
    if (insightLists.length) {
      const r = await fetchOnce("insights", "/insights");
      const items = (r.insights || []).map((i) =>
        `<li class="insight-item"><strong>${i.type||""}</strong> · ${i.message||""}</li>`
      ).join("") || `<li class="muted">No insights yet</li>`;
      insightLists.forEach((ul) => { ul.innerHTML = items; });
    }

    // Re-trigger icon repaint and counters
    if (window.lucide) window.lucide.createIcons();
    if (typeof animateCounters === "function") animateCounters();
  }

  // Auto-paint on load + provide manual hook
  document.addEventListener("DOMContentLoaded", () => paint().catch((e) => console.warn("[LiveData paint]", e)));
  // Real-time polling every 15s when tab is visible
  setInterval(() => {
    if (document.visibilityState === "visible") {
      bust(); paint().catch(() => {});
    }
  }, 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") { bust(); paint().catch(() => {}); }
  });
  return { paint, refresh: () => { bust(); return paint(); }, fetchOnce };
})();
window.LiveData = LiveData;
