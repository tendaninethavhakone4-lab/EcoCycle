const router = require("express").Router();
const { supabase, live } = require("../lib/dataAccess");

router.get("/", async (_req, res) => {
  if (!live) return res.json({ audit: [] });
  const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
  res.json({ audit: data || [] });
});

router.get("/:id", async (req, res) => {
  if (!live) return res.status(404).json({ error: "Not found" });
  const { data } = await supabase.from("audit_log").select("*").eq("id", req.params.id).maybeSingle();
  data ? res.json({ entry: data }) : res.status(404).json({ error: "Not found" });
});

module.exports = router;
