const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const username = event.target.username.value;
  const password = event.target.password.value;
  // Authenticate user with username and password here
});

window.location.href = 'https://digilens.netlify.app/'; // Replace '/' with the URL of your app's homepage
