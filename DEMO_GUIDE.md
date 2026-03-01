# DialFlow CRM — Client Demo Guide

> **Demo date:** March 1, 2026  
> **Company slug used throughout:** `nexgen`  
> **App URL:** `http://localhost:8080` (or your deployed URL)

---

## Quick Reference — All Login Credentials

### Super Admin
| Field | Value |
|-------|-------|
| Email | `superadmin@dialflow.io` |
| Password | `Super@2026` |
| Company Slug | *(leave blank — or type any slug to enter as that company's admin)* |

### Admin (NexGen Solutions)
| Field | Value |
|-------|-------|
| Email | `admin@nexgen.demo` |
| Password | `Admin@2026` |
| Company Slug | `nexgen` |

### BDA / Sales Members — All 21 Agents
All BDA accounts use the **same password:** `BDA@2026` and company slug: `nexgen`

| # | Name | Email |
|---|------|-------|
| 1 | Rahul Sharma ⭐ Top Performer | `rahul.sharma@nexgen.demo` |
| 2 | Priya Patel ⭐ Top Closer | `priya.patel@nexgen.demo` |
| 3 | Amit Verma ⭐ High Call Volume | `amit.verma@nexgen.demo` |
| 4 | Sneha Gupta 🔵 Strong Performer | `sneha.gupta@nexgen.demo` |
| 5 | Vikram Singh 🔵 Fast Qualifier | `vikram.singh@nexgen.demo` |
| 6 | Neha Reddy 🔵 Best Talk Time | `neha.reddy@nexgen.demo` |
| 7 | Arjun Mehta 🔵 Consistent | `arjun.mehta@nexgen.demo` |
| 8 | Kavita Iyer 🟡 Average | `kavita.iyer@nexgen.demo` |
| 9 | Rohit Malhotra 🟡 Average | `rohit.malhotra@nexgen.demo` |
| 10 | Anjali Deshmukh 🟡 Average | `anjali.deshmukh@nexgen.demo` |
| 11 | Nitin Saxena 🟡 Average | `nitin.saxena@nexgen.demo` |
| 12 | Swati Pandey 🟡 Average | `swati.pandey@nexgen.demo` |
| 13 | Manoj Kumar 🟠 Learning | `manoj.kumar@nexgen.demo` |
| 14 | Pooja Nair 🟠 Learning | `pooja.nair@nexgen.demo` |
| 15 | Sanjay Kapoor 🟠 Learning | `sanjay.kapoor@nexgen.demo` |
| 16 | Meera Jain 🟠 Learning | `meera.jain@nexgen.demo` |
| 17 | Deepak Joshi 🟠 Learning | `deepak.joshi@nexgen.demo` |
| 18 | Sunita Rao 🔴 New Joiner | `sunita.rao@nexgen.demo` |
| 19 | Gaurav Choudhary 🔴 New Joiner | `gaurav.choudhary@nexgen.demo` |
| 20 | Ritika Sen 🔴 New Joiner | `ritika.sen@nexgen.demo` |
| 21 | Vivek Reddy 🔴 Day One | `vivek.reddy@nexgen.demo` |

---

## Demo Data Overview

| Category | Count | Details |
|----------|-------|---------|
| Tenant | 1 | NexGen Solutions (`nexgen`) |
| Users | 23 | 1 super admin · 1 admin · 21 BDAs |
| Leads | 80 | 20 new · 20 contacted · 25 interested · 15 closed |
| Call Logs | 83 | Spanning last 25 days (today → day −25) |
| Notifications | 18 | 8 unread (urgent/high) · 10 read |
| Activity Logs | 23 | Mixed achievements, closures, team updates |
| User Settings | 23 | One per user, pre-configured |

---

## Recommended Demo Flow

### Total time: ~25–30 minutes

---

### PART 1 — Admin Perspective (10 min)
*Login: `admin@nexgen.demo` / `Admin@2026` / `nexgen`*

#### Step 1.1 — Dashboard (2 min)
**What to show:**
- The **7 unread notifications** badge — click the bell to show urgent alerts: deal closures, team milestones, reminders.
- The **Today's stats** bento cards: calls made, deals closed, team online.
- The **Activity feed** — recent closures (today's big wins: Prakash Nair ₹3.6L, Jaya Kumar ₹5.0L Enterprise).
- The **Talk time chart** and **Lead Conversion funnel**.

**Talking points:**
> "As the sales manager, the first thing I see every morning is exactly what happened — who closed, who needs follow-up, and who's at risk. No more calling everyone for a morning standup."

---

#### Step 1.2 — Leads (3 min)
**What to show:**
- **80 leads** across 4 stages: New → Contacted → Interested → Closed.
- Filter by status — show the **25 Interested** leads that are hot pipeline.
- Click on a lead with a history (e.g., Siddharth Chopra or Hemant Saxena) to show the **call log history** inside the detail popup.
- Show **20 New unassigned leads** — demonstrate "Assign Lead" flow to a BDA.
- Highlight the **closed leads** (15) to show revenue already confirmed this month.

**Talking points:**
> "Every lead has a complete journey — from the first call to the close. If I tap into Siddharth Chopra, I can see every touchpoint, every note, every outcome in one place."

---

#### Step 1.3 — Team Management (2 min)
**What to show:**
- The **21 BDA cards** with their current status (active/idle/offline).
- Click on **Rahul Sharma** — show his performance: leads assigned, calls made, deals closed.
- Compare with a new joiner like **Vivek Reddy** — 0 calls, 0 leads assigned. 
- Show how admin can **assign leads directly** from the team member profile.

**Talking points:**
> "I can instantly see who's performing and who needs coaching. Rahul has 7 leads and closed 3 this week. Vivek just joined — I can give him starter leads right now."

---

#### Step 1.4 — Analytics (3 min)
**What to show:**
- **Top performers** leaderboard: Rahul #1, Priya #2, Amit #3.
- **Talk time trend** over the last 14 days — show the ramp-up curve.
- **Lead funnel chart** — the conversion pipeline (80 in → 15 closed deal).
- **Month vs Week** toggle — show the historical trend.

**Talking points:**
> "The analytics tell me our conversion rate from Interested to Closed is about 60%. That means if we push more leads to Interested stage, closures follow. I can make data-driven decisions about where to focus coaching."

---

### PART 2 — BDA Perspective: Top Performer (8 min)
*Logout admin → Login: `rahul.sharma@nexgen.demo` / `BDA@2026` / `nexgen`*

#### Step 2.1 — BDA Dashboard (2 min)
**What to show:**
- **Personal stats:** calls today, leads in progress, deals closed this week.
- **Achievement banner:** "50 total conversions — Top Performer! 🏆" notification.
- The **My Leads** quick view at a glance.
- The **Quick Actions** panel — "Call Next Lead" / "Log a Call".

**Talking points:**
> "From the BDA's view, everything is focused on one thing: what do I call next? No CRM nav, no confusion. The dashboard tells me my targets, my wins, and my next action."

---

#### Step 2.2 — My Leads (2 min)
**What to show:**
- Rahul's assigned leads: mix of contacted, interested, and 3 closed leads.
- Click **Siddharth Chopra** (Interested) → show call history, last note: *"Excellent call — wants full product demo. Scheduling Tuesday."*
- Click **Prakash Nair** (Closed) → closed today, shows full journey from first contact to closure.

**Talking points:**
> "Rahul doesn't see 80 leads — he sees only his 7. Each one has full context. Before calling Siddharth, he already knows the last conversation. No prep time wasted."

---

#### Step 2.3 — Post-Call Flow (2 min)
**What to show/simulate:**
- Tap a lead → "Initiate Call" (shows mock dialer).
- After call: **Post-Call Modal** appears automatically.
  - Select outcome: Interested / Follow Up / Closed Won / etc.
  - Add notes.
  - Submit → lead status updates, call logged.

**Talking points:**
> "The moment a call ends, this modal appears. In 10 seconds, Rahul logs the outcome and a note. That data instantly appears in the admin's dashboard — no end-of-day reporting, no spreadsheets."

---

#### Step 2.4 — Notifications (2 min)
**What to show:**
- Rahul's personal notifications: achievement alerts, follow-up reminders.
- Show the "5 Consecutive Closures 🔥" achievement notification.

**Talking points:**
> "Gamification keeps the team motivated. Rahul gets real-time achievement notifications — this creates healthy internal competition without the manager having to manually track anything."

---

### PART 3 — BDA Perspective: New Joiner (3 min)
*Logout → Login: `vivek.reddy@nexgen.demo` / `BDA@2026` / `nexgen`*

**What to show:**
- Dashboard with **0 leads, 0 calls** — clean slate that's ready for leads.
- The onboarding-friendly empty state (invite to set up profile, ready to start calling).
- Settings page — show the **auto-assign**, **notification preferences**, **timezone** etc.

**Talking points:**
> "Even on day one, Vivek has a fully functional workspace. The admin assigns leads and he's immediately productive. No manual onboarding configuration needed."

---

### PART 4 — Super Admin View (5 min)
*Logout → Login: `superadmin@dialflow.io` / `Super@2026` / (company slug: optional — leave blank for platform view)*

**What to show:**
- The **Platform Dashboard** — can see all tenants registered on the platform.
- Switch into NexGen tenant → instantly gets admin access.
- Demonstrate **tenant switcher** — could show a different company without logging out.
- The "Platform" view if applicable — shows system-level data.

**Talking points:**
> "For a SaaS deployment, the super admin can manage every client from a single login. They can jump into any company's workspace to provide support or audit data — without needing that company's credentials."

---

### PART 5 — Q&A / Key Features Recap (2 min)

**Feature highlights to emphasize:**

| Feature | Value |
|---------|-------|
| Real-time call logging | Notes and outcomes sync instantly to admin dashboard |
| Lead assignment | Admin can bulk-assign or manually assign with one tap |
| Performance leaderboard | Auto-ranks BDAs by conversions — drives competition |
| Notification system | Urgent deal alerts, follow-up reminders, achievement badges |
| Role-based access | Admin sees everything; BDA sees only their leads |
| Multi-tenant | One platform, multiple companies, isolated data |
| Analytics | Talk time trends, conversion funnels, 14-day history |
| Dark/Light mode | Toggle from any screen |

---

## Pro Tips for the Demo

### Before you begin
- [ ] Run `node scripts/seed-demo.mjs` to ensure fresh data
- [ ] Open two browser tabs — one for admin, one for BDA (incognito for BDA)
- [ ] Disable browser notifications to avoid interruptions
- [ ] Bookmark: `http://localhost:8080` or your deployed URL

### Create "live" effect during demo
1. Log in as a BDA in one tab (e.g., Priya Patel)
2. Log a call on a lead and submit the post-call modal
3. Switch to the admin tab → refresh analytics → **the data is already there**

This shows real-time data flow live in front of the client — very compelling.

### If asked "can multiple BDAs be online at the same time?"
Login as `rahul.sharma@nexgen.demo` in regular browser and `priya.patel@nexgen.demo` in incognito. Both are "active" and admin can see both dashboards simultaneously.

### Numbers to cite during demo
- **80 leads** in the pipeline right now
- **15 closed deals** confirmed this month
- **83 call logs** across 25 days of activity
- **₹3.6L** — largest single deal (Prakash Nair by Rahul Sharma)
- **₹5.0L** — biggest enterprise deal (Jaya Kumar by Sneha Gupta)
- **50 conversions** — Rahul's milestone (shown as achievement)
- **82% of monthly target** hit — shown in analytics

---

## Re-running the Seed (if you need fresh data)

```sh
# From the project root
node scripts/seed-demo.mjs
```

The script uses `INSERT OR IGNORE` — it's **safe to run multiple times**. Existing records with the same IDs are skipped. To fully reset, run the script after clearing the demo records:

```sql
-- Run in Turso shell to wipe demo data before re-seeding
DELETE FROM activity_logs  WHERE tenant_id = '10000001-0000-0000-0000-000000000001';
DELETE FROM notifications  WHERE tenant_id = '10000001-0000-0000-0000-000000000001';
DELETE FROM call_logs      WHERE tenant_id = '10000001-0000-0000-0000-000000000001';
DELETE FROM leads          WHERE tenant_id = '10000001-0000-0000-0000-000000000001';
DELETE FROM user_settings  WHERE user_id IN (SELECT id FROM app_users WHERE email LIKE '%@nexgen.demo');
DELETE FROM tenant_memberships WHERE tenant_id = '10000001-0000-0000-0000-000000000001';
DELETE FROM app_users      WHERE email LIKE '%@nexgen.demo';
DELETE FROM app_users      WHERE email = 'superadmin@dialflow.io';
DELETE FROM tenants        WHERE id = '10000001-0000-0000-0000-000000000001';
```

---

## Lead Distribution Reference

| BDA | Leads Assigned | Contacted | Interested | Closed |
|-----|---------------|-----------|------------|--------|
| Rahul Sharma | 7 | 2 | 2 | 3 |
| Priya Patel | 7 | 2 | 2 | 3 |
| Amit Verma | 6 | 2 | 2 | 2 |
| Sneha Gupta | 6 | 2 | 2 | 2 |
| Vikram Singh | 6 | 2 | 2 | 2 |
| Neha Reddy | 5 | 2 | 2 | 1 |
| Arjun Mehta | 5 | 2 | 2 | 1 |
| Kavita Iyer | 4 | 2 | 2 | 0 |
| Rohit Malhotra | 4 | 2 | 2 | 0 |
| Anjali Deshmukh | 4 | 2 | 2 | 0 |
| Nitin Saxena | 1 | 0 | 1 | 0 |
| Swati Pandey | 1 | 0 | 1 | 0 |
| Manoj Kumar | 1 | 0 | 1 | 0 |
| Pooja Nair | 1 | 0 | 1 | 0 |
| Sanjay Kapoor | 1 | 0 | 1 | 0 |
| Meera–Vivek (6 users) | 0 | — | — | — |
| **Unassigned (new)** | **20** | — | — | — |

---

*Generated by `scripts/seed-demo.mjs` · DialFlow CRM Demo Setup*
