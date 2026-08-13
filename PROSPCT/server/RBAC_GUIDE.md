# RBAC (Role-Based Access Control) Guide

## Overview

This document describes the RBAC system implemented in the Prospct SaaS application.

## Role Hierarchy

### 1. Global Roles (Application-Level)

Stored in `User.role` field:

| Role | Description | Permissions |
|------|-------------|-------------|
| `admin` | System administrator | Full application access, user management, system settings |
| `user` | Regular user | Standard application access, workspace management |

**Middleware:** `requireGlobalAdmin`

### 2. Team Roles (Workspace-Level)

Stored in both:
- `Team.members.role` (source of truth)
- `User.teamRole` (cached for quick access)

| Role | Description | Permissions |
|------|-------------|-------------|
| `owner` | Team creator | Full team control, billing, member removal, invites |
| `admin` | Team administrator | Invite members, update team, cannot remove members or billing |
| `member` | Regular team member | View team data, access workspace resources |

**Middleware:**
- `requireTeamOwner` - Owner-only actions
- `requireTeamAdminOrOwner` - Owner or admin actions
- `requireTeamMember` - Any team member

### 3. Membership Status

Stored in `Team.members.status`:

| Status | Description |
|--------|-------------|
| `pending` | Invitation sent, not yet accepted |
| `joined` | Active team member |

**Behavior:** Pending members are blocked from accessing workspace by `authMiddleware`.

## Middleware Reference

### Global Role Middleware

```javascript
const { requireGlobalAdmin } = require("./middleware/rbacMiddleware");

// Admin-only route
router.get("/admin/users", authMiddleware, requireGlobalAdmin, getAllUsers);
```

### Team Role Middleware

```javascript
const {
  requireTeamOwner,
  requireTeamAdminOrOwner,
  requireTeamMember
} = require("./middleware/rbacMiddleware");

// Owner only
router.delete("/team/:id", requireTeamOwner, deleteTeam);

// Owner or admin
router.post("/invite", requireTeamAdminOrOwner, sendInvite);

// Any team member
router.get("/team/data", requireTeamMember, getTeamData);
```

### Combined Middleware

```javascript
const { requireStandaloneOrTeamOwner } = require("./middleware/rbacMiddleware");

// Standalone users OR team owners (blocks team members who aren't owners)
router.post("/team/create", requireStandaloneOrTeamOwner, createTeam);
```

## Permission Matrix

| Action | Global Admin | Team Owner | Team Admin | Team Member | Pending |
|--------|--------------|------------|------------|-------------|---------|
| Create Team | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Team | ✅ | ✅ | ❌ | ❌ | ❌ |
| Invite Members | ✅ | ✅ | ✅ | ❌ | ❌ |
| Revoke Invites | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove Members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update Team Name | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Team Data | ✅ | ✅ | ✅ | ✅ | ❌ |
| Billing/Checkout | ✅ | ✅ | ❌ | ❌ | ❌ |
| Access Workspace Data | ✅ | ✅ | ✅ | ✅ | ❌ |

## Route Protection Examples

### Team Routes

```javascript
// Create team - standalone or owners only
router.post("/", requireStandaloneOrTeamOwner, createTeam);

// Update team - owners or admins
router.patch("/:teamId/name", requireTeamAdminOrOwner, updateTeamName);

// Generate invite - owners or admins
router.post("/invite-link", requireTeamAdminOrOwner, generateInviteLink);

// Remove member - owners only
router.delete("/member/:teamId/:memberId", requireTeamOwner, removeMember);

// Get teams - any team member
router.get("/", requireTeamMember, getUserTeams);
```

### Invite Routes

```javascript
// Send invite - owners or admins
router.post("/send", requireTeamAdminOrOwner, sendInvite);

// List invites - owners or admins
router.get("/list", requireTeamAdminOrOwner, getInvites);

// Revoke invite - owners only
router.post("/revoke/:inviteId", requireTeamOwner, revokeInvite);
```

### Payment Routes

```javascript
// All billing routes - owners only (admins and members blocked)
router.post("/stripe/checkout", requireTeamOwner, stripeCheckout);
router.post("/fastspring/checkout", requireTeamOwner, fastspringCheckout);
```

## Key Security Principles

1. **Permissions come from `req.user`, NOT `req.workspaceOwner`**
   - `req.user.userId` - for identifying the actor
   - `req.user.teamRole` - for permission checks
   - `req.workspaceOwner` - ONLY for data queries (which workspace to access)

2. **Double Verification**
   - Middleware checks role at route level
   - Controller verifies ownership at data level (defense in depth)

3. **Clear Error Codes**
   - `GLOBAL_ADMIN_REQUIRED` - Need admin role
   - `TEAM_OWNER_REQUIRED` - Need team ownership
   - `TEAM_ADMIN_REQUIRED` - Need admin or owner role
   - `TEAM_MEMBERSHIP_REQUIRED` - Need to be in a team
   - `MEMBER_CREATE_TEAM_FORBIDDEN` - Members can't create teams

4. **Pending Members Blocked**
   - `authMiddleware` checks `membership.status !== "joined"`
   - Pending invitations cannot access workspace

## Frontend Integration

### Hide UI Elements Based on Role

```javascript
// Check team role from user context
const canInvite = user.teamRole === "owner" || user.teamRole === "admin";
const canRemoveMembers = user.teamRole === "owner";
const canCreateTeam = !user.teamId || user.teamRole === "owner";

// Conditionally render
{canInvite && <InviteButton />}
{canRemoveMembers && <RemoveMemberButton />}
```

### Show Read-Only View for Members

```javascript
const isOwner = user.teamRole === "owner";
const isAdmin = user.teamRole === "admin";
const isMember = user.teamRole === "member";

// Team settings page
<TeamSettings>
  <TeamName value={team.name} readOnly={!isOwner && !isAdmin} />
  <MemberList members={team.members} />
  {isOwner && <RemoveAllMembersButton />}
</TeamSettings>
```

## Testing RBAC

### Test Cases

1. **Member tries to create team** → 403 `MEMBER_CREATE_TEAM_FORBIDDEN`
2. **Member tries to invite** → 403 `TEAM_ADMIN_REQUIRED`
3. **Admin tries to remove member** → 403 `TEAM_OWNER_REQUIRED`
4. **Pending member tries to access** → 403 (blocked by authMiddleware)
5. **Owner can do everything** → 200
6. **Global admin can do everything** → 200

## Migration Notes

### Changes from Previous System

1. **Removed `isWorkspaceOwner` dependency** - Now uses `teamRole === "owner"`
2. **Separated permissions from data access** - `req.workspaceOwner` only for queries
3. **Added proper team role checking** - Source of truth is `Team.members.role`
4. **Blocked pending members** - Must have `status === "joined"`
5. **Added admin role support** - Owners and admins can invite, only owners can remove

### Files Modified

- `middleware/rbacMiddleware.js` - NEW: Proper RBAC middleware
- `routes/teamRoutes.js` - Updated to use RBAC middleware
- `routes/inviteRoutes.js` - Updated to use RBAC middleware
- `routes/paymentRoutes.js` - Updated to use RBAC middleware
- `controllers/teamController.js` - Updated permission checks
- `controllers/inviteController.js` - Updated to use `req.user.userId`

## Best Practices

1. **Always use middleware** for route-level protection
2. **Always verify in controller** for defense in depth
3. **Return clear error codes** for frontend handling
4. **Use `req.user.userId`** for permission identification
5. **Use `req.workspaceOwner`** ONLY for data queries
6. **Never trust client-side role checks** - always verify server-side
