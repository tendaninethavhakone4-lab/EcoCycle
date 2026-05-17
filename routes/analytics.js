const router = require("express").Router();
const { selectAll } = require("../lib/dataAccess");

router.get("/", async (_req, res) => {
  const [tx, pickers] = await Promise.all([selectAll("transactions"), selectAll("pickers")]);
  const totalKg = tx.reduce((a, t) => a + Number(t.weight || 0), 0);
  const totalRevenue = tx.reduce((a, t) => a + Number(t.amount || 0), 0);
  res.json({
    totalKg,
    totalRevenue,
    txCount: tx.length,
    activePickers: pickers.filter((p) => p.status === "active").length,
  });
});

router.get("/branch/:id", async (req, res) => {
  const tx = await selectAll("transactions");
  const filtered = tx.filter((t) => t.branch === req.params.id);
  res.json({
    branchId: req.params.id,
    summary: {
      kg: filtered.reduce((a, t) => a + Number(t.weight || 0), 0),
      revenue: filtered.reduce((a, t) => a + Number(t.amount || 0), 0),
    },
  });
});

router.get("/global", async (_req, res) => {
  const [tx, branches] = await Promise.all([selectAll("transactions"), selectAll("branches")]);
  res.json({
    branches: branches.length,
    totalKg: tx.reduce((a, t) => a + Number(t.weight || 0), 0),
    totalRevenue: tx.reduce((a, t) => a + Number(t.amount || 0), 0),
  });
});

router.get("/leaderboard", async (_req, res) => {
  const pickers = await selectAll("pickers");
  res.json({
    pickers: pickers
      .slice()
      .sort((a, b) => Number(b.total_kg || 0) - Number(a.total_kg || 0))
      .slice(0, 10),
  });
});

module.exports = router;
