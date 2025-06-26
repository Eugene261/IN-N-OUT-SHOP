# Messaging System Setup Guide

## Overview
The messaging system allows communication between admins and super admins with real-time notifications and email alerts.

## Features Implemented
✅ **Redux-based state management** - Messages properly sync across components
✅ **Email notifications** - Users receive email alerts when receiving new messages  
✅ **Notification badges** - Red dots show unread message counts in navigation
✅ **Responsive design** - Works on mobile and desktop
✅ **Message persistence** - Messages are stored in MongoDB
✅ **User role-based messaging** - Admins can message super admins and vice versa

## Required Environment Variables

### Server (.env)
Add these variables to your server .env file:

```bash
# Messaging System Feature Flags
MESSAGING_SYSTEM_ENABLED=true
ENABLE_NEW_FEATURES=true
ENABLE_AUDIO_MESSAGES=true
ENABLE_VIDEO_MESSAGES=true

# Email Configuration (for message notifications)
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="IN-N-OUT Store" <your-email@gmail.com>
EMAIL_DOMAIN=in-nd-out.com

# Client URL for email links
CLIENT_URL=https://www.in-nd-out.com
```

### Client (.env)
Add these variables to your client .env file:

```bash
# API Configuration
VITE_API_URL=https://api.in-nd-out.com

# Messaging Configuration
VITE_MESSAGING_ENABLED=true
VITE_ENABLE_REAL_TIME_MESSAGING=true
```

## Deployment Steps

### 1. Update Environment Variables
1. **Vercel API Project**: Add the server environment variables to your API project settings
2. **Vercel Frontend Project**: Add the client environment variables to your frontend project settings

### 2. Redeploy Both Projects
```bash
# Trigger redeployment
git add .
git commit -m "Enable messaging system with notifications and email alerts"
git push origin main
```

### 3. Verify Setup
After deployment, check:
- ✅ Messaging pages load without errors
- ✅ Can send and receive messages
- ✅ Messages display properly in conversation list
- ✅ Notification badges appear for unread messages
- ✅ Email notifications are sent when messages are received

## How the System Works

### Message Flow
1. **User sends message** → Message saved to database
2. **Backend triggers email notification** → Recipient gets email alert
3. **Frontend updates in real-time** → Message appears immediately
4. **Unread count updates** → Notification badges update across UI

### Email Notifications
When a user receives a message:
- Immediate email notification sent to recipient
- Email includes message preview and direct link to conversation
- Professional email template with IN-N-OUT branding
- Anti-spam headers for better deliverability

### Notification System
- **Red badges** show unread message counts
- **Navigation sidebar** displays notification indicators
- **Conversation list** shows individual unread counts
- **Auto-read marking** when opening conversations

## Database Collections Used
- **conversations** - Stores conversation metadata and participants
- **messages** - Stores individual messages and attachments
- **users** - User information for messaging permissions

## API Endpoints Available
- `GET /api/common/messaging/conversations` - Get user conversations
- `GET /api/common/messaging/users/available` - Get available users to message
- `POST /api/common/messaging/conversations/direct` - Create new conversation
- `GET /api/common/messaging/conversations/:id/messages` - Get conversation messages
- `POST /api/common/messaging/conversations/:id/messages/text` - Send text message
- `POST /api/common/messaging/conversations/:id/read` - Mark messages as read

## Troubleshooting

### Messages Not Displaying
1. Check that `MESSAGING_SYSTEM_ENABLED=true` in server .env
2. Verify `ENABLE_NEW_FEATURES=true` is set
3. Check browser console for API errors
4. Ensure user has proper role (admin or superAdmin)

### Email Notifications Not Working
1. Verify email environment variables are set correctly
2. Check email provider credentials (Gmail app password)
3. Review server logs for email sending errors
4. Test email configuration with other email types

### Notification Badges Not Showing
1. Ensure Redux store is properly configured
2. Check that messaging slice is imported in store
3. Verify notification badge component is imported in sidebars
4. Check browser console for Redux errors

## Security Features
- **Role-based access** - Only admins and super admins can use messaging
- **Participant validation** - Users can only access conversations they're part of
- **Input sanitization** - All message content is validated and sanitized
- **Authentication required** - All endpoints require valid JWT token

## Performance Optimizations
- **Pagination** - Messages load in batches of 50
- **Redux caching** - Conversations and messages cached in frontend
- **Database indexes** - Optimized queries for conversations and messages
- **Lazy loading** - Only active conversation messages are loaded

## Future Enhancements
- Real-time WebSocket integration for instant message delivery
- File attachment support (images, documents)
- Message read receipts and typing indicators
- Message search and filtering
- Conversation archiving and management 