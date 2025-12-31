const API_BASE = '/api/auth';

// --- Helper Functions ---
function showAlert(message, type = 'info') {
    // Simple alert for now, could be enhanced with a custom modal later
    alert(message);
}

// --- Registration Logic ---
async function handleRegister(event) {
    event.preventDefault();

    const form = event.target;
    // Extract values based on assumed input order or logic since IDs weren't strictly standard in HTML yet
    // But we will be adding IDs to inputs in the HTML modification step.
    // For robustness, let's use querySelector within the form
    const nameInput = form.querySelector('input[placeholder="John Doe"]');
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const majorInput = form.querySelector('input[placeholder="e.g. Computer Science"]');

    const payload = {
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        major: majorInput.value
    };

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } else {
            showAlert(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration Error:', error);
        showAlert('An error occurred. Please try again.', 'error');
    }
}

// --- Login Logic ---
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');

    const payload = {
        email: emailInput.value,
        password: passwordInput.value
    };

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            // Save user info
            localStorage.setItem('user', JSON.stringify(data.user));
            showAlert('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html'; // Or dashboard
            }, 500);
        } else {
            showAlert(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login Error:', error);
        showAlert('Server connection failed', 'error');
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});
