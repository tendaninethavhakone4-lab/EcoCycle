lucide.createIcons();

const materialSelect = document.getElementById('material-select');
const quantityInput = document.getElementById('quantity-input');
const totalAmountDisplay = document.getElementById('total-amount');
const form = document.getElementById('transaction-form');


function updatePayout() {
    const price = parseFloat(materialSelect.value) || 0;
    const qty = parseFloat(quantityInput.value) || 0;
    const total = price * qty;
    
    const paymentBox = document.querySelector('.payment-summary');

    if (qty > 0) {
       
        paymentBox.style.display = 'flex';
        totalAmountDisplay.innerText = `R ${total.toFixed(2)}`;
    } else {
        
        paymentBox.style.display = 'none';
    }
}

materialSelect.addEventListener('change', updatePayout);
quantityInput.addEventListener('input', updatePayout);

form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert("Transaction recorded successfully!");
    form.reset();
    totalAmountDisplay.innerText = "R 0.00";
});

document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const navLinks = document.querySelectorAll('.nav-link');

  menuToggle?.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  sidebarClose?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      
      navLinks.forEach(l => l.classList.remove('active'));
      
      link.classList.add('active');
      
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      closeSidebar();
    }
  });
});