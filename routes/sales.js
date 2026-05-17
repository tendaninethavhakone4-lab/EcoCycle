const router = require("express").Router();
const { selectAll, selectOne, insert, update, audit, supabase, live } = require("../lib/dataAccess");

router.get("/", async (_req, res) => {
  const sales = await selectAll("sales", { orderBy: "created_at", ascending: false });
  res.json({ sales });
});

router.post("/", async (req, res) => {
  try {
    const { material, qty, buyer, price_per_kg } = req.body || {};
    if (!material || !qty) return res.status(400).json({ error: "Missing fields" });

    // Check inventory
    const inv = await selectOne("inventory", { material });
    if (!inv || Number(inv.stock_kg || 0) < Number(qty)) return res.status(400).json({ error: "Insufficient stock" });

    // Decrement stock
    if (live) {
      await supabase.from("inventory")
        .update({ stock_kg: Number(inv.stock_kg) - Number(qty), updated_at: new Date().toISOString() })
        .eq("material", material);
    }

    const all = await selectAll("sales");
    const id = "SL-" + String(all.length + 1).padStart(3, "0");
    const sale = await insert("sales", {
      id, material,
      qty: Number(qty),
      price_per_kg: Number(price_per_kg || 0),
      total: +(Number(qty) * Number(price_per_kg || 0)).toFixed(2),
      buyer: buyer || "",
      status: "pending",
    });
    await audit("admin", "CREATE_SALE", id);
    res.json({ sale });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/:id", async (req, res) => {
  const sale = await selectOne("sales", { id: req.params.id });
  sale ? res.json({ sale }) : res.status(404).json({ error: "Not found" });
});

router.post("/:id/complete", async (req, res) => {
  try {
    const sale = await update("sales", { id: req.params.id }, { status: "paid" });
    sale ? res.json({ sale }) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
