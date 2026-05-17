const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { selectOne, insert, update, audit } = require("../lib/dataAccess");
const { sign, authRequired } = require("../lib/auth");
const mailer = require("../lib/mailer");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, branch, phone } = req.body || {};
    if (!email || !password || !name) return res.status(400).json({ error: "Missing required fields" });
    if ((password || "").length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const existing = await selectOne("users", { email });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    // Self-registered users are always 'user' role and must wait for admin approval.
    const user = await insert("users", {
      name, email, branch, phone,
      role: "user",
      status: "pending",
      password_hash: bcrypt.hashSync(password, 8),
    });
    await audit(email, "REGISTER", user.id);
    const t = mailer.pendingEmail(user);
    mailer.send({ to: email, subject: t.subject, html: t.html });
    res.json({ ok: true, message: "Account created. An administrator will review and approve it. You'll be emailed when it's active." });
  } catch (e) {
    res.status(500).json({ error: e.message || "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await selectOne("users", { email });
    const hash = user && (user.password_hash || user.password);
    if (!user || !hash || !bcrypt.compareSync(password || "", hash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (user.status && user.status !== "active") {
      const why = user.status === "pending"
        ? "Your account is awaiting administrator approval."
        : "Your account is " + user.status + ". Contact an administrator.";
      return res.status(403).json({ error: why });
    }
    const token = sign(user);
    update("users", { id: user.id }, { last_login: new Date().toISOString() }).catch(() => {});
    await audit(email, "LOGIN", user.id);
    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, branch: user.branch,
        must_change_password: !!user.must_change_password,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Login failed" });
  }
});

router.post("/change-password", authRequired, async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!new_password || new_password.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });
    const user = await selectOne("users", { id: req.user.id });
    if (!user) return res.status(404).json({ error: "Account not found" });
    if (!current_password || !bcrypt.compareSync(current_password, user.password_hash || "")) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    await update("users", { id: user.id }, {
      password_hash: bcrypt.hashSync(new_password, 8),
      must_change_password: false,
      updated_at: new Date().toISOString(),
    });
    await audit(user.email, "CHANGE_PASSWORD", user.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Could not change password" });
  }
});

router.post("/logout", (_req, res) => res.json({ ok: true }));
router.post("/forgot-password", (_req, res) => res.json({ ok: true }));
router.post("/reset-password", (_req, res) => res.json({ ok: true }));
router.get("/me", authRequired, (req, res) => res.json({ user: req.user }));

module.exports = router;
