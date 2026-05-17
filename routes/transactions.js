const router = require("express").Router();
const { selectAll, selectOne, insert, update, remove, audit, supabase, live } = require("../lib/dataAccess");

async function withPickerName(transactions) {
  const pickers = await selectAll("pickers");
  const map = Object.fromEntries(pickers.map((p) => [p.id, p.name]));
  return transactions.map((t) => ({ ...t, picker_name: t.picker_name || map[t.picker_id] || "" }));
}

router.get("/", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const all = await selectAll("transactions", { orderBy: "created_at", ascending: false, limit });
  res.json({ transactions: await withPickerName(all) });
});

router.get("/ledger", async (_req, res) => {
  const all = await selectAll("transactions", { orderBy: "created_at", ascending: false });
  res.json({ transactions: await withPickerName(all) });
});

router.post("/", async (req, res) => {
  try {
    const { picker_id, items = [] } = req.body || {};
    const picker = await selectOne("pickers", { id: picker_id });
    if (!picker) return res.status(400).json({ error: "Unknown picker" });
    const allTx = await selectAll("transactions");
    const pricesArr = await selectAll("prices");
    const priceMap = Object.fromEntries(pricesArr.map((p) => [p.material, Number(p.price_per_kg)]));
    const created = [];
    let nextSeq = 1043 + allTx.length;
    for (const it of items) {
      const price = priceMap[it.material] || 0;
      const amount = +(Number(it.weight) * price).toFixed(2);
      const tx = await insert("transactions", {
        id: "TX-" + (nextSeq++),
        picker_id, material: it.material,
        weight: Number(it.weight), price_per_kg: price, amount,
        status: "completed", branch: picker.branch,
      });
      created.push({ ...tx, picker_name: picker.name });
    }
    await audit("user", "CREATE_TX", created.map((t) => t.id).join(","));
    res.json({ transactions: created });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  const t = await selectOne("transactions", { id: req.params.id });
  t ? res.json({ transaction: t }) : res.status(404).json({ error: "Not found" });
});

router.put("/:id", async (req, res) => {
  try {
    const t = await update("transactions", { id: req.params.id }, req.body);
    t ? res.json({ transaction: t }) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try { await remove("transactions", { id: req.params.id }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
