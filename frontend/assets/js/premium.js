/* ============================================================
   EcoCycle Premium Stack
   - Chart.js (premium animated charts)
   - jsPDF + html2canvas (invoice + receipt PDF export)
   - PapaParse (CSV parse/export)
   ============================================================ */
(function () {
  const CDN = {
    chart:     "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js",
    luxon:     "https://cdn.jsdelivr.net/npm/luxon@3.4.4/build/global/luxon.min.js",
    chartLux:  "https://cdn.jsdelivr.net/npm/chartjs-adapter-luxon@1.3.1/dist/chartjs-adapter-luxon.umd.min.js",
    jspdf:     "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js",
    autotable: "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js",
    h2c:       "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
    papa:      "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js",
    qr:        "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js",
    leafletJs: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    leafletCss:"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    qrScan:    "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js",
  };
  const CURRENCY = { symbol: "R", code: "ZAR", rate: 1 }; // ZAR is the source currency now — swapper just rewrites the symbol

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if ([...document.scripts].some(s => s.src === src)) return resolve();
      const s = document.createElement("script");
      s.src = src; s.async = true; s.crossOrigin = "anonymous";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed: " + src));
      document.head.appendChild(s);
    });
  }
  function loadStyle(href) {
    if ([...document.styleSheets].some(s => s.href === href)) return;
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href;
    document.head.appendChild(l);
  }
  function loadLeaflet() { loadStyle(CDN.leafletCss); return loadScript(CDN.leafletJs); }
  function loadQrScanner() { return loadScript(CDN.qrScan); }
  async function loadAll() {
    await loadScript(CDN.chart);
    await loadScript(CDN.luxon);
    await loadScript(CDN.chartLux);
    await loadScript(CDN.papa);
    await loadScript(CDN.jspdf);
    await loadScript(CDN.autotable);
    await loadScript(CDN.h2c);
    await loadScript(CDN.qr);
  }
  const ready = loadAll().catch(e => console.warn("[premium]", e.message));

  // -------- Chart.js theme & helpers --------
  const palette = {
    primary:   "#10B981",
    secondary: "#064E3B",
    accent:    "#F59E0B",
    info:      "#3B82F6",
    danger:    "#EF4444",
    purple:    "#8B5CF6",
    pink:      "#EC4899",
    teal:      "#14B8A6",
  };
  const palArr = Object.values(palette);

  function gradient(ctx, area, from, to) {
    if (!area) return from;
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, from); g.addColorStop(1, to);
    return g;
  }
  function applyTheme() {
    if (!window.Chart) return;
    Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = "#475569";
    Chart.defaults.borderColor = "rgba(148,163,184,0.18)";
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 18;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(6,78,59,0.95)";
    Chart.defaults.plugins.tooltip.titleColor = "#fff";
    Chart.defaults.plugins.tooltip.bodyColor = "#ECFDF5";
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 12;
    Chart.defaults.plugins.tooltip.titleFont = { weight: "700", size: 13 };
    Chart.defaults.plugins.tooltip.bodyFont = { weight: "600", size: 12 };
    Chart.defaults.plugins.tooltip.boxPadding = 6;
    Chart.defaults.animation = { duration: 900, easing: "easeOutQuart" };
  }

  function ensureCanvas(target) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return null;
    if (el.tagName === "CANVAS") return el;
    el.classList.add("chart-host");
    el.innerHTML = "";
    const c = document.createElement("canvas");
    c.style.maxHeight = el.style.height || "320px";
    el.appendChild(c);
    return c;
  }

  const Charts = {
    palette, palArr,
    async area(target, { labels, data, label = "Series", color = palette.primary }) {
      await ready; applyTheme();
      const cv = ensureCanvas(target); if (!cv) return;
      return new Chart(cv, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label, data,
            borderColor: color, borderWidth: 3, tension: 0.4,
            pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: color, pointHoverBorderWidth: 3,
            fill: true,
            backgroundColor: (ctx) => gradient(ctx.chart.ctx, ctx.chart.chartArea, color + "55", color + "00"),
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: "rgba(148,163,184,0.12)" }, border: { display: false }, beginAtZero: true },
          },
        },
      });
    },
    async bar(target, { labels, datasets }) {
      await ready; applyTheme();
      const cv = ensureCanvas(target); if (!cv) return;
      return new Chart(cv, {
        type: "bar",
        data: {
          labels,
          datasets: datasets.map((d, i) => ({
            label: d.label, data: d.data,
            backgroundColor: (ctx) => gradient(ctx.chart.ctx, ctx.chart.chartArea, (d.color || palArr[i]) + "ff", (d.color || palArr[i]) + "55"),
            borderRadius: 10, borderSkipped: false, maxBarThickness: 38,
          })),
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: "top", align: "end" } },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: "rgba(148,163,184,0.12)" }, border: { display: false }, beginAtZero: true },
          },
        },
      });
    },
    async stackedBar(target, { labels, datasets }) {
      await ready; applyTheme();
      const cv = ensureCanvas(target); if (!cv) return;
      return new Chart(cv, {
        type: "bar",
        data: {
          labels,
          datasets: datasets.map((d, i) => ({
            label: d.label, data: d.data,
            backgroundColor: (d.color || palArr[i]),
            borderRadius: 6, borderSkipped: false, maxBarThickness: 38,
          })),
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: "top", align: "end" } },
          scales: {
            x: { stacked: true, grid: { display: false }, border: { display: false } },
            y: { stacked: true, grid: { color: "rgba(148,163,184,0.12)" }, border: { display: false }, beginAtZero: true },
          },
        },
      });
    },
    async donut(target, { labels, data, colors, centerText }) {
      await ready; applyTheme();
      const cv = ensureCanvas(target); if (!cv) return;
      const center = {
        id: "centerText",
        afterDraw(chart) {
          if (!centerText) return;
          const { ctx, chartArea } = chart;
          const cx = (chartArea.left + chartArea.right) / 2;
          const cy = (chartArea.top + chartArea.bottom) / 2;
          ctx.save();
          ctx.textAlign = "center";
          ctx.fillStyle = "#064E3B";
          ctx.font = "800 24px 'Plus Jakarta Sans'";
          ctx.fillText(centerText.value || "", cx, cy - 4);
          ctx.fillStyle = "#64748B";
          ctx.font = "600 11px 'Plus Jakarta Sans'";
          ctx.fillText((centerText.label || "").toUpperCase(), cx, cy + 16);
          ctx.restore();
        },
      };
      return new Chart(cv, {
        type: "doughnut",
        data: { labels, datasets: [{ data, backgroundColor: colors || palArr, borderWidth: 0, hoverOffset: 12 }] },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: "70%",
          plugins: { legend: { position: "bottom" } },
        },
        plugins: [center],
      });
    },
    async sparkline(target, data, color = palette.primary) {
      await ready; applyTheme();
      const cv = ensureCanvas(target); if (!cv) return;
      return new Chart(cv, {
        type: "line",
        data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color, borderWidth: 2, tension: 0.4, pointRadius: 0, fill: true,
          backgroundColor: (ctx) => gradient(ctx.chart.ctx, ctx.chart.chartArea, color + "44", color + "00") }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
        },
      });
    },
    async mixed(target, { labels, bar, line }) {
      await ready; applyTheme();
      const cv = ensureCanvas(target); if (!cv) return;
      return new Chart(cv, {
        data: {
          labels,
          datasets: [
            { type: "bar", label: bar.label, data: bar.data, borderRadius: 8, maxBarThickness: 32,
              backgroundColor: (ctx) => gradient(ctx.chart.ctx, ctx.chart.chartArea, (bar.color || palette.primary) + "ee", (bar.color || palette.primary) + "55") },
            { type: "line", label: line.label, data: line.data, borderColor: line.color || palette.accent, borderWidth: 3, tension: 0.4, pointRadius: 0, pointHoverRadius: 6, fill: false, yAxisID: "y1" },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: "top", align: "end" } },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: "rgba(148,163,184,0.12)" }, border: { display: false }, beginAtZero: true },
            y1: { position: "right", grid: { display: false }, border: { display: false }, beginAtZero: true },
          },
        },
      });
    },
  };

  // -------- CSV --------
  const CSV = {
    download(rows, filename = "export.csv") {
      if (!rows || !rows.length) return;
      const Papa = window.Papa;
      const csv = Papa ? Papa.unparse(rows) : naiveCsv(rows);
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      saveBlob(blob, filename);
    },
    parse(text) { return window.Papa ? window.Papa.parse(text, { header: true }).data : []; },
  };
  function naiveCsv(rows) {
    const keys = Object.keys(rows[0]);
    const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    return [keys.join(","), ...rows.map(r => keys.map(k => esc(r[k])).join(","))].join("\n");
  }
  function saveBlob(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 200);
  }

  // -------- Invoice + Receipt rendering --------
  function money(n, cur) {
    const sym = cur || CURRENCY.symbol;
    return sym + " " + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function formatDate(d = new Date()) { return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  function uid(prefix) { return prefix + "-" + Date.now().toString(36).toUpperCase().slice(-6); }

  function invoiceHTML(o) {
    const items = o.items || [];
    const subtotal = items.reduce((s, it) => s + (Number(it.qty) * Number(it.price)), 0);
    const tax = o.taxRate ? subtotal * o.taxRate : 0;
    const total = subtotal + tax - (o.discount || 0);
    const cur = o.currency || "$";
    return `
    <div class="doc-page invoice-doc" id="${o._mountId}">
      <header class="doc-head">
        <div class="doc-brand">
          <div class="doc-logo">
            <svg viewBox="0 0 32 32" width="36" height="36"><circle cx="16" cy="16" r="15" fill="#10B981"/><path d="M9 17l5 5 9-12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <div>
              <div class="brand-name">EcoCycle<span>.</span></div>
              <div class="brand-tag">Reclaim. Recycle. Reward.</div>
            </div>
          </div>
        </div>
        <div class="doc-meta">
          <div class="doc-title">INVOICE</div>
          <div class="doc-num">#${o.id || uid("INV")}</div>
          <div class="doc-date">Issued ${formatDate(o.date)}</div>
          ${o.dueDate ? `<div class="doc-date">Due ${formatDate(o.dueDate)}</div>` : ""}
        </div>
      </header>

      <section class="doc-parties">
        <div>
          <div class="doc-label">From</div>
          <div class="doc-name">${o.from?.name || "EcoCycle Inc."}</div>
          <div class="doc-line">${o.from?.address || "12 Greenway Plaza, Lagos"}</div>
          <div class="doc-line">${o.from?.email || "billing@ecocycle.app"}</div>
        </div>
        <div>
          <div class="doc-label">Bill To</div>
          <div class="doc-name">${o.to?.name || "Customer"}</div>
          <div class="doc-line">${o.to?.address || ""}</div>
          <div class="doc-line">${o.to?.email || ""}</div>
        </div>
        <div>
          <div class="doc-label">Status</div>
          <div class="doc-status ${o.status || "due"}">${(o.status || "DUE").toUpperCase()}</div>
          <div class="doc-line">Method: ${o.method || "Bank Transfer"}</div>
          <div class="doc-line">Ref: ${o.ref || "—"}</div>
        </div>
      </section>

      <table class="doc-table">
        <thead><tr><th>Description</th><th>Qty</th><th class="r">Unit</th><th class="r">Total</th></tr></thead>
        <tbody>
          ${items.map(it => `<tr>
            <td><div class="it-name">${it.name}</div>${it.note ? `<div class="it-note">${it.note}</div>` : ""}</td>
            <td>${it.qty}${it.unit ? " " + it.unit : ""}</td>
            <td class="r">${money(it.price, cur)}</td>
            <td class="r"><strong>${money(it.qty * it.price, cur)}</strong></td>
          </tr>`).join("")}
        </tbody>
      </table>

      <section class="doc-totals">
        <div class="doc-notes">
          <div class="doc-label">Notes</div>
          <p>${o.notes || "Thank you for partnering with EcoCycle. Together we keep recyclables in the loop and out of landfill."}</p>
        </div>
        <div class="doc-sums">
          <div><span>Subtotal</span><span>${money(subtotal, cur)}</span></div>
          ${o.discount ? `<div><span>Discount</span><span>-${money(o.discount, cur)}</span></div>` : ""}
          ${o.taxRate ? `<div><span>Tax (${(o.taxRate * 100).toFixed(0)}%)</span><span>${money(tax, cur)}</span></div>` : ""}
          <div class="grand"><span>Total Due</span><span>${money(total, cur)}</span></div>
        </div>
      </section>

      <footer class="doc-foot">
        <div>Generated by EcoCycle • ${formatDate()}</div>
        <div>ecocycle.app</div>
      </footer>
    </div>`;
  }

  function receiptHTML(o) {
    const items = o.items || [];
    const subtotal = items.reduce((s, it) => s + (Number(it.qty) * Number(it.price)), 0);
    const total = subtotal - (o.discount || 0);
    const cur = o.currency || "$";
    return `
    <div class="doc-page receipt-doc" id="${o._mountId}">
      <div class="rcp-strip"></div>
      <div class="rcp-head">
        <div class="rcp-logo">
          <svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="15" fill="#10B981"/><path d="M9 17l5 5 9-12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="rcp-title">EcoCycle</div>
        <div class="rcp-sub">Pickup Receipt</div>
        <div class="rcp-meta">${formatDate(o.date)} • ${new Date(o.date || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        <div class="rcp-id">#${o.id || uid("RCP")}</div>
      </div>

      <div class="rcp-block">
        <div><span>Picker</span><strong>${o.picker || "—"}</strong></div>
        <div><span>Branch</span><strong>${o.branch || "—"}</strong></div>
        ${o.method ? `<div><span>Method</span><strong>${o.method}</strong></div>` : ""}
      </div>

      <div class="rcp-divider"></div>

      <table class="rcp-table">
        ${items.map(it => `<tr>
          <td>${it.name}<br><small>${it.qty}${it.unit ? " " + it.unit : ""} × ${money(it.price, cur)}</small></td>
          <td class="r"><strong>${money(it.qty * it.price, cur)}</strong></td>
        </tr>`).join("")}
      </table>

      <div class="rcp-divider"></div>

      <div class="rcp-totals">
        <div><span>Subtotal</span><span>${money(subtotal, cur)}</span></div>
        ${o.discount ? `<div><span>Adj.</span><span>-${money(o.discount, cur)}</span></div>` : ""}
        <div class="grand"><span>Total</span><span>${money(total, cur)}</span></div>
      </div>

      ${o.qr ? `<div class="rcp-qr"><canvas data-qr="${o.qr}"></canvas><div>Scan to verify</div></div>` : ""}

      <div class="rcp-thanks">Thank you for keeping ${(items.reduce((s, it) => s + Number(it.qty), 0)).toFixed(1)} kg out of landfill ♻</div>
      <div class="rcp-foot">ecocycle.app • support@ecocycle.app</div>
    </div>`;
  }

  function mountOffscreen(html) {
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;left:-9999px;top:0;background:#fff;";
    wrap.innerHTML = html;
    document.body.appendChild(wrap);
    return wrap;
  }
  async function paintQRCodes(root) {
    if (!window.QRCode) return;
    const tasks = [...root.querySelectorAll("canvas[data-qr]")].map(c =>
      window.QRCode.toCanvas(c, c.getAttribute("data-qr"), { width: 96, margin: 0, color: { dark: "#064E3B", light: "#ffffff" } }).catch(() => {})
    );
    await Promise.all(tasks);
  }
  async function htmlToPDF(html, filename, format = "a4") {
    await ready;
    const wrap = mountOffscreen(html);
    await paintQRCodes(wrap);
    const node = wrap.firstElementChild;
    const canvas = await window.html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "pt", format, orientation: format === "a4" ? "p" : "p" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = canvas.height / canvas.width;
    const imgW = pageW;
    const imgH = imgW * ratio;
    if (imgH <= pageH) {
      pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
    } else {
      let y = 0;
      while (y < imgH) {
        pdf.addImage(imgData, "PNG", 0, -y, imgW, imgH);
        y += pageH;
        if (y < imgH) pdf.addPage();
      }
    }
    pdf.save(filename);
    wrap.remove();
  }
  async function htmlToPrint(html) {
    await ready;
    const wrap = mountOffscreen(html);
    await paintQRCodes(wrap);
    const node = wrap.firstElementChild.outerHTML;
    const w = window.open("", "_blank", "width=900,height=1100");
    w.document.write(`<!doctype html><html><head><title>Print</title>
      <link rel="stylesheet" href="${location.origin}/assets/css/styles.css">
      <link rel="stylesheet" href="${location.origin}/assets/css/premium.css">
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>body{margin:0;padding:24px;background:#fff;font-family:'Plus Jakarta Sans',sans-serif}@media print{body{padding:0}}</style>
      </head><body>${node}<script>window.addEventListener('load',()=>{setTimeout(()=>{window.print();window.close()},250)})<\/script></body></html>`);
    w.document.close();
    wrap.remove();
  }

  const Invoice = {
    html: invoiceHTML,
    render(target, opts) {
      const id = "inv_" + Math.random().toString(36).slice(2, 8);
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (el) el.innerHTML = invoiceHTML({ ...opts, _mountId: id });
      return id;
    },
    download(opts, filename) { return htmlToPDF(invoiceHTML({ ...opts, _mountId: "inv" }), filename || `invoice-${opts.id || "ecocycle"}.pdf`); },
    print(opts) { return htmlToPrint(invoiceHTML({ ...opts, _mountId: "inv" })); },
  };
  const Receipt = {
    html: receiptHTML,
    render(target, opts) {
      const id = "rcp_" + Math.random().toString(36).slice(2, 8);
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (el) {
        el.innerHTML = receiptHTML({ ...opts, _mountId: id });
        ready.then(() => paintQRCodes(el));
      }
      return id;
    },
    download(opts, filename) { return htmlToPDF(receiptHTML({ ...opts, _mountId: "rcp" }), filename || `receipt-${opts.id || "ecocycle"}.pdf`, [320, 600]); },
    print(opts) { return htmlToPrint(receiptHTML({ ...opts, _mountId: "rcp" })); },
  };

  // ---------- Currency utilities ----------
  function fmt(n, opts) {
    const o = opts || {};
    const sym = o.symbol || CURRENCY.symbol;
    const num = Number(n || 0);
    return sym + " " + num.toLocaleString(undefined, {
      minimumFractionDigits: o.decimals == null ? 2 : o.decimals,
      maximumFractionDigits: o.decimals == null ? 2 : o.decimals,
    });
  }
  /** Walks the DOM and replaces inline "$<number>" / "USD <number>" with R-converted values.
   *  Run once after your page renders — it is idempotent (skips already-marked nodes). */
  function swapCurrency(root) {
    const r = root || document.body;
    const RX = /\$\s?([0-9][0-9,]*(?:\.[0-9]+)?)([KMB]?)/g;
    const skip = new Set(["SCRIPT", "STYLE", "INPUT", "TEXTAREA", "CODE", "PRE"]);
    const walker = document.createTreeWalker(r, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.includes("$")) return NodeFilter.FILTER_REJECT;
        let p = node.parentElement;
        while (p) {
          if (skip.has(p.tagName)) return NodeFilter.FILTER_REJECT;
          if (p.dataset && p.dataset.ecCur === "1") return NodeFilter.FILTER_REJECT;
          p = p.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const targets = []; let n;
    while ((n = walker.nextNode())) targets.push(n);
    targets.forEach((node) => {
      const txt = node.nodeValue.replace(RX, (_, num, suffix) => {
        const v = parseFloat(num.replace(/,/g, "")) * CURRENCY.rate;
        if (suffix) return CURRENCY.symbol + " " + Math.round(v).toLocaleString() + suffix;
        // small amounts → 2dp, big amounts → integer
        const dec = v >= 1000 ? 0 : 2;
        return CURRENCY.symbol + " " + v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
      });
      if (txt !== node.nodeValue) {
        node.nodeValue = txt;
        if (node.parentElement) node.parentElement.dataset.ecCur = "1";
      }
    });
  }
  // Auto-run after each page paints; also re-run when async fetches mutate content.
  document.addEventListener("DOMContentLoaded", () => {
    swapCurrency();
    const mo = new MutationObserver((muts) => {
      let needs = false;
      muts.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 || n.nodeType === 3) needs = true; }));
      if (needs) swapCurrency();
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  });

  window.EcoCycle = Object.assign(window.EcoCycle || {}, {
    ready, Charts, CSV, Invoice, Receipt, palette,
    currency: CURRENCY, fmt, money, swapCurrency,
    loadLeaflet, loadQrScanner,
  });
})();
