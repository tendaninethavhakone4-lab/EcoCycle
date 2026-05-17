const router = require("express").Router();
const { selectAll, audit, supabase, live } = require("../lib/dataAccess");
const memHistory = [];

router.get("/", async (_req, res) => {
  const rows = await selectAll("prices");
  // Return as { Plastic: 0.5, ... } for client compat
  const obj = Object.fromEntries(rows.map((r) => [r.material, Number(r.price_per_kg)]));
  res.json({ prices: obj, list: rows });
});

router.put("/", async (req, res) => {
  try {
    const changes = req.body || {};
    if (!live) return res.status(503).json({ error: "Database not configured" });
    for (const [material, price] of Object.entries(changes)) {
      const { data: existing } = await supabase.from("prices").select("price_per_kg").eq("material", material).maybeSingle();
      await supabase.from("prices").upsert({ material, price_per_kg: Number(price), updated_at: new Date().toISOString() });
      if (existing) await supabase.from("price_history").insert({ material, old_price: existing.price_per_kg, new_price: Number(price) });
    }
    memHistory.unshift({ at: Date.now(), changes });
    await audit("admin", "UPDATE_PRICES", JSON.stringify(changes));
    const rows = await selectAll("prices");
    res.json({ prices: Object.fromEntries(rows.map((r) => [r.material, Number(r.price_per_kg)])) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/history", async (_req, res) => {
  if (live) {
    const { data } = await supabase.from("price_history").select("*").order("changed_at", { ascending: false }).limit(50);
    return res.json({ history: data || [] });
  }
  res.json({ history: memHistory });
});

module.exports = router;
