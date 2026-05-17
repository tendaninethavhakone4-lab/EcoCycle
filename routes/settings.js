const router = require("express").Router();
const { selectAll, supabase, live } = require("../lib/dataAccess");

// settings table is key/value (jsonb). Returned shape:
//   { settings: { platform_name, currency, support_email, default_branch, flags } }

async function readSettings() {
  const rows = await selectAll("settings");
  const settings = { currency: "ZAR" };
  for (const r of rows || []) settings[r.key] = r.value;
  return settings;
}

router.get("/", async (_req, res) => {
  try { res.json({ settings: await readSettings() }); }
  catch (e) { res.status(503).json({ error: e.message || "settings unavailable" }); }
});

router.put("/", async (req, res) => {
  if (!live) return res.status(503).json({ error: "Supabase not configured" });
  try {
    const body = req.body || {};
    const upserts = Object.entries(body).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }));
    if (upserts.length) {
      const { error } = await supabase.from("settings").upsert(upserts, { onConflict: "key" });
      if (error) throw error;
    }
    res.json({ settings: await readSettings() });
  } catch (e) {
    res.status(500).json({ error: e.message || "settings update failed" });
  }
});

module.exports = router;
