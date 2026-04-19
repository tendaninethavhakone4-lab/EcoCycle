// Switch active nav item on click
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    navItems.forEach(n => n.classList.remove('active'));
    this.classList.add('active');
  });
});

// Logout button
const logoutBtn = document.querySelector('.logout-btn');

logoutBtn.addEventListener('click', function() {
  alert('You have been logged out.');
});

