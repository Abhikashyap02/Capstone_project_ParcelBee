# Phase 1 Testing Guide - Authentication & Foundation

## Prerequisites

1. **Backend Server Running**:
   ```bash
   cd parcelbee_backend
   python manage.py runserver
   ```
   - Server should be running on `http://127.0.0.1:8000`
   - Verify by visiting `http://127.0.0.1:8000/admin/` (should show Django admin login)

2. **Frontend Files**:
   - All HTML files should be accessible via a web server
   - You can use VS Code Live Server, Python's http.server, or any local web server
   - Example: `python -m http.server 8080` in the `parcelbee_frontend/src/public` directory

3. **Browser Console**:
   - Open Developer Tools (F12) in your browser
   - Check Console tab for any JavaScript errors
   - Check Network tab to monitor API calls

---

## Testing Checklist

### ✅ Test 1: API Utilities (api.js)

**Objective**: Verify that `api.js` is loaded and functions are accessible

**Steps**:
1. Open any HTML page (e.g., `login.html`) in browser
2. Open Browser Console (F12)
3. Type: `window.API`
4. Press Enter

**Expected Result**:
- Should show an object with properties: `BASE_URL`, `getAuthHeaders`, `getToken`, `setToken`, `clearToken`, `isAuthenticated`, `handleApiError`, `checkAuthAndRedirect`, `makeApiCall`
- `API.BASE_URL` should be `"http://127.0.0.1:8000/api"`

**Test Commands**:
```javascript
// In browser console:
window.API.BASE_URL  // Should return: "http://127.0.0.1:8000/api"
window.API.isAuthenticated()  // Should return: false (if not logged in)
window.API.getToken()  // Should return: null (if not logged in)
```

---

### ✅ Test 2: User Registration - Customer

**Objective**: Verify customer registration works and redirects correctly

**Steps**:
1. Navigate to `signup.html` or `register.html`
2. Fill in the form:
   - **Full Name**: "John Doe"
   - **Email**: "customer@test.com" (use a unique email)
   - **Password**: "test123"
   - **Confirm Password**: "test123"
   - **Role**: Select "Customer"
3. Click "Sign Up" or "Register"
4. Check browser console for any errors
5. Check Network tab for API call to `/api/register/`

**Expected Results**:
- ✅ Form validation works (try submitting empty form)
- ✅ Loading state shows ("Creating Account..." on button)
- ✅ API call is made to `http://127.0.0.1:8000/api/register/`
- ✅ Success alert shows: "Account created successfully! Welcome John Doe!"
- ✅ Token is stored in localStorage
- ✅ **Redirects to `dashboard.html`** (for customer)
- ✅ No console errors

**Verify Token Storage**:
```javascript
// In browser console after registration:
localStorage.getItem('token')  // Should return a JWT token string
window.API.getToken()  // Should return the same token
```

---

### ✅ Test 3: User Registration - Partner

**Objective**: Verify partner registration works and redirects correctly

**Steps**:
1. Navigate to `signup.html` or `register.html`
2. Fill in the form:
   - **Full Name**: "Jane Partner"
   - **Email**: "partner@test.com" (use a unique email)
   - **Password**: "test123"
   - **Confirm Password**: "test123"
   - **Role**: Select "Partner"
3. Click "Sign Up" or "Register"

**Expected Results**:
- ✅ API call succeeds
- ✅ Success alert shows with partner name
- ✅ Token is stored in localStorage
- ✅ **Redirects to `partner.html`** (for partner)
- ✅ No console errors

---

### ✅ Test 4: User Login - Customer

**Objective**: Verify customer login works with "Remember Me" functionality

**Steps**:
1. Navigate to `login.html`
2. Enter credentials:
   - **Email**: "customer@test.com" (from Test 2)
   - **Password**: "test123"
   - **Remember Me**: ✅ Checked
3. Click "Login"
4. Check browser console and Network tab

**Expected Results**:
- ✅ Loading state shows ("Logging in..." on button)
- ✅ API call is made to `http://127.0.0.1:8000/api/login/`
- ✅ Token is stored in **localStorage** (because "Remember Me" is checked)
- ✅ **Redirects to `dashboard.html`**
- ✅ No console errors

**Verify Token Storage**:
```javascript
// In browser console:
localStorage.getItem('token')  // Should have token
sessionStorage.getItem('token')  // Should be null (because Remember Me was checked)
```

---

### ✅ Test 5: User Login - Without "Remember Me"

**Objective**: Verify token is stored in sessionStorage when "Remember Me" is unchecked

**Steps**:
1. Clear browser storage (localStorage and sessionStorage)
2. Navigate to `login.html`
3. Enter credentials:
   - **Email**: "customer@test.com"
   - **Password**: "test123"
   - **Remember Me**: ❌ Unchecked
4. Click "Login"

**Expected Results**:
- ✅ Token is stored in **sessionStorage** (not localStorage)
- ✅ Redirects correctly
- ✅ Token persists until browser tab is closed

**Verify Token Storage**:
```javascript
// In browser console:
localStorage.getItem('token')  // Should be null
sessionStorage.getItem('token')  // Should have token
window.API.getToken()  // Should return token from sessionStorage
```

---

### ✅ Test 6: Login - Partner

**Objective**: Verify partner login redirects to partner dashboard

**Steps**:
1. Navigate to `login.html`
2. Enter partner credentials:
   - **Email**: "partner@test.com" (from Test 3)
   - **Password**: "test123"
3. Click "Login"

**Expected Results**:
- ✅ Login succeeds
- ✅ **Redirects to `partner.html`** (not dashboard.html)
- ✅ Token is stored correctly

---

### ✅ Test 7: Login - Invalid Credentials

**Objective**: Verify error handling for invalid credentials

**Steps**:
1. Navigate to `login.html`
2. Enter invalid credentials:
   - **Email**: "wrong@test.com"
   - **Password**: "wrongpassword"
3. Click "Login"

**Expected Results**:
- ✅ API call is made
- ✅ Error alert shows: "Invalid credentials" or similar
- ✅ Button returns to normal state
- ✅ User stays on login page (no redirect)
- ✅ No token is stored

---

### ✅ Test 8: Registration - Duplicate Email

**Objective**: Verify error handling for duplicate email registration

**Steps**:
1. Navigate to `signup.html`
2. Try to register with an email that already exists (e.g., "customer@test.com")
3. Fill form and submit

**Expected Results**:
- ✅ API call is made
- ✅ Error alert shows: "Email already registered" or similar
- ✅ Button returns to normal state
- ✅ User stays on signup page
- ✅ No token is stored

---

### ✅ Test 9: Form Validation

**Objective**: Verify client-side validation works

**Test Cases**:

#### 9a. Empty Form Submission
- Try submitting empty form
- **Expected**: Validation errors show for required fields

#### 9b. Invalid Email Format
- Enter email: "invalid-email"
- **Expected**: Email validation error shows

#### 9c. Short Password
- Enter password: "12345" (less than 6 characters)
- **Expected**: Password validation error shows

#### 9d. Password Mismatch (signup.html only)
- Enter password: "test123"
- Enter confirm password: "test456"
- **Expected**: Password mismatch error shows

#### 9e. Full Name Validation (signup.html only)
- Enter name: "John" (single word)
- **Expected**: Full name validation error shows

---

### ✅ Test 10: API Error Handling

**Objective**: Verify error handling when backend is unavailable

**Steps**:
1. **Stop the Django backend server**
2. Try to login or register
3. Check error message

**Expected Results**:
- ✅ Network error is caught
- ✅ User-friendly error message: "Network error. Please check your connection and ensure the backend server is running."
- ✅ Button returns to normal state
- ✅ No unhandled errors in console

---

### ✅ Test 11: Token Persistence

**Objective**: Verify token persists across page refreshes

**Steps**:
1. Login successfully (with "Remember Me" checked)
2. Verify token in localStorage
3. **Refresh the page** (F5)
4. Check if token still exists

**Expected Results**:
- ✅ Token persists in localStorage after refresh
- ✅ `window.API.getToken()` still returns the token

---

### ✅ Test 12: Cross-Page Token Access

**Objective**: Verify token is accessible across different pages

**Steps**:
1. Login on `login.html`
2. Navigate to `dashboard.html` (manually or via redirect)
3. Open browser console
4. Check token access

**Expected Results**:
- ✅ Token is accessible via `window.API.getToken()`
- ✅ `window.API.isAuthenticated()` returns `true`

---

## Common Issues & Troubleshooting

### Issue 1: "API is not defined" or "window.API is undefined"

**Solution**:
- Check that `api.js` is loaded before other scripts
- Verify script tag: `<script src="api.js"></script>` appears before other script tags
- Check browser console for script loading errors

### Issue 2: CORS Errors

**Solution**:
- Ensure Django backend has CORS configured
- Check `parcelbee_backend/parcelbee/settings.py` has:
  ```python
  INSTALLED_APPS += ['corsheaders']
  CORS_ALLOW_ALL_ORIGINS = True  # For development
  ```
- Restart Django server after changes

### Issue 3: 404 Error on API Calls

**Solution**:
- Verify backend server is running on `http://127.0.0.1:8000`
- Check API endpoint URLs match backend routes
- Verify `core/urls.py` is included in main `urls.py`

### Issue 4: Token Not Stored

**Solution**:
- Check browser console for errors
- Verify `window.API.setToken()` is being called
- Check if browser blocks localStorage (some privacy modes do this)
- Try in incognito/private mode to rule out extensions

### Issue 5: Redirect Not Working

**Solution**:
- Check browser console for JavaScript errors
- Verify redirect URLs are correct (relative paths)
- Check if popup blockers are interfering
- Verify HTML files exist in the same directory

---

## Manual Testing Script

Run this in browser console after each test to verify state:

```javascript
// Check API utilities
console.log('API Base URL:', window.API.BASE_URL);
console.log('Is Authenticated:', window.API.isAuthenticated());
console.log('Token:', window.API.getToken());

// Check storage
console.log('localStorage token:', localStorage.getItem('token'));
console.log('sessionStorage token:', sessionStorage.getItem('token'));
```

---

## Success Criteria

Phase 1 is **PASSED** if:

- ✅ All 12 tests pass
- ✅ No console errors during normal operation
- ✅ Token storage works correctly (localStorage and sessionStorage)
- ✅ Redirects work based on user role
- ✅ Error handling shows user-friendly messages
- ✅ Form validation works on all forms
- ✅ API utilities are accessible globally

---

## Next Steps After Testing

Once Phase 1 testing is complete and all tests pass:

1. **Report any bugs** found during testing
2. **Proceed to Phase 2** (Customer Dashboard Integration)
3. **Proceed to Phase 3** (Partner Dashboard Integration)

Both Phase 2 and Phase 3 can be started in parallel after Phase 1 is confirmed working.

---

## Quick Test Summary

| Test | Feature | Status |
|------|---------|--------|
| 1 | API Utilities Load | ⬜ |
| 2 | Customer Registration | ⬜ |
| 3 | Partner Registration | ⬜ |
| 4 | Customer Login (Remember Me) | ⬜ |
| 5 | Customer Login (No Remember Me) | ⬜ |
| 6 | Partner Login | ⬜ |
| 7 | Invalid Credentials | ⬜ |
| 8 | Duplicate Email | ⬜ |
| 9 | Form Validation | ⬜ |
| 10 | Network Error Handling | ⬜ |
| 11 | Token Persistence | ⬜ |
| 12 | Cross-Page Token Access | ⬜ |

**Total Passed**: 0/12

---

**Testing Date**: _______________
**Tester**: _______________
**Notes**: _______________

