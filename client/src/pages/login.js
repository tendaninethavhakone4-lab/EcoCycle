const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', function(event) {
    event.preventDefault(); // this Prevents the page from refreshing

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log("Login Attempt:", email, password);
    alert("Signing in with: " + email);
});