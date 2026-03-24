# Testing Guide for AI Event Planner System

## Quick Start Testing

### 1. Start the Server
```bash
# Terminal 1: Start web server
bun run start-web-dev
```

The app will be available at `http://localhost:8081`

---

## Manual Test Scenarios

### **Test 1: Home Screen & Navigation**

**Steps:**
1. Open app at `http://localhost:8081`
2. Verify you see "Welcome back, Guest" message
3. Check that event cards display with images
4. Click on an event card
5. Verify it navigates to event details
6. Go back to home

**Expected Results:**
- ✅ Home page loads with gradient background
- ✅ All event images display or show fallback images
- ✅ Event cards are clickable
- ✅ Navigation works smoothly

---

### **Test 2: Event Details & Booking**

**Steps:**
1. From home, click any event card
2. Scroll through event details
3. Click "Book Now" button
4. Fill booking form:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Phone: `9876543210`
   - Date: `2025-12-31` (future date)
   - Guests: `100`
   - Venue: `Grand Hall`
   - Payment: `7500`
5. Click "Confirm Booking"
6. Verify success message

**Expected Results:**
- ✅ Event details load correctly
- ✅ Booking form opens as modal
- ✅ Form accepts valid input
- ✅ Booking is saved
- ✅ Confirmation alert appears

**Validation Testing:**
Submit form with:
- Empty fields → "Please fill in all required fields"
- Invalid email → "Please enter a valid email"
- Invalid phone → "Please enter a valid phone number"
- Past date → "Please select a future date"
- Guest count 0 → "Guest count must be 1-10000"
- Payment < 50% of price → "Minimum payment is ₹..."

---

### **Test 3: Form Field Validation**

**Test Case 3a: Email Validation**
```
Valid:    user@example.com, test@domain.co.uk
Invalid:  user@, invalid.email, @example.com
```

**Test Case 3b: Phone Validation**
```
Valid:    9876543210, +91 9876543210, (098) 765-4321
Invalid:  123, abc123456
```

**Test Case 3c: Date Validation**
```
Valid:    2025-12-31 (future)
Invalid:  2020-01-01 (past), invalid format
```

**Test Case 3d: Amount Validation**
```
Valid:    100, 50000, 999999
Invalid:  -1000, 0, 10000000+
```

---

### **Test 4: My Events Page**

**Steps:**
1. Complete at least one booking (Test 2)
2. Go to home page
3. Click "My Events" button
4. Verify booked event appears in list
5. Click on booking to view details
6. Check booking status shows "booked"

**Expected Results:**
- ✅ My Events page loads
- ✅ Booked event appears in list
- ✅ Event details are correct
- ✅ Payment status displays

---

### **Test 5: AI Chat Feature**

**Steps:**
1. Go to home page
2. Click "AI Event Planner" card or Bot button
3. Type: `Plan a birthday party for 50 guests`
4. Send message
5. Wait for AI response
6. Upload an image:
   - Click image icon
   - Select an image
   - Follow prompt "What can you tell me about this venue?"
7. View chat history:
   - Click history icon
   - See previous chat
   - Click a previous chat

**Expected Results:**
- ✅ Chat screen opens
- ✅ Messages are sent and received
- ✅ Chat persists in history
- ✅ Image upload works
- ✅ History can be viewed and accessed

---

### **Test 6: Vendors Feature**

**Steps:**
1. From home, click "Vendors" button
2. Scroll through vendor list
3. Click on a vendor
4. View vendor details
5. Check portfolio, services, reviews

**Expected Results:**
- ✅ Vendors page shows list
- ✅ Vendor cards display properly
- ✅ Click opens vendor details
- ✅ Portfolio and services display

---

### **Test 7: Admin Dashboard**

**Steps:**
1. Click "Admin" button in top menu
2. Login with credentials:
   - Email: `admin@eventai.com`
   - Password: `admin123`
3. Verify dashboard loads
4. Check for:
   - Total users
   - Total events
   - Recent bookings
   - AI generations

**Expected Results:**
- ✅ Admin login page shows
- ✅ Accepts correct credentials
- ✅ Dashboard displays statistics
- ✅ Can view booking requests

---

### **Test 8: User Profile**

**Steps:**
1. From home, click profile icon (top right)
2. View current profile info
3. Edit profile:
   - Change name to `Test User`
   - Change email to `test@example.com`
   - Click Save
4. Go back to home
5. Verify new name displays in greeting

**Expected Results:**
- ✅ Profile page loads
- ✅ Form fields pre-populate
- ✅ Can edit and save changes
- ✅ Changes persist on home page

---

### **Test 9: Category Filters**

**Steps:**
1. From home, click on a category (e.g., "Wedding")
2. Verify navigation to /events?category=wedding
3. Filter shows only wedding events
4. Try other categories

**Expected Results:**
- ✅ Category filter works
- ✅ Only relevant events show
- ✅ All categories are functional

---

### **Test 10: Image Loading & Fallbacks**

**Steps:**
1. Open DevTools (F12)
2. Go to home page
3. Check Network tab
4. If images fail to load, verify fallback images appear
5. Check Console for any errors

**Expected Results:**
- ✅ Images load from Unsplash or fallback
- ✅ No broken image icons
- ✅ Console has no critical errors

---

## Automated Test Execution

### Run Unit Tests
```bash
bun test __tests__/validation.test.ts
```

### Test Coverage
Tests verify:
- Email validation (valid/invalid)
- Phone validation (with formatting)
- Date validation (past/future)
- Guest count limits
- Payment amount validation
- Name requirements
- Complete booking form validation

---

## Error Handling Tests

### **Test Error Boundaries**

1. Open app console (F12)
2. Try to trigger errors:
   - Delete event ID from URL
   - Submit invalid booking data
   - Disconnect network (DevTools)

3. Verify:
   - ✅ Error messages display
   - ✅ App doesn't crash
   - ✅ Can retry or navigate back

---

## Performance Tests

### **Test 1: Load Time**
- Open app, check Network tab
- Mobile bundle: Should be < 2MB
- Initial load: < 5 seconds

### **Test 2: Responsiveness**
- Scroll through events: Smooth 60fps
- Navigate between screens: No lag
- Form input: Real-time validation feedback

### **Test 3: State Persistence**
- Book an event
- Refresh page (F5)
- Verify booking still saved
- Clear browser storage
- Verify empty again

---

## Browser Compatibility

Test on:
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

---

## Accessibility Tests

1. **Keyboard Navigation**
   - Tab through form fields
   - Enter/Space to activate buttons
   - Escape to close modals

2. **Screen Reader**
   - All buttons have text labels
   - Form labels associated with inputs
   - Images have alt text

3. **Color Contrast**
   - Text readable on background
   - Error states visible

---

## Depression Test Checklist

- [ ] Home page loads without errors
- [ ] Events display with images or fallbacks
- [ ] Booking form validates input correctly
- [ ] Booking saves and persists
- [ ] AI chat sends/receives messages
- [ ] Admin login works with credentials
- [ ] My Events shows booked events
- [ ] Profile can be edited and saved
- [ ] Error boundaries catch errors
- [ ] No console warnings/errors

---

## Test Report Template

```
Test Date: [date]
Tester: [name]
Browser: [browser/version]

Results:
- Home Screen: PASS / FAIL
- Booking Flow: PASS / FAIL
- Form Validation: PASS / FAIL
- AI Chat: PASS / FAIL
- Admin Panel: PASS / FAIL
- Profile Management: PASS / FAIL
- Error Handling: PASS / FAIL

Issues Found:
1. [Description]
   - Severity: Critical / High / Medium / Low
   - Steps to reproduce: [steps]
   - Expected: [result]
   - Actual: [result]

Notes:
[Any additional observations]
```

---

## Debugging Tips

### Enable Debug Logging
Edit `/config.ts`:
```typescript
enableLogging: true,
```

### Check Console Errors
Press F12 → Console tab
Look for:
- TypeScript errors
- Runtime errors
- Network failures
- Warning messages

### Test with Network Throttling
DevTools → Network → Throttling
- Slow 3G
- Fast 3G
- Offline

### Test with Different Screen Sizes
DevTools → Toggle device toolbar
- iPhone SE (375px)
- iPhone Pro Max (430px)
- iPad (768px)
- Desktop (1920px)

---

## Final Verification

Before deployment, verify:
- [ ] All unit tests pass
- [ ] No console errors
- [ ] All features working
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Images loading
- [ ] Forms validating
- [ ] Persistence working
- [ ] Error handling working
- [ ] Admin features accessible

---

**Testing Checklist Complete ✅**

For detailed feature documentation, see [IMPROVEMENTS.md](./IMPROVEMENTS.md)
