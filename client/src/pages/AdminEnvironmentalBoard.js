/* ── app.js – Environmental Dashboard ────────────────────────── */
 
document.addEventListener("DOMContentLoaded", () => {
 
  /* ── 1. MATERIAL COLLECTION TRENDS CHART ─────────────────── */
 
  const labels = ["Jan", "Feb", "Mar", "Apr"];
 
  // Approximate data from the screenshot (kg values → hundreds for clarity)
  const plasticData  = [1200, 1300, 1500, 5000];
  const paperData    = [1000, 1100, 1200, 1900];
  const metalData    = [3000, 3000, 3000, 3200];
 
  const ctx = document.getElementById("trendsChart").getContext("2d");
 
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Plastic (kg)",
          data: plasticData,
          borderColor: "#3a9e3f",
          backgroundColor: "rgba(58,158,63,0.08)",
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: "#3a9e3f",
          tension: 0.3,
          fill: false,
        },
        {
          label: "Paper (kg)",
          data: paperData,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245,158,11,0.08)",
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: "#f59e0b",
          tension: 0.3,
          fill: false,
        },
        {
          label: "Metal (kg)",
          data: metalData,
          borderColor: "#6b7280",
          backgroundColor: "rgba(107,114,128,0.08)",
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: "#6b7280",
          tension: 0.3,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "line",
            font: { family: "DM Sans", size: 12 },
            color: "#7a7a7a",
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#1a1a1a",
          bodyColor: "#7a7a7a",
          borderColor: "#ebebeb",
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "Sora", weight: "700" },
          bodyFont: { family: "DM Sans" },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { family: "DM Sans", size: 12 },
            color: "#7a7a7a",
          },
        },
        y: {
          grid: { color: "#f0f0f0" },
          border: { display: false, dash: [4, 4] },
          ticks: {
            font: { family: "DM Sans", size: 12 },
            color: "#7a7a7a",
            callback: (v) => v.toLocaleString(),
          },
          min: 0,
          suggestedMax: 5500,
        },
      },
    },
  });
 
  /* ── 2. SIDEBAR NAV – active state on click ───────────────── */
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
      item.classList.add("active");
    });
  });
 
  /* ── 3. LOGOUT button ─────────────────────────────────────── */
  document.querySelector(".topbar-logout").addEventListener("click", () => {
    if (confirm("Are you sure you want to log out?")) {
      alert("Logged out successfully.");
    }
  });
 
});