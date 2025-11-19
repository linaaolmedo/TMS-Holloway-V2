# Admin Portal Implementation Guide

## Overview

The Admin Portal provides comprehensive system oversight, user management, audit logging, and analytics capabilities for users with `admin` or `executive` roles. Access is strictly controlled via middleware and server-side role verification.

## Access Control

### Role Requirements
- **admin** - Full administrative access to all admin features
- **executive** - Same access as admin for oversight and reporting

### Security Features
- Middleware protection on `/admin` routes
- Server-side role verification in all admin actions
- Comprehensive audit logging of all admin activities
- Impersonation tracking and monitoring

## Database Migrations

Run the following migrations in Supabase SQL editor in order:

1. **006_admin_audit_logs.sql** - Enhanced audit logging
2. **007_impersonation_logs.sql** - Impersonation tracking
3. **008_user_sessions.sql** - Session management
4. **009_system_settings.sql** - System configuration
5. **010_user_last_login.sql** - User activity tracking

All migrations are **safe for UAT environments**:
- Only adds new tables (no existing data affected)
- Only adds nullable columns or columns with defaults
- No breaking changes to existing functionality

## Admin Portal Structure

### Routes

```
/admin                    - Main dashboard with system KPIs
/admin/users              - User management & role assignment
/admin/companies          - Company management
/admin/audit-logs         - Comprehensive audit log viewer
/admin/analytics          - Deep-dive analytics & BI
/admin/security           - Security monitoring & impersonation logs
/admin/settings           - System configuration
/admin/data-tools         - Bulk operations & maintenance
```

### Navigation

The admin portal uses a dedicated sidebar with the following items:
- Dashboard (System Overview)
- Users (User Management)
- Companies (Company Management)
- Audit Logs (Activity Tracking)
- Analytics (Business Intelligence)
- Security (Security Monitoring)
- Settings (System Configuration)
- Data Tools (Bulk Operations)

## Features by Section

### 1. Dashboard (`/admin`)

**Purpose:** System-wide overview and key metrics

**Metrics Displayed:**
- Total users by role breakdown
- Total companies (shippers/carriers)
- Load metrics (last 30 days)
- Revenue trends and margins
- Recent admin activities

**Key Components:**
- `AdminDashboardWrapper` - Client component for dashboard
- Uses `getSystemAnalytics()` server action

### 2. User Management (`/admin/users`)

**Purpose:** Manage all users across all roles

**Features:**
- Search users by name or email
- Filter by role and active status
- View user details with company associations
- Edit user information (name, email, phone)
- Change user roles (dropdown selection)
- Activate/deactivate users
- Create new users
- View last login dates

**Key Components:**
- `UserManagementClient` - Main client component
- Uses server actions: `getSystemUsers()`, `updateUserRole()`, `toggleUserActive()`, `updateUser()`, `createUser()`

**User Creation:**
- Admin can create users with any role
- Required fields: email, role
- Optional fields: name, phone, company association
- New users start as active by default

### 3. Company Management (`/admin/companies`)

**Purpose:** View and manage all companies in the system

**Features:**
- View all companies with type badges
- Filter by company type (shipper/carrier/internal)
- Search by company name
- View creation and update dates

**Key Components:**
- `CompanyManagementClient` - Client component
- Uses `getAllCompanies()` server action

**Statistics:**
- Total companies count
- Breakdown by type

### 4. Audit Logs (`/admin/audit-logs`)

**Purpose:** Comprehensive activity tracking and monitoring

**Features:**
- View all system activities
- Filter by entity type (user, company, load, invoice, document, setting, system)
- Filter by action (created, updated, deleted, login, role_changed, impersonated, etc.)
- View detailed metadata for each log entry
- Identify impersonated actions
- Export to CSV for external analysis
- Pagination for performance

**Key Components:**
- `AuditLogViewer` - Client component with filtering
- Uses `getAuditLogs()` server action

**Audit Log Details:**
- Timestamp of action
- User who performed action
- Action type
- Entity affected
- Full metadata (before/after values)
- Impersonation indicator

**CSV Export:**
- Includes: timestamp, user, action, entity type, entity ID, impersonator, metadata
- Downloads with timestamp in filename

### 5. Analytics (`/admin/analytics`)

**Purpose:** Deep-dive analytics and business intelligence

**Metrics:**
- **Revenue Overview (30 days):**
  - Total customer revenue
  - Total carrier cost
  - Gross margin and percentage

- **Load Performance:**
  - Total loads
  - Breakdown by status
  - Delivery metrics

- **User Metrics:**
  - Total users
  - Breakdown by role

- **Company Metrics:**
  - Total shippers
  - Total carriers

- **KPIs:**
  - Average revenue per load
  - Average cost per load
  - Average margin per load
  - Margin percentage analysis

**Key Components:**
- `AnalyticsDashboard` - Client component
- Uses `getSystemAnalytics()` server action

### 6. Security Dashboard (`/admin/security`)

**Purpose:** Security monitoring and impersonation tracking

**Features:**
- View active impersonation sessions (highlighted)
- Impersonation history with full details
- Session duration tracking
- Security metrics (today, week, all-time)
- Average session duration
- IP address tracking (if implemented)

**Key Components:**
- `SecurityDashboard` - Client component
- Uses `getImpersonationLogs()` server action

**Security Metrics:**
- Active impersonation sessions
- Total impersonations
- Impersonations today
- Impersonations this week
- Average session duration

**Impersonation Log Details:**
- Admin user who initiated
- Target user impersonated
- Start and end times
- Session duration
- Reason provided
- Actions taken during session

### 7. System Settings (`/admin/settings`)

**Purpose:** Configure global system settings

**Settings Categories:**
- **General:** System-wide preferences
- **Pricing:** Default margins, payment terms
- **Features:** Feature flags, enable/disable features
- **Documents:** Invoice/load number prefixes, templates
- **Notifications:** Email settings, notification preferences
- **Security:** Session timeouts, login attempt limits

**Features:**
- Filter settings by category
- Edit settings inline with type-appropriate inputs
- Save button appears when value changes
- Settings metadata (description, type, category, public flag)
- Last updated timestamp

**Setting Types:**
- **String:** Text input
- **Number:** Numeric input
- **Boolean:** Toggle switch
- **JSON:** Textarea with JSON validation
- **Template:** Textarea for templates

**Key Components:**
- `SettingsForm` - Client component with inline editing
- Uses `getSystemSettings()`, `updateSystemSetting()` server actions

**Default Settings Included:**
- Default customer payment terms (Net 30)
- Default margin percent (15%)
- Smart dispatch feature toggle
- Real-time tracking toggle
- Invoice/load number prefixes
- Session timeout (8 hours)
- Max login attempts (5)
- Company name

### 8. Data Tools (`/admin/data-tools`)

**Purpose:** Bulk operations and data maintenance

**Features:**
- **Bulk Rate Updates:** Upload CSV to update rates
- **Archive Old Loads:** Soft delete loads older than date
- **Data Integrity Check:** Scan for inconsistencies

**Safety Features:**
- Warning banners for all operations
- Best practices guide
- Preview before execution (for some operations)
- Database statistics dashboard

**Key Components:**
- `BulkOperationsPanel` - Client component
- Server actions for bulk operations (to be implemented)

**Database Statistics:**
- Total records
- Active records
- Archived records
- Storage usage

## Server Actions

All admin operations use server actions located in `/app/actions/admin.ts`:

### User Management
- `getSystemUsers(filters?)` - Fetch all users with optional filters
- `updateUserRole(userId, newRole)` - Change user role
- `toggleUserActive(userId, isActive)` - Activate/deactivate user
- `updateUser(userId, updates)` - Update user details
- `createUser(data)` - Create new user

### Audit & Security
- `getAuditLogs(filters?)` - Fetch audit logs with filters
- `getImpersonationLogs(limit)` - Fetch impersonation history

### Analytics & Reporting
- `getSystemAnalytics()` - Get comprehensive system metrics

### Company Management
- `getAllCompanies(filters?)` - Fetch all companies

### System Configuration
- `getSystemSettings(category?)` - Fetch system settings
- `updateSystemSetting(key, value)` - Update setting value

### Security Helper
- `verifyAdminAccess()` - Verify user has admin/executive role
- `logAuditEntry()` - Log action to audit_logs table

## Audit Logging

All admin actions are automatically logged with:
- Entity type and ID
- Action performed
- User who performed action
- User role
- Timestamp
- Metadata (before/after values)
- Impersonation indicator (if applicable)

### Logged Actions
- User creation, updates, role changes, activation/deactivation
- System setting updates
- Bulk operations
- Impersonation sessions
- Any data modifications

## Security Considerations

### Access Control
1. Middleware enforces role-based access
2. Server actions verify admin role on every call
3. Unauthorized users redirected to appropriate portal

### Audit Trail
1. Every admin action logged to `audit_logs`
2. Impersonation sessions tracked separately
3. All logs include user context and metadata

### Data Protection
1. No destructive operations without confirmation
2. Soft deletes used for data archival
3. Export functions for backup/compliance

## Usage Guide

### Accessing Admin Portal

1. Log in with admin or executive credentials
2. Navigate to `/admin` or use navigation menu
3. Access restricted if user lacks proper role

### Creating a User

1. Go to `/admin/users`
2. Click "Create User" button
3. Fill in required fields (email, role)
4. Optionally add name, phone, company
5. Submit to create

### Changing User Role

1. Go to `/admin/users`
2. Find user in table
3. Use role dropdown in their row
4. Change is immediate and logged

### Viewing Audit Logs

1. Go to `/admin/audit-logs`
2. Use filters to narrow results
3. Click "View" on any log for full details
4. Export to CSV for external analysis

### Updating System Settings

1. Go to `/admin/settings`
2. Filter by category if needed
3. Edit value inline
4. Click "Save" button that appears
5. Change is immediate

### Reviewing Security Events

1. Go to `/admin/security`
2. View active impersonation sessions (if any)
3. Review impersonation history
4. Check security metrics

## Testing Checklist

Before deploying to production:

- [ ] Verify only admin/executive users can access `/admin`
- [ ] Test user creation with various roles
- [ ] Test role changes and verify they take effect
- [ ] Test user activation/deactivation
- [ ] Verify audit logs capture all actions
- [ ] Test audit log filters and search
- [ ] Verify CSV export works correctly
- [ ] Test system settings updates
- [ ] Check analytics calculations are accurate
- [ ] Review impersonation logs (if feature implemented)
- [ ] Test with non-admin user (should redirect)
- [ ] Verify all admin actions are logged
- [ ] Test responsive design on mobile/tablet

## Future Enhancements

### Impersonation Feature
- Add impersonation start/end functions
- Display banner when impersonating
- Quick "Exit Impersonation" button
- Enhanced action tracking during impersonation

### Bulk Operations
- Implement CSV upload processing
- Add preview before execution
- Progress indicators for long operations
- Error handling and rollback

### Advanced Analytics
- Custom date range selectors
- Comparison views (YoY, MoM)
- Carrier performance scorecards
- Customer performance analysis
- Scheduled reports via email

### Session Management
- View active user sessions
- Force logout functionality
- Session timeout controls
- Multiple device tracking

## Troubleshooting

### Can't Access Admin Portal
- Verify user role is 'admin' or 'executive'
- Check middleware is running
- Verify user is logged in
- Check browser console for errors

### Audit Logs Not Appearing
- Verify migrations were run successfully
- Check server action is being called
- Verify user permissions on audit_logs table
- Check for JavaScript errors in console

### Settings Not Saving
- Verify migrations ran successfully
- Check network tab for failed requests
- Verify user has admin role
- Check server logs for errors

## Support

For issues or questions about the admin portal:
1. Check this documentation
2. Review audit logs for clues
3. Check server logs for errors
4. Contact system administrator

---

**Version:** 1.0  
**Last Updated:** November 2024  
**Maintainer:** Development Team

