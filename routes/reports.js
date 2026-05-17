const router = require("express").Router();
const { selectAll, audit } = require("../lib/dataAccess");

// Reports are generated on-demand from live data (no in-memory placeholders).
async function buildReport(type) {
  if (type === "transactions") {
    const tx = await selectAll("transactions", { orderBy: "created_at", ascending: false });
    return { type, generatedAt: new Date().toISOString(), rowCount: tx.length, rows: tx };
  }
  if (type === "sales") {
    const rows = await selectAll("sales", { orderBy: "created_at", ascending: false });
    return { type, generatedAt: new Date().toISOString(), rowCount: rows.length, rows };
  }
  if (type === "payouts") {
    const rows = await selectAll("payouts", { orderBy: "created_at", ascending: false });
    return { type, generatedAt: new Date().toISOString(), rowCount: rows.length, rows };
  }
  if (type === "inventory") {
    const rows = await selectAll("inventory");
    return { type, generatedAt: new Date().toISOString(), rowCount: rows.length, rows };
  }
  // default summary
  const [tx, sales, payouts, pickers] = await Promise.all([
    selectAll("transactions"), selectAll("sales"),
    selectAll("payouts"),       selectAll("pickers"),
  ]);
  return {
    type: "summary",
    generatedAt: new Date().toISOString(),
    totals: {
      kg: tx.reduce((a, t) => a + Number(t.weight || 0), 0),
      revenue: tx.reduce((a, t) => a + Number(t.amount || 0), 0),
      sales: sales.reduce((a, s) => a + Number(s.total || 0), 0),
      payouts: payouts.reduce((a, p) => a + Number(p.amount || 0), 0),
      pickers: pickers.length,
    },
  };
}

router.get("/", async (_req, res) => res.json({ reports: [] }));

router.post("/generate", async (req, res) => {
  try {
    const report = await buildReport(req.body?.type || "summary");
    await audit("admin", "GENERATE_REPORT", report.type);
    res.json({ report });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/:type", async (req, res) => {
  try {
    const report = await buildReport(req.params.type);
    res.json({ report });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
