const router = require("express").Router();
const { selectAll, update } = require("../lib/dataAccess");

router.get("/", async (_req, res) => {
  const alerts = await selectAll("alerts", { orderBy: "created_at", ascending: false });
  res.json({ alerts });
});

router.put("/:id/read", async (req, res) => {
  const a = await update("alerts", { id: req.params.id }, { read: true });
  res.json({ alert: a });
});

module.exports = router;
