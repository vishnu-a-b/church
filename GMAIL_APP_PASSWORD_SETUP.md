# Gmail App Password Setup Guide

## Current Issue
Gmail is rejecting the credentials with error: `Invalid login: Username and Password not accepted`

## Steps to Fix:

### 1. Verify 2-Step Verification is Enabled

1. Go to: https://myaccount.google.com/security
2. Look for "2-Step Verification" section
3. **If it's OFF**, click to enable it
4. Follow the setup wizard to enable 2-Step Verification

### 2. Generate a New App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords

2. You might need to sign in again

3. **Select app and device:**
   - Select app: **Mail** (or **Other**)
   - Select device: **Other (Custom name)**
   - Enter name: **Church Wallet System**

4. Click **Generate**

5. Google will show you a 16-character password like: `abcd efgh ijkl mnop`

6. **IMPORTANT:** Copy this password (you can copy it with or without spaces)

### 3. Update the .env File

Open `/Users/vishnuab/Official/Church/server/.env` and update:

```env
EMAIL_USERNAME=sbnctrl@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Note:** Remove all spaces from the App Password when pasting it!

Example:
- Google shows: `ibrx vhhj buif zzsb`
- You should enter: `ibrxvhhjbuifzzsb`

### 4. Test the Configuration

Run the test script:

```bash
cd /Users/vishnuab/Official/Church/server
npx ts-node src/test-email.ts
```

You should see:
```
✅ Email server is ready to send messages
✅ Test email sent successfully!
```

### 5. Restart the Server

After updating the .env file:

```bash
npm run dev
```

## Troubleshooting

### Error: "2-Step Verification is not turned on"
- You must enable 2-Step Verification before you can create App Passwords
- Follow Step 1 above

### Error: "The password you entered is incorrect"
- Make sure you removed ALL spaces from the App Password
- Try generating a new App Password
- Make sure you're using the App Password, not your regular Gmail password

### Still Not Working?
Try these additional steps:

1. **Use a different email service** (if you have one):
   - Gmail: smtp.gmail.com:587
   - Outlook: smtp-mail.outlook.com:587
   - Yahoo: smtp.mail.yahoo.com:587

2. **Check Gmail settings:**
   - Go to Gmail → Settings → Forwarding and POP/IMAP
   - Make sure IMAP is enabled

3. **Check if "Less secure app access" is needed:**
   - This is deprecated but might help: https://myaccount.google.com/lesssecureapps
   - However, App Passwords should work without this

## Quick Commands

Test email after updating .env:
```bash
cd /Users/vishnuab/Official/Church/server
npx ts-node src/test-email.ts
```

Check current .env configuration:
```bash
grep EMAIL_ /Users/vishnuab/Official/Church/server/.env
```

## Need Help?

If you're still having issues:
1. Double-check the email address is `sbnctrl@gmail.com`
2. Make sure you're logged into the correct Google account
3. Try using a different Gmail account if available
4. Consider using a different email service (Outlook, Yahoo, etc.)

---

**Note:** App Passwords are more secure than using your regular Gmail password and are the recommended way to authenticate third-party apps.
