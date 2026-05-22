async function doReset(e){ e.preventDefault();
  const em = document.getElementById('email').value;
  try { await api("/auth/forgot-password",{method:"POST",body:{email:em}}); } catch{}
  toast("If " + em + " is registered, a reset link is on the way.");
  setTimeout(()=>location.href="LoginPage.html",1500); return false;
}