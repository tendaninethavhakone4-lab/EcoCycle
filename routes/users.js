const router = require("express").Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { selectAll, selectOne, insert, update, remove, audit } = require("../lib/dataAccess");
const { authRequired, requireRole } = require("../lib/auth");
const mailer = require("../lib/mailer");

const sanitize = (u) => { if (!u) return u; const { password_hash, password, ...rest } = u; return rest; };

function makeTempPassword() {
  // 12-char alphanumeric, easy to type but unpredictable.
  return crypto.randomBytes(9).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 12) || "Temp" + Date.now();
}

router.get("/", authRequired, requireRole("admin", "superadmin"), async (_req, res) => {
  const users = await selectAll("users", { orderBy: "created_at", ascending: false });
  res.json({ users: users.map(sanitize) });
});

router.get("/:id", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  const u = await selectOne("users", { id: req.params.id });
  u ? res.json({ user: sanitize(u) }) : res.status(404).json({ error: "Not found" });
});

// Admin or superadmin creates an admin/user. SuperAdmin only may create
// superadmins. A temporary password is generated and emailed; the new
// user must change it on first login.
router.post("/", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const { name, email, role = "admin", branch, phone } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: "Name and email required" });
    if (!["user", "admin", "superadmin"].includes(role)) return res.status(400).json({ error: "Invalid role" });
    if (role === "superadmin" && req.user.role !== "superadmin") return res.status(403).json({ error: "Only superadmins can create superadmins" });

    const existing = await selectOne("users", { email });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    const tempPassword = makeTempPassword();
    const password_hash = bcrypt.hashSync(tempPassword, 8);
    if (!password_hash) return res.status(500).json({ error: "Failed to hash temp password" });
    const created = await insert("users", {
      name, email, role, branch, phone,
      status: "active",
      must_change_password: true,
      password_hash,
    });
    await audit(req.user.email, "CREATE_USER", `${created.id} (${role})`);
    const t = mailer.adminInviteEmail(created, tempPassword);
    mailer.send({ to: email, subject: t.subject, html: t.html });
    res.json({ user: sanitize(created), email_sent: !!process.env.RESEND_API_KEY });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Approve a pending user → activates them and emails them.
router.post("/:id/approve", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const user = await selectOne("users", { id: req.params.id });
    if (!user) return res.status(404).json({ error: "User not found" });
    const updated = await update("users", { id: user.id }, {
      status: "active",
      approved_at: new Date().toISOString(),
      approved_by: req.user.email,
    });
    await audit(req.user.email, "APPROVE_USER", user.id);
    const t = mailer.approvedEmail(updated || user);
    mailer.send({ to: user.email, subject: t.subject, html: t.html });
    res.json({ user: sanitize(updated || user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/:id/suspend", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const u = await update("users", { id: req.params.id }, { status: "suspended" });
    await audit(req.user.email, "SUSPEND_USER", req.params.id);
    res.json({ user: sanitize(u) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    // Never let arbitrary password / role escalation through here.
    const { password_hash, password, role, ...patch } = req.body || {};
    if (role && req.user.role === "superadmin") patch.role = role;
    const u = await update("users", { id: req.params.id }, patch);
    u ? res.json({ user: sanitize(u) }) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id/role", authRequired, requireRole("superadmin"), async (req, res) => {
  try {
    const u = await update("users", { id: req.params.id }, { role: req.body.role });
    u ? res.json({ user: sanitize(u) }) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", authRequired, requireRole("superadmin"), async (req, res) => {
  try { await remove("users", { id: req.params.id }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
