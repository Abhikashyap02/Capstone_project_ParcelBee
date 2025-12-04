document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const roleInput = document.getElementById('role');
    const togglePassword = document.getElementById('togglePassword');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');

    togglePassword.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        eyeIcon.classList.toggle('hidden');
        eyeOffIcon.classList.toggle('hidden');
    });

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Reset errors
        document.querySelectorAll('.text-red-500').forEach(el => el.classList.add('hidden'));

        let valid = true;
        if (!nameInput.value.trim()) {
            document.getElementById('nameError').classList.remove('hidden');
            valid = false;
        }
        if (!emailInput.value.trim() || !isValidEmail(emailInput.value.trim())) {
            document.getElementById('emailError').classList.remove('hidden');
            valid = false;
        }
        if (!passwordInput.value || passwordInput.value.length < 6) {
            document.getElementById('passwordError').classList.remove('hidden');
            valid = false;
        }
        if (!valid) return;

        // Prepare payload
        const payload = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
            role: roleInput.value
        };

        // Use API_BASE_URL from api.js if available, otherwise fallback
        const apiBaseUrl = (typeof window !== 'undefined' && window.API) 
          ? window.API.BASE_URL 
          : 'http://127.0.0.1:8000/api';

        try {
            const res = await fetch(`${apiBaseUrl}/register/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok && data.token && data.user) {
                // Store token using API utility if available
                if (typeof window !== 'undefined' && window.API && window.API.setToken) {
                    window.API.setToken(data.token, true); // Store in localStorage (persistent)
                } else {
                    localStorage.setItem('token', data.token);
                }

                // Redirect based on user role
                if (data.user.role === 'customer') {
                    window.location.href = 'dashboard.html';
                } else if (data.user.role === 'partner') {
                    window.location.href = 'partner.html';
                } else if (data.user.role === 'admin') {
                    window.location.href = 'admin_dashboard.html';
                } else {
                    // Default redirect to login if role is unknown
                    window.location.href = 'login.html';
                }
            } else {
                // Handle error response
                const errorMessage = data.error || data.message || 'Registration failed. Please try again.';
                alert(errorMessage);
            }
        } catch (err) {
            console.error('Registration error:', err);
            
            // Show user-friendly error message
            if (err.message) {
                alert(`Error: ${err.message}`);
            } else {
                alert('Network error. Please check your connection and ensure the backend server is running.');
            }
        }
    });
});
