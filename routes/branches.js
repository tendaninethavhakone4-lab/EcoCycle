const router = require("express").Router();
const { selectAll, insert, update, remove, audit } = require("../lib/dataAccess");
const { authRequired, requireRole } = require("../lib/auth");

router.get("/", async (_req, res) => {
  const branches = await selectAll("branches", { orderBy: "created_at", ascending: true });
  res.json({ branches });
});

router.post("/", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: "Branch name required" });
    const branch = await insert("branches", { status: "active", country: "South Africa", ...req.body });
    await audit(req.user.email, "CREATE_BRANCH", branch.name);
    res.json({ branch });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const b = await update("branches", { id: req.params.id }, req.body);
    b ? res.json({ branch: b }) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", authRequired, requireRole("superadmin"), async (req, res) => {
  try { await remove("branches", { id: req.params.id }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
