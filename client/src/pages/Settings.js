  let pendingAction = null;
 
  function showSection(id, el) {
    document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('visible'));
    document.querySelectorAll('.snav-item').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + id).classList.add('visible');
    el.classList.add('active');
  }
 
  function toast(icon, title, msg) {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="toast-icon">${icon}</span><div class="toast-body"><strong>${title}</strong><span>${msg}</span></div>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
 
  function setSwatch(el) {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    toast('🎨', 'Accent colour changed', 'Theme will apply on save');
    if (el.dataset.color) document.documentElement.style.setProperty('--accent', el.dataset.color);
    else document.documentElement.style.removeProperty('--accent');
  }
 
  function updateStrength(val) {
    const segs = ['s1','s2','s3','s4'];
    const colors = ['#f44336','#ff9800','#ffc107','#4caf50'];
    const labels = ['Too short','Weak','Medium','Strong!'];
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    segs.forEach((id, i) => {
      document.getElementById(id).style.background = i < score ? colors[score-1] : '#e0e8e0';
    });
    document.getElementById('strengthLabel').textContent = val.length === 0 ? 'Enter a new password' : labels[Math.max(0, score-1)];
  }
  
 
  function confirmAction(action, title, desc) {
    pendingAction = action;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalDesc').textContent = desc;
    document.getElementById('confirmModal').style.display = 'flex';
  }
 
  function executeAction() {
    document.getElementById('confirmModal').style.display = 'none';
    if (pendingAction === 'delete') toast('🗑️', 'Account Deletion Requested', 'Contact support to complete this process.');
    else if (pendingAction === 'deactivate') toast('😴', 'Account Deactivated', 'Your account has been suspended.');
    else if (pendingAction === 'reset-rewards') toast('🔄', 'Rewards Reset', 'All XP and badges have been cleared.');
    pendingAction = null;
  }