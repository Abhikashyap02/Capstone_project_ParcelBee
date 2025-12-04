document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    const devTokenDisplay = document.getElementById('devTokenDisplay');
    const resetToken = document.getElementById('resetToken');

    // Email validation
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

    emailInput.addEventListener('blur', validateEmail);
    emailInput.addEventListener('input', function() {
        if (!emailError.classList.contains('hidden')) {
            emailError.classList.add('hidden');
            emailInput.classList.remove('border-red-500');
        }
    });

    // Form submission
    forgotPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateEmail()) return;

        const email = emailInput.value.trim();
        const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        // Loading state
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        submitButton.classList.add('opacity-75');

        // Hide previous messages
        successMessage.classList.add('hidden');
        devTokenDisplay.classList.add('hidden');

        // API Base URL
        const apiBaseUrl = (typeof window !== 'undefined' && window.API) 
            ? window.API.BASE_URL 
            : 'http://127.0.0.1:8000/api';

        try {
            const response = await fetch(`${apiBaseUrl}/password/forgot/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                successText.textContent = data.message || 'Password reset instructions have been sent to your email.';
                successMessage.classList.remove('hidden');

                // In development mode, show token
                if (data.reset_token) {
                    resetToken.textContent = data.reset_token;
                    devTokenDisplay.classList.remove('hidden');
                    
                    // Store token in sessionStorage for easy access
                    sessionStorage.setItem('reset_token', data.reset_token);
                }

                // Clear form
                emailInput.value = '';
            } else {
                // Show error
                alert(data.error || 'Failed to send reset instructions. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Network error. Please check your connection and ensure the backend server is running.');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-75');
        }
    });
});

