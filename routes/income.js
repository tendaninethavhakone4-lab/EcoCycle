const router = require("express").Router();
const { selectAll } = require("../lib/dataAccess");

router.get("/", async (_req, res) => {
  const payouts = await selectAll("payouts", { orderBy: "created_at", ascending: false });
  const totalPaid = payouts.filter((p) => p.status === "paid").reduce((a, p) => a + Number(p.amount || 0), 0);
  const pending = payouts.filter((p) => p.status === "pending").reduce((a, p) => a + Number(p.amount || 0), 0);
  res.json({ totalPaid, pending, payouts });
});

module.exports = router;
