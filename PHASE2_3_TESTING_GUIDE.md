# Phase 2 & 3 Testing Guide - Dashboard Integration

## Prerequisites

1. **Backend Server Running**:
   ```bash
   cd parcelbee_backend
   python manage.py runserver
   ```
   - Server should be running on `http://127.0.0.1:8000`

2. **Frontend Server Running**:
   - Navigate to `parcelbee_frontend/src/public`
   - Use a web server (VS Code Live Server, Python http.server, etc.)
   - Example: `python -m http.server 8080`

3. **Test Accounts Created**:
   - At least one Customer account
   - At least one Partner account
   - Both should be registered and logged in successfully (Phase 1)

4. **Browser Console Open**:
   - Open Developer Tools (F12)
   - Monitor Console and Network tabs

---

## Phase 2: Customer Dashboard Testing

### ✅ Test 1: Authentication Check on Dashboard Load

**Objective**: Verify customer is redirected if not authenticated

**Steps**:
1. **Clear browser storage** (localStorage and sessionStorage)
2. Navigate directly to `dashboard.html`
3. Check what happens

**Expected Results**:
- ✅ Redirects to `login.html` automatically
- ✅ No console errors
- ✅ No dashboard content is displayed

**Verify in Console**:
```javascript
localStorage.getItem('token')  // Should be null
sessionStorage.getItem('token')  // Should be null
```

---

### ✅ Test 2: Dashboard Loads with Authentication

**Objective**: Verify dashboard loads correctly when authenticated

**Steps**:
1. Login as a customer (from Phase 1 testing)
2. Should redirect to `dashboard.html`
3. Check page loads correctly

**Expected Results**:
- ✅ Dashboard page loads without redirect
- ✅ "Welcome back! 👋" header is visible
- ✅ "Create New Delivery" form is visible
- ✅ "Active Deliveries" section is visible
- ✅ No console errors
- ✅ Loading indicator shows briefly, then deliveries list appears

**Verify in Console**:
```javascript
window.API.isAuthenticated()  // Should return: true
window.API.getToken()  // Should return: JWT token string
```

---

### ✅ Test 3: Load Deliveries on Page Load

**Objective**: Verify deliveries are fetched from API when page loads

**Steps**:
1. Login as customer
2. Navigate to dashboard
3. Open Network tab in DevTools
4. Check API calls

**Expected Results**:
- ✅ API call is made to `GET /api/delivery/list/`
- ✅ Request includes `Authorization: Bearer {token}` header
- ✅ Response contains deliveries array
- ✅ Deliveries are displayed in the list
- ✅ If no deliveries, empty state shows: "No active deliveries yet"

**Check Network Tab**:
- Request URL: `http://127.0.0.1:8000/api/delivery/list/`
- Request Method: `GET`
- Request Headers: Should include `Authorization: Bearer {token}`
- Response Status: `200 OK`
- Response Body: `{ "count": number, "deliveries": [...] }`

---

### ✅ Test 4: Create New Delivery Request

**Objective**: Verify customer can create a delivery request

**Steps**:
1. Login as customer
2. Navigate to dashboard
3. Fill in the delivery form:
   - **Pickup Address**: "123 Main Street, Downtown"
   - **Drop Address**: "456 Oak Avenue, Uptown"
   - **Parcel Description**: "Electronics package"
   - **Weight (kg)**: "2.5"
4. Click "Request Delivery"
5. Check Network tab for API call
6. Check if delivery appears in list

**Expected Results**:
- ✅ Form validation works (try submitting empty form first)
- ✅ Button shows "Processing..." during submission
- ✅ API call is made to `POST /api/delivery/create/`
- ✅ Request body contains: `pickup_address`, `drop_address`, `description`, `weight`
- ✅ Success message appears: "Delivery request submitted successfully!"
- ✅ Form resets after submission
- ✅ New delivery appears in the deliveries list
- ✅ Delivery shows status "Pending"
- ✅ No console errors

**Check Network Tab**:
- Request URL: `http://127.0.0.1:8000/api/delivery/create/`
- Request Method: `POST`
- Request Headers: Should include `Authorization: Bearer {token}`
- Request Body: 
  ```json
  {
    "pickup_address": "123 Main Street, Downtown",
    "drop_address": "456 Oak Avenue, Uptown",
    "description": "Electronics package",
    "weight": 2.5
  }
  ```
- Response Status: `201 Created`
- Response Body: Contains delivery object with `id`, `status: "pending"`, etc.

---

### ✅ Test 5: Form Validation

**Objective**: Verify form validation works correctly

**Test Cases**:

#### 5a. Empty Form Submission
- Try submitting with all fields empty
- **Expected**: Form doesn't submit, fields show validation

#### 5b. Invalid Weight
- Enter weight: "0" or "-5" or "abc"
- **Expected**: Error message or form doesn't submit

#### 5c. Missing Fields
- Try submitting with only some fields filled
- **Expected**: Form validation prevents submission

---

### ✅ Test 6: Delivery Display Format

**Objective**: Verify deliveries are displayed correctly

**Steps**:
1. Create a delivery (from Test 4)
2. Check how it appears in the list

**Expected Results**:
- ✅ Delivery ID shows as "PB001", "PB002", etc.
- ✅ Status badge shows correct color:
  - Pending: Yellow badge
  - Accepted: Blue badge
  - In Transit: Purple badge
  - Delivered: Green badge
- ✅ Pickup address displays correctly
- ✅ Drop address displays correctly
- ✅ Description displays correctly
- ✅ Weight displays correctly (e.g., "2.5 kg")
- ✅ Partner name shows if delivery is accepted, or "Awaiting partner" if pending
- ✅ Created timestamp displays (if available)

---

### ✅ Test 7: Empty State Display

**Objective**: Verify empty state shows when no deliveries exist

**Steps**:
1. Login as a new customer (or clear all deliveries)
2. Navigate to dashboard
3. Check deliveries section

**Expected Results**:
- ✅ Empty state shows: "📭 No active deliveries yet"
- ✅ Message: "Create your first delivery to get started!"
- ✅ Empty state is centered and styled correctly

---

### ✅ Test 8: Error Handling - Expired Token

**Objective**: Verify 401 errors redirect to login

**Steps**:
1. Login as customer
2. Manually delete token from localStorage: `localStorage.removeItem('token')`
3. Try to create a delivery or refresh the page
4. Check what happens

**Expected Results**:
- ✅ API call returns 401 Unauthorized
- ✅ Alert shows: "Your session has expired. Please login again."
- ✅ Redirects to `login.html`
- ✅ Token is cleared from storage

---

### ✅ Test 9: Error Handling - Network Error

**Objective**: Verify network errors are handled gracefully

**Steps**:
1. Login as customer
2. **Stop the Django backend server**
3. Try to create a delivery or refresh the page
4. Check error message

**Expected Results**:
- ✅ Error message shows: "Network error..." or similar
- ✅ User-friendly error message displayed
- ✅ No unhandled errors in console
- ✅ Button returns to normal state

---

### ✅ Test 10: Periodic Refresh

**Objective**: Verify deliveries refresh automatically

**Steps**:
1. Login as customer
2. Create a delivery
3. Wait 30 seconds (or check Network tab)
4. Verify API call is made automatically

**Expected Results**:
- ✅ API call to `/api/delivery/list/` is made every 30 seconds
- ✅ Deliveries list updates if there are changes
- ✅ No console errors during refresh

**Note**: You can check Network tab to see periodic requests

---

## Phase 3: Partner Dashboard Testing

### ✅ Test 11: Authentication Check on Partner Dashboard

**Objective**: Verify partner is redirected if not authenticated

**Steps**:
1. **Clear browser storage**
2. Navigate directly to `partner.html`
3. Check what happens

**Expected Results**:
- ✅ Redirects to `login.html` automatically
- ✅ No console errors

---

### ✅ Test 12: Partner Dashboard Loads

**Objective**: Verify partner dashboard loads correctly

**Steps**:
1. Login as a partner (from Phase 1 testing)
2. Should redirect to `partner.html`
3. Check page loads

**Expected Results**:
- ✅ Dashboard page loads without redirect
- ✅ "Partner Dashboard 🚚" header is visible
- ✅ "Available Requests" panel is visible
- ✅ "My Active Deliveries" panel is visible
- ✅ Count badges show numbers (or 0)
- ✅ No console errors

---

### ✅ Test 13: Load Available Requests

**Objective**: Verify available delivery requests are fetched

**Steps**:
1. Login as partner
2. Navigate to partner dashboard
3. Open Network tab
4. Check API calls

**Expected Results**:
- ✅ API call is made to `GET /api/delivery/list/?status=available`
- ✅ Request includes `Authorization: Bearer {token}` header
- ✅ Available requests are displayed in the left panel
- ✅ Count badge shows correct number
- ✅ If no requests, empty state shows: "No available requests at the moment"

**Check Network Tab**:
- Request URL: `http://127.0.0.1:8000/api/delivery/list/?status=available`
- Request Method: `GET`
- Response Status: `200 OK`
- Response Body: Contains deliveries with `status: "pending"` and `partner: null`

---

### ✅ Test 14: Load Active Deliveries

**Objective**: Verify partner's active deliveries are fetched

**Steps**:
1. Login as partner
2. Navigate to partner dashboard
3. Check right panel

**Expected Results**:
- ✅ API call is made to `GET /api/delivery/list/?status=my`
- ✅ Active deliveries are displayed in the right panel
- ✅ Count badge shows correct number
- ✅ If no active deliveries, empty state shows: "No active deliveries yet"

**Check Network Tab**:
- Request URL: `http://127.0.0.1:8000/api/delivery/list/?status=my`
- Response Status: `200 OK`
- Response Body: Contains deliveries where `partner` is the current partner

---

### ✅ Test 15: Accept Delivery Request

**Objective**: Verify partner can accept a delivery request

**Prerequisites**: 
- At least one pending delivery exists (created by a customer)

**Steps**:
1. Login as partner
2. Navigate to partner dashboard
3. Find an available request in the left panel
4. Click "Accept Request" button
5. Check Network tab
6. Check if request moves to active deliveries

**Expected Results**:
- ✅ API call is made to `POST /api/delivery/{id}/accept/`
- ✅ Request includes `Authorization: Bearer {token}` header
- ✅ Success message shows: "Delivery request accepted successfully!"
- ✅ Request disappears from "Available Requests" panel
- ✅ Request appears in "My Active Deliveries" panel
- ✅ Status shows as "Accepted" (blue badge)
- ✅ Count badges update correctly
- ✅ No console errors

**Check Network Tab**:
- Request URL: `http://127.0.0.1:8000/api/delivery/{id}/accept/`
- Request Method: `POST`
- Response Status: `200 OK`
- Response Body: `{ "message": "...", "delivery": { "id": ..., "status": "accepted" } }`

---

### ✅ Test 16: Error Handling - Already Accepted Request

**Objective**: Verify error when trying to accept already accepted request

**Steps**:
1. Login as partner 1
2. Accept a delivery request
3. **In a different browser/incognito**: Login as partner 2
4. Try to accept the same delivery request
5. Check error message

**Expected Results**:
- ✅ API call returns error (400 or 403)
- ✅ Error message shows: "Delivery already accepted by another partner" or similar
- ✅ Request doesn't move to active deliveries
- ✅ User-friendly error message displayed

---

### ✅ Test 17: Update Status - Start Delivery (In Transit)

**Objective**: Verify partner can mark delivery as "In Transit"

**Prerequisites**:
- Partner has at least one accepted delivery

**Steps**:
1. Login as partner
2. Navigate to partner dashboard
3. Find an "Accepted" delivery in "My Active Deliveries"
4. Click "Start Delivery" button
5. Check Network tab
6. Check status update

**Expected Results**:
- ✅ API call is made to `PUT /api/delivery/{id}/update-status/`
- ✅ Request body contains: `{ "status": "in_transit" }`
- ✅ Success message shows: "Delivery is now in transit!"
- ✅ Status badge changes to "In Transit" (purple badge)
- ✅ Button changes to "Mark as Delivered"
- ✅ No console errors

**Check Network Tab**:
- Request URL: `http://127.0.0.1:8000/api/delivery/{id}/update-status/`
- Request Method: `PUT`
- Request Body: `{ "status": "in_transit" }`
- Response Status: `200 OK`

---

### ✅ Test 18: Update Status - Mark as Delivered

**Objective**: Verify partner can mark delivery as "Delivered"

**Prerequisites**:
- Partner has at least one "In Transit" delivery

**Steps**:
1. Login as partner
2. Navigate to partner dashboard
3. Find an "In Transit" delivery
4. Click "Mark as Delivered" button
5. Check Network tab
6. Check status update

**Expected Results**:
- ✅ API call is made to `PUT /api/delivery/{id}/update-status/`
- ✅ Request body contains: `{ "status": "delivered" }`
- ✅ Success message shows: "Delivery marked as delivered! Payment earned: ₹{amount}"
- ✅ Status badge changes to "Delivered" (green badge)
- ✅ Button disappears, replaced with "✅ Delivery Completed"
- ✅ No console errors

**Check Network Tab**:
- Request URL: `http://127.0.0.1:8000/api/delivery/{id}/update-status/`
- Request Method: `PUT`
- Request Body: `{ "status": "delivered" }`
- Response Status: `200 OK`

---

### ✅ Test 19: Status Display and Badges

**Objective**: Verify status badges display correctly

**Steps**:
1. Login as partner
2. Check deliveries with different statuses

**Expected Results**:
- ✅ Pending: Yellow badge
- ✅ Accepted: Blue badge
- ✅ In Transit: Purple badge
- ✅ Delivered: Green badge
- ✅ Status text matches backend status values

---

### ✅ Test 20: Periodic Refresh on Partner Dashboard

**Objective**: Verify both panels refresh automatically

**Steps**:
1. Login as partner
2. Navigate to partner dashboard
3. Wait 30 seconds
4. Check Network tab

**Expected Results**:
- ✅ Two API calls are made every 30 seconds:
  - `GET /api/delivery/list/?status=available`
  - `GET /api/delivery/list/?status=my`
- ✅ Both panels update if there are changes
- ✅ No console errors

---

## Integration Testing (Customer + Partner)

### ✅ Test 21: End-to-End Delivery Flow

**Objective**: Test complete delivery workflow from customer to partner

**Steps**:
1. **As Customer**:
   - Login as customer
   - Create a new delivery request
   - Note the delivery details

2. **As Partner** (in same or different browser):
   - Login as partner
   - Check "Available Requests" panel
   - Verify the new delivery appears
   - Accept the delivery request

3. **As Customer** (refresh dashboard):
   - Refresh customer dashboard
   - Verify delivery status changed to "Accepted"
   - Verify partner name appears

4. **As Partner**:
   - Update status to "In Transit"
   - Update status to "Delivered"

5. **As Customer** (refresh dashboard):
   - Refresh customer dashboard
   - Verify delivery status is "Delivered"

**Expected Results**:
- ✅ Customer can create delivery
- ✅ Partner sees delivery in available requests
- ✅ Partner can accept delivery
- ✅ Customer sees status update
- ✅ Partner can update status through all stages
- ✅ Customer sees final "Delivered" status
- ✅ All status changes reflect in real-time (after refresh)

---

### ✅ Test 22: Multiple Partners - First Come First Served

**Objective**: Verify only one partner can accept a delivery

**Steps**:
1. Create a delivery as customer
2. **Partner 1**: Login and accept the delivery
3. **Partner 2**: Login and try to accept the same delivery
4. Check error handling

**Expected Results**:
- ✅ Partner 1 successfully accepts delivery
- ✅ Partner 2 sees error: "Delivery already accepted by another partner"
- ✅ Delivery only appears in Partner 1's active deliveries

---

## Error Scenarios

### ✅ Test 23: 401 Unauthorized Handling

**Objective**: Verify expired tokens are handled correctly

**Steps**:
1. Login as customer or partner
2. Manually expire token: `localStorage.setItem('token', 'invalid')`
3. Try to perform any action (create delivery, accept request, etc.)

**Expected Results**:
- ✅ API returns 401 Unauthorized
- ✅ Alert shows: "Your session has expired. Please login again."
- ✅ Redirects to `login.html`
- ✅ Token is cleared

---

### ✅ Test 24: Network Error Handling

**Objective**: Verify network errors are handled gracefully

**Steps**:
1. Login as customer or partner
2. **Stop Django backend server**
3. Try to perform actions (create delivery, accept request, etc.)

**Expected Results**:
- ✅ Network error is caught
- ✅ User-friendly error message displayed
- ✅ No unhandled errors in console
- ✅ UI returns to normal state

---

### ✅ Test 25: Invalid Status Update

**Objective**: Verify invalid status updates are rejected

**Steps**:
1. Login as partner
2. Try to update a delivery status with invalid value
3. Check error handling

**Expected Results**:
- ✅ API returns error (400 Bad Request)
- ✅ Error message displayed
- ✅ Status doesn't change
- ✅ Delivery remains in correct state

---

## Performance & UX Testing

### ✅ Test 26: Loading States

**Objective**: Verify loading indicators show during API calls

**Steps**:
1. Login as customer or partner
2. Perform actions (create delivery, accept request, etc.)
3. Check for loading indicators

**Expected Results**:
- ✅ Loading spinner shows during API calls
- ✅ Button shows "Processing..." or similar during submission
- ✅ Loading states clear after API response
- ✅ No flickering or UI glitches

---

### ✅ Test 27: Mobile Responsiveness

**Objective**: Verify dashboards work on mobile devices

**Steps**:
1. Open dashboard in browser
2. Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
3. Test on mobile viewport (375px width)
4. Test all functionality

**Expected Results**:
- ✅ Mobile menu works correctly
- ✅ Forms are usable on mobile
- ✅ Buttons are appropriately sized
- ✅ Text is readable
- ✅ All functionality works on mobile

---

## Quick Test Summary

| Test | Feature | Status |
|------|---------|--------|
| 1 | Customer Auth Check | ⬜ |
| 2 | Customer Dashboard Load | ⬜ |
| 3 | Load Deliveries | ⬜ |
| 4 | Create Delivery | ⬜ |
| 5 | Form Validation | ⬜ |
| 6 | Delivery Display | ⬜ |
| 7 | Empty State | ⬜ |
| 8 | 401 Error Handling | ⬜ |
| 9 | Network Error | ⬜ |
| 10 | Periodic Refresh | ⬜ |
| 11 | Partner Auth Check | ⬜ |
| 12 | Partner Dashboard Load | ⬜ |
| 13 | Load Available Requests | ⬜ |
| 14 | Load Active Deliveries | ⬜ |
| 15 | Accept Request | ⬜ |
| 16 | Already Accepted Error | ⬜ |
| 17 | Update to In Transit | ⬜ |
| 18 | Mark as Delivered | ⬜ |
| 19 | Status Badges | ⬜ |
| 20 | Partner Periodic Refresh | ⬜ |
| 21 | End-to-End Flow | ⬜ |
| 22 | Multiple Partners | ⬜ |
| 23 | 401 Handling | ⬜ |
| 24 | Network Error | ⬜ |
| 25 | Invalid Status | ⬜ |
| 26 | Loading States | ⬜ |
| 27 | Mobile Responsive | ⬜ |

**Total Passed**: 0/27

---

## Testing Tips

1. **Use Browser DevTools**:
   - Console tab: Check for JavaScript errors
   - Network tab: Monitor API calls and responses
   - Application tab: Check localStorage/sessionStorage

2. **Test with Multiple Browsers**:
   - Chrome, Firefox, Edge
   - Check for browser-specific issues

3. **Test with Multiple Users**:
   - Create multiple customer accounts
   - Create multiple partner accounts
   - Test concurrent operations

4. **Monitor Backend Logs**:
   - Check Django console for errors
   - Verify database changes

5. **Test Edge Cases**:
   - Very long addresses
   - Special characters in descriptions
   - Very large weight values
   - Empty strings

---

## Common Issues & Solutions

### Issue 1: "API is not defined"

**Solution**:
- Check that `api.js` is loaded before `dashboard.js` or `partner.js`
- Verify script tags in HTML files

### Issue 2: CORS Errors

**Solution**:
- Ensure Django CORS is configured
- Check `CORS_ALLOW_ALL_ORIGINS = True` in settings.py
- Restart Django server

### Issue 3: 401 Errors on Every Request

**Solution**:
- Check token is being sent in headers
- Verify token format: `Bearer {token}`
- Check token hasn't expired (7 days)

### Issue 4: Deliveries Not Appearing

**Solution**:
- Check Network tab for API response
- Verify user role is correct (customer vs partner)
- Check backend logs for errors
- Verify database has deliveries

### Issue 5: Status Updates Not Reflecting

**Solution**:
- Wait for periodic refresh (30 seconds)
- Manually refresh the page
- Check Network tab for API calls
- Verify backend updated the status

---

## Success Criteria

Phase 2 & 3 are **PASSED** if:

- ✅ All 27 tests pass
- ✅ No console errors during normal operation
- ✅ All API calls include authentication headers
- ✅ Error handling works for all scenarios
- ✅ Loading states show during API calls
- ✅ Status updates reflect correctly
- ✅ End-to-end workflow functions correctly
- ✅ Mobile responsive design maintained

---

**Testing Date**: _______________
**Tester**: _______________
**Notes**: _______________

