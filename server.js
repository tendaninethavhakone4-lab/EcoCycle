const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(require("path").join(__dirname, "..", "frontend"))); // serves the HTML pages

// Routes
app.use("/api/auth",         require("./routes/auth"));
app.use("/api/users",        require("./routes/users"));
app.use("/api/pickers",      require("./routes/pickers"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/prices",       require("./routes/prices"));
app.use("/api/inventory",    require("./routes/inventory"));
app.use("/api/sales",        require("./routes/sales"));
app.use("/api/income",       require("./routes/income"));
app.use("/api/payouts",      require("./routes/payouts"));
app.use("/api/analytics",    require("./routes/analytics"));
app.use("/api/impact",       require("./routes/impact"));
app.use("/api/reports",      require("./routes/reports"));
app.use("/api/support",      require("./routes/support"));
app.use("/api/alerts",       require("./routes/alerts"));
app.use("/api/audit",        require("./routes/audit"));
app.use("/api/branches",     require("./routes/branches"));
app.use("/api/insights",     require("./routes/insights"));
app.use("/api/settings",     require("./routes/settings"));
app.use("/api/logistics",    require("./routes/logistics"));

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// 404 for unknown API paths only
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ EcoCycle API listening on http://localhost:${PORT}`);
  console.log(`   Frontend: open http://localhost:${PORT}/AuthScreens/LandingPage.html`);
});
