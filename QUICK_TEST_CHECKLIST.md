# Quick Test Checklist - Phases 2 & 3

## Quick Verification (5 minutes)

### Customer Dashboard (Phase 2)

- [ ] **Login as customer** → Redirects to dashboard.html
- [ ] **Page loads** → No redirect, shows form and deliveries list
- [ ] **Create delivery** → Fill form, submit, see success message
- [ ] **Delivery appears** → New delivery shows in list with "Pending" status
- [ ] **Check Network tab** → See API calls to `/api/delivery/create/` and `/api/delivery/list/`

### Partner Dashboard (Phase 3)

- [ ] **Login as partner** → Redirects to partner.html
- [ ] **Page loads** → Shows "Available Requests" and "My Active Deliveries" panels
- [ ] **See available requests** → Customer's delivery appears in left panel
- [ ] **Accept request** → Click "Accept Request", see success message
- [ ] **Request moves** → Disappears from available, appears in active deliveries
- [ ] **Update status** → Click "Start Delivery" → Status changes to "In Transit"
- [ ] **Mark delivered** → Click "Mark as Delivered" → Status changes to "Delivered"

### Integration Test

- [ ] **Customer creates delivery** → Status: Pending
- [ ] **Partner accepts** → Customer sees status: Accepted (after refresh)
- [ ] **Partner marks in transit** → Customer sees status: In Transit (after refresh)
- [ ] **Partner marks delivered** → Customer sees status: Delivered (after refresh)

## Critical Tests (Must Pass)

1. ✅ **Authentication**: Both dashboards redirect if not logged in
2. ✅ **API Calls**: All API calls include `Authorization: Bearer {token}` header
3. ✅ **Error Handling**: 401 errors redirect to login
4. ✅ **Status Updates**: Status changes reflect correctly
5. ✅ **No Console Errors**: Browser console shows no JavaScript errors

## Quick Browser Console Checks

```javascript
// Check authentication
window.API.isAuthenticated()  // Should return: true

// Check token
window.API.getToken()  // Should return: JWT token string

// Check API base URL
window.API.BASE_URL  // Should return: "http://127.0.0.1:8000/api"
```

## Network Tab Verification

### Customer Dashboard
- `GET /api/delivery/list/` → 200 OK
- `POST /api/delivery/create/` → 201 Created

### Partner Dashboard
- `GET /api/delivery/list/?status=available` → 200 OK
- `GET /api/delivery/list/?status=my` → 200 OK
- `POST /api/delivery/{id}/accept/` → 200 OK
- `PUT /api/delivery/{id}/update-status/` → 200 OK

All requests should have:
- `Authorization: Bearer {token}` header
- `Content-Type: application/json` header

---

**If all quick tests pass → Proceed to detailed testing guide**
**If any test fails → Check console errors and Network tab responses**

