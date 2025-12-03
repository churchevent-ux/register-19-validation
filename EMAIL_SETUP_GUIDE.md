# Email Auto-Reply Setup Guide

## Overview
This application now includes automatic email notifications for new registrations using EmailJS.

## Template ID
Your EmailJS template ID: **template_b7zcbv3**

## Setup Instructions

### 1. Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Add Email Service
1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the instructions to connect your email account
5. Copy the **Service ID** (you'll need this later)

### 3. Configure Email Template
1. Go to **Email Templates** in your EmailJS dashboard
2. Click **Create New Template**
3. Use the template ID: **template_b7zcbv3** (or create a new one)
4. Design your email template with these variables:
   - `{{to_email}}` - Recipient email
   - `{{to_name}}` - Participant/Volunteer name
   - `{{participant_name}}` - Full name
   - `{{unique_id}}` - Registration ID (DGK-xxx, DGT-xxx, or DGV-xxx)
   - `{{registration_date}}` - Date of registration
   - `{{event_name}}` - Event name
   - `{{event_dates}}` - Event dates
   - `{{category}}` - Category (Kids/Teen/Volunteer)
   - `{{contact_number}}` - Contact number

### 4. Get Your Public Key
1. Go to **Account** → **General** in EmailJS dashboard
2. Copy your **Public Key** (also called User ID)

### 5. Update Configuration
Open the file: `src/services/emailService.js`

Replace these values:
```javascript
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // Replace with your Service ID from step 2
const EMAILJS_TEMPLATE_ID = 'template_b7zcbv3'; // Your template ID (already set)
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Replace with your Public Key from step 4
```

### 6. Example Email Template

Here's a sample email template you can use in EmailJS:

**Subject:** Registration Confirmed - DEO GRATIAS 2025

**Body:**
```
Dear {{to_name}},

Thank you for registering for {{event_name}}!

Registration Details:
- Name: {{participant_name}}
- Registration ID: {{unique_id}}
- Category: {{category}}
- Event Dates: {{event_dates}}
- Registration Date: {{registration_date}}

Important Information:
- Please keep your Registration ID safe
- Bring a printed copy of this confirmation
- Arrive 30 minutes before the event start time
- Contact Number on File: {{contact_number}}

Event Location:
St. Mary's Church, Dubai
P.O. BOX: 51200, Dubai, U.A.E

For any queries, please contact:
- Prem Das: +971504751801
- Jenny Thekkooden: +971561213388

We look forward to seeing you!

Best regards,
DEO GRATIAS 2025 Team
St. Mary's Church, Dubai
```

## Testing

### Test the Email Service
1. Start your development server:
   ```bash
   npm start
   ```

2. Complete a test registration
3. Check the console for email sending logs
4. Verify the email arrives in the recipient's inbox

### Troubleshooting

#### Email Not Sending
- Check console for error messages
- Verify Service ID, Template ID, and Public Key are correct
- Ensure your EmailJS account is verified
- Check EmailJS dashboard for any service issues
- Verify template variables match the ones in emailService.js

#### Email Goes to Spam
- Add your domain to EmailJS allowed domains
- Use a professional email service (not free Gmail)
- Ask users to whitelist your email address

#### Rate Limits
- Free EmailJS account: 200 emails/month
- For higher volume, upgrade to a paid plan

## Features Implemented

### Participant Registration (Register.jsx)
- Sends confirmation email after successful registration
- Includes participant details and unique ID
- Emails sent to the address provided in registration form

### Volunteer Registration (VolunteerRegister.jsx)
- Sends confirmation email after volunteer registration
- Includes volunteer ID and role information
- Emails sent to volunteer's registered email

### Error Handling
- Emails are sent asynchronously
- Registration continues even if email fails
- Errors are logged to console for debugging
- User experience is not affected by email delivery issues

## Customization

### Multiple Templates
You can create different templates for different purposes:

```javascript
// In your component
import { sendCustomEmail } from '../services/emailService';

// Send with different template
await sendCustomEmail('template_xyz123', {
  to_email: 'user@example.com',
  custom_field: 'value'
});
```

### Additional Email Notifications
To send emails at other points in your application:

```javascript
import { sendCustomEmail } from '../services/emailService';

const sendReminderEmail = async (userData) => {
  await sendCustomEmail('template_reminder', {
    to_email: userData.email,
    reminder_message: 'Your event is tomorrow!',
    // ... other fields
  });
};
```

## Production Deployment

Before deploying to production:
1. ✅ Update all three configuration values in emailService.js
2. ✅ Test email delivery thoroughly
3. ✅ Set up email template with proper branding
4. ✅ Consider upgrading EmailJS plan for higher limits
5. ✅ Monitor email delivery in EmailJS dashboard

## Support

For EmailJS support:
- Documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- Support: contact@emailjs.com

For application support:
- Check console logs for errors
- Review emailService.js configuration
- Test with different email addresses
