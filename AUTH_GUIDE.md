# DialFlow — Authentication Guide

## Login Credentials

| Role | Email | Password | Company URL |
|------|-------|----------|-------------|
| **Super Admin** | superadmin@dialflow.io | Super@2026 | *(leave empty)* |
| **NexGen Admin** | admin@nexgen.demo | Admin@2026 | nexgen |
| **NexGen Member** | rahul.sharma@nexgen.demo | BDA@2026 | nexgen |
| **NexGen Member** | priya.patel@nexgen.demo | BDA@2026 | nexgen |
| **NexGen Member** | amit.verma@nexgen.demo | BDA@2026 | nexgen |
| **NexGen Member** | *(any `*@nexgen.demo` BDA)* | BDA@2026 | nexgen |

> All 21 BDA accounts share the password `BDA@2026` and use the slug `nexgen`.

---

## How Login Works

### 1. Three Fields on Login Page

```
┌─────────────────────────────┐
│  Company URL   [ nexgen   ] │  ← your company slug (empty for super admin)
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
| **Super Admin** | `nexgen` | Enters NexGen Solutions as an admin (can go back to platform) |
| **Admin** | `nexgen` | Dashboard, leads, team management, analytics |
| **Member** | `nexgen` | Personal dashboard, assigned leads, call logs |

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
        │  NexGen  │ │ TechStart│ │GrowthLabs│  ← tenants (companies)
        │slug:nexgn│ │slug:tech │ │slug:grow  │
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
Platform View ──[Enter NexGen]──► NexGen Dashboard (as admin)
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
- Cookie name: `df_auth_token` / localStorage key: `df_auth_user`
