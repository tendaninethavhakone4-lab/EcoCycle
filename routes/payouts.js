const router = require("express").Router();
const { selectAll, insert, update, audit } = require("../lib/dataAccess");

router.get("/", async (_req, res) => {
  const payouts = await selectAll("payouts", { orderBy: "created_at", ascending: false });
  res.json({ payouts });
});

router.post("/", async (req, res) => {
  try {
    const all = await selectAll("payouts");
    const id = req.body?.id || "PO-" + String(all.length + 1).padStart(3, "0");
    const payout = await insert("payouts", { id, status: "pending", ...req.body });
    await audit("admin", "CREATE_PAYOUT", id);
    res.json({ payout });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const p = await update("payouts", { id: req.params.id }, req.body);
    p ? res.json({ payout: p }) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/:id/complete", async (req, res) => {
  try {
    const p = await update("payouts", { id: req.params.id }, { status: "paid" });
    p ? res.json({ payout: p }) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
