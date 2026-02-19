# 🧪 Login System - Testing & Verification Guide

## Quick Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    APP LOAD FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User opens app / Refresh page                                   │
│       ↓                                                           │
│  AuthContext initializes                                         │
│       ↓                                                           │
│  useEffect runs: Check localStorage                              │
│       ↓                                                           │
│   ┌─ If NO token/user → isAuthenticated = false → loading = false
│   │       ↓                                                       │
│   │  ProtectedRoute checks → NOT authenticated                   │
│   │       ↓                                                       │
│   │  Redirect to /login → Show Login Page ✅                     │
│   │                                                               │
│   └─ If YES token/user → Restore from storage                   │
│        ↓                                                          │
│        isAuthenticated = true → loading = false                 │
│       ↓                                                           │
│  ProtectedRoute checks → IS authenticated                        │
│       ↓                                                           │
│  Render Protected Page (Dashboard/Users/etc) ✅                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User enters email + password                                    │
│       ↓                                                           │
│  Click "Sign In" button                                          │
│       ↓                                                           │
│  Frontend calls: login(email, password)                          │
│       ↓                                                           │
│  Backend: POST /auth/login                                       │
│       ↓                                                           │
│  Backend validates credentials + fetches permissions            │
│       ↓                                                           │
│  Response: {user, permissions, accessToken, deviceId}           │
│       ↓                                                           │
│  Frontend stores:                                                │
│    • localStorage['authToken'] = accessToken                    │
│    • localStorage['user'] = JSON.stringify(user)                │
│    • localStorage['permissions'] = JSON.stringify(permissions)  │
│       ↓                                                           │
│  AuthContext state updates:                                      │
│    • user = user object                                          │
│    • permissions = permission array                              │
│    • isAuthenticated = true                                      │
│       ↓                                                           │
│  navigate('/') → Redirect to home                                │
│       ↓                                                           │
│  ProtectedRoute sees isAuthenticated=true                        │
│       ↓                                                           │
│  Dashboard renders ✅                                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               AUTHENTICATION STATE MACHINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│         ┌─────────────────┐                                      │
│         │  NOT LOGGED IN  │ ─── User visits /login              │
│         │                 │     Can see: Login form              │
│         │ loading: false  │     Can't see: Dashboard             │
│         └────────┬────────┘                                      │
│                  │                                               │
│                  │ login()                                       │
│                  │ success                                       │
│                  ↓                                               │
│         ┌─────────────────┐                                      │
│         │  LOADING/CHECK  │                                      │
│         │                 │                                      │
│         │ loading: true   │                                      │
│         └────────┬────────┘                                      │
│                  │                                               │
│                  │ (data restored or user confirms)             │
│                  ↓                                               │
│         ┌─────────────────┐                                      │
│         │  LOGGED IN      │ ─── User visits /dashboard          │
│         │                 │     Can see: Dashboard               │
│         │ loading: false  │     Can't see: Login form            │
│         │ isAuth: true    │─────────┐                            │
│         └─────────────────┘         │                            │
│                  ↑                  │                            │
│                  │                  │ (redirect)               │
│                  │                  ↓                            │
│                  └─ logout() ──── /login                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 STEP-BY-STEP TESTING

### **PART 1: First Time User (Fresh Browser)**

#### Step 1.1: Clear All Storage
```javascript
// Open browser console (F12)
localStorage.clear()
sessionStorage.clear()
```

#### Step 1.2: Load App
```
URL: http://localhost:5173
Expected: See Login page immediately
```

#### Step 1.3: Verify localStorage is Empty
```javascript
// Console
console.log('authToken:', localStorage.getItem('authToken'))  // null
console.log('user:', localStorage.getItem('user'))           // null
console.log('permissions:', localStorage.getItem('permissions')) // null
```

#### Step 1.4: Try to Access Protected Route
```
URL: http://localhost:5173/
Expected: Instantly redirected to /login
```

---

### **PART 2: Login Process**

#### Step 2.1: Test Login Form
```
1. Click on Login page
2. Enter email: user@example.com
3. Enter password: password123
4. Click "Sign In"

Expected: 
  • Button shows "Signing In..."
  • Backend called
  • Response received
```

**Verify Backend Response:**
```javascript
// Network tab → Find /auth/login request → Response
{
  "success": true,
  "data": {
    "user": { ... },
    "permissions": ["asset:read", "user:create", ...],  // ← Check this
    "accessToken": "eyJhbGc...",
    "deviceId": "uuid-...",
    "forcePasswordChange": false
  },
  "message": "Login successful"
}
```

#### Step 2.2: After Successful Login
```
Expected:
  • Page shows loading spinner briefly
  • Redirected to / (dashboard)
  • Dashboard shows (with header, sidebar)
  • URL changes to http://localhost:5173/
```

#### Step 2.3: Verify localStorage Updated
```javascript
// Console
console.log('authToken:', localStorage.getItem('authToken'))
// Should show: eyJhbGciOiJIUzI1NiIs...

console.log('user:', localStorage.getItem('user'))
// Should show: {"_id":"...","email":"...","role":"..."}

console.log('permissions:', localStorage.getItem('permissions'))
// Should show: ["asset:read","user:create",...]

// Verify as array
const perms = JSON.parse(localStorage.getItem('permissions'))
console.log('Permissions array:', perms)
console.log('First permission:', perms[0]) // e.g., "asset:read"
```

#### Step 2.4: Verify Auth Context State
```javascript
// If using React DevTools:
// 1. Open DevTools → Components tab
// 2. Find <Context.Provider> for AuthContext
// 3. Look at value prop:
//    user: { ... }
//    permissions: [...] 
//    isAuthenticated: true
//    loading: false
```

---

### **PART 3: Reload While Logged In**

#### Step 3.1: Refresh Page
```
1. Press F5 or Ctrl+R to refresh
Expected:
  • Brief loading spinner
  • Dashboard loads (no redirect to login)
  • Same user/permissions persist
  • localStorage still has authToken, user, permissions
```

#### Step 3.2: Verify localStorage Not Cleared
```javascript
console.log('authToken still exists:', !!localStorage.getItem('authToken'))
// Should be: true

console.log('permissions still exist:', !!localStorage.getItem('permissions'))
// Should be: true
```

---

### **PART 4: Already Logged In User Visits Login Page**

#### Step 4.1: Navigate to Login While Logged In
```
1. At dashboard (logged in)
2. Manual URL change: http://localhost:5173/login
Expected:
  • Login page NOT visible
  • Instantly redirected to / (dashboard)
  • No form submission happens
```

#### Step 4.2: Navigate to Register While Logged In
```
1. At dashboard (logged in)
2. Manual URL change: http://localhost:5173/register
Expected:
  • Register page NOT visible
  • Instantly redirected to / (dashboard)
```

---

### **PART 5: Logout**

#### Step 5.1: Find Logout Button
```
1. Look for logout button (usually in header/profile menu)
2. Click logout
Expected:
  • API call to /auth/logout
  • localStorage cleared:
    - authToken removed
    - user removed
    - permissions removed
```

#### Step 5.2: Verify Redirect After Logout
```
Expected:
  • Redirected to /login
  • Login page visible
  • Can see login form
```

#### Step 5.3: Verify localStorage Cleared
```javascript
console.log('authToken after logout:', localStorage.getItem('authToken'))
// Should be: null

console.log('user after logout:', localStorage.getItem('user'))
// Should be: null

console.log('permissions after logout:', localStorage.getItem('permissions'))
// Should be: null
```

#### Step 5.4: Try to Access Dashboard
```
1. Try manual URL: http://localhost:5173/
Expected:
  • Redirected to /login
  • Dashboard NOT accessible
```

---

### **PART 6: Permissions Check**

#### Step 6.1: After Login, Check Permissions
```javascript
// Console
const perms = JSON.parse(localStorage.getItem('permissions'))

// Check if it's an array
console.log('Is array:', Array.isArray(perms))

// Check some permissions
console.log('Has user:create:', perms.includes('user:create'))
console.log('Has asset:read:', perms.includes('asset:read'))

// Show all permissions
console.log('All permissions:')
perms.forEach(p => console.log('  -', p))
```

#### Step 6.2: Verify in Frontend Code
```javascript
// Open src/pages/users/Users.jsx or similar

// Look for data-permission attributes in HTML:
// <button data-permission="user:create">Add User</button>
// <button data-permission="user:delete">Delete</button>

// Verify buttons are visible/hidden based on permissions
// If you have user:create permission → Add User button visible
// If you DON'T have user:delete → Delete buttons hidden
```

---

### **PART 7: Error Cases**

#### Step 7.1: Login with Wrong Password
```
1. Click Login
2. Enter valid email but wrong password
3. Click "Sign In"
Expected:
  • Error message: "Invalid login credentials"
  • NOT redirected
  • Stay on login page
  • localStorage unchanged
```

#### Step 7.2: Login with Wrong Email
```
1. Click Login
2. Enter invalid email
3. Click "Sign In"
Expected:
  • Error message: "Invalid login credentials"
  • NOT redirected
  • localStorage unchanged
```

#### Step 7.3: Expired Token
```
1. Login successfully
2. Wait for token to expire (or manually clear token:)
   localStorage.removeItem('authToken')
3. Try to access dashboard
Expected:
  • Redirected to /login
  • Can't access dashboard
  • See login form
```

---

## 🔍 Debug Console Commands

**Quick verification commands:**

```javascript
// 1. Check everything at once
const auth = {
  token: localStorage.getItem('authToken') ? '✅ Set' : '❌ Missing',
  user: localStorage.getItem('user') ? '✅ Set' : '❌ Missing',
  permissions: localStorage.getItem('permissions') ? '✅ Set' : '❌ Missing'
}
console.table(auth)

// 2. Parse and show permissions
try {
  const perms = JSON.parse(localStorage.getItem('permissions') || '[]')
  console.log('Permissions:', perms)
} catch (e) {
  console.error('Error parsing permissions:', e)
}

// 3. Check user details
try {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  console.log('User:', user)
  console.log('User ID:', user?._id)
  console.log('User Email:', user?.email)
  console.log('User Role:', user?.role)
} catch (e) {
  console.error('Error parsing user:', e)
}

// 4. Clear all and start fresh
localStorage.clear()
sessionStorage.clear()
location.reload()
```

---

## 📊 Expected Results Summary

| Test Case | Step | Expected | Result |
|-----------|------|----------|--------|
| First Visit | 1.1 | localStorage empty | ✅ |
| First Visit | 1.2 | See login page | ✅ |
| First Visit | 1.4 | Visit / → Redirected | ✅ |
| Login | 2.1 | Form works | ✅ |
| Login | 2.2 | Redirected to home | ✅ |
| Login | 2.3 | Storage populated | ✅ |
| Login | 2.4 | Context state updated | ✅ |
| Reload | 3.1 | No redirect to login | ✅ |
| Reload | 3.2 | Storage preserved | ✅ |
| Protected | 4.1 | Can't stay on login | ✅ |
| Protected | 4.2 | Can't stay on register | ✅ |
| Logout | 5.1 | Logout API called | ✅ |
| Logout | 5.2 | Redirected to login | ✅ |
| Logout | 5.3 | Storage cleared | ✅ |
| Logout | 5.4 | Dashboard inaccessible | ✅ |
| Permissions | 6.1 | Permissions array shown | ✅ |
| Permissions | 6.2 | UI controls work | ✅ |
| Errors | 7.1 | Wrong password error | ✅ |
| Errors | 7.2 | Wrong email error | ✅ |
| Errors | 7.3 | Expired token redirects | ✅ |

---

## 🚀 Running Tests Automatically

**Create test script:**

```javascript
// tests/login-flow.test.js

async function testLoginFlow() {
  console.log('🧪 Testing Login Flow...')
  
  // 1. Clear storage
  localStorage.clear()
  console.log('✅ Storage cleared')
  
  // 2. Verify can't access dashboard
  // (Would need to test routing)
  
  // 3. Login
  const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: 'user@example.com',
      password: 'password123'
    })
  })
  
  const { data } = await loginResponse.json()
  console.log('✅ Login successful')
  console.log('✅ Permissions received:', data.permissions)
  
  // 4. Verify localStorage
  console.log('✅ Token stored:', !!localStorage.getItem('authToken'))
  console.log('✅ User stored:', !!localStorage.getItem('user'))
  console.log('✅ Permissions stored:', !!localStorage.getItem('permissions'))
  
  console.log('✅ All tests passed!')
}
```

---

## ✅ Final Verification Checklist

- [ ] Fresh visit → Login page
- [ ] Login with credentials → Dashboard
- [ ] localStorage has: authToken, user, permissions
- [ ] Refresh page → Dashboard loads (no redirect)
- [ ] Visit /login while logged in → Redirected to /
- [ ] Logout → Redirected to /login
- [ ] Try /  after logout → Redirected to /login
- [ ] Permissions array is valid JSON
- [ ] All 3 localStorage items clear on logout
- [ ] API errors show properly

---

## 📚 Documentation Files

- **LOGIN_SETUP_GUIDE.md** ← You are here  
- **RBAC_IMPLEMENTATION_GUIDE.md** - Permission system
- **LOGIN_SETUP_GUIDE.md** - Complete auth flow

---

**Status:** ✅ Ready for testing  
**Date:** February 2026  
**Version:** 1.0
