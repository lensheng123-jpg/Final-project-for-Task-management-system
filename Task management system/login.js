document.addEventListener('DOMContentLoaded', function() {
// Wait for Firebase to be ready
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
initLogin();
} else {
document.addEventListener('firebase-ready', initLogin);
}
});

function initLogin() {
console.log('Initializing login...');

// DOM elements
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const toggleLoginPassword = document.getElementById('toggleLoginPassword');
const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
const authMessage = document.getElementById('authMessage');

// Check if elements exist
if (!loginForm || !registerForm) {
console.error('Login form elements not found');
return;
}

// Tab switching
if (loginTab) loginTab.addEventListener('click', () => switchTab('login'));
if (registerTab) registerTab.addEventListener('click', () => switchTab('register'));
if (switchToRegister) switchToRegister.addEventListener('click', (e) => {
e.preventDefault();
switchTab('register');
});
if (switchToLogin) switchToLogin.addEventListener('click', (e) => {
e.preventDefault();
switchTab('login');
});

// Password visibility toggle
if (toggleLoginPassword) {
toggleLoginPassword.addEventListener('click', () => {
const passwordInput = document.getElementById('loginPassword');
const icon = toggleLoginPassword.querySelector('i');
togglePasswordVisibility(passwordInput, icon);
});
}

if (toggleRegisterPassword) {
toggleRegisterPassword.addEventListener('click', () => {
const passwordInput = document.getElementById('registerPassword');
const icon = toggleRegisterPassword.querySelector('i');
togglePasswordVisibility(passwordInput, icon);
});
}

// Login form submission
loginForm.addEventListener('submit', async (e) => {
e.preventDefault();
const email = document.getElementById('loginEmail').value;
const password = document.getElementById('loginPassword').value;

showMessage('Logging in...', 'loading');

try {
await auth.signInWithEmailAndPassword(email, password);
showMessage('Login successful! Redirecting...', 'success');
setTimeout(() => {
window.location.href = 'index.html';
}, 1500);
} catch (error) {
showMessage(`Login failed: ${error.message}`, 'error');
}
});

// Register form submission
registerForm.addEventListener('submit', async (e) => {
e.preventDefault();
const email = document.getElementById('registerEmail').value;
const password = document.getElementById('registerPassword').value;
const confirmPassword = document.getElementById('confirmPassword').value;

if (password.length < 6) {
showMessage('Password must be at least 6 characters long', 'error');
return;
}

if (password !== confirmPassword) {
showMessage('Passwords do not match', 'error');
return;
}

showMessage('Creating account...', 'loading');

try {
// Create user account
await auth.createUserWithEmailAndPassword(email, password);

// Sign out immediately after registration
await auth.signOut();

showMessage('Account created successfully! Please login with your credentials.', 'success');

// Switch to login tab
switchTab('login');

// Clear registration form but keep email
document.getElementById('registerPassword').value = '';
document.getElementById('confirmPassword').value = '';

} catch (error) {
showMessage(`Registration failed: ${error.message}`, 'error');
}
});
}

function switchTab(tab) {
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');

// Clear any messages
if (authMessage) {
authMessage.textContent = '';
authMessage.className = 'auth-message';
}

if (tab === 'login') {
if (loginTab) loginTab.classList.add('active');
if (registerTab) registerTab.classList.remove('active');
if (loginForm) loginForm.classList.add('active');
if (registerForm) registerForm.classList.remove('active');
} else {
if (loginTab) loginTab.classList.remove('active');
if (registerTab) registerTab.classList.add('active');
if (loginForm) loginForm.classList.remove('active');
if (registerForm) registerForm.classList.add('active');
}
}

function togglePasswordVisibility(input, icon) {
if (!input || !icon) return;

if (input.type === 'password') {
input.type = 'text';
icon.classList.remove('fa-eye');
icon.classList.add('fa-eye-slash');
} else {
input.type = 'password';
icon.classList.remove('fa-eye-slash');
icon.classList.add('fa-eye');
}
}

function showMessage(message, type) {
const authMessage = document.getElementById('authMessage');
if (!authMessage) return;

authMessage.textContent = message;
authMessage.className = `auth-message ${type}`;
}


