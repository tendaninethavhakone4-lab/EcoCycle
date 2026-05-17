const router = require("express").Router();
const { selectAll, selectOne, insert, update } = require("../lib/dataAccess");

router.get("/", async (_req, res) => {
  const tickets = await selectAll("support_tickets", { orderBy: "created_at", ascending: false });
  res.json({ tickets });
});

router.post("/", async (req, res) => {
  try {
    const all = await selectAll("support_tickets");
    const id = "TK-" + String(all.length + 1).padStart(3, "0");
    const ticket = await insert("support_tickets", { id, status: "open", ...req.body });
    res.json({ ticket });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/:id", async (req, res) => {
  const t = await selectOne("support_tickets", { id: req.params.id });
  t ? res.json({ ticket: t }) : res.status(404).json({ error: "Not found" });
});

router.put("/:id", async (req, res) => {
  try {
    const t = await update("support_tickets", { id: req.params.id }, req.body);
    t ? res.json({ ticket: t }) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/:id/escalate", async (req, res) => {
  try {
    const t = await update("support_tickets", { id: req.params.id }, { escalated: true });
    t ? res.json({ ticket: t }) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
