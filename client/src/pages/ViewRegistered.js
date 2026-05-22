// It seeds the demo if the local storage is empty
function seedIfEmpty() {
  const existing = JSON.parse(localStorage.getItem("ecocycle_pickers") || "[]");
  if (existing.length > 0) return;
  const demo = [
    {
      id: "EC-0001",
      name: "John Mthembu",
      phone: "071 234 5678",
      zone: "Zone A — Johannesburg CBD",
      material: "Plastic (PET)",
      address: "123 Main St, Johannesburg",
      payment: "Cash",
      notes: "Very reliable",
      gender: "Male",
      idnum: "",
      dob: "",
      bankaccount: "",
      joined: "2025-01-15",
      kg: 142,
      transactions: 12,
      earnings: 426,
    },
    {
      id: "EC-0002",
      name: "Sarah Ndlovu",
      phone: "082 345 6789",
      zone: "Zone B — Soweto",
      material: "Paper / Cardboard",
      address: "45 Vilakazi St, Soweto",
      payment: "Mobile Money",
      notes: "",
      gender: "Female",
      idnum: "",
      dob: "",
      bankaccount: "",
      joined: "2025-02-03",
      kg: 88,
      transactions: 8,
      earnings: 176,
    },
    {
      id: "EC-0003",
      name: "David Zuma",
      phone: "060 456 7890",
      zone: "Zone C — Sandton",
      material: "Metal (Aluminium)",
      address: "7 Rivonia Rd, Sandton",
      payment: "Bank Transfer",
      notes: "",
      gender: "Male",
      idnum: "",
      dob: "",
      bankaccount: "",
      joined: "2025-02-18",
      kg: 118,
      transactions: 9,
      earnings: 826,
    },
    {
      id: "EC-0004",
      name: "Nomsa Dlamini",
      phone: "073 567 8901",
      zone: "Zone A — Johannesburg CBD",
      material: "Glass",
      address: "88 Bree St, Johannesburg",
      payment: "Cash",
      notes: "Prefers morning drop-offs",
      gender: "Female",
      idnum: "",
      dob: "",
      bankaccount: "",
      joined: "2025-03-01",
      kg: 97,
      transactions: 7,
      earnings: 194,
    },
    {
      id: "EC-0005",
      name: "Bongani Nkosi",
      phone: "064 678 9012",
      zone: "Zone D — Alexandra",
      material: "Plastic (HDPE)",
      address: "12 London Rd, Alexandra",
      payment: "Cash",
      notes: "",
      gender: "Male",
      idnum: "",
      dob: "",
      bankaccount: "",
      joined: "2025-03-20",
      kg: 76,
      transactions: 6,
      earnings: 304,
    },
  ];
  localStorage.setItem("ecocycle_pickers", JSON.stringify(demo));
}

seedIfEmpty();

function getPickers() {
  return JSON.parse(localStorage.getItem("ecocycle_pickers") || "[]");
}

function savePickers(arr) {
  localStorage.setItem("ecocycle_pickers", JSON.stringify(arr));
}

function updateStats(pickers) {
  document.getElementById("stat-total").textContent = pickers.length;
  document.getElementById("stat-active").textContent = Math.min(
    pickers.length,
    Math.ceil(pickers.length * 0.75),
  );
  const kg = pickers.reduce((s, p) => s + (p.kg || 0), 0);
  const earn = pickers.reduce((s, p) => s + (p.earnings || 0), 0);
  document.getElementById("stat-kg").textContent = kg.toLocaleString() + " kg";
  document.getElementById("stat-earnings").textContent =
    "R " + earn.toLocaleString();
}

function renderTable() {
  const pickers = getPickers();
  const search = document.getElementById("search-input").value.toLowerCase();
  const zone = document.getElementById("zone-filter").value;

  const filtered = pickers.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search) ||
      p.id.toLowerCase().includes(search) ||
      (p.zone || "").toLowerCase().includes(search);
    const matchZone = !zone || p.zone === zone;
    return matchSearch && matchZone;
  });

  updateStats(pickers);
  document.getElementById("count-badge").textContent =
    filtered.length + (filtered.length === 1 ? " picker" : " pickers");

  const tbody = document.getElementById("pickers-tbody");
  const empty = document.getElementById("empty-state");
  const table = tbody.closest("table");

  if (filtered.length === 0) {
    table.style.display = "none";
    empty.classList.remove("hidden");
    return;
  }

  table.style.display = "";
  empty.classList.add("hidden");

  const statuses = ["Active", "Active", "Active", "Pending", "Active"];
  const statusClass = {
    Active: "badge-green",
    Pending: "badge-amber",
    Inactive: "badge-blue",
  };

  tbody.innerHTML = filtered
    .map((p, i) => {
      const initials = p.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      const status = statuses[i % statuses.length];
      return `
      <tr>
        <td>
          <div class="picker-cell">
            <div class="picker-avatar">${initials}</div>
            <div>
              <div class="picker-cell-name">${p.name}</div>
              <div class="picker-cell-id">${p.id}</div>
            </div>
          </div>
        </td>
        <td>${p.zone || "—"}</td>
        <td>${p.material || "—"}</td>
        <td>${p.phone || "—"}</td>
        <td>${p.joined || "—"}</td>
        <td><span class="badge ${statusClass[status]}">${status}</span></td>
        <td>
          <button class="action-btn" onclick="viewPicker('${p.id}')">View</button>
          <button class="action-btn del" onclick="removePicker('${p.id}')">Remove</button>
        </td>
      </tr>
    `;
    })
    .join("");
}
//Views the pickers and other information

function viewPicker(id) {
  const p = getPickers().find((x) => x.id === id);
  if (!p) return;
  document.getElementById("modal-name").textContent = p.name;
  document.getElementById("m-id").textContent = p.id;
  document.getElementById("m-joined").textContent = p.joined || "—";
  document.getElementById("m-phone").textContent = p.phone || "—";
  document.getElementById("m-gender").textContent = p.gender || "—";
  document.getElementById("m-zone").textContent = p.zone || "—";
  document.getElementById("m-material").textContent = p.material || "—";
  document.getElementById("m-payment").textContent = p.payment || "—";
  document.getElementById("m-kg").textContent = (p.kg || 0) + " kg";
  document.getElementById("m-address").textContent = p.address || "—";
  document.getElementById("m-notes").textContent = p.notes || "—";
  document.getElementById("view-modal").classList.add("open");
}

function closeModal() {
  document.getElementById("view-modal").classList.remove("open");
}

function removePicker(id) {
  if (!confirm("Are you sure you want to remove this picker?")) return;
  let pickers = getPickers();
  const name = pickers.find((p) => p.id === id)?.name || "Picker";
  pickers = pickers.filter((p) => p.id !== id);
  savePickers(pickers);
  renderTable();
  showToast("🗑️ " + name + " removed");
}

document.getElementById("view-modal").addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

function showToast(msg) {
  const t = document.getElementById("toast");
  document.getElementById("toast-msg").textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

// Add anything that is hidden
document.head.insertAdjacentHTML(
  "beforeend",
  "<style>.hidden{display:none!important}</style>",
);

renderTable();
