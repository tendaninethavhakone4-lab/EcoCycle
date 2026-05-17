const router = require("express").Router();
const { selectAll, selectOne, audit, supabase, live } = require("../lib/dataAccess");

async function asMap() {
  const rows = await selectAll("inventory");
  return Object.fromEntries(rows.map((r) => [r.material, Number(r.stock_kg)]));
}

router.get("/", async (_req, res) => {
  const inventory = await asMap();
  res.json({ inventory, list: await selectAll("inventory") });
});

router.get("/alerts", async (_req, res) => {
  const rows = await selectAll("inventory");
  const alerts = rows.filter((r) => Number(r.stock_kg) < Number(r.threshold_kg ?? 500))
    .map((r) => ({ material: r.material, stock: Number(r.stock_kg), threshold: Number(r.threshold_kg ?? 500) }));
  res.json({ alerts });
});

router.get("/:material", async (req, res) => {
  const row = await selectOne("inventory", { material: req.params.material });
  res.json({ material: req.params.material, stock: row ? Number(row.stock_kg) : 0 });
});

router.post("/update", async (req, res) => {
  try {
    const { material, delta } = req.body || {};
    if (!material) return res.status(400).json({ error: "material is required" });
    if (!live) return res.status(503).json({ error: "Database not configured" });
    const { data: existing } = await supabase.from("inventory").select("stock_kg").eq("material", material).maybeSingle();
    const newStock = Number(existing?.stock_kg || 0) + Number(delta || 0);
    await supabase.from("inventory").upsert({ material, stock_kg: newStock, updated_at: new Date().toISOString() });
    await audit("admin", "ADJUST_STOCK", `${material} ${delta}`);
    res.json({ inventory: await asMap() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
