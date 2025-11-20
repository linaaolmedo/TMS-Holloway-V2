# Admin User Impersonation Implementation

## Overview

The admin impersonation feature allows administrators to view and interact with the system as any user, with comprehensive logging and visual indicators. This is useful for troubleshooting, customer support, and testing.

## Features Implemented

### 1. Visual Indicators
- **Red Border**: The entire application has a 4px red border when in impersonation mode
- **Persistent Banner**: A red banner at the top of every page shows:
  - Who is being impersonated (name and role)
  - "Exit Impersonation" button
  - Warning icon

### 2. Impersonation Flow

#### Starting Impersonation
1. Admin navigates to `/admin/users`
2. Clicks "Impersonate" button next to any user
3. Modal appears requesting a reason for impersonation
4. Upon submission:
   - Session is created in `impersonation_logs` table
   - Secure cookie `impersonation_session_id` is set
   - Admin is redirected to the target user's default portal

#### During Impersonation
- Admin sees the interface as the target user would see it
- Red border and banner are visible on all pages
- All analytical actions are logged to the session's `actions_taken` JSONB array
- Middleware validates the session on every request

#### Ending Impersonation
- Admin clicks "Exit Impersonation" in the banner
- Session is marked as ended in database
- Cookie is cleared
- Admin is redirected back to `/admin/users`

### 3. Security Features

#### Access Control
- Only admins and executives can impersonate users
- Admins CANNOT impersonate other admins or executives
- Sessions are validated on every request via middleware

#### Session Tracking
- All sessions stored in `impersonation_logs` table
- Tracks:
  - Admin user ID
  - Target user ID
  - Start time
  - End time
  - Reason for impersonation
  - All actions taken during session

#### Action Logging
The following actions are logged during impersonation:
- **Loads**: Creating loads, updating load status
- **Customers**: Creating customers
- **Carriers**: Creating carriers
- Additional actions can be easily added using the helper function

### 4. Admin Security Dashboard

Located at `/admin/security`, shows:
- **Active Impersonation Sessions**: Real-time view of who is impersonating whom
- **Impersonation History**: Complete log of all sessions with duration
- **Security Metrics**: 
  - Impersonations today
  - Impersonations this week
  - Average session duration

## Technical Architecture

### Files Created
1. **`lib/impersonation.ts`**: Helper functions for checking impersonation context
2. **`components/layout/impersonation-banner.tsx`**: Red banner component
3. **`app/api/impersonation/start/route.ts`**: API endpoint to start impersonation
4. **`app/api/impersonation/end/route.ts`**: API endpoint to end impersonation

### Files Modified
1. **`app/actions/admin.ts`**: Added impersonation server actions
2. **`middleware.ts`**: Added impersonation session validation
3. **`app/layout.tsx`**: Added red border and banner when impersonating
4. **`components/admin/user-management-client.tsx`**: Wired up impersonate button
5. **`app/actions/loads.ts`**: Added impersonation logging
6. **`app/actions/customers.ts`**: Added impersonation logging
7. **`app/actions/carriers.ts`**: Added impersonation logging

### Database Schema

The `impersonation_logs` table (already existed) stores:
```sql
- id (bigserial)
- admin_user_id (uuid) - The admin doing the impersonation
- target_user_id (uuid) - The user being impersonated
- started_at (timestamptz)
- ended_at (timestamptz) - NULL for active sessions
- reason (text)
- ip_address (text)
- user_agent (text)
- actions_taken (jsonb) - Array of actions performed
```

### Cookie Management

The impersonation session uses a secure HTTP-only cookie:
- Name: `impersonation_session_id`
- Value: The session ID from `impersonation_logs` table
- HTTP Only: true
- Secure: true (in production)
- SameSite: lax
- Max Age: 24 hours

## Adding Logging to New Actions

To add impersonation logging to any server action:

```typescript
import { getImpersonationContext } from '@/lib/impersonation'
import { logImpersonationAction } from './admin'

// Helper function (add once per file)
async function logIfImpersonating(action: string, metadata?: any) {
  const context = await getImpersonationContext()
  if (context.isImpersonating) {
    await logImpersonationAction(action, metadata)
  }
}

// In your action function, after successful operation:
await logIfImpersonating('action_name', {
  entity_id: entity.id,
  entity_name: entity.name,
  // ... other relevant metadata
})
```

## Testing

### Test Cases

1. **Start Impersonation**
   - Go to `/admin/users`
   - Click impersonate on a non-admin user
   - Enter a reason
   - Verify redirect to user's portal
   - Verify red border and banner appear

2. **During Impersonation**
   - Navigate to different pages
   - Perform actions (create load, update status, etc.)
   - Verify actions are logged

3. **End Impersonation**
   - Click "Exit Impersonation" button
   - Verify redirect to `/admin/users`
   - Verify red border and banner disappear

4. **Security Dashboard**
   - Go to `/admin/security`
   - Start an impersonation session
   - Verify it appears in "Active Sessions"
   - End the session
   - Verify it moves to "History"

5. **Security Restrictions**
   - Try to impersonate an admin user
   - Verify it's blocked with error message

## Usage Guidelines

### When to Use Impersonation
- Customer support requests requiring access to user's view
- Troubleshooting user-reported issues
- Testing user-specific functionality
- Verifying permissions and access controls

### Best Practices
1. **Always provide a clear reason** when starting impersonation
2. **Minimize session duration** - exit as soon as task is complete
3. **Document actions taken** - the system logs automatically, but note the issue resolution
4. **Regular audits** - Review impersonation logs monthly
5. **Never impersonate for unauthorized purposes**

## API Endpoints

### POST `/api/impersonation/start`
Starts an impersonation session.

**Request Body:**
```json
{
  "targetUserId": "uuid",
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "number",
    "targetUser": { ... },
    "redirectPath": "/path"
  }
}
```

### POST `/api/impersonation/end`
Ends the current impersonation session.

**Response:**
```json
{
  "success": true
}
```

## Future Enhancements

Potential improvements:
1. IP address and user agent tracking
2. Configurable session timeout
3. Email notifications when impersonation starts/ends
4. More granular action logging
5. Ability to force-end someone else's impersonation session
6. Export impersonation audit logs
7. Impersonation approval workflow for sensitive accounts

## Support

For issues or questions about the impersonation feature, contact the development team or check the audit logs at `/admin/audit-logs`.

