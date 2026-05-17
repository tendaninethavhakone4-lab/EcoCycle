const router = require("express").Router();
const { selectAll } = require("../lib/dataAccess");

// South African branch coordinates (used as a base when picker rows have no GPS).
const BRANCH_COORDS = {
  "Lagos Central":   { lat: 6.5244,  lng: 3.3792  },
  "Nairobi East":    { lat: -1.2921, lng: 36.8219 },
  "Accra Hub":       { lat: 5.6037,  lng: -0.1870 },
  "Cape Town West":  { lat: -33.9249,lng: 18.4241 },
  "HQ":              { lat: -26.2041,lng: 28.0473 },
};

function jitter(coord, picker_id) {
  // Deterministic jitter from picker id so dots don't all overlap on the branch.
  const seed = (picker_id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const dLat = ((seed % 17) - 8) * 0.004;
  const dLng = (((seed * 7) % 19) - 9) * 0.004;
  return { lat: coord.lat + dLat, lng: coord.lng + dLng };
}

router.get("/pickups", async (_req, res) => {
  const pickers = await selectAll("pickers");
  const pickups = pickers
    .filter((p) => p.status === "active")
    .map((p) => {
      const base = BRANCH_COORDS[p.branch] || BRANCH_COORDS["Lagos Central"];
      const c = jitter(base, p.id);
      return {
        id: "PU-" + p.id.replace("PK-", ""),
        picker_id: p.id,
        picker: p.name,
        branch: p.branch,
        lat: c.lat,
        lng: c.lng,
        eta: 6 + (p.id.charCodeAt(p.id.length - 1) % 30),
      };
    });
  res.json({ pickups });
});

router.post("/assign", (req, res) => res.json({ ok: true, assignment: req.body }));
router.get("/routes", (_req, res) => res.json({ routes: [] }));

module.exports = router;
