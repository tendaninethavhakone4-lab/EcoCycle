const router = require("express").Router();
const { selectAll } = require("../lib/dataAccess");

const compute = (kg) => ({
  co2: +(kg * 1.7).toFixed(2),
  trees: Math.floor(kg / 22),
  landfill: kg,
  water: +(kg * 5.7).toFixed(2),
});

router.get("/", async (_req, res) => {
  const tx = await selectAll("transactions");
  const totalKg = tx.reduce((a, t) => a + Number(t.weight || 0), 0);
  res.json(compute(totalKg));
});

router.get("/global", async (_req, res) => {
  const tx = await selectAll("transactions");
  const totalKg = tx.reduce((a, t) => a + Number(t.weight || 0), 0);
  res.json(compute(totalKg));
});

module.exports = router;
