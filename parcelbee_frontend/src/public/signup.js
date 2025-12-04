document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");
  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const roleSelect = document.getElementById("role");

  // Error elements
  const fullNameError = document.getElementById("fullNameError");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const confirmPasswordError = document.getElementById("confirmPasswordError");
  const roleError = document.getElementById("roleError");

  // Password visibility toggles
  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById(
    "toggleConfirmPassword"
  );
  const eyeIcon = document.getElementById("eyeIcon");
  const eyeOffIcon = document.getElementById("eyeOffIcon");
  const eyeIcon2 = document.getElementById("eyeIcon2");
  const eyeOffIcon2 = document.getElementById("eyeOffIcon2");

  // Password visibility toggle for main password
  togglePassword.addEventListener("click", function () {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    if (type === "text") {
      eyeIcon.classList.add("hidden");
      eyeOffIcon.classList.remove("hidden");
    } else {
      eyeIcon.classList.remove("hidden");
      eyeOffIcon.classList.add("hidden");
    }
  });

  // Password visibility toggle for confirm password
  toggleConfirmPassword.addEventListener("click", function () {
    const type =
      confirmPasswordInput.getAttribute("type") === "password"
        ? "text"
        : "password";
    confirmPasswordInput.setAttribute("type", type);

    if (type === "text") {
      eyeIcon2.classList.add("hidden");
      eyeOffIcon2.classList.remove("hidden");
    } else {
      eyeIcon2.classList.remove("hidden");
      eyeOffIcon2.classList.add("hidden");
    }
  });

  // Email validation function
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Full name validation function
  function isValidFullName(name) {
    return name.trim().length >= 2 && name.trim().includes(" ");
  }

  // Real-time validation functions
  function validateFullName() {
    const name = fullNameInput.value.trim();
    if (name && !isValidFullName(name)) {
      fullNameError.textContent =
        "Please enter your full name (first and last name)";
      fullNameError.classList.remove("hidden");
      fullNameInput.classList.add("border-red-500");
      fullNameInput.classList.remove("border-gray-300");
      return false;
    } else {
      fullNameError.classList.add("hidden");
      fullNameInput.classList.remove("border-red-500");
      fullNameInput.classList.add("border-gray-300");
      return true;
    }
  }

  function validateEmail() {
    const email = emailInput.value.trim();
    if (email && !isValidEmail(email)) {
      emailError.classList.remove("hidden");
      emailInput.classList.add("border-red-500");
      emailInput.classList.remove("border-gray-300");
      return false;
    } else {
      emailError.classList.add("hidden");
      emailInput.classList.remove("border-red-500");
      emailInput.classList.add("border-gray-300");
      return true;
    }
  }

  function validatePassword() {
    const password = passwordInput.value;
    if (password && password.length < 6) {
      passwordError.classList.remove("hidden");
      passwordInput.classList.add("border-red-500");
      passwordInput.classList.remove("border-gray-300");
      return false;
    } else {
      passwordError.classList.add("hidden");
      passwordInput.classList.remove("border-red-500");
      passwordInput.classList.add("border-gray-300");
      return true;
    }
  }

  function validateConfirmPassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    if (confirmPassword && password !== confirmPassword) {
      confirmPasswordError.classList.remove("hidden");
      confirmPasswordInput.classList.add("border-red-500");
      confirmPasswordInput.classList.remove("border-gray-300");
      return false;
    } else {
      confirmPasswordError.classList.add("hidden");
      confirmPasswordInput.classList.remove("border-red-500");
      confirmPasswordInput.classList.add("border-gray-300");
      return true;
    }
  }

  function validateRole() {
    const role = roleSelect.value;
    if (!role) {
      roleError.classList.remove("hidden");
      roleSelect.classList.add("border-red-500");
      roleSelect.classList.remove("border-gray-300");
      return false;
    } else {
      roleError.classList.add("hidden");
      roleSelect.classList.remove("border-red-500");
      roleSelect.classList.add("border-gray-300");
      return true;
    }
  }

  // Real-time validation event listeners
  fullNameInput.addEventListener("blur", validateFullName);
  emailInput.addEventListener("blur", validateEmail);
  passwordInput.addEventListener("blur", validatePassword);
  confirmPasswordInput.addEventListener("blur", validateConfirmPassword);
  roleSelect.addEventListener("change", validateRole);

  // Also validate confirm password when main password changes
  passwordInput.addEventListener("input", function () {
    if (confirmPasswordInput.value) {
      validateConfirmPassword();
    }
    if (!passwordError.classList.contains("hidden")) {
      validatePassword();
    }
  });

  // Clear errors on input
  fullNameInput.addEventListener("input", function () {
    if (!fullNameError.classList.contains("hidden")) {
      fullNameError.classList.add("hidden");
      this.classList.remove("border-red-500");
      this.classList.add("border-gray-300");
    }
  });

  emailInput.addEventListener("input", function () {
    if (!emailError.classList.contains("hidden")) {
      emailError.classList.add("hidden");
      this.classList.remove("border-red-500");
      this.classList.add("border-gray-300");
    }
  });

  passwordInput.addEventListener("input", function () {
    if (!passwordError.classList.contains("hidden")) {
      passwordError.classList.add("hidden");
      this.classList.remove("border-red-500");
      this.classList.add("border-gray-300");
    }
  });

  confirmPasswordInput.addEventListener("input", function () {
    if (!confirmPasswordError.classList.contains("hidden")) {
      confirmPasswordError.classList.add("hidden");
      this.classList.remove("border-red-500");
      this.classList.add("border-gray-300");
    }
  });

  // Form submission
  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const role = roleSelect.value;

    let isValid = true;

    // Validate full name
    if (!fullName) {
      fullNameError.textContent = "Full name is required";
      fullNameError.classList.remove("hidden");
      fullNameInput.classList.add("border-red-500");
      isValid = false;
    } else if (!isValidFullName(fullName)) {
      fullNameError.textContent =
        "Please enter your full name (first and last name)";
      fullNameError.classList.remove("hidden");
      fullNameInput.classList.add("border-red-500");
      isValid = false;
    }

    // Validate email
    if (!email) {
      emailError.textContent = "Email is required";
      emailError.classList.remove("hidden");
      emailInput.classList.add("border-red-500");
      isValid = false;
    } else if (!isValidEmail(email)) {
      emailError.textContent = "Please enter a valid email address";
      emailError.classList.remove("hidden");
      emailInput.classList.add("border-red-500");
      isValid = false;
    }

    // Validate password
    if (!password) {
      passwordError.textContent = "Password is required";
      passwordError.classList.remove("hidden");
      passwordInput.classList.add("border-red-500");
      isValid = false;
    } else if (password.length < 6) {
      passwordError.textContent = "Password must be at least 6 characters";
      passwordError.classList.remove("hidden");
      passwordInput.classList.add("border-red-500");
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      confirmPasswordError.textContent = "Please confirm your password";
      confirmPasswordError.classList.remove("hidden");
      confirmPasswordInput.classList.add("border-red-500");
      isValid = false;
    } else if (password !== confirmPassword) {
      confirmPasswordError.textContent = "Passwords do not match";
      confirmPasswordError.classList.remove("hidden");
      confirmPasswordInput.classList.add("border-red-500");
      isValid = false;
    }

    // Validate role
    if (!role) {
      roleError.classList.remove("hidden");
      roleSelect.classList.add("border-red-500");
      isValid = false;
    }

    // If validation passes, proceed with registration
    if (isValid) {
      // Add loading state to button
      const submitButton = signupForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = "Creating Account...";
      submitButton.disabled = true;
      submitButton.classList.add("opacity-75");

        // Use API_BASE_URL from api.js if available, otherwise fallback
        const apiBaseUrl = (typeof window !== 'undefined' && window.API) 
          ? window.API.BASE_URL 
          : 'http://127.0.0.1:8000/api';

        fetch(`${apiBaseUrl}/register/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: fullName,
            email: email,
            password: password,
            role: role,
          }),
        })
          .then(async (response) => {
            const data = await response.json();
            
            if (response.ok && data.token && data.user) {
              // Store token using API utility if available
              if (typeof window !== 'undefined' && window.API && window.API.setToken) {
                window.API.setToken(data.token, true); // Store in localStorage (persistent)
              } else {
                localStorage.setItem("token", data.token);
              }

              // Show success message
              alert(
                `Account created successfully!\nWelcome ${data.user.name}!\nEmail: ${data.user.email}\n\nPlease login to continue.`
              );

              // Redirect to login page after successful registration
              window.location.href = 'login.html';
            } else {
              // Handle error response
              const errorMessage = data.error || data.message || "Registration failed. Please try again.";
              alert(`Error: ${errorMessage}`);
              
              // Reset button state
              submitButton.textContent = originalText;
              submitButton.disabled = false;
              submitButton.classList.remove("opacity-75");
            }
          })
          .catch((error) => {
            console.error("Registration error:", error);
            
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            submitButton.classList.remove("opacity-75");
            
            // Show user-friendly error message
            if (error.message) {
              alert(`Error: ${error.message}`);
            } else {
              alert("Network error. Please check your connection and ensure the backend server is running.");
            }
          });
    }
  });

  // Add smooth focus animations
  const inputs = [
    fullNameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
    roleSelect,
  ];
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.classList.add("transform", "scale-105");
    });

    input.addEventListener("blur", function () {
      this.parentElement.classList.remove("transform", "scale-105");
    });
  });

  // Add click animation to signup button
  const signupButton = signupForm.querySelector('button[type="submit"]');
  signupButton.addEventListener("mousedown", function () {
    this.style.transform = "scale(0.98)";
  });

  signupButton.addEventListener("mouseup", function () {
    this.style.transform = "scale(1)";
  });

  signupButton.addEventListener("mouseleave", function () {
    this.style.transform = "scale(1)";
  });
});
