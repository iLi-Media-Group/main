# MyBeatFi.io Manual Testing Script

## 🎯 Quick Start Testing

This script provides step-by-step instructions to test all major functions of your site. Follow each section in order and check off items as you complete them.

---

## 📋 Pre-Testing Setup

### **Test Accounts Setup**
Create these test accounts before starting:

**Client Test Account:**
- Email: `testclient@mybeatfi.io`
- Password: `TestClient123!`
- Account Type: Client

**Producer Test Account:**
- Email: `testproducer@mybeatfi.io`
- Password: `TestProducer123!`
- Account Type: Producer
- Invitation Code: `TEST_PRODUCER_001`
- IPI Number: `123456789`
- PRO: `ASCAP`

**Admin Test Account:**
- Email: `testadmin@mybeatfi.io`
- Password: `TestAdmin123!`
- Account Type: Admin

---

## 🔐 1. Authentication Testing (15 minutes)

### **A. User Registration**
**Time: 5 minutes**

1. **Open the site** in a new incognito/private browser window
2. **Click "Sign Up"** or "Create Account"
3. **Test Client Registration:**
   - [ ] Fill in: First Name: "Test", Last Name: "Client"
   - [ ] Fill in: Email: "testclient@mybeatfi.io"
   - [ ] Fill in: Password: "TestClient123!"
   - [ ] **Verify:** Age verification checkbox appears
   - [ ] **Verify:** Terms and Conditions checkbox appears
   - [ ] **Click:** Terms and Conditions link (should open in new tab)
   - [ ] **Check:** Both checkboxes
   - [ ] **Click:** "Create Account"
   - [ ] **Verify:** Account creation success message
   - [ ] **Verify:** Redirected to client dashboard

4. **Test Producer Registration:**
   - [ ] Open new incognito window
   - [ ] **Click:** "Sign Up"
   - [ ] **Select:** "Sign Up as Producer"
   - [ ] **Verify:** Invitation code field appears
   - [ ] **Fill in:** Invitation code: "TEST_PRODUCER_001"
   - [ ] **Fill in:** IPI Number: "123456789"
   - [ ] **Select:** PRO: "ASCAP"
   - [ ] **Complete:** Registration form
   - [ ] **Verify:** Producer account created successfully

### **B. User Login**
**Time: 3 minutes**

1. **Test Client Login:**
   - [ ] **Click:** "Log In"
   - [ ] **Fill in:** Email: "testclient@mybeatfi.io"
   - [ ] **Fill in:** Password: "TestClient123!"
   - [ ] **Click:** "Log In"
   - [ ] **Verify:** Redirected to client dashboard

2. **Test Invalid Login:**
   - [ ] **Fill in:** Wrong password
   - [ ] **Click:** "Log In"
   - [ ] **Verify:** Error message appears

3. **Test Producer Login:**
   - [ ] **Log in** with producer account
   - [ ] **Verify:** Redirected to producer dashboard

### **C. Password Reset**
**Time: 3 minutes**

1. **Request Password Reset:**
   - [ ] **Click:** "Forgot Password?"
   - [ ] **Fill in:** Email: "testclient@mybeatfi.io"
   - [ ] **Click:** "Send Reset Link"
   - [ ] **Verify:** Success message appears

2. **Check Email:**
   - [ ] **Check:** Email inbox for reset link
   - [ ] **Click:** Reset link
   - [ ] **Set:** New password
   - [ ] **Verify:** Can log in with new password

---

## 👥 2. Client Functions Testing (20 minutes)

### **A. Catalog Browsing**
**Time: 8 minutes**

1. **Browse Catalog:**
   - [ ] **Navigate to:** `/catalog`
   - [ ] **Verify:** Tracks are displayed
   - [ ] **Verify:** Track cards show: title, artist, genre, price

2. **Search Functionality:**
   - [ ] **Type:** Track title in search box
   - [ ] **Verify:** Results filter correctly
   - [ ] **Type:** Artist name in search box
   - [ ] **Verify:** Results filter correctly

3. **Filter Testing:**
   - [ ] **Click:** Genre filter
   - [ ] **Select:** A genre
   - [ ] **Verify:** Results filter by genre
   - [ ] **Click:** Mood filter
   - [ ] **Select:** A mood
   - [ ] **Verify:** Results filter by mood
   - [ ] **Test:** BPM range slider
   - [ ] **Verify:** Results filter by BPM

4. **Track Details:**
   - [ ] **Click:** On a track card
   - [ ] **Verify:** Track detail page loads
   - [ ] **Verify:** Track information is displayed
   - [ ] **Click:** Play button
   - [ ] **Verify:** Audio preview plays
   - [ ] **Verify:** Producer information is shown

### **B. Licensing & Purchases**
**Time: 8 minutes**

1. **Single Track Licensing:**
   - [ ] **Navigate to:** Track detail page
   - [ ] **Click:** "License Track"
   - [ ] **Verify:** License options are displayed
   - [ ] **Select:** A license type
   - [ ] **Click:** "Continue to Checkout"
   - [ ] **Verify:** Checkout page loads
   - [ ] **Fill in:** Test payment information
   - [ ] **Click:** "Complete Purchase"
   - [ ] **Verify:** Payment processes successfully
   - [ ] **Verify:** License is generated
   - [ ] **Verify:** Download link is provided

2. **Subscription Plans:**
   - [ ] **Navigate to:** `/pricing`
   - [ ] **Verify:** Subscription plans are displayed
   - [ ] **Click:** "Subscribe" on a plan
   - [ ] **Verify:** Checkout process works
   - [ ] **Verify:** Subscription is activated

### **C. Client Dashboard**
**Time: 4 minutes**

1. **Profile Management:**
   - [ ] **Navigate to:** Dashboard
   - [ ] **Click:** "Edit Profile"
   - [ ] **Update:** Profile information
   - [ ] **Save:** Changes
   - [ ] **Verify:** Changes are saved

2. **Purchase History:**
   - [ ] **Click:** "Purchase History"
   - [ ] **Verify:** Past purchases are listed
   - [ ] **Click:** On a purchase
   - [ ] **Verify:** Purchase details are shown
   - [ ] **Verify:** Download links work

3. **Favorites:**
   - [ ] **Navigate to:** Catalog
   - [ ] **Click:** Heart icon on a track
   - [ ] **Verify:** Track is added to favorites
   - [ ] **Navigate to:** Favorites page
   - [ ] **Verify:** Track appears in favorites

---

## 🎵 3. Producer Functions Testing (15 minutes)

### **A. Track Upload**
**Time: 8 minutes**

1. **Upload Process:**
   - [ ] **Log in** as producer
   - [ ] **Navigate to:** Producer dashboard
   - [ ] **Click:** "Upload Track"
   - [ ] **Upload:** Test audio file (MP3/WAV)
   - [ ] **Fill in:** Track title: "Test Track"
   - [ ] **Fill in:** Artist name: "Test Artist"
   - [ ] **Select:** Genre: "Pop"
   - [ ] **Select:** Mood: "Happy"
   - [ ] **Set:** BPM: 120
   - [ ] **Set:** Price: $50
   - [ ] **Upload:** Track artwork
   - [ ] **Fill in:** Description
   - [ ] **Click:** "Submit Track"
   - [ ] **Verify:** Track uploads successfully

2. **File Validation:**
   - [ ] **Try to upload:** Invalid file type (e.g., .txt)
   - [ ] **Verify:** Error message appears
   - [ ] **Try to upload:** File too large
   - [ ] **Verify:** Error message appears

### **B. Track Management**
**Time: 4 minutes**

1. **Track Dashboard:**
   - [ ] **Navigate to:** "My Tracks"
   - [ ] **Verify:** Uploaded track appears
   - [ ] **Click:** "Edit" on track
   - [ ] **Update:** Track information
   - [ ] **Save:** Changes
   - [ ] **Verify:** Changes are saved

2. **Track Analytics:**
   - [ ] **Click:** "Analytics" on track
   - [ ] **Verify:** Analytics data is displayed
   - [ ] **Verify:** Play counts are shown
   - [ ] **Verify:** Revenue data is shown

### **C. Producer Dashboard**
**Time: 3 minutes**

1. **Overview:**
   - [ ] **Navigate to:** Producer dashboard
   - [ ] **Verify:** Total earnings are displayed
   - [ ] **Verify:** Pending payouts are shown
   - [ ] **Verify:** Recent sales are listed

2. **Payout Management:**
   - [ ] **Click:** "Payouts"
   - [ ] **Verify:** Payout history is shown
   - [ ] **Verify:** Payout threshold can be set

---

## ⚙️ 4. Admin Functions Testing (10 minutes)

### **A. User Management**
**Time: 5 minutes**

1. **User Overview:**
   - [ ] **Log in** as admin
   - [ ] **Navigate to:** Admin dashboard
   - [ ] **Click:** "Users"
   - [ ] **Verify:** All users are listed
   - [ ] **Test:** Search functionality
   - [ ] **Test:** Filter by account type

2. **User Actions:**
   - [ ] **Click:** On a producer user
   - [ ] **Verify:** User details are shown
   - [ ] **Test:** Approve producer application
   - [ ] **Verify:** Status changes to "approved"

### **B. Content Management**
**Time: 3 minutes**

1. **Track Moderation:**
   - [ ] **Navigate to:** "Pending Tracks"
   - [ ] **Verify:** Pending tracks are listed
   - [ ] **Click:** On a track
   - [ ] **Test:** Approve track
   - [ ] **Verify:** Track status changes

### **C. Analytics**
**Time: 2 minutes**

1. **Reports:**
   - [ ] **Navigate to:** "Analytics"
   - [ ] **Verify:** Revenue reports are shown
   - [ ] **Verify:** User growth data is displayed
   - [ ] **Test:** Export functionality

---

## 💳 5. Payment Testing (10 minutes)

### **A. Stripe Integration**
**Time: 5 minutes**

1. **Test Payments:**
   - [ ] **Use Stripe test card:** 4242 4242 4242 4242
   - [ ] **Complete:** A test purchase
   - [ ] **Verify:** Payment processes successfully
   - [ ] **Verify:** Receipt is generated

2. **Test Failed Payments:**
   - [ ] **Use Stripe test card:** 4000 0000 0000 0002
   - [ ] **Attempt:** Purchase
   - [ ] **Verify:** Error message appears

### **B. Subscription Management**
**Time: 3 minutes**

1. **Subscription Flow:**
   - [ ] **Subscribe:** To a test plan
   - [ ] **Verify:** Subscription is active
   - [ ] **Test:** Cancel subscription
   - [ ] **Verify:** Cancellation is processed

### **C. Payout System**
**Time: 2 minutes**

1. **Producer Payouts:**
   - [ ] **Log in** as producer
   - [ ] **Navigate to:** Payouts
   - [ ] **Verify:** Payout calculations are correct
   - [ ] **Test:** Request payout (if threshold met)

---

## 🗄️ 6. Database Testing (5 minutes)

### **A. Data Integrity**
**Time: 3 minutes**

1. **User Data:**
   - [ ] **Verify:** User profiles are created correctly
   - [ ] **Verify:** Terms acceptance is stored
   - [ ] **Verify:** Account types are set correctly

2. **Track Data:**
   - [ ] **Verify:** Track metadata is stored
   - [ ] **Verify:** File URLs are generated
   - [ ] **Verify:** Relationships are maintained

### **B. API Testing**
**Time: 2 minutes**

1. **Endpoints:**
   - [ ] **Test:** Track search API
   - [ ] **Test:** User profile API
   - [ ] **Verify:** Error handling works

---

## 🎨 7. UI/UX Testing (10 minutes)

### **A. Responsive Design**
**Time: 5 minutes**

1. **Mobile Testing:**
   - [ ] **Open:** Site on mobile device
   - [ ] **Test:** Navigation menu
   - [ ] **Test:** Forms on mobile
   - [ ] **Verify:** Touch interactions work

2. **Tablet Testing:**
   - [ ] **Open:** Site on tablet
   - [ ] **Verify:** Layout adapts correctly
   - [ ] **Test:** Touch targets are appropriate

3. **Desktop Testing:**
   - [ ] **Test:** Different screen sizes
   - [ ] **Verify:** Keyboard navigation
   - [ ] **Test:** Mouse interactions

### **B. Navigation**
**Time: 3 minutes**

1. **Menu Navigation:**
   - [ ] **Test:** Main navigation links
   - [ ] **Verify:** Breadcrumbs work
   - [ ] **Test:** Footer links
   - [ ] **Verify:** Search functionality

2. **User Flow:**
   - [ ] **Test:** Complete user journeys
   - [ ] **Verify:** Redirects work correctly
   - [ ] **Test:** Back button behavior

### **C. Accessibility**
**Time: 2 minutes**

1. **Basic Accessibility:**
   - [ ] **Test:** Keyboard navigation
   - [ ] **Verify:** Focus indicators
   - [ ] **Check:** Color contrast
   - [ ] **Test:** Screen reader compatibility

---

## 🔒 8. Security Testing (5 minutes)

### **A. Authentication Security**
**Time: 3 minutes**

1. **Session Management:**
   - [ ] **Log in** to account
   - [ ] **Close:** Browser tab
   - [ ] **Reopen:** Site
   - [ ] **Verify:** Still logged in (or properly logged out)

2. **Access Control:**
   - [ ] **Try to access:** Admin page as regular user
   - [ ] **Verify:** Access is denied
   - [ ] **Try to access:** Producer dashboard as client
   - [ ] **Verify:** Access is denied

### **B. Data Protection**
**Time: 2 minutes**

1. **Input Validation:**
   - [ ] **Test:** SQL injection attempts
   - [ ] **Test:** XSS attempts
   - [ ] **Verify:** Input is properly sanitized

---

## 📊 Testing Summary

### **Test Results Tracking**

**Date:** _______________
**Tester:** _______________
**Environment:** _______________

**Passed Tests:** ___ / ___ (___%)
**Failed Tests:** ___ / ___
**Critical Issues:** ___
**Minor Issues:** ___

### **Issues Found**

| Issue | Severity | Description | Steps to Reproduce |
|-------|----------|-------------|-------------------|
|       |          |             |                   |
|       |          |             |                   |
|       |          |             |                   |

### **Recommendations**

1. **Immediate Actions:**
   - [ ] Fix critical issues
   - [ ] Address security concerns
   - [ ] Resolve payment issues

2. **Follow-up Actions:**
   - [ ] Address minor issues
   - [ ] Improve user experience
   - [ ] Optimize performance

---

## 🎯 Success Criteria

**Testing is considered successful when:**
- [ ] All critical user flows work correctly
- [ ] Payment processing functions properly
- [ ] User data is secure and protected
- [ ] No critical bugs remain
- [ ] Performance meets requirements
- [ ] User experience is smooth and intuitive

---

*Complete this testing script before each major deployment to ensure quality and reliability.*
