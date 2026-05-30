  const API_BASE = 'http://localhost:3000';

  function getToken() {
  return localStorage.getItem('ecocycle_token');
}

function getUser() {
  return JSON.parse(localStorage.getItem('ecocycle_user') || '{}');
}

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
  
  async function changePassword() {
  const currentPwd = document.getElementById('currentPwd').value;
  const newPwd     = document.getElementById('newPwd').value;

  if (!currentPwd || !newPwd) {
    toast('⚠️', 'Missing fields', 'Please fill in both password fields.');
    return;
  }

  if (newPwd.length < 8) {
    toast('⚠️', 'Password too short', 'New password must be at least 8 characters.');
    return;
  }

  const btn = document.querySelector('button[onclick="changePassword()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

try {
    const response = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        currentPassword: currentPwd,
        newPassword:     newPwd,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast('❌', 'Error', data.error || 'Failed to change password.');
      return;
    }

    document.getElementById('currentPwd').value = '';
    document.getElementById('newPwd').value     = '';
    updateStrength('');

    toast('✅', 'Password Changed', 'Your password has been updated successfully!');

  } catch (err) {
    toast('❌', 'Connection Error', 'Could not connect to the server. Please try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Save Password'; }
  }
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
  
function loadUserInfo() {
  const user = getUser();
  if (!user) return;
  const nameField  = document.getElementById('profileName');
  const emailField = document.getElementById('profileEmail');
  if (nameField)  nameField.value  = user.name  || '';
  if (emailField) emailField.value = user.email || '';
}

document.addEventListener('DOMContentLoaded', loadUserInfo);
