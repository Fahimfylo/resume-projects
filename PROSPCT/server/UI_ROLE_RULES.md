# UI Role Rules - Frontend Implementation Guide

## Overview

This document describes how the frontend UI should behave based on user roles.

## Key Concepts

### Shared Workspace Model

When a user joins a team as a **member**, they log into the **OWNER'S workspace context**:

- All data queries use the owner's ID (`req.workspaceOwner = user.invitedBy`)
- Members see the owner's credits, data, settings
- Members work within the owner's account, not their own isolated account

### Role Values from Backend

After login, the backend returns:

```json
{
  "user": {
    "role": "user",           // Global role ("admin" | "user")
    "teamRole": "member",     // Team role ("owner" | "admin" | "member" | null)
    "teamId": "...",          // Team ID if member
    "ownerId": "..."          // Owner ID (for members, null for owners)
  }
}
```

## UI Visibility Rules

### 1. Team Creation Page

**Show only if:**
- `teamRole === null` (standalone user) 
- OR `teamRole === "owner"` (can create additional teams)

**Hide if:**
- `teamRole === "admin"`
- `teamRole === "member"`

```javascript
const canCreateTeam = !teamRole || teamRole === "owner";
```

### 2. Invite Page / Invite Button

**Show only if:**
- `teamRole === "owner"`
- OR `teamRole === "admin"`

**Hide if:**
- `teamRole === "member"`
- `teamRole === null` (standalone)

```javascript
const canInvite = teamRole === "owner" || teamRole === "admin";
```

### 3. Team Management (Remove Members, Revoke Invites)

**Show only if:**
- `teamRole === "owner"`

**Hide if:**
- `teamRole === "admin"` (admins can invite but not remove)
- `teamRole === "member"`

```javascript
const canManageTeam = teamRole === "owner";
const canRemoveMembers = teamRole === "owner";
const canRevokeInvites = teamRole === "owner";
```

### 4. Billing / Payment / Credits Management

**Show only if:**
- `teamRole === "owner"`

**Hide if:**
- `teamRole === "admin"`
- `teamRole === "member"`
- `teamRole === null` (standalone with their own billing)

```javascript
const canManageBilling = teamRole === "owner";
```

### 5. Team Member Table (Owner & Members List)

**Show if:**
- `teamRole !== null` (any team member: owner, admin, or member)

**Content:**
- Show Owner (who invited them)
- Show all team members
- Show their own role

```javascript
const showTeamTable = teamRole !== null;
```

**Example Table:**

| Name | Email | Role | Status |
|------|-------|------|--------|
| John Doe | john@example.com | Owner | Active |
| Jane Smith | jane@example.com | Admin | Active |
| You | you@example.com | Member | Active |

### 6. Credits Display

**For Members:**
- Show **Owner's credits** (they're using the owner's workspace)
- Show read-only view
- Add note: "Using [Owner Name]'s credits"

**For Owners:**
- Show their own credits
- Show management controls

```javascript
if (teamRole === "member") {
  // Show owner's credits with "Shared Workspace" label
  creditsLabel = `Using ${ownerName}'s credits`;
} else {
  // Show own credits with management
  creditsLabel = "Your credits";
}
```

## Complete Permission Matrix

| Feature | Standalone | Team Member | Team Admin | Team Owner |
|---------|------------|-------------|------------|------------|
| Create Team | ✅ | ❌ | ❌ | ✅ |
| View Team Table | ❌ | ✅ | ✅ | ✅ |
| Invite Members | ❌ | ❌ | ✅ | ✅ |
| Revoke Invites | ❌ | ❌ | ❌ | ✅ |
| Remove Members | ❌ | ❌ | ❌ | ✅ |
| Manage Billing | ❌ | ❌ | ❌ | ✅ |
| View Owner Credits | ❌ | ✅ | ✅ | ✅ |
| Access Workspace Data | ❌ | ✅ | ✅ | ✅ |

## Code Examples

### React/Vue Component Guards

```javascript
// Role-based component rendering
function TeamPage({ user }) {
  const { teamRole } = user;

  return (
    <div>
      {/* Only owners and admins see invite button */}
      {(teamRole === "owner" || teamRole === "admin") && (
        <InviteButton />
      )}

      {/* Only owners see remove buttons */}
      {teamRole === "owner" && (
        <RemoveMemberButton />
      )}

      {/* All team members see the team table */}
      {teamRole && (
        <TeamMemberTable />
      )}

      {/* Members see owner info, owners manage */}
      {teamRole === "member" ? (
        <MemberView owner={user.ownerId} />
      ) : teamRole === "owner" ? (
        <OwnerView />
      ) : null}
    </div>
  );
}
```

### Route Guards

```javascript
// Navigation guards
const routes = [
  {
    path: "/invite",
    component: InvitePage,
    beforeEnter: (to, from, next) => {
      const teamRole = store.state.user.teamRole;
      if (teamRole === "owner" || teamRole === "admin") {
        next(); // Allow
      } else {
        next("/"); // Redirect to home
      }
    }
  },
  {
    path: "/billing",
    component: BillingPage,
    beforeEnter: (to, from, next) => {
      const teamRole = store.state.user.teamRole;
      if (teamRole === "owner") {
        next(); // Allow
      } else {
        next("/"); // Redirect
      }
    }
  }
];
```

### Credit Display Component

```javascript
function CreditsDisplay({ user, credits }) {
  const { teamRole, ownerId } = user;

  if (teamRole === "member") {
    return (
      <div className="shared-credits">
        <h3>Shared Workspace Credits</h3>
        <p>You are using your team's credits.</p>
        <CreditMeter 
          credits={credits} 
          readOnly={true}
          label="Team Credits"
        />
      </div>
    );
  }

  if (teamRole === "owner" || teamRole === "admin") {
    return (
      <div className="workspace-credits">
        <h3>Your Credits</h3>
        <CreditMeter 
          credits={credits} 
          showManage={teamRole === "owner"}
        />
      </div>
    );
  }

  // Standalone user
  return (
    <div className="personal-credits">
      <h3>Your Credits</h3>
      <CreditMeter credits={credits} showManage={true} />
    </div>
  );
}
```

## Backend Error Codes for UI

| Error Code | HTTP Status | UI Action |
|------------|-------------|-----------|
| `TEAM_OWNER_REQUIRED` | 403 | Hide button, show "Owner only" tooltip |
| `TEAM_ADMIN_REQUIRED` | 403 | Show upgrade prompt or hide feature |
| `MEMBER_CREATE_TEAM_FORBIDDEN` | 403 | Explain members can't create teams |
| `TEAM_MEMBERSHIP_REQUIRED` | 403 | Redirect to team creation/join page |

## Summary

**For Members:**
- ✅ Can access workspace data (owner's data)
- ✅ Can use owner's credits
- ❌ Cannot create teams
- ❌ Cannot invite others
- ❌ Cannot manage billing
- ❌ Cannot remove members
- See: Team table with owner and members

**For Admins:**
- ✅ Can invite members
- ✅ Can manage settings
- ❌ Cannot remove members
- ❌ Cannot manage billing

**For Owners:**
- ✅ Full control over everything

**For Standalone:**
- ✅ Can create team
- ❌ No team features visible
