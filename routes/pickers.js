const router = require("express").Router();
const { selectAll, selectOne, insert, update, remove, audit } = require("../lib/dataAccess");

router.get("/", async (_req, res) => {
  const pickers = await selectAll("pickers", { orderBy: "created_at", ascending: false });
  res.json({ pickers });
});

router.post("/", async (req, res) => {
  try {
    const all = await selectAll("pickers");
    const id = req.body?.id || "PK-" + String(all.length + 1).padStart(3, "0");
    const picker = await insert("pickers", { id, status: "active", total_kg: 0, ...req.body });
    await audit("system", "CREATE_PICKER", id);
    res.json({ picker });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/:id", async (req, res) => {
  const picker = await selectOne("pickers", { id: req.params.id });
  picker ? res.json({ picker }) : res.status(404).json({ error: "Not found" });
});

router.put("/:id", async (req, res) => {
  try {
    const picker = await update("pickers", { id: req.params.id }, req.body);
    picker ? res.json({ picker }) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try { await remove("pickers", { id: req.params.id }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/:id/qr", (req, res) => res.json({ qr: "data:text/plain," + req.params.id }));

router.get("/:id/transactions", async (req, res) => {
  const all = await selectAll("transactions", { orderBy: "created_at", ascending: false });
  res.json({ transactions: all.filter((t) => t.picker_id === req.params.id) });
});

router.get("/:id/earnings", async (req, res) => {
  const all = await selectAll("transactions");
  const earnings = all.filter((t) => t.picker_id === req.params.id).reduce((a, t) => a + Number(t.amount || 0), 0);
  res.json({ earnings });
});

module.exports = router;
