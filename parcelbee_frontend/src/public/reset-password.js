document.addEventListener('DOMContentLoaded', function() {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const tokenInput = document.getElementById('token');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');

    // Check if token is in URL or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const tokenFromStorage = sessionStorage.getItem('reset_token');

    if (tokenFromUrl) {
        tokenInput.value = tokenFromUrl;
        tokenInput.readOnly = true;
        tokenInput.classList.add('bg-gray-100');
    } else if (tokenFromStorage) {
        tokenInput.value = tokenFromStorage;
    }

    // Password visibility toggles
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');
    const eyeIcon2 = document.getElementById('eyeIcon2');
    const eyeOffIcon2 = document.getElementById('eyeOffIcon2');

    togglePassword.addEventListener('click', function() {
        const type = newPasswordInput.type === 'password' ? 'text' : 'password';
        newPasswordInput.type = type;
        eyeIcon.classList.toggle('hidden');
        eyeOffIcon.classList.toggle('hidden');
    });

    toggleConfirmPassword.addEventListener('click', function() {
        const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
        confirmPasswordInput.type = type;
        eyeIcon2.classList.toggle('hidden');
        eyeOffIcon2.classList.toggle('hidden');
    });

    // Password validation
    function validatePassword() {
        const password = newPasswordInput.value;
        if (password && password.length < 6) {
            passwordError.classList.remove('hidden');
            newPasswordInput.classList.add('border-red-500');
            return false;
        }
        passwordError.classList.add('hidden');
        newPasswordInput.classList.remove('border-red-500');
        return true;
    }

    function validateConfirmPassword() {
        const password = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordError.classList.remove('hidden');
            confirmPasswordInput.classList.add('border-red-500');
            return false;
        }
        confirmPasswordError.classList.add('hidden');
        confirmPasswordInput.classList.remove('border-red-500');
        return true;
    }

    newPasswordInput.addEventListener('blur', validatePassword);
    confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
    newPasswordInput.addEventListener('input', function() {
        if (!passwordError.classList.contains('hidden')) {
            validatePassword();
        }
        if (confirmPasswordInput.value) {
            validateConfirmPassword();
        }
    });
    confirmPasswordInput.addEventListener('input', function() {
        if (!confirmPasswordError.classList.contains('hidden')) {
            validateConfirmPassword();
        }
    });

    // Form submission
    resetPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validatePassword() || !validateConfirmPassword()) return;

        const token = tokenInput.value.trim();
        const newPassword = newPasswordInput.value;

        if (!token) {
            alert('Reset token is required');
            return;
        }

        const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        // Loading state
        submitButton.textContent = 'Resetting...';
        submitButton.disabled = true;
        submitButton.classList.add('opacity-75');

        // Hide success message
        successMessage.classList.add('hidden');

        // API Base URL
        const apiBaseUrl = (typeof window !== 'undefined' && window.API) 
            ? window.API.BASE_URL 
            : 'http://127.0.0.1:8000/api';

        try {
            const response = await fetch(`${apiBaseUrl}/password/reset/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                successText.textContent = data.message || 'Password reset successfully! Redirecting to login...';
                successMessage.classList.remove('hidden');

                // Clear token from storage
                sessionStorage.removeItem('reset_token');

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                // Show error
                alert(data.error || 'Failed to reset password. Please check your token and try again.');
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

