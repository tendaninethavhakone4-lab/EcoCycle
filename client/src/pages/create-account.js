const signupForm = document.getElementById('signupForm');

signupForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevents the page from refreshing

    const name = document.getElementById('fullname').value;
    const email = document.getElementById('workEmail').value;

    console.log("Account Creation:", name, email);
    alert("Account created for: " + name);
});