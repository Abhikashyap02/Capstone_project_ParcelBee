document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');

    const emailError = document.getElementById('emailError');

    // Validate email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validateEmail() {
        const email = emailInput.value.trim();
        if (!isValidEmail(email)) {
            emailError.classList.remove('hidden');
            emailInput.classList.add('border-red-500');
            return false;
        }
        emailError.classList.add('hidden');
        emailInput.classList.remove('border-red-500');
        return true;
    }

    emailInput.addEventListener('input', () => {
        if (!emailError.classList.contains('hidden')) {
            emailError.classList.add('hidden');
            emailInput.classList.remove('border-red-500');
        }
    });

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        eyeIcon.classList.toggle('hidden');
        eyeOffIcon.classList.toggle('hidden');
    });

    // Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateEmail()) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = document.getElementById('remember').checked;

        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        // Loading state
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;
        submitButton.classList.add('opacity-75');

        // Use API_BASE_URL from api.js if available, otherwise fallback
        const apiBaseUrl = (typeof window !== 'undefined' && window.API) 
          ? window.API.BASE_URL 
          : 'http://127.0.0.1:8000/api';

        try {
            const response = await fetch(`${apiBaseUrl}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok && result.token && result.user) {
                // Save JWT using API utility if available
                if (typeof window !== 'undefined' && window.API && window.API.setToken) {
                    window.API.setToken(result.token, remember);
                } else {
                    // Fallback to manual storage
                    if (remember) {
                        localStorage.setItem('token', result.token);
                        sessionStorage.removeItem('token');
                    } else {
                        sessionStorage.setItem('token', result.token);
                        localStorage.removeItem('token');
                    }
                }

                // Redirect based on role
                if (result.user.role === 'customer') {
                    window.location.href = 'dashboard.html';
                } else if (result.user.role === 'partner') {
                    window.location.href = 'partner.html';
                } else if (result.user.role === 'admin') {
                    window.location.href = 'admin_dashboard.html';
                } else {
                    // Unknown role, redirect to login
                    alert('Unknown user role. Please contact support.');
                }
            } else {
                // Handle error response
                let errorMessage = 'Login failed. Please check your credentials.';
                
                if (response.status === 401) {
                    errorMessage = result.error || 'Invalid email or password. Please try again.';
                } else if (result.error) {
                    errorMessage = result.error;
                } else if (result.message) {
                    errorMessage = result.message;
                }
                
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Show user-friendly error message
            if (error.message) {
                alert(`Error: ${error.message}`);
            } else {
                alert('Network error. Please check your connection and ensure the backend server is running.');
            }
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-75');
        }
    });
});
