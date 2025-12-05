# Email Notification System - Setup Guide

## Overview

PVARA's recruitment platform includes an email notification system that automatically sends emails to candidates at key stages of the recruitment process.

## Current Status

✅ **Email System Configured**
- Backend email server ready (`server.js`)
- Email templates created for all stages
- Frontend integration complete
- Graceful fallback (emails log to console if server not running)

## Email Templates

The system automatically sends emails for:

1. **APPLICATION_RECEIVED** - When candidate submits application
2. **TEST_INVITED** - When candidate is invited to take assessment
3. **APPLICATION_SHORTLISTED** - When candidate is added to shortlist
4. **OFFER_EXTENDED** - When job offer is made
5. **REJECTION** - When candidate is rejected (future implementation)

## Quick Setup (5 minutes)

### Option 1: Using Gmail (Easiest)

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Security → 2-Step Verification → Turn On

2. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (remove spaces)

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Configure credentials in .env**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   REACT_APP_API_URL=http://localhost:5000
   ```

5. **Start the email server**
   ```bash
   # Terminal 1: Start backend
   npm run server
   
   # Terminal 2: Start frontend
   npm start
   
   # OR run both together:
   npm run dev
   ```

### Option 2: Using SendGrid (Production Recommended)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Update `server.js` transporter configuration:
   ```javascript
   const transporter = nodemailer.createTransport({
     host: 'smtp.sendgrid.net',
     port: 587,
     auth: {
       user: 'apikey',
       pass: process.env.SENDGRID_API_KEY
     }
   });
   ```

### Option 3: Using AWS SES

1. Set up AWS SES and verify domain
2. Get SMTP credentials
3. Update `server.js` transporter configuration:
   ```javascript
   const transporter = nodemailer.createTransport({
     host: 'email-smtp.us-east-1.amazonaws.com',
     port: 587,
     auth: {
       user: process.env.AWS_SES_USER,
       pass: process.env.AWS_SES_PASSWORD
     }
   });
   ```

## Testing the Email System

### 1. Check Server Status
```bash
npm run server
```

Look for:
```
✅ Email service ready - emails will be sent
🚀 PVARA Email Server Running
   Port: 5000
```

### 2. Test Email Manually
```bash
curl -X POST http://localhost:5000/api/send-email-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "templateType": "APPLICATION_RECEIVED",
    "data": {
      "candidateName": "John Doe",
      "jobTitle": "Senior Developer"
    }
  }'
```

### 3. Test in Application
1. Start both servers (`npm run dev`)
2. Create a test job
3. Submit an application
4. Check console for: `📧 APPLICATION_RECEIVED email sent to...`
5. Check your inbox

## Troubleshooting

### "Email service not configured properly"
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- For Gmail: Make sure you're using App Password, not regular password
- Verify 2FA is enabled on Gmail account

### "Email server not running"
- Start backend: `npm run server`
- Check port 5000 is not in use: `lsof -ti:5000`
- Verify REACT_APP_API_URL in .env matches server port

### "Connection timeout"
- Gmail may block access from "less secure apps"
- Use App Password instead of regular password
- Check firewall settings

### Emails go to spam
- Add your email to safe senders list
- For production: Set up SPF/DKIM records
- Use a verified domain email address

## Production Deployment

### Netlify + Backend Service

1. **Frontend (Netlify)**
   - Deploy as usual
   - Add environment variable: `REACT_APP_API_URL=https://your-backend.com`

2. **Backend (Heroku/Railway/Render)**
   ```bash
   # Deploy server.js separately
   git push heroku main
   
   # Set environment variables
   heroku config:set EMAIL_USER=your-email@gmail.com
   heroku config:set EMAIL_PASSWORD=your-app-password
   ```

3. **Update Frontend .env**
   ```env
   REACT_APP_API_URL=https://your-backend-url.herokuapp.com
   ```

### Environment Variables Checklist

**Frontend (.env)**
- `REACT_APP_API_URL` - Backend API URL

**Backend (.env)**
- `EMAIL_USER` - Email address for sending
- `EMAIL_PASSWORD` - Email password/app password
- `PORT` - Server port (default: 5000)

## Email Flow Diagram

```
Application → Screening → Test → Shortlist → Offer
     ↓            ↓         ↓        ↓         ↓
APPLICATION   (manual)  TEST_   SHORTLIST  OFFER_
_RECEIVED             INVITED   EMAIL    EXTENDED
```

## Customization

### Adding New Templates

1. **Update server.js** (line ~115):
   ```javascript
   const templates = {
     YOUR_TEMPLATE: {
       subject: 'Your Subject',
       body: 'Your message body'
     }
   };
   ```

2. **Call from frontend**:
   ```javascript
   sendEmailNotification(
     candidateEmail,
     'YOUR_TEMPLATE',
     { candidateName: 'John', customData: 'value' }
   );
   ```

### Customizing Email Design

Edit the HTML template in `server.js` (line ~58):
```javascript
const htmlBody = `
  <html>
    <!-- Your custom HTML design -->
  </html>
`;
```

## Performance & Limits

### Gmail Limits
- 500 emails/day (free account)
- 2000 emails/day (Google Workspace)
- Rate limit: 1 email/second

### SendGrid Limits
- 100 emails/day (free)
- Unlimited with paid plans
- Better deliverability

### AWS SES
- 200 emails/day (free tier)
- $0.10 per 1000 emails after
- Requires domain verification

## Security Best Practices

1. **Never commit .env file**
   - Already in .gitignore
   - Use environment variables in production

2. **Use App Passwords**
   - Never use your main Gmail password
   - Rotate passwords regularly

3. **Validate Email Addresses**
   - Basic validation already implemented
   - Consider email verification service

4. **Rate Limiting**
   - Implement rate limiting for bulk sends
   - Use queue system for large batches

## Support

### Email Not Sending?
1. Check server logs: `npm run server`
2. Test manually with curl command above
3. Verify .env configuration
4. Check Gmail security settings

### Need Help?
- Check console logs for detailed error messages
- Review server.js line ~35 for connection test
- All emails fallback to console logging if server unavailable

## Next Steps

- [ ] Add email verification for new candidates
- [ ] Implement rejection email automation
- [ ] Add email templates for interview reminders
- [ ] Create email analytics dashboard
- [ ] Add unsubscribe functionality
- [ ] Implement email queue for bulk operations

