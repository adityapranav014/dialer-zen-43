# DialFlow — Authentication Guide

## Login Credentials

| Role | Email | Password | Company URL |
|------|-------|----------|-------------|
| **Super Admin** | super@dialflow.com | super123 | *(leave empty)* |
| **Acme Admin** | admin@acme.com | admin123 | acme |
| **Acme Member** | john@acme.com | pass123 | acme |
| **Acme Member** | sarah@acme.com | pass123 | acme |
| **TechStart Admin** | admin@techstart.com | admin123 | techstart |
| **TechStart Member** | mike@techstart.com | pass123 | techstart |

---

## How Login Works

### 1. Three Fields on Login Page

```
┌─────────────────────────────┐
│  Company URL   [ acme     ] │  ← your company slug (empty for super admin)
│  Email/Phone   [ you@...  ] │
│  Password      [ ••••••   ] │
│         [ Sign In ]         │
└─────────────────────────────┘
```

### 2. Login Flow (Step by Step)

```
User clicks Sign In
       │
       ▼
Hash password (SHA-256 on client side)
       │
       ▼
Look up user in `app_users` table by email or phone
       │
       ├── Not found? → "Invalid credentials"
       ├── Hash mismatch? → "Invalid credentials"
       ├── Account deactivated? → "Account deactivated"
       │
       ▼
Is user a Super Admin? (`is_super_admin = true`)
       │
       ├── YES ──► Company URL empty?
       │             ├── YES → Login to Platform View (no tenant)
       │             └── NO  → Login into that specific company
       │
       └── NO ───► Company URL empty?
                     ├── YES → Error: "Company URL is required"
                     └── NO  → Look up company by slug
                                  │
                                  ▼
                              Is user a member of this company?
                                  ├── NO  → "Not a member of this company"
                                  └── YES → Login with role (admin/member)
```

### 3. After Login

- A **session token** is created in `auth_sessions` table
- Token is stored in a **browser cookie** (`df_token`)
- User data is stored in **localStorage** (`df_user`)
- On every page load, the session is validated against the DB

---

## Three Roles

| Role | Company URL | What They See |
|------|-------------|---------------|
| **Super Admin** | *(empty)* | Platform console — manage all companies |
| **Super Admin** | `acme` | Enters Acme as an admin (can go back to platform) |
| **Admin** | `acme` | Dashboard, leads, team management, analytics |
| **Member** | `acme` | Personal dashboard, assigned leads, call logs |

---

## Multi-Tenant Architecture

```
                    ┌──────────────┐
                    │  Super Admin │  ← can see ALL companies
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │   Acme   │ │ TechStart│ │GrowthLabs│  ← tenants (companies)
        │ slug:acme│ │slug:tech │ │slug:grow  │
        └────┬─────┘ └────┬─────┘ └──────────┘
             │            │
        ┌────┴────┐  ┌────┴────┐
        │ Admin   │  │ Admin   │   ← each company has its own admins
        │ Members │  │ Members │   ← and its own members
        └─────────┘  └─────────┘
```

- Each company (tenant) has its own **leads, call logs, notifications, activities**
- Users see ONLY their company's data
- A user can belong to **multiple companies** (via `tenant_memberships`)
- Super admin can **enter any company** and switch back to platform view

---

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `tenants` | Companies (slug, name, plan) |
| `app_users` | All users globally (email, password hash, is_super_admin) |
| `tenant_memberships` | Links user ↔ company with role (admin/member) |
| `auth_sessions` | Active sessions (token, user, tenant, expiry) |

---

## Session Lifecycle

```
Login  →  Create session (token + user_id + tenant_id)
              │
              ▼
        Store token in cookie, user in localStorage
              │
              ▼
        Every page load → validateSession()
              │
              ├── Token valid + not expired → Refresh user data from DB
              └── Token invalid/expired → Clear cookie → Redirect to login
              
Logout →  Delete session from DB → Clear cookie + localStorage
```

---

## Super Admin: Switching Between Companies

```
Platform View ──[Enter Acme]──► Acme Dashboard (as admin)
                                      │
                                [Back to Platform]
                                      │
                                      ▼
                               Platform View
```

- `switchTenant(tenantId)` — updates the session's `tenant_id`
- `switchToPlatform()` — sets session's `tenant_id` to `null`

---

## Security Notes

- Passwords are **SHA-256 hashed on the client** before sending
- No raw passwords are ever stored or transmitted to the API
- Sessions expire after **30 days**
- RLS policies are permissive (anon access) — authorization is handled at the **app layer** via session validation
- Cookie name: `df_token` / localStorage key: `df_user`
