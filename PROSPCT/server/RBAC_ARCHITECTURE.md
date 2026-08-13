# RBAC Architecture - Production-Grade Refactor

## Overview

This document describes the refactored RBAC system with **single source of truth** for roles.

## Single Source of Truth

### Global Roles (Application-Level)

**Stored in:** `User.role` field only

| Role | Description |
|------|-------------|
| `admin` | System administrator - full application access |
| `user` | Regular user - standard application access |

### Team Roles (Workspace-Level)

**Stored in:** `Team.members.role` field only

| Role | Description |
|------|-------------|
| `owner` | Team creator - full team control |
| `admin` | Team administrator - can invite, manage settings |
| `member` | Regular team member - can access workspace data |

### NO Role Duplication

**REMOVED from User model:**
- ❌ `User.teamRole` - No longer used
- ❌ `User.teamRole` caching - No longer used

**User model keeps only:**
- ✅ `User.role` - Global role
- ✅ `User.teamId` - Links to team (for finding team context)
- ✅ `User.invitedBy` - Tracks who invited them

## Architecture Flow

```
Request → authMiddleware → permissionService.resolveUserPermissions() → req.user
```

### Step 1: JWT Verification
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const userId = decoded.userId; // Minimal payload: { userId }
```

### Step 2: Global Role Resolution
```javascript
const user = await User.findById(userId).select("_id email role teamId invitedBy isBlocked");
const globalRole = user.role; // "admin" | "user"
```

### Step 3: Team Role Resolution (Single Source of Truth)
```javascript
// ALWAYS from Team.members - never from User
const team = await Team.findById(user.teamId).select("owner members");

// Check if owner
if (team.owner.toString() === userId.toString()) {
  teamRole = "owner";
}

// Check membership with status === "joined"
const membership = team.members.find(m =>
  m.user?.toString() === userId.toString() &&
  m.status === "joined"
);

if (membership) {
  teamRole = membership.role; // "admin" | "member"
}
```

### Step 4: Permission Object
```javascript
req.user = {
  // Identity
  _id: user._id,
  userId: user._id,
  email: user.email,

  // Global role
  role: "user" | "admin",
  isGlobalAdmin: true | false,

  // Team role (from Team.members - single source of truth)
  teamId: teamId | null,
  teamRole: "owner" | "admin" | "member" | null,

  // Permission flags
  isTeamOwner: true | false,
  isTeamAdmin: true | false,
  isTeamMember: true | false,

  // Full permissions object
  permissions: { /* full permission object */ }
};
```

## Centralized Permission Service

### File: `services/permissionService.js`

```javascript
// Resolve all permissions for a user
const permissions = await resolveUserPermissions(userId, teamId);

// Returns:
{
  userId: ObjectId,
  email: string,
  globalRole: "admin" | "user",
  isGlobalAdmin: boolean,
  teamId: ObjectId | null,
  teamRole: "owner" | "admin" | "member" | null,
  membershipStatus: "joined" | "pending" | null,
  isTeamOwner: boolean,
  isTeamAdmin: boolean,
  isTeamMember: boolean,
  canInvite: boolean,
  canManageBilling: boolean,
  canRemoveMembers: boolean,
  canDeleteTeam: boolean,
}
```

### Permission Check Functions

```javascript
// Check specific permission
const canInvite = hasPermission(permissions, "action:invite");

// Verify team membership (throws if not valid)
const membership = await verifyTeamMembership(userId, teamId);
```

## RBAC Middleware

### File: `middleware/rbacMiddleware.js`

Simplified middleware - no confusing options:

```javascript
// Global role middleware
requireGlobalAdmin      // Only global admins
requireGlobalUser       // Only non-admin users
requireAuthenticated    // Any authenticated user

// Team role middleware (use teamRole from req.user)
requireTeamOwner        // Only team owners
requireTeamAdminOrOwner // Owners or admins
requireTeamMember       // Any team member (owner, admin, member)
```

### Middleware Flow

```javascript
// Route definition
router.post("/invite", authMiddleware, requireTeamAdminOrOwner, sendInvite);

// Execution flow:
// 1. authMiddleware resolves teamRole from Team.members
// 2. requireTeamAdminOrOwner checks req.user.teamRole
// 3. Controller executes with guaranteed permissions
```

## Role Hierarchy

```
Global Admin
    ↓
Team Owner
    ↓
Team Admin
    ↓
Team Member
    ↓
Standalone User (no team)
```

### Hierarchy Rules

1. **Global Admin** can do anything (including team management)
2. **Team Owner** can do anything within their team
3. **Team Admin** can invite and manage settings, cannot remove members or billing
4. **Team Member** can access workspace data, cannot invite or manage
5. **Standalone User** can only create/join teams

## Data Consistency Rules

### Rule 1: Team.members is the ONLY source for team roles

```javascript
// CORRECT: Read from Team.members
const team = await Team.findById(teamId);
const role = team.members.find(m => m.user.toString() === userId).role;

// INCORRECT: Never read from User.teamRole
const user = await User.findById(userId);
const role = user.teamRole; // ❌ DON'T DO THIS
```

### Rule 2: User.teamId links to team, not role

```javascript
// User model only stores teamId for finding the team
const user = await User.findById(userId).select("teamId");
const team = await Team.findById(user.teamId); // Find team
const role = team.members.find(...).role; // Get role from team
```

### Rule 3: Always verify membership.status === "joined"

```javascript
// STRICT check required
const membership = team.members.find(m =>
  m.user.toString() === userId.toString() &&
  m.status === "joined" // Critical security check
);

if (!membership) {
  throw new Error("Not an active member");
}
```

## Security Requirements

### 1. No Privilege Escalation
```javascript
// authMiddleware blocks if membership.status !== "joined"
if (!membership || membership.status !== "joined") {
  return res.status(403).json({
    message: "Access revoked. Your team membership is no longer active.",
  });
}
```

### 2. No Fallback Access
```javascript
// Standalone users don't get automatic team access
if (user.teamId) {
  // Must have valid membership
} else {
  // No team = no team access
  teamRole = null;
}
```

### 3. Defense in Depth
```javascript
// Middleware check (route level)
router.post("/invite", authMiddleware, requireTeamAdminOrOwner, sendInvite);

// Controller check (data level)
if (!req.user.isTeamOwner && !req.user.isTeamAdmin) {
  return res.status(403).json({ error: "Insufficient permissions" });
}
```

## Route Protection Examples

### Team Routes
```javascript
// Create team - auth required, controller handles permission
router.post("/", authMiddleware, createTeam);

// Update team - owner or admin
router.patch("/:id", authMiddleware, requireTeamAdminOrOwner, updateTeam);

// Delete team - owner only
router.delete("/:id", authMiddleware, requireTeamOwner, deleteTeam);

// Get teams - any authenticated user
router.get("/", authMiddleware, getUserTeams);
```

### Invite Routes
```javascript
// Send invite - owner or admin
router.post("/send", authMiddleware, requireTeamAdminOrOwner, sendInvite);

// Revoke invite - owner only
router.post("/revoke/:id", authMiddleware, requireTeamOwner, revokeInvite);
```

### Payment Routes
```javascript
// All billing - owner only
router.post("/checkout", authMiddleware, requireTeamOwner, checkout);
```

## Permission Matrix

| Action | Global Admin | Team Owner | Team Admin | Team Member | Standalone |
|--------|--------------|------------|------------|-------------|------------|
| Create Team | ✅ | ✅ | ❌ | ❌ | ✅ |
| Delete Team | ✅ | ✅ | ❌ | ❌ | ❌ |
| Invite Members | ✅ | ✅ | ✅ | ❌ | ❌ |
| Revoke Invites | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove Members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update Team | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Team Data | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage Billing | ✅ | ✅ | ❌ | ❌ | ❌ |
| Access Workspace | ✅ | ✅ | ✅ | ✅ | ❌ |

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `GLOBAL_ADMIN_REQUIRED` | Need global admin role | 403 |
| `TEAM_OWNER_REQUIRED` | Need team ownership | 403 |
| `TEAM_ADMIN_REQUIRED` | Need admin or owner role | 403 |
| `TEAM_MEMBERSHIP_REQUIRED` | Must be team member | 403 |
| `INVALID_TEAM_ROLE` | Invalid/missing team role | 403 |
| `MEMBERSHIP_REVOKED` | Status not "joined" | 403 |
| `AUTH_REQUIRED` | Not authenticated | 401 |

## Migration Notes

### Changes from Previous System

1. ✅ **Removed `User.teamRole`** - Role now ONLY in `Team.members`
2. ✅ **Created `permissionService`** - Centralized permission resolution
3. ✅ **Updated `authMiddleware`** - Resolves teamRole from Team.members
4. ✅ **Simplified `rbacMiddleware`** - Removed confusing middleware options
5. ✅ **Updated all controllers** - Use req.user.teamRole from authMiddleware
6. ✅ **Fixed `joinTeam`** - Removed User.teamRole update

### Files Modified

- `services/permissionService.js` ⭐ NEW - Centralized permission resolver
- `middleware/authMiddleware.js` ✅ - Uses permissionService
- `middleware/rbacMiddleware.js` ✅ - Simplified middleware
- `routes/teamRoutes.js` ✅ - Updated to use simplified RBAC
- `routes/inviteRoutes.js` ✅ - Uses requireTeamOwner/requireTeamAdminOrOwner
- `routes/paymentRoutes.js` ✅ - Uses requireTeamOwner
- `controllers/teamController.js` ✅ - Removed User.teamRole updates
- `controllers/inviteController.js` ✅ - Uses new permission system

## Testing RBAC

### Test Cases

```javascript
// 1. Member tries to create team
POST /api/team (as member)
→ 403 { code: "MEMBER_CREATE_TEAM_FORBIDDEN" }

// 2. Member tries to invite
POST /api/invite/send (as member)
→ 403 { code: "TEAM_ADMIN_REQUIRED" }

// 3. Pending member tries to access
GET /api/team (as pending)
→ 403 { message: "Access revoked..." }

// 4. Admin tries to remove member
DELETE /api/team/member/:id (as admin)
→ 403 { code: "TEAM_OWNER_REQUIRED" }

// 5. Owner can do everything
Any action (as owner)
→ 200 Success

// 6. Global admin can do everything
Any action (as global admin)
→ 200 Success
```

## Best Practices

1. **Always use `req.user.teamRole`** for permission checks (resolved from Team.members)
2. **Always use `req.user.userId`** for identity checks
3. **Always use `req.workspaceOwner`** ONLY for data ownership queries
4. **Never use `User.teamRole`** directly - it doesn't exist anymore
5. **Always verify `status === "joined"`** in authMiddleware
6. **Always use middleware** for route-level protection
7. **Always double-check** in controller for defense in depth
