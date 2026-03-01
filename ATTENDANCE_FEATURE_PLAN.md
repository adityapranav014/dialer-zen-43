# Attendance & HR Feature Plan — DialFlow CRM

> **Status:** Planning only — nothing implemented yet  
> **Last updated:** March 1, 2026  
> Say "implement [section name]" to start building any section.

---

## ⚠️ Real-Time Capability of Turso (Read This First)

**Short answer: No native WebSockets. Polling is the practical solution.**

| Question | Answer |
|---|---|
| Does Turso push changes to the browser? | ❌ No |
| Does libSQL support WebSocket connections? | Only server-side (`libsql://` protocol), not in browsers |
| What are we using? | `@libsql/client/web` — pure HTTP, browser-safe |
| Can we get "live" status updates? | ✅ Yes, via **polling** with React Query's `refetchInterval` |

### Recommended Approach: Polling with React Query

```ts
useQuery({
  queryKey: ["attendance", "team"],
  queryFn: fetchTeamAttendance,
  refetchInterval: 30_000,   // refresh every 30 seconds
  staleTime: 20_000,
})
```

For features that truly need sub-second real-time (e.g. "who is on a call right now"), two options:
- **Option A (Simple):** Poll every 10–15 seconds — sufficient for attendance/presence
- **Option B (Advanced):** Add [Ably](https://ably.com/) or [Pusher](https://pusher.com/) as a thin broadcast layer — BDA publishes status change → Ably broadcasts → admin sees it instantly. Costs ~$0 for demo scale.

---

## Feature Breakdown

### 1. Clock In / Clock Out

**What it does:** BDA taps "Clock In" when they start work and "Clock Out" when done. Admin sees who is in/out in real time.

**New DB table: `attendance_logs`**
```sql
id           TEXT PRIMARY KEY
tenant_id    TEXT NOT NULL
user_id      TEXT NOT NULL
date         TEXT NOT NULL          -- "2026-03-01" (date only, IST)
clock_in_at  TEXT                   -- ISO timestamp
clock_out_at TEXT                   -- ISO timestamp, NULL if still clocked in
total_minutes INTEGER DEFAULT 0    -- computed on clock-out
status       TEXT DEFAULT 'present' -- present | absent | half_day | leave | holiday
notes        TEXT                   -- admin override notes
created_at   TEXT
updated_at   TEXT
```

**New DB table: `attendance_adjustments`** (for admin overwrite/correction requests)
```sql
id              TEXT PRIMARY KEY
tenant_id       TEXT NOT NULL
user_id         TEXT NOT NULL        -- who is requesting
attendance_id   TEXT NOT NULL        -- which log to adjust
requested_by    TEXT NOT NULL        -- same as user_id (BDA self-request) or admin
original_in     TEXT
original_out    TEXT
requested_in    TEXT
requested_out   TEXT
reason          TEXT NOT NULL
status          TEXT DEFAULT 'pending'  -- pending | approved | rejected
reviewed_by     TEXT                    -- admin user_id
reviewed_at     TEXT
created_at      TEXT
```

**BDA UI:** "Clock In" / "Clock Out" button prominently on dashboard (replaces Quick Actions area). Shows today's hours running live (front-end timer, not DB).

**Admin UI:** Team grid with a coloured dot per person — Green (clocked in), Grey (not started), Red (clocked out), Amber (on break), Orange (leave).

**How clock-in/out works:**
1. BDA clicks Clock In → INSERT row into `attendance_logs` with `clock_in_at = now()`
2. BDA clicks Clock Out → UPDATE row: `clock_out_at = now()`, `total_minutes = diff`
3. Admin can edit any row and INSERT into `attendance_adjustments` for audit trail

---

### 2. Custom Status / Away Messages

**What it does:** BDA can set a one-line status like "🍽️ Lunch break", "📞 On a call", "🤒 Feeling unwell". Admin sees it next to their name.

**New DB table: `user_presence`**
```sql
id          TEXT PRIMARY KEY
user_id     TEXT NOT NULL UNIQUE
tenant_id   TEXT NOT NULL
status      TEXT NOT NULL DEFAULT 'available'
  -- available | busy | break | away | offline
custom_msg  TEXT                         -- max 80 chars
updated_at  TEXT
```

**Predefined statuses with icons:**
| Status | Icon | Colour |
|--------|------|--------|
| Available | 🟢 | Emerald |
| On a Call | 📞 | Blue |
| Lunch Break | 🍽️ | Amber |
| Short Break | ☕ | Orange |
| Away | 🌀 | Purple |
| Offline / Done | ⚫ | Grey |

**How it works:**
- BDA opens a small popover → picks status + optional text → saves to `user_presence`
- Admin's Team page polls `user_presence` every 30s and shows live statuses
- Status auto-resets to `available` when BDA clocks in; auto-sets to `offline` on clock-out

---

### 3. Global Team Availability View

**What it does:** Admin sees a single-screen grid of all BDAs with their current status, hours worked today, and availability.

**No new tables needed** — reads from `attendance_logs` (today's row) + `user_presence`.

**UI Layout:**
```
┌─────────────────────────────────────────────────┐
│ Team Availability — Today  Mar 1, 2026          │
│ 🟢 14 Active  ☕ 3 On Break  ⚫ 4 Not Started  │
├────────┬──────────────┬──────────┬──────────────┤
│ Avatar │ Name         │ Status    │ Hours Today  │
├────────┼──────────────┼──────────┼──────────────┤
│ RS     │ Rahul Sharma │ 🟢 Active │ 5h 23m       │
│ PP     │ Priya Patel  │ 📞 On Call│ 4h 10m       │
│ AV     │ Amit Verma   │ ☕ Break  │ 3h 55m       │
└────────┴──────────────┴──────────┴──────────────┘
```

---

### 4. Leave Management

#### 4a. Leave Balance Tracking

**New DB table: `leave_balances`**
```sql
id              TEXT PRIMARY KEY
tenant_id       TEXT NOT NULL
user_id         TEXT NOT NULL
year            INTEGER NOT NULL        -- 2026
casual_total    INTEGER DEFAULT 12
casual_used     INTEGER DEFAULT 0
sick_total      INTEGER DEFAULT 6
sick_used       INTEGER DEFAULT 0
earned_total    INTEGER DEFAULT 15
earned_used     INTEGER DEFAULT 0
updated_at      TEXT
```
One row per user per year. Admin can edit totals. Used count auto-increments when leave is approved.

#### 4b. Leave Requests

**New DB table: `leave_requests`**
```sql
id            TEXT PRIMARY KEY
tenant_id     TEXT NOT NULL
user_id       TEXT NOT NULL
leave_type    TEXT NOT NULL   -- casual | sick | earned | unpaid | wfh
from_date     TEXT NOT NULL   -- "2026-03-05"
to_date       TEXT NOT NULL   -- "2026-03-07"
total_days    REAL NOT NULL   -- supports 0.5 for half day
reason        TEXT NOT NULL
status        TEXT DEFAULT 'pending'  -- pending | approved | rejected | cancelled
reviewed_by   TEXT            -- admin user_id
reviewed_at   TEXT
admin_note    TEXT
created_at    TEXT
updated_at    TEXT
```

**BDA flow:**
1. BDA opens Leave Request form → picks type, dates, reason
2. Request shows as "Pending" in their leave history
3. Admin gets a notification (type: `leave_request`)

**Admin flow:**
1. Admin sees pending requests badge in Team/Attendance menu
2. Opens request → sees leave balance remaining
3. Clicks Approve / Reject, optionally adds a note
4. System: updates `leave_balances.used`, creates notification to BDA, marks `attendance_logs` for those days as `leave`

---

### 5. Attendance Adjustment Requests

**What it does:** BDA forgot to clock in/out, or clocked at wrong time → can request a correction. Admin approves/rejects.

Uses the `attendance_adjustments` table from Section 1.

**BDA flow:** In their attendance history, taps "Request Adjustment" next to any row → fills in correct times + reason.

**Admin flow:** Sees pending adjustments in a dedicated queue. Reviews original vs requested times → Approve (auto-updates `attendance_logs`) or Reject with note.

---

### 6. Org Tree / Directory

**What it does:** Visual org chart and searchable people directory.

**No new tables needed** — built from `app_users` + `tenant_memberships`.

**Org tree structure:**
```
Admin (Rajesh Kumar)
 ├── Senior BDA: Rahul Sharma, Priya Patel, Amit Verma
 ├── BDA: Sneha Gupta, Vikram Singh …
 └── New Joiners: Vivek Reddy …
```

**Directory search:** Full-text search by name/email/phone. Click profile → see their leads, calls, leave balance, current status. Already partially exists in TeamManagement — extend it.

**Implementation:** `role` is already stored in `tenant_memberships`. Add an optional `reports_to` column to `tenant_memberships` to support multi-level hierarchy:
```sql
ALTER TABLE tenant_memberships ADD COLUMN reports_to TEXT REFERENCES app_users(id);
```

---

### 7. Role / Permission Management

**Current roles:** `admin` | `member` — stored as text in `tenant_memberships.role`.

**Extended role system:**

| Role | Can Do |
|------|--------|
| `super_admin` | Everything across all tenants |
| `admin` | All within tenant |
| `team_lead` | View all BDA data, assign leads, approve leave for their team |
| `senior_bda` | Own data + view team leaderboard + request lead reassignment |
| `member` | Own data only |
| `readonly` | View-only, no mutations |

**New DB table: `role_permissions`** (optional, for fine-grained control):
```sql
id           TEXT PRIMARY KEY
tenant_id    TEXT NOT NULL
role         TEXT NOT NULL
permission   TEXT NOT NULL   -- e.g. "leads.assign", "attendance.approve"
created_at   TEXT
```

**Implementation:** Add `team_lead_of` column to `tenant_memberships` (array of user IDs as JSON) so team leads only see their sub-team's data.

---

### 8. Reporting

#### 8a. Personal Monthly Summary (BDA view)
- Days present / absent / on leave
- Total hours worked
- Avg clock-in time, avg clock-out time
- Calls made, leads closed, conversion rate
- Exportable as PDF

#### 8b. Team Monthly Report (Admin view)
- Attendance % per person
- Late arrivals (clock-in after expected time)
- Leave utilisation
- Productivity: calls per hour worked

#### 8c. Payroll/Compliance Export
- CSV export of: Name, Days Present, Hours, Leave Days, Calls, Deals
- Filterable by month and team

**Implementation:** All reports are computed queries from `attendance_logs` + `call_logs` + `leave_requests`. No new tables needed. Export via browser `Blob` → CSV download. PDF via `jsPDF` or `react-pdf`.

---

## New Navigation Item

A new **"Attendance"** page accessible to admin (full view) and BDA (personal view only).

```
/attendance          → Admin: full team view + approvals queue
/attendance/me       → BDA: personal clock-in/out + leave requests
/attendance/leaves   → Leave request management (admin)
/attendance/reports  → Reports & export (admin only)
```

Add to `SideNav` between Team and Analytics:
```tsx
{ label: "Attendance", icon: CalendarCheck, path: "/attendance" }
```

---

## Complete DB Migration Plan

Run these in order when implementing:

```sql
-- 1. User presence (status/away messages)
CREATE TABLE IF NOT EXISTS user_presence (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES app_users(id),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  status TEXT NOT NULL DEFAULT 'available',
  custom_msg TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 2. Attendance logs (clock in/out)
CREATE TABLE IF NOT EXISTS attendance_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL REFERENCES app_users(id),
  date TEXT NOT NULL,
  clock_in_at TEXT,
  clock_out_at TEXT,
  total_minutes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(user_id, date)
);

-- 3. Attendance adjustment requests
CREATE TABLE IF NOT EXISTS attendance_adjustments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL REFERENCES app_users(id),
  attendance_id TEXT NOT NULL REFERENCES attendance_logs(id),
  requested_by TEXT NOT NULL REFERENCES app_users(id),
  original_in TEXT,
  original_out TEXT,
  requested_in TEXT,
  requested_out TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT REFERENCES app_users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 4. Leave balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL REFERENCES app_users(id),
  year INTEGER NOT NULL,
  casual_total INTEGER DEFAULT 12,
  casual_used INTEGER DEFAULT 0,
  sick_total INTEGER DEFAULT 6,
  sick_used INTEGER DEFAULT 0,
  earned_total INTEGER DEFAULT 15,
  earned_used INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(user_id, year)
);

-- 5. Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL REFERENCES app_users(id),
  leave_type TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  total_days REAL NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT REFERENCES app_users(id),
  reviewed_at TEXT,
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 6. Extend tenant_memberships for org tree
ALTER TABLE tenant_memberships ADD COLUMN reports_to TEXT REFERENCES app_users(id);
```

---

## Implementation Order (Recommended)

| Phase | Features | Effort |
|---|---|---|
| **Phase 1** | Clock In/Out + Today's status on BDA dashboard + Admin team availability grid | ~2 days |
| **Phase 2** | Custom status / away messages + real-time polling refresh | ~1 day |
| **Phase 3** | Leave requests + balance tracking + approval workflow | ~2 days |
| **Phase 4** | Attendance adjustment requests | ~1 day |
| **Phase 5** | Org tree + extended roles (team_lead) | ~2 days |
| **Phase 6** | Reports + CSV export | ~1 day |
| **Phase 7** | PDF reports + payroll export | ~1 day |

**Total estimate:** ~10 working days for full implementation

---

## What to Say to Start

- `"implement phase 1"` → Clock In/Out + BDA dashboard button + admin team grid
- `"implement leave management"` → Phase 3
- `"implement attendance reports"` → Phase 6
- `"implement all phases"` → Full feature build (10 days of work)

---

*Plan created March 1, 2026 · DialFlow CRM Attendance Feature Roadmap*
