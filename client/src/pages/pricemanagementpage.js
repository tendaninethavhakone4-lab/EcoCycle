// === DATA ===
const materials = [
  { id: 'plastic',   name: 'Plastic',   price: 12 },
  { id: 'paper',     name: 'Paper',     price: 8  },
  { id: 'metal',     name: 'Metal',     price: 25 },
  { id: 'glass',     name: 'Glass',     price: 6  },
  { id: 'cardboard', name: 'Cardboard', price: 10 },
];

// === RENDER ROWS ===
function renderPriceList() {
  const container = document.getElementById('price-list');
  container.innerHTML = '';

  materials.forEach(mat => {
    const row = document.createElement('div');
    row.className = 'price-row';

    row.innerHTML = `
      <div class="material-icon">$</div>
      <div class="material-info">
        <p class="material-name">${mat.name}</p>
        <p class="material-sub">Price per kilogram</p>
      </div>
      <div class="price-input-group">
        <span class="currency-label">R</span>
        <input
          class="price-input"
          type="number"
          id="price-${mat.id}"
          value="${mat.price}"
          min="0"
          step="1"
        />
        <span class="unit-label">/ kg</span>
      </div>
    `;

    container.appendChild(row);
  });
}

// === SAVE HANDLER ===
function saveChanges() {
  const updated = materials.map(mat => {
    const input = document.getElementById(`price-${mat.id}`);
    const newPrice = parseFloat(input.value);
    return { ...mat, price: isNaN(newPrice) ? mat.price : newPrice };
  });

  // Log to console (replace with API call in production)
  console.log('Saved prices:', updated);

  // User feedback
  const btn = document.querySelector('.save-btn');
  btn.textContent = '✓ Changes Saved!';
  setTimeout(() => { btn.textContent = 'Save Changes'; }, 2000);
}

// === INIT ===
renderPriceList();