/**
 * DialFlow — Full Demo Seed Script
 *
 * Creates 1 SuperAdmin + 1 Admin + 21 BDAs across a realistic demo tenant,
 * plus 80 leads, ~160 call logs, 22 notifications, 23 settings records,
 * and 30 activity log entries — all with authentic Indian names and data.
 *
 * Run once (safe to re-run; uses INSERT OR IGNORE):
 *   node scripts/seed-demo.mjs
 *
 * Requirements: Node 18+, @libsql/client installed, .env file present.
 */

import { readFileSync } from "fs";
import { createClient } from "@libsql/client/web";

// ─── 1. Load .env ──────────────────────────────────────────────────────────

const envRaw = readFileSync(".env", "utf-8");
const env = {};
for (const line of envRaw.split("\n")) {
  const idx = line.indexOf("=");
  if (idx > 0) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

const DB_URL        = env["VITE_TURSO_DATABASE_URL"];
const DB_AUTH_TOKEN = env["VITE_TURSO_AUTH_TOKEN"];

if (!DB_URL || !DB_AUTH_TOKEN) {
  console.error("❌  Missing VITE_TURSO_DATABASE_URL or VITE_TURSO_AUTH_TOKEN in .env");
  process.exit(1);
}

const client = createClient({ url: DB_URL, authToken: DB_AUTH_TOKEN });

// ─── 2. Timestamp helpers ──────────────────────────────────────────────────

// Demo reference: March 1 2026, 10:00 AM IST (04:30 UTC)
const REF = new Date("2026-03-01T04:30:00.000Z");

/** Returns ISO timestamp offset by hours + days from demo reference date. */
function ts(hours = 0, days = 0) {
  const d = new Date(REF);
  d.setTime(d.getTime() - (days * 86400 + hours * 3600) * 1000);
  return d.toISOString().replace(/\.\d{3}Z$/, ".000Z");
}

/** Random offset within a window (for variety). */
function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── 3. Fixed IDs ─────────────────────────────────────────────────────────

const T1  = "10000001-0000-0000-0000-000000000001"; // NexGen Solutions

const SA  = "20000001-0000-0000-0000-000000000001"; // superadmin@dialflow.io
const A1  = "20000001-0000-0000-0000-000000000002"; // admin@nexgen.demo
// BDAs M01–M21
const M = {};
for (let i = 1; i <= 21; i++) {
  M[i] = `20000001-0000-0000-0000-${String(i + 2).padStart(12, "0")}`;
}

// Leads L001–L080
const L = {};
for (let i = 1; i <= 80; i++) {
  L[i] = `30000001-0000-0000-0000-${String(i).padStart(12, "0")}`;
}

// ─── 4. Static data definitions ───────────────────────────────────────────

// Password hashes (SHA-256)
const H_SUPER = "04b4b063c2038952abec8e274f99a6b9a964642d3cf5e98707aae82148f29f05"; // Super@2026
const H_ADMIN = "a36aef5a11c4073fbe60314fc9df530a9d5f986533594d1f5190742ff9e0e408"; // Admin@2026
const H_BDA   = "78bf4d787e90276d5ba25228c79b4732d698f01c8dcc84e7ce2df0a576ec0dbd"; // BDA@2026

const BDA_COLORS = ["violet","blue","emerald","orange","pink","cyan","indigo","rose","amber","teal"];

/** 21 BDA profiles — tier-1 to tier-5 (performance) */
const BDA_PROFILES = [
  // Tier 1 — Top performers
  { n: 1,  name: "Rahul Sharma",       email: "rahul.sharma@nexgen.demo",       phone: "+91 98765 43001" },
  { n: 2,  name: "Priya Patel",        email: "priya.patel@nexgen.demo",        phone: "+91 98765 43002" },
  { n: 3,  name: "Amit Verma",         email: "amit.verma@nexgen.demo",         phone: "+91 98765 43003" },
  // Tier 2 — Strong performers
  { n: 4,  name: "Sneha Gupta",        email: "sneha.gupta@nexgen.demo",        phone: "+91 98765 43004" },
  { n: 5,  name: "Vikram Singh",       email: "vikram.singh@nexgen.demo",       phone: "+91 98765 43005" },
  { n: 6,  name: "Neha Reddy",         email: "neha.reddy@nexgen.demo",         phone: "+91 98765 43006" },
  { n: 7,  name: "Arjun Mehta",        email: "arjun.mehta@nexgen.demo",        phone: "+91 98765 43007" },
  // Tier 3 — Average performers
  { n: 8,  name: "Kavita Iyer",        email: "kavita.iyer@nexgen.demo",        phone: "+91 98765 43008" },
  { n: 9,  name: "Rohit Malhotra",     email: "rohit.malhotra@nexgen.demo",     phone: "+91 98765 43009" },
  { n: 10, name: "Anjali Deshmukh",    email: "anjali.deshmukh@nexgen.demo",    phone: "+91 98765 43010" },
  { n: 11, name: "Nitin Saxena",       email: "nitin.saxena@nexgen.demo",       phone: "+91 98765 43011" },
  { n: 12, name: "Swati Pandey",       email: "swati.pandey@nexgen.demo",       phone: "+91 98765 43012" },
  // Tier 4 — Learning the ropes
  { n: 13, name: "Manoj Kumar",        email: "manoj.kumar@nexgen.demo",        phone: "+91 98765 43013" },
  { n: 14, name: "Pooja Nair",         email: "pooja.nair@nexgen.demo",         phone: "+91 98765 43014" },
  { n: 15, name: "Sanjay Kapoor",      email: "sanjay.kapoor@nexgen.demo",      phone: "+91 98765 43015" },
  { n: 16, name: "Meera Jain",         email: "meera.jain@nexgen.demo",         phone: "+91 98765 43016" },
  { n: 17, name: "Deepak Joshi",       email: "deepak.joshi@nexgen.demo",       phone: "+91 98765 43017" },
  // Tier 5 — New joiners
  { n: 18, name: "Sunita Rao",         email: "sunita.rao@nexgen.demo",         phone: "+91 98765 43018" },
  { n: 19, name: "Gaurav Choudhary",   email: "gaurav.choudhary@nexgen.demo",   phone: "+91 98765 43019" },
  { n: 20, name: "Ritika Sen",         email: "ritika.sen@nexgen.demo",         phone: "+91 98765 43020" },
  { n: 21, name: "Vivek Reddy",        email: "vivek.reddy@nexgen.demo",        phone: "+91 98765 43021" },
];

/** 80 leads — realistic Indian B2B/B2C contacts */
const LEADS_RAW = [
  // new / unassigned — 20 leads
  { i:  1, name: "Aryan Khanna",           phone: "+91 91100 00001", status: "new",       assigned: null,  age_days: rnd(1,3)  },
  { i:  2, name: "Divya Menon",            phone: "+91 91100 00002", status: "new",       assigned: null,  age_days: rnd(1,3)  },
  { i:  3, name: "Suresh Pillai",          phone: "+91 91100 00003", status: "new",       assigned: null,  age_days: rnd(1,4)  },
  { i:  4, name: "Meghna Tiwari",          phone: "+91 91100 00004", status: "new",       assigned: null,  age_days: rnd(1,4)  },
  { i:  5, name: "Rajan Sharma",           phone: "+91 91100 00005", status: "new",       assigned: null,  age_days: rnd(1,5)  },
  { i:  6, name: "Anita Krishnan",         phone: "+91 91100 00006", status: "new",       assigned: null,  age_days: rnd(2,5)  },
  { i:  7, name: "Harish Bhat",            phone: "+91 91100 00007", status: "new",       assigned: null,  age_days: rnd(2,5)  },
  { i:  8, name: "Lalita Singh",           phone: "+91 91100 00008", status: "new",       assigned: null,  age_days: rnd(2,6)  },
  { i:  9, name: "Pavan Reddy",            phone: "+91 91100 00009", status: "new",       assigned: null,  age_days: rnd(3,6)  },
  { i: 10, name: "Nandita Rao",            phone: "+91 91100 00010", status: "new",       assigned: null,  age_days: rnd(3,6)  },
  { i: 11, name: "Sriram Iyer",            phone: "+91 91100 00011", status: "new",       assigned: null,  age_days: rnd(3,7)  },
  { i: 12, name: "Geetha Nair",            phone: "+91 91100 00012", status: "new",       assigned: null,  age_days: rnd(3,7)  },
  { i: 13, name: "Karthik Murugan",        phone: "+91 91100 00013", status: "new",       assigned: null,  age_days: rnd(4,7)  },
  { i: 14, name: "Preeti Shah",            phone: "+91 91100 00014", status: "new",       assigned: null,  age_days: rnd(4,8)  },
  { i: 15, name: "Ajay Bansal",            phone: "+91 91100 00015", status: "new",       assigned: null,  age_days: rnd(4,8)  },
  { i: 16, name: "Vandana Mishra",         phone: "+91 91100 00016", status: "new",       assigned: null,  age_days: rnd(5,8)  },
  { i: 17, name: "Rajesh Ghosh",           phone: "+91 91100 00017", status: "new",       assigned: null,  age_days: rnd(5,9)  },
  { i: 18, name: "Sudha Kulkarni",         phone: "+91 91100 00018", status: "new",       assigned: null,  age_days: rnd(5,9)  },
  { i: 19, name: "Vikas Agarwal",          phone: "+91 91100 00019", status: "new",       assigned: null,  age_days: rnd(6,9)  },
  { i: 20, name: "Chitra Srinivasan",      phone: "+91 91100 00020", status: "new",       assigned: null,  age_days: rnd(6,10) },

  // contacted — 20 leads (M01-M10, 2 each)
  { i: 21, name: "Aditya Kapoor",          phone: "+91 91100 00021", status: "contacted", assigned: M[1],  age_days: rnd(5,10) },
  { i: 22, name: "Pallavi Joshi",          phone: "+91 91100 00022", status: "contacted", assigned: M[1],  age_days: rnd(5,10) },
  { i: 23, name: "Manish Trivedi",         phone: "+91 91100 00023", status: "contacted", assigned: M[2],  age_days: rnd(5,10) },
  { i: 24, name: "Ritu Choudhary",         phone: "+91 91100 00024", status: "contacted", assigned: M[2],  age_days: rnd(5,10) },
  { i: 25, name: "Dinesh Pillai",          phone: "+91 91100 00025", status: "contacted", assigned: M[3],  age_days: rnd(6,11) },
  { i: 26, name: "Shobha Rao",             phone: "+91 91100 00026", status: "contacted", assigned: M[3],  age_days: rnd(6,11) },
  { i: 27, name: "Pankaj Mathur",          phone: "+91 91100 00027", status: "contacted", assigned: M[4],  age_days: rnd(6,11) },
  { i: 28, name: "Indira Bose",            phone: "+91 91100 00028", status: "contacted", assigned: M[4],  age_days: rnd(6,12) },
  { i: 29, name: "Rakesh Dubey",           phone: "+91 91100 00029", status: "contacted", assigned: M[5],  age_days: rnd(7,12) },
  { i: 30, name: "Sonal Mehta",            phone: "+91 91100 00030", status: "contacted", assigned: M[5],  age_days: rnd(7,12) },
  { i: 31, name: "Govind Prasad",          phone: "+91 91100 00031", status: "contacted", assigned: M[6],  age_days: rnd(7,13) },
  { i: 32, name: "Kavitha Nambiar",        phone: "+91 91100 00032", status: "contacted", assigned: M[6],  age_days: rnd(7,13) },
  { i: 33, name: "Bharat Solanki",         phone: "+91 91100 00033", status: "contacted", assigned: M[7],  age_days: rnd(8,13) },
  { i: 34, name: "Poornima Hegde",         phone: "+91 91100 00034", status: "contacted", assigned: M[7],  age_days: rnd(8,14) },
  { i: 35, name: "Sanjeev Khanna",         phone: "+91 91100 00035", status: "contacted", assigned: M[8],  age_days: rnd(8,14) },
  { i: 36, name: "Amrita Jha",             phone: "+91 91100 00036", status: "contacted", assigned: M[8],  age_days: rnd(9,14) },
  { i: 37, name: "Yashwant Patil",         phone: "+91 91100 00037", status: "contacted", assigned: M[9],  age_days: rnd(9,15) },
  { i: 38, name: "Veena Sharma",           phone: "+91 91100 00038", status: "contacted", assigned: M[9],  age_days: rnd(9,15) },
  { i: 39, name: "Tarun Aggarwal",         phone: "+91 91100 00039", status: "contacted", assigned: M[10], age_days: rnd(10,15) },
  { i: 40, name: "Rukmini Das",            phone: "+91 91100 00040", status: "contacted", assigned: M[10], age_days: rnd(10,16) },

  // interested — 25 leads (M01-M15 mixed)
  { i: 41, name: "Siddharth Chopra",       phone: "+91 91100 00041", status: "interested", assigned: M[1],  age_days: rnd(10,18) },
  { i: 42, name: "Nisha Pandey",           phone: "+91 91100 00042", status: "interested", assigned: M[1],  age_days: rnd(10,18) },
  { i: 43, name: "Hemant Saxena",          phone: "+91 91100 00043", status: "interested", assigned: M[2],  age_days: rnd(10,18) },
  { i: 44, name: "Anuradha Singh",         phone: "+91 91100 00044", status: "interested", assigned: M[2],  age_days: rnd(11,19) },
  { i: 45, name: "Vimal Kumar",            phone: "+91 91100 00045", status: "interested", assigned: M[3],  age_days: rnd(11,19) },
  { i: 46, name: "Shanti Reddy",           phone: "+91 91100 00046", status: "interested", assigned: M[3],  age_days: rnd(11,20) },
  { i: 47, name: "Kamlesh Patel",          phone: "+91 91100 00047", status: "interested", assigned: M[4],  age_days: rnd(12,20) },
  { i: 48, name: "Tanuja Iyer",            phone: "+91 91100 00048", status: "interested", assigned: M[4],  age_days: rnd(12,20) },
  { i: 49, name: "Raghavendra Rao",        phone: "+91 91100 00049", status: "interested", assigned: M[5],  age_days: rnd(12,21) },
  { i: 50, name: "Lakshmi Prasad",         phone: "+91 91100 00050", status: "interested", assigned: M[5],  age_days: rnd(12,21) },
  { i: 51, name: "Deepesh Verma",          phone: "+91 91100 00051", status: "interested", assigned: M[6],  age_days: rnd(13,22) },
  { i: 52, name: "Jyoti Gurjar",           phone: "+91 91100 00052", status: "interested", assigned: M[6],  age_days: rnd(13,22) },
  { i: 53, name: "Santosh Naik",           phone: "+91 91100 00053", status: "interested", assigned: M[7],  age_days: rnd(13,22) },
  { i: 54, name: "Madhuri Bhat",           phone: "+91 91100 00054", status: "interested", assigned: M[7],  age_days: rnd(14,23) },
  { i: 55, name: "Vinay Mahajan",          phone: "+91 91100 00055", status: "interested", assigned: M[8],  age_days: rnd(14,23) },
  { i: 56, name: "Shailaja Venkatesh",     phone: "+91 91100 00056", status: "interested", assigned: M[8],  age_days: rnd(14,24) },
  { i: 57, name: "Prashant Kale",          phone: "+91 91100 00057", status: "interested", assigned: M[9],  age_days: rnd(15,24) },
  { i: 58, name: "Meenakshi Sundaram",     phone: "+91 91100 00058", status: "interested", assigned: M[9],  age_days: rnd(15,25) },
  { i: 59, name: "Ashwin Trivedi",         phone: "+91 91100 00059", status: "interested", assigned: M[10], age_days: rnd(15,25) },
  { i: 60, name: "Rekha Bajaj",            phone: "+91 91100 00060", status: "interested", assigned: M[10], age_days: rnd(16,25) },
  { i: 61, name: "Umesh Choudhary",        phone: "+91 91100 00061", status: "interested", assigned: M[11], age_days: rnd(16,26) },
  { i: 62, name: "Padmini Krishnaswamy",   phone: "+91 91100 00062", status: "interested", assigned: M[12], age_days: rnd(16,26) },
  { i: 63, name: "Ravi Shekhar",           phone: "+91 91100 00063", status: "interested", assigned: M[13], age_days: rnd(17,27) },
  { i: 64, name: "Sumitra Pandey",         phone: "+91 91100 00064", status: "interested", assigned: M[14], age_days: rnd(17,27) },
  { i: 65, name: "Kartik Jain",            phone: "+91 91100 00065", status: "interested", assigned: M[15], age_days: rnd(17,28) },

  // closed — 15 leads (M01-M08 mixed, showing top performers close more)
  { i: 66, name: "Prakash Nair",           phone: "+91 91100 00066", status: "closed", assigned: M[1],  age_days: rnd(18,28) },
  { i: 67, name: "Savita Sharma",          phone: "+91 91100 00067", status: "closed", assigned: M[1],  age_days: rnd(18,28) },
  { i: 68, name: "Dilip Gupta",            phone: "+91 91100 00068", status: "closed", assigned: M[2],  age_days: rnd(18,28) },
  { i: 69, name: "Pooja Reddy",            phone: "+91 91100 00069", status: "closed", assigned: M[2],  age_days: rnd(19,29) },
  { i: 70, name: "Mohan Rao",              phone: "+91 91100 00070", status: "closed", assigned: M[3],  age_days: rnd(19,29) },
  { i: 71, name: "Prabha Venkatesh",       phone: "+91 91100 00071", status: "closed", assigned: M[3],  age_days: rnd(19,29) },
  { i: 72, name: "Sunil Malhotra",         phone: "+91 91100 00072", status: "closed", assigned: M[4],  age_days: rnd(20,28) },
  { i: 73, name: "Jaya Kumar",             phone: "+91 91100 00073", status: "closed", assigned: M[4],  age_days: rnd(20,28) },
  { i: 74, name: "Naresh Singh",           phone: "+91 91100 00074", status: "closed", assigned: M[5],  age_days: rnd(20,28) },
  { i: 75, name: "Usha Mehta",             phone: "+91 91100 00075", status: "closed", assigned: M[5],  age_days: rnd(21,29) },
  { i: 76, name: "Mukesh Pandey",          phone: "+91 91100 00076", status: "closed", assigned: M[6],  age_days: rnd(21,29) },
  { i: 77, name: "Saritha Pillai",         phone: "+91 91100 00077", status: "closed", assigned: M[6],  age_days: rnd(22,29) },
  { i: 78, name: "Devendra Joshi",         phone: "+91 91100 00078", status: "closed", assigned: M[7],  age_days: rnd(22,29) },
  { i: 79, name: "Laleh Mishra",           phone: "+91 91100 00079", status: "closed", assigned: M[8],  age_days: rnd(23,29) },
  { i: 80, name: "Amarjit Singh",          phone: "+91 91100 00080", status: "closed", assigned: M[8],  age_days: rnd(23,29) },
];

/** Call log templates by outcome */
const CALL_NOTES = {
  "Interested":     ["Great conversation. Client is keen to proceed.", "Excellent call — moving to proposal stage.", "Client wants a full demo next week.", "Very positive response. Sending pricing today.", "Client comparing options, we're the frontrunner."],
  "Follow Up":      ["Needs internal approval. Following up Thursday.", "Client on leave, reconnecting next Monday.", "Requested pricing document via email.", "Asked for a case study. Following up after review.", "Decision deferred to next week."],
  "Closed Won":     ["Deal signed! Annual plan confirmed.", "Contract closed. Onboarding starts Monday.", "Upsell successful — upgraded to Premium plan.", "₹2.4L annual contract confirmed.", "Excellent deal closure — ₹3.6L contract."],
  "Voicemail":      ["Left voicemail. Will try again tomorrow.", "No answer. Voicemail left — asked for callback.", "Third attempt. Left detailed voicemail."],
  "Not Interested": ["Budget constraints this quarter.", "Currently using a competitor, locked in 1 year.", "Not the right fit, suggest revisiting in Q3.", "Decision-maker unavailable indefinitely."],
  "Wrong Number":   ["Incorrect number on file. Need to update contact.", "Wrong person answered. Verifying lead details."],
};

function randomNote(outcome) {
  const arr = CALL_NOTES[outcome] || ["Call completed."];
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomOutcome(status) {
  if (status === "closed")     return "Closed Won";
  if (status === "interested") return Math.random() < 0.6 ? "Interested" : Math.random() < 0.5 ? "Follow Up" : "Voicemail";
  if (status === "contacted")  return Math.random() < 0.4 ? "Follow Up" : Math.random() < 0.5 ? "Interested" : Math.random() < 0.5 ? "Voicemail" : "Not Interested";
  return "Follow Up";
}

function randomDuration(outcome) {
  if (outcome === "Voicemail" || outcome === "Wrong Number") return rnd(15, 60);
  if (outcome === "Not Interested") return rnd(30, 180);
  if (outcome === "Closed Won") return rnd(480, 900);
  if (outcome === "Interested") return rnd(240, 720);
  return rnd(120, 480);
}

// ─── 5. Build INSERT statements ────────────────────────────────────────────

const stmts = [];

// ── a. Tenant
stmts.push({ sql: `INSERT OR IGNORE INTO tenants (id, name, slug, plan, is_active, settings, created_at, updated_at)
  VALUES (?, ?, ?, ?, 1, '{}', ?, ?)`,
  args: [T1, "NexGen Solutions", "nexgen", "pro", ts(0, 30), ts(0, 30)] });

// ── b. Users
stmts.push({ sql: `INSERT OR IGNORE INTO app_users (id, email, phone, password_hash, display_name, avatar_color, is_super_admin, is_active, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
  args: [SA, "superadmin@dialflow.io", "+91 98000 00001", H_SUPER, "Super Admin", "violet", ts(0, 90), ts(0, 90)] });

stmts.push({ sql: `INSERT OR IGNORE INTO app_users (id, email, phone, password_hash, display_name, avatar_color, is_super_admin, is_active, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?)`,
  args: [A1, "admin@nexgen.demo", "+91 98000 00002", H_ADMIN, "Rajiv Nair (Admin)", "indigo", ts(0, 30), ts(0, 30)] });

for (const b of BDA_PROFILES) {
  const uid = M[b.n];
  const color = BDA_COLORS[(b.n - 1) % BDA_COLORS.length];
  const joinDays = b.n <= 7 ? rnd(25, 30) : b.n <= 12 ? rnd(15, 25) : b.n <= 17 ? rnd(7, 14) : rnd(1, 6);
  stmts.push({ sql: `INSERT OR IGNORE INTO app_users (id, email, phone, password_hash, display_name, avatar_color, is_super_admin, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?)`,
    args: [uid, b.email, b.phone, H_BDA, b.name, color, ts(0, joinDays), ts(0, joinDays)] });
}

// ── c. Tenant memberships
stmts.push({ sql: `INSERT OR IGNORE INTO tenant_memberships (id, user_id, tenant_id, role, is_active, joined_at)
  VALUES (?, ?, ?, 'admin', 1, ?)`,
  args: [`40000001-0000-0000-0000-000000000001`, A1, T1, ts(0, 30)] });

for (const b of BDA_PROFILES) {
  stmts.push({ sql: `INSERT OR IGNORE INTO tenant_memberships (id, user_id, tenant_id, role, is_active, joined_at)
    VALUES (?, ?, ?, 'member', 1, ?)`,
    args: [`40000001-0000-0000-0000-${String(b.n + 1).padStart(12, "0")}`, M[b.n], T1, ts(0, rnd(7, 30))] });
}

// ── d. Leads
for (const lead of LEADS_RAW) {
  stmts.push({ sql: `INSERT OR IGNORE INTO leads (id, tenant_id, name, phone, status, assigned_to, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [L[lead.i], T1, lead.name, lead.phone, lead.status, lead.assigned, ts(rnd(0, 8), lead.age_days), ts(rnd(0, 4), Math.max(0, lead.age_days - rnd(1, 3)))] });
}

// ── e. Call logs — build ~160 calls across 30 days
const callLogData = [];
let clId = 1;

function addCall(leadIdx, userId, offsetDays, offsetHours, outcome, overrideNote) {
  const out = outcome || randomOutcome(LEADS_RAW[leadIdx - 1].status);
  callLogData.push({
    id: `80000001-0000-0000-0000-${String(clId++).padStart(12, "0")}`,
    lead: L[leadIdx],
    user: userId,
    dur: randomDuration(out),
    out,
    note: overrideNote || randomNote(out),
    ts: ts(offsetHours, offsetDays),
  });
}

// Today's calls (high visibility, vivid outcomes for the demo)
addCall(41, M[1], 0, 2,  "Interested",  "Excellent call — Siddharth wants a full product demo. Scheduling Tuesday.");
addCall(66, M[1], 0, 4,  "Closed Won",  "₹3.6L annual contract closed with Prakash Nair. Onboarding Monday!");
addCall(43, M[2], 0, 1,  "Interested",  "Hemant is comparing vendors. We're the frontrunner — sending proposal.");
addCall(68, M[2], 0, 3,  "Closed Won",  "Dilip Gupta confirmed Premium plan. ₹2.4L deal done.");
addCall(45, M[3], 0, 2,  "Interested",  "Vimal Kumar needs board approval. Very positive discussion.");
addCall(70, M[3], 0, 5,  "Closed Won",  "Mohan Rao signed on — ₹1.8L contract. Team's 3rd closure today!");
addCall(47, M[4], 0, 3,  "Follow Up",   "Kamlesh needs pricing doc. Sending over email today.");
addCall(72, M[4], 0, 6,  "Closed Won",  "Sunil Malhotra upgraded to Enterprise. ₹4.2L deal!");
addCall(29, M[5], 0, 2,  "Follow Up",   "Rakesh Dubey needs internal sign-off. Callback Friday.");
addCall(74, M[5], 0, 4,  "Closed Won",  "Usha Mehta — annual deal signed. ₹1.2L.");
addCall(31, M[6], 0, 3,  "Voicemail",   "No answer. Left voicemail, will try again tomorrow.");
addCall(51, M[6], 0, 5,  "Interested",  "Deepesh Verma VERY interested. Demo scheduled Thursday.");
addCall(33, M[7], 0, 4,  "Follow Up",   "Bharat Solanki needs proposal PDF. Sharing this afternoon.");
addCall(53, M[7], 0, 6,  "Interested",  "Santosh Naik wants to involve CFO. Great sign!");
addCall(35, M[8], 0, 5,  "Not Interested", "Sanjeev Khanna — budget freeze until Q3. Reminding then.");
addCall(55, M[8], 0, 7,  "Interested",  "Vinay Mahajan very positive. Follow-up call booked.");

// Yesterday's calls
addCall(42, M[1], 1, 2,  "Follow Up",   "Nisha sent questions by email. Responding with detailed answers.");
addCall(67, M[1], 1, 5,  "Closed Won",  "Savita Sharma deal closed. ₹2.8L standard plan.");
addCall(44, M[2], 1, 1,  "Interested",  "Anuradha Singh — very warm lead. Moving to proposal stage.");
addCall(69, M[2], 1, 4,  "Closed Won",  "Pooja Reddy contract confirmed. Seamless close — ₹1.6L.");
addCall(46, M[3], 1, 3,  "Interested",  "Shanti Reddy interested in onboarding entire team.");
addCall(23, M[2], 1, 6,  "Follow Up",   "Manish needs approval from his manager. Following up Monday.");
addCall(27, M[4], 1, 2,  "Voicemail",   "No answer from Pankaj Mathur. Will try morning slot tomorrow.");
addCall(71, M[3], 1, 3,  "Closed Won",  "Prabha Venkatesh signed off on deal. ₹3.0L contract.");
addCall(48, M[4], 1, 5,  "Follow Up",   "Tanuja Iyer comparing 2 other vendors. Following up in 3 days.");
addCall(73, M[4], 1, 4,  "Closed Won",  "Jaya Kumar — Enterprise plan closed. ₹5.0L.");
addCall(36, M[8], 1, 6,  "Follow Up",   "Amrita Jha requested a pilot. Arranging 2-week trial.");
addCall(57, M[9], 1, 3,  "Interested",  "Prashant Kale very positive. Budget confirmed for Q1.");

// 2 days ago
addCall(49, M[5], 2, 3,  "Interested",  "Raghavendra Rao — strong lead. Scheduling demo this week.");
addCall(75, M[5], 2, 1,  "Closed Won",  "Usha Mehta — deal done after 4 calls. ₹2.0L.");
addCall(50, M[5], 2, 5,  "Follow Up",   "Lakshmi Prasad needs to discuss with partner.");
addCall(25, M[3], 2, 4,  "Follow Up",   "Dinesh Pillai — callback after his travel next week.");
addCall(37, M[9], 2, 2,  "Voicemail",   "Yashwant Patil unavailable. Third attempt.");
addCall(59, M[10], 2, 6, "Interested",  "Ashwin Trivedi saw ROI calculation. Highly interested.");
addCall(52, M[6], 2, 3,  "Interested",  "Jyoti Gurjar confirmed budget availability for this quarter.");
addCall(76, M[6], 2, 5,  "Closed Won",  "Mukesh Pandey contract closed. ₹1.4L standard plan.");
addCall(21, M[1], 2, 2,  "Follow Up",   "Aditya Kapoor — good call, needs feature walkthrough.");
addCall(61, M[11], 2, 4, "Interested",  "Umesh Choudhary first positive contact. Promising lead.");

// 3–5 days ago
addCall(54, M[7], 3, 3,  "Interested",  "Madhuri Bhat — ready to move forward after budget approval.");
addCall(77, M[6], 3, 2,  "Closed Won",  "Saritha Pillai annual plan confirmed. ₹1.8L.");
addCall(22, M[1], 3, 5,  "Not Interested", "Pallavi Joshi budget cut. Follow up in Q3.");
addCall(39, M[10], 3, 4, "Follow Up",   "Tarun Aggarwal asked for case study in fintech.");
addCall(62, M[12], 3, 6, "Interested",  "Padmini K. — first positive call. Scheduling formal demo.");
addCall(24, M[2], 3, 3,  "Voicemail",   "Ritu Choudhary not reachable. Left voicemail.");
addCall(55, M[8], 4, 2,  "Follow Up",   "Vinay Mahajan — proposal sent. Awaiting feedback Thursday.");
addCall(78, M[7], 4, 4,  "Closed Won",  "Devendra Joshi signed deal. ₹2.2L.");
addCall(38, M[9], 4, 5,  "Not Interested", "Veena Sharma — budget freeze. Revisit Q2.");
addCall(60, M[10], 4, 3, "Follow Up",   "Rekha Bajaj — decision next week after team meeting.");
addCall(30, M[5], 4, 6,  "Follow Up",   "Sonal Mehta requested pilot demo. Arranging next week.");
addCall(63, M[13], 5, 2, "Interested",  "Ravi Shekhar — first contact. Good engagement.");
addCall(79, M[8], 5, 4,  "Closed Won",  "Laleh Mishra confirmed deal. ₹1.6L.");
addCall(56, M[8], 5, 3,  "Interested",  "Shailaja Venkatesh — moving to advanced discussion.");
addCall(26, M[3], 5, 5,  "Voicemail",   "Shobha Rao — no answer twice. Trying different time slot.");
addCall(64, M[14], 5, 6, "Follow Up",   "Sumitra Pandey — first call positive. Sending deck.");

// 6–10 days ago
addCall(41, M[1], 6, 3,  "Follow Up",   "Siddharth Chopra — good discovery call. Follow-up email sent.");
addCall(43, M[2], 6, 2,  "Follow Up",   "Hemant Saxena — initial interest. Call again next week.");
addCall(45, M[3], 6, 4,  "Follow Up",   "Vimal Kumar — needs ROI document before proceeding.");
addCall(47, M[4], 7, 3,  "Voice Mail",  "Kamlesh Patel not available. Left voicemail.");
addCall(49, M[5], 7, 5,  "Follow Up",   "Raghavendra initial call. Interested in CRM capabilities.");
addCall(51, M[6], 7, 2,  "Follow Up",   "Deepesh Verma — needs feature list. Sharing tomorrow.");
addCall(53, M[7], 8, 4,  "Not Interested", "Santosh was exploring. Not ready to move forward yet.");
addCall(53, M[7], 10, 3, "Follow Up",   "Reconnected with Santosh. Changed mind, open to a demo.");
addCall(57, M[9], 8, 6,  "Follow Up",   "Prashant Kale initial discovery call. Budget discussion next.");
addCall(59, M[10], 9, 3, "Follow Up",   "Ashwin Trivedi — sent product overview, scheduling demo.");
addCall(61, M[11], 10, 4,"Follow Up",   "Umesh first call. Sending introductory email.");
addCall(33, M[7], 9, 5,  "Follow Up",   "Bharat Solanki — sent company overview. Awaiting reply.");
addCall(66, M[1], 9, 2,  "Interested",  "Prakash Nair warm call. Sending contract draft.");
addCall(68, M[2], 10, 4, "Interested",  "Dilip Gupta very interested. Proposal stage.");
addCall(70, M[3], 10, 3, "Interested",  "Mohan Rao positive meeting. Moving to close.");
addCall(72, M[4], 10, 5, "Interested",  "Sunil Malhotra negotiating terms. Close imminent.");
addCall(74, M[5], 11, 4, "Interested",  "Usha Mehta — ready to sign. Paperwork in progress.");
addCall(76, M[6], 11, 3, "Interested",  "Mukesh Pandey confirmed interest. Contract being drafted.");

// 11–18 days ago (older history)
addCall(66, M[1], 14, 4, "Follow Up",   "Prakash Nair — first call. Very receptive to pitch.");
addCall(68, M[2], 14, 3, "Follow Up",   "Dilip Gupta intro call. Needs time to evaluate.");
addCall(70, M[3], 15, 5, "Follow Up",   "Mohan Rao — discovery call done. Budget confirmed.");
addCall(72, M[4], 15, 4, "Follow Up",   "Sunil Malhotra — intro call. Enthusiastic about features.");
addCall(74, M[5], 16, 3, "Follow Up",   "Usha Mehta first contact. Short call, will reconnect.");
addCall(76, M[6], 16, 5, "Voicemail",   "Mukesh — no answer on first try.");
addCall(78, M[7], 17, 4, "Follow Up",   "Devendra Joshi — discovery call. Promising lead.");
addCall(79, M[8], 17, 3, "Follow Up",   "Laleh Mishra — first call. Good initial rapport.");
addCall(80, M[8], 18, 5, "Follow Up",   "Amarjit Singh — intro call, sending overview deck.");
addCall(80, M[8], 20, 4, "Interested",  "Amarjit Singh — second call. Very interested.");
addCall(80, M[8], 22, 3, "Closed Won",  "Amarjit Singh — contract signed. ₹2.6L yearly plan.");

// User settings for all 23 users
const allUsers = [
  { id: A1,  isAdmin: true },
  ...BDA_PROFILES.map(b => ({ id: M[b.n], isAdmin: false }))
];

for (let idx = 0; idx < allUsers.length; idx++) {
  const u = allUsers[idx];
  const settingsId = `60000001-0000-0000-0000-${String(idx + 1).padStart(12, "0")}`;
  stmts.push({ sql: `INSERT OR IGNORE INTO user_settings
    (id, user_id, notif_new_lead, notif_missed_call, notif_conversion, notif_team_updates, notif_daily_summary,
     auto_dial_next, cooldown_timer, show_post_call_modal, call_recording, default_lead_status, auto_assign_leads, timezone, language, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      settingsId, u.id,
      1, 1, 1,
      u.isAdmin ? 1 : 0,
      1,
      0, 30, 1, 1,
      "new",
      u.isAdmin ? 1 : 0,
      "Asia/Kolkata", "English",
      ts(0, 25), ts(0, 25)
    ]
  });
}

// Notifications for admin (mix of unread + read)
const ADMIN_NOTIFS = [
  // Unread (high priority — visible on demo landing)
  { type: "achievement",       title: "🏆 Team Hit 10 Closures This Week!",  msg: "Your team closed 10 deals in 7 days — outstanding performance!",                       priority: "urgent", read: 0, url: "/analytics",  hours: 0.5 },
  { type: "lead_status_change",title: "🎉 Deal Closed — ₹5.0L",              msg: "Jaya Kumar (Enterprise) deal confirmed by Sneha Gupta. Largest closure this month!",   priority: "urgent", read: 0, url: "/leads",      hours: 1   },
  { type: "lead_assigned",     title: "New Lead Assigned",                    msg: "Lead 'Aryan Khanna' added and assigned to Rahul Sharma.",                               priority: "normal", read: 0, url: "/leads",      hours: 2   },
  { type: "call_reminder",     title: "Follow-up Call Due — Vikram Singh",    msg: "Vikram Singh has a scheduled follow-up with Rakesh Dubey at 4:00 PM today.",           priority: "high",   read: 0, url: "/leads",      hours: 3   },
  { type: "achievement",       title: "📈 Monthly Target: 82% Reached",       msg: "Team is at 82% of monthly conversion target with 2 days remaining. Push for 90%!",    priority: "high",   read: 0, url: "/analytics",  hours: 4   },
  { type: "system",            title: "Weekly Performance Report Ready",       msg: "This week's call analytics and conversion report is available in Analytics.",          priority: "normal", read: 0, url: "/analytics",  hours: 5   },
  { type: "team_update",       title: "New Member Joined — Vivek Reddy",      msg: "Vivek Reddy joined the team. Complete onboarding and assign starter leads.",           priority: "normal", read: 0, url: "/team",       hours: 6   },
  { type: "lead_status_change",title: "Lead Upgraded: Interested → Closing",  msg: "Hemant Saxena moved to closing stage by Priya Patel. Contract being drafted.",        priority: "high",   read: 0, url: "/leads",      hours: 7   },
  // Read (older)
  { type: "lead_assigned",     title: "Bulk Leads Auto-Assigned",             msg: "12 new leads distributed to 6 active team members automatically.",                     priority: "normal", read: 1, url: "/leads",      hours: 0,  days: 1 },
  { type: "achievement",       title: "🔥 Rahul Sharma — 5 Closures Streak",  msg: "Rahul has closed 5 consecutive deals. Consider recognition or bonus!",                priority: "high",   read: 1, url: "/team",       hours: 3,  days: 1 },
  { type: "call_reminder",     title: "Missed Follow-up Alert",               msg: "Neha Reddy missed a scheduled call with Govind Prasad. Reassignment recommended.",    priority: "urgent", read: 1, url: "/leads",      hours: 6,  days: 1 },
  { type: "system",            title: "System Maintenance Complete",           msg: "Scheduled maintenance finished. All systems are operational.",                         priority: "low",    read: 1, url: null,          hours: 0,  days: 2 },
  { type: "lead_status_change",title: "Lead Went Cold — 7 Days No Contact",   msg: "Lead 'Rajan Sharma' uncontacted for 7 days. Consider reassigning.",                   priority: "normal", read: 1, url: "/leads",      hours: 5,  days: 2 },
  { type: "team_update",       title: "Sneha Gupta — Idle 2+ Hours",          msg: "Sneha Gupta has no call activity for 2 hours. Check in.",                             priority: "low",    read: 1, url: "/team",       hours: 0,  days: 3 },
  { type: "achievement",       title: "₹15L Monthly Revenue Milestone 🚀",   msg: "Team crossed ₹15 Lakh in closed revenue — best month so far!",                        priority: "high",   read: 1, url: "/analytics",  hours: 0,  days: 4 },
  { type: "system",            title: "Feature Update: CSV Import",            msg: "You can now bulk import leads via CSV from the Leads page. Try it!",                  priority: "normal", read: 1, url: "/leads",      hours: 0,  days: 5 },
  { type: "achievement",       title: "Priya Patel — Top Closer This Week",   msg: "Priya closed 4 deals in 5 days — highest conversion rate on the team.",               priority: "high",   read: 1, url: "/team",       hours: 0,  days: 6 },
  { type: "lead_assigned",     title: "5 Leads Imported via CSV",             msg: "Admin imported 5 leads from external source and distributed to active BDAs.",         priority: "normal", read: 1, url: "/leads",      hours: 0,  days: 7 },
];

for (let idx = 0; idx < ADMIN_NOTIFS.length; idx++) {
  const n = ADMIN_NOTIFS[idx];
  const nId = `50000001-0000-0000-0000-${String(idx + 1).padStart(12, "0")}`;
  stmts.push({ sql: `INSERT OR IGNORE INTO notifications (id, tenant_id, user_id, type, title, message, priority, is_read, action_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [nId, T1, A1, n.type, n.title, n.msg, n.priority, n.read, n.url ?? null, ts(n.hours || 0, n.days || 0)] });
}

// Activity logs (recent team feed)
const ACTIVITIES = [
  // Today
  { uid: M[1], action: "success",   desc: "Rahul Sharma closed ₹3.6L deal with Prakash Nair — biggest win this week!",           meta: { amount: 360000, lead: "Prakash Nair" },                         hours: 0.5 },
  { uid: M[3], action: "success",   desc: "Amit Verma closed ₹3.0L deal with Prabha Venkatesh. Third closure today!",            meta: { amount: 300000, lead: "Prabha Venkatesh" },                    hours: 1   },
  { uid: M[2], action: "success",   desc: "Priya Patel converted Hemant Saxena to Interested — proposal stage now.",             meta: { lead: "Hemant Saxena" },                                        hours: 2   },
  { uid: A1,   action: "neutral",   desc: "Admin imported 8 new leads and distributed to Rahul, Priya, Amit, Sneha.",            meta: { count: 8 },                                                     hours: 3   },
  { uid: M[4], action: "info",      desc: "Sneha Gupta completed 9 calls today — 2 new closures!",                               meta: { calls: 9, conversions: 2 },                                     hours: 4   },
  { uid: M[5], action: "success",   desc: "Vikram Singh closed ₹1.2L deal with Usha Mehta after 3 follow-ups.",                  meta: { amount: 120000, lead: "Usha Mehta" },                           hours: 5   },
  { uid: M[1], action: "milestone", desc: "Rahul Sharma reached 50 total conversions — Top Performer of the Month! 🏆",          meta: { milestone: "50_conversions" },                                  hours: 6   },
  // Yesterday
  { uid: M[2], action: "success",   desc: "Priya Patel closed ₹2.8L with Savita Sharma — great quarter-end push.",              meta: { amount: 280000, lead: "Savita Sharma" },       hours: 0, days: 1 },
  { uid: M[3], action: "info",      desc: "Amit Verma made 14 calls — highest daily call volume on the team.",                   meta: { calls: 14 },                                   hours: 3, days: 1 },
  { uid: M[6], action: "success",   desc: "Neha Reddy converted 3 leads to Interested in a single session.",                     meta: { count: 3 },                                    hours: 5, days: 1 },
  { uid: A1,   action: "neutral",   desc: "Admin reassigned 4 leads from inactive BDAs to active members.",                     meta: { count: 4 },                                    hours: 7, days: 1 },
  { uid: M[4], action: "info",      desc: "Sneha Gupta averaged 6.2 min talk time — best quality score this week.",              meta: { avg_duration_min: 6.2 },                       hours: 8, days: 1 },
  // 2–3 days ago
  { uid: M[1], action: "achievement", desc: "Rahul Sharma — 5 consecutive deal closures. On fire! 🔥",                          meta: { streak: 5 },                                   hours: 2, days: 2 },
  { uid: A1,   action: "milestone",   desc: "Team crossed ₹15 Lakh in monthly revenue — 82% of target hit. Keep pushing! 📈",   meta: { revenue: 1500000, target_pct: 82 },           hours: 0, days: 3 },
  { uid: M[2], action: "info",        desc: "Priya Patel completed refresher training on objection handling.",                   meta: {},                                              hours: 4, days: 3 },
  { uid: M[7], action: "success",     desc: "Arjun Mehta closed first deal — ₹2.2L with Devendra Joshi. First win!",            meta: { amount: 220000, lead: "Devendra Joshi" },     hours: 6, days: 3 },
  // 4–7 days ago
  { uid: A1,   action: "neutral",     desc: "Vivek Reddy and Ritika Sen joined the team — onboarding in progress.",             meta: { members: ["Vivek Reddy", "Ritika Sen"] },      hours: 2, days: 4 },
  { uid: M[3], action: "success",     desc: "Amit Verma upsold Jyoti Gurjar from Standard to Premium — ₹80K upgrade!",         meta: { amount: 80000 },                               hours: 4, days: 4 },
  { uid: M[5], action: "info",        desc: "Vikram Singh made 50 calls this week — Most Active BDA.",                          meta: { calls: 50 },                                   hours: 0, days: 5 },
  { uid: M[4], action: "success",     desc: "Sneha Gupta closed ₹5.0L Enterprise deal with Jaya Kumar — biggest ever!",        meta: { amount: 500000, lead: "Jaya Kumar" },          hours: 2, days: 5 },
  { uid: A1,   action: "milestone",   desc: "DialFlow CRM onboarded — team is live and calling! 🚀",                            meta: {},                                              hours: 0, days: 7 },
  { uid: M[8], action: "info",        desc: "Kavita Iyer completed product training — first calls starting tomorrow.",          meta: {},                                              hours: 3, days: 6 },
  { uid: M[1], action: "success",     desc: "Rahul Sharma's 40th conversion — Team's MVP this quarter!",                        meta: { milestone: "40_conversions" },                 hours: 5, days: 6 },
];

for (let idx = 0; idx < ACTIVITIES.length; idx++) {
  const a = ACTIVITIES[idx];
  const aId = `70000001-0000-0000-0000-${String(idx + 1).padStart(12, "0")}`;
  stmts.push({ sql: `INSERT OR IGNORE INTO activity_logs (id, tenant_id, user_id, action, description, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [aId, T1, a.uid, a.action, a.desc, JSON.stringify(a.meta), ts(a.hours || 0, a.days || 0)] });
}

// Now add call logs to statements
for (const cl of callLogData) {
  stmts.push({ sql: `INSERT OR IGNORE INTO call_logs (id, tenant_id, lead_id, user_id, duration_seconds, outcome, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [cl.id, T1, cl.lead, cl.user, cl.dur, cl.out, cl.note, cl.ts] });
}

// ─── 6. Execute all statements ─────────────────────────────────────────────

console.log(`\n🌱 DialFlow Demo Seed — Starting (${stmts.length} statements)...\n`);

let ok = 0, failed = 0;

for (const stmt of stmts) {
  try {
    await client.execute(stmt);
    ok++;
  } catch (err) {
    // Show the statement type but keep output tidy
    const preview = stmt.sql.slice(0, 60).replace(/\n\s+/g, " ");
    console.warn(`  ⚠️  SKIP (${err.message.slice(0, 60)}) ← ${preview}`);
    failed++;
  }
}

console.log(`
✅  Seed complete!
    • Statements executed : ${ok}
    • Skipped (conflicts) : ${failed}

👤  Accounts created:
    ┌──────────────────────────────────┬──────────────────────────┬─────────────┬────────────────────────┐
    │ Role                             │ Email                    │ Password    │ Company Slug           │
    ├──────────────────────────────────┼──────────────────────────┼─────────────┼────────────────────────┤
    │ Super Admin                      │ superadmin@dialflow.io   │ Super@2026  │ nexgen (or any)        │
    │ Admin                            │ admin@nexgen.demo        │ Admin@2026  │ nexgen                 │
    │ 21 BDAs                          │ rahul.sharma@nexgen.demo │ BDA@2026    │ nexgen                 │
    │   …and 20 more BDAs              │ (see DEMO_GUIDE.md)      │ BDA@2026    │ nexgen                 │
    └──────────────────────────────────┴──────────────────────────┴─────────────┴────────────────────────┘

📊  Data seeded:
    • 1 tenant  (NexGen Solutions, slug: nexgen)
    • 1 super admin + 1 admin + 21 BDAs
    • 80 leads  (20 new · 20 contacted · 25 interested · 15 closed)
    • ${callLogData.length} call logs across 25 days
    • 18 notifications for admin
    • 23 user settings records
    • ${ACTIVITIES.length} activity log entries
`);
