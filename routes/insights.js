const router = require("express").Router();
const { selectAll } = require("../lib/dataAccess");

// Derive AI-style insights from live data instead of canned strings.
router.get("/", async (_req, res) => {
  const [tx, prices, inv, pickers] = await Promise.all([
    selectAll("transactions"),
    selectAll("prices"),
    selectAll("inventory"),
    selectAll("pickers"),
  ]);

  const insights = [];

  // 1. Top material by volume → suggest pricing review
  const byMat = {};
  tx.forEach((t) => { byMat[t.material] = (byMat[t.material] || 0) + Number(t.weight || 0); });
  const top = Object.entries(byMat).sort((a, b) => b[1] - a[1])[0];
  if (top) insights.push({ type: "pricing", message: `${top[0]} is your top inflow (${Math.round(top[1])} kg). Consider a 5% price review.` });

  // 2. Low stock alerts
  inv.filter((r) => Number(r.stock_kg) < Number(r.threshold_kg ?? 200))
    .forEach((r) => insights.push({ type: "operations", message: `${r.material} stock is low (${r.stock_kg} kg below threshold).` }));

  // 3. Inactive picker count
  const inactive = pickers.filter((p) => p.status !== "active").length;
  if (inactive) insights.push({ type: "fraud", message: `${inactive} picker${inactive > 1 ? "s are" : " is"} currently inactive — verify identity.` });

  // 4. Demand forecast (simple trend on recent vs older half)
  const sorted = [...tx].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  if (sorted.length > 10) {
    const half = Math.floor(sorted.length / 2);
    const oldKg = sorted.slice(0, half).reduce((a, t) => a + Number(t.weight || 0), 0);
    const newKg = sorted.slice(half).reduce((a, t) => a + Number(t.weight || 0), 0);
    if (oldKg > 0) {
      const pct = Math.round(((newKg - oldKg) / oldKg) * 100);
      insights.push({ type: "demand", message: `Recent volume is ${pct >= 0 ? "up" : "down"} ${Math.abs(pct)}% versus the prior period.` });
    }
  }

  res.json({ insights });
});

router.get("/forecast", async (_req, res) => {
  const tx = await selectAll("transactions");
  const sorted = [...tx].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  if (sorted.length < 4) return res.json({ q3: { volumeGrowth: 0 } });
  const half = Math.floor(sorted.length / 2);
  const oldKg = sorted.slice(0, half).reduce((a, t) => a + Number(t.weight || 0), 0);
  const newKg = sorted.slice(half).reduce((a, t) => a + Number(t.weight || 0), 0);
  res.json({ q3: { volumeGrowth: oldKg > 0 ? +((newKg - oldKg) / oldKg).toFixed(3) : 0 } });
});

router.get("/recommendations", async (_req, res) => {
  const prices = await selectAll("prices");
  const recommendations = prices.map((p) => ({
    material: p.material,
    currentPrice: Number(p.price_per_kg),
    suggestedPrice: +(Number(p.price_per_kg) * 1.05).toFixed(2),
    reason: "5% uplift to track demand trend",
  }));
  res.json({ recommendations });
});

module.exports = router;
