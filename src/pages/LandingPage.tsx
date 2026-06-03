import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PhoneCall, TrendingUp, Users, BarChart2, ArrowRight,
  Target, Timer, Zap, CheckCircle, ChevronRight,
  Bell, ChevronDown, Search, Plus, MoreHorizontal, Home,
  CreditCard, Settings, Building2,
} from "lucide-react";

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => (
  <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5" style={{ fontFamily: "var(--font-body)" }}>
    <a href="#" className="flex items-center gap-2 no-underline" style={{ color: "hsl(210,14%,17%)" }}>
      <img src="/favicon.svg" alt="DialFlow" className="h-8 w-8 rounded-xl" />
      <span className="text-xl font-semibold tracking-tight">DialFlow</span>
    </a>
    <div className="hidden md:flex items-center gap-8">
      {[
        { label: "Features", href: "#features" },
        { label: "How it Works", href: "#howitworks" },
        { label: "Demo", href: "#demo" },
      ].map(link => (
        <a
          key={link.label}
          href={link.href}
          className="text-sm transition-colors duration-200"
          style={{ color: "hsl(184,5%,55%)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "hsl(210,14%,17%)")}
          onMouseLeave={e => (e.currentTarget.style.color = "hsl(184,5%,55%)")}
        >
          {link.label}
        </a>
      ))}
    </div>
    <a
      href="/platform"
      className="rounded-full px-5 py-2 text-sm font-medium transition-colors duration-200"
      style={{ background: "hsl(210,14%,17%)", color: "#fff" }}
    >
      Try Demo
    </a>
  </nav>
);

// ─── Hero Dashboard Mockup ────────────────────────────────────────────────────
const DashboardMockup = () => {
  const fg = "hsl(210,14%,17%)";
  const mutedFg = "hsl(184,5%,55%)";
  const accent = "hsl(239,84%,67%)";
  const border = "hsl(0,0%,90%)";
  const secondary = "hsl(0,0%,96%)";

  const sidebarItems = [
    { label: "Home", icon: <Home className="w-3 h-3" />, active: true },
    { label: "Tasks", icon: <Building2 className="w-3 h-3" />, badge: "10" },
    { label: "Transactions", icon: <ArrowRight className="w-3 h-3" /> },
    { label: "Payments", icon: <CreditCard className="w-3 h-3" />, chevron: true },
    { label: "Cards", icon: <CreditCard className="w-3 h-3" /> },
    { label: "Capital", icon: <TrendingUp className="w-3 h-3" /> },
    { label: "Accounts", icon: <Building2 className="w-3 h-3" />, chevron: true },
  ];
  const workflowItems = ["Trake rutes", "Payments", "Notifications", "Settings"];

  const actionBtns = ["Send", "Request", "Transfer", "Deposit", "Pay Bill", "Create Invoice"];

  const accounts = [
    { label: "Credit", amount: "$98,125.50" },
    { label: "Treasury", amount: "$6,750,200.00" },
    { label: "Operations", amount: "$1,592,864.82" },
  ];

  const transactions = [
    { date: "Jun 1", desc: "AWS", amount: "-$5,200", status: "Pending", statusColor: "#d97706", statusBg: "#fef3c7" },
    { date: "Jun 1", desc: "Client Payment", amount: "+$125,000", status: "Completed", statusColor: "#059669", statusBg: "#d1fae5" },
    { date: "May 31", desc: "Payroll", amount: "-$85,450", status: "Completed", statusColor: "#059669", statusBg: "#d1fae5" },
    { date: "May 30", desc: "Office Supplies", amount: "-$1,200", status: "Completed", statusColor: "#059669", statusBg: "#d1fae5" },
  ];

  // SVG area chart path (cubic Bézier, upward trend)
  const chartPath = "M 0 60 C 15 58 25 54 35 58 C 45 62 55 68 70 65 C 85 62 90 42 105 40 C 120 38 130 48 145 44 C 160 40 175 24 200 18 L 200 80 L 0 80 Z";
  const chartStroke = "M 0 60 C 15 58 25 54 35 58 C 45 62 55 68 70 65 C 85 62 90 42 105 40 C 120 38 130 48 145 44 C 160 40 175 24 200 18";

  return (
    <div
      className="rounded-2xl overflow-hidden select-none pointer-events-none"
      style={{
        background: "rgba(255,255,255,0.4)",
        border: "1px solid rgba(255,255,255,0.5)",
        boxShadow: "0 25px 80px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
        padding: "12px 16px",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="rounded-xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${border}` }}>
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-3 py-2 text-[11px]"
          style={{ borderBottom: `1px solid ${border}`, gap: 12 }}
        >
          {/* Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="flex items-center justify-center rounded-md font-bold text-[10px]"
              style={{ width: 20, height: 20, background: fg, color: "#fff" }}
            >N</span>
            <span className="font-semibold" style={{ color: fg, fontFamily: "var(--font-body)" }}>Nexora</span>
            <ChevronDown className="w-3 h-3" style={{ color: mutedFg }} />
          </div>
          {/* Search */}
          <div
            className="flex items-center gap-1.5 flex-1 rounded-md px-2 py-1"
            style={{ background: secondary, border: `1px solid ${border}`, maxWidth: 200 }}
          >
            <Search className="w-3 h-3" style={{ color: mutedFg }} />
            <span style={{ color: mutedFg, fontFamily: "var(--font-body)" }}>Search...</span>
            <span
              className="ml-auto rounded px-1 text-[9px]"
              style={{ background: border, color: mutedFg, fontFamily: "var(--font-body)" }}
            >⌘K</span>
          </div>
          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
              style={{ background: fg, color: "#fff", fontFamily: "var(--font-body)" }}
            >Move Money</span>
            <Bell className="w-3.5 h-3.5" style={{ color: mutedFg }} />
            <span
              className="flex items-center justify-center rounded-full text-[9px] font-bold"
              style={{ width: 20, height: 20, background: accent, color: "#fff" }}
            >JB</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex" style={{ minHeight: 320 }}>
          {/* Sidebar */}
          <div
            className="flex flex-col py-2 px-1.5 shrink-0 text-[11px]"
            style={{ width: 128, borderRight: `1px solid ${border}`, gap: 1 }}
          >
            {sidebarItems.map(item => (
              <div
                key={item.label}
                className="flex items-center justify-between px-2 py-1.5 rounded-md"
                style={{
                  background: item.active ? secondary : "transparent",
                  color: item.active ? fg : mutedFg,
                  fontFamily: "var(--font-body)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className="rounded-full px-1.5 text-[9px] font-semibold"
                    style={{ background: accent, color: "#fff" }}
                  >{item.badge}</span>
                )}
                {item.chevron && <ChevronRight className="w-2.5 h-2.5" style={{ color: mutedFg }} />}
              </div>
            ))}
            <div className="mt-3 mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest" style={{ color: mutedFg, fontFamily: "var(--font-body)" }}>
              Workflows
            </div>
            {workflowItems.map(item => (
              <div
                key={item}
                className="px-2 py-1.5 rounded-md"
                style={{ color: mutedFg, fontFamily: "var(--font-body)" }}
              >{item}</div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 p-3 overflow-hidden" style={{ background: "hsl(0,0%,98%)" }}>
            {/* Greeting */}
            <p className="text-sm font-semibold mb-2" style={{ color: fg, fontFamily: "var(--font-body)" }}>
              Welcome, Jane
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {actionBtns.map((btn, i) => (
                <span
                  key={btn}
                  className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                  style={{
                    background: i === 0 ? fg : "#fff",
                    color: i === 0 ? "#fff" : fg,
                    border: i === 0 ? "none" : `1px solid ${border}`,
                    fontFamily: "var(--font-body)",
                  }}
                >{btn}</span>
              ))}
              <span className="text-[10px] ml-1" style={{ color: mutedFg, fontFamily: "var(--font-body)" }}>Customize</span>
            </div>

            {/* Cards row */}
            <div className="flex gap-2 mb-3">
              {/* Balance card */}
              <div
                className="flex-1 basis-0 rounded-xl p-3"
                style={{ background: "#fff", border: `1px solid ${border}` }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] font-semibold" style={{ color: fg, fontFamily: "var(--font-body)" }}>Mercury Balance</span>
                  <CheckCircle className="w-2.5 h-2.5" style={{ color: "#059669" }} />
                </div>
                <div className="mb-2">
                  <span className="text-sm font-bold" style={{ color: fg, fontFamily: "var(--font-body)" }}>$8,450,190</span>
                  <span className="text-[10px]" style={{ color: mutedFg, fontFamily: "var(--font-body)" }}>.32</span>
                </div>
                <div className="flex gap-3 mb-2 text-[9px]" style={{ fontFamily: "var(--font-body)" }}>
                  <span style={{ color: mutedFg }}>Last 30 Days</span>
                  <span style={{ color: "#059669" }}>+$1.8M</span>
                  <span style={{ color: "#dc2626" }}>-$900K</span>
                </div>
                {/* SVG area chart */}
                <svg viewBox="0 0 200 80" className="w-full" style={{ height: 52 }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={accent} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={chartPath} fill="url(#chartGrad)" />
                  <path d={chartStroke} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Accounts card */}
              <div
                className="flex-1 basis-0 rounded-xl p-3"
                style={{ background: "#fff", border: `1px solid ${border}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold" style={{ color: fg, fontFamily: "var(--font-body)" }}>Accounts</span>
                  <div className="flex items-center gap-1">
                    <Plus className="w-3 h-3" style={{ color: mutedFg }} />
                    <MoreHorizontal className="w-3 h-3" style={{ color: mutedFg }} />
                  </div>
                </div>
                {accounts.map(acc => (
                  <div
                    key={acc.label}
                    className="flex items-center justify-between py-2 text-xs"
                    style={{ borderTop: `1px solid ${border}`, fontFamily: "var(--font-body)" }}
                  >
                    <span style={{ color: mutedFg }}>{acc.label}</span>
                    <span className="font-medium" style={{ color: fg }}>{acc.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions table */}
            <div className="rounded-xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${border}` }}>
              <div className="px-3 py-2 text-[10px] font-semibold" style={{ color: fg, borderBottom: `1px solid ${border}`, fontFamily: "var(--font-body)" }}>
                Recent Transactions
              </div>
              <table className="w-full text-[10px]" style={{ fontFamily: "var(--font-body)" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    {["Date", "Description", "Amount", "Status"].map(h => (
                      <th key={h} className="text-left px-3 py-1.5 font-medium" style={{ color: mutedFg }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={i} style={{ borderBottom: i < transactions.length - 1 ? `1px solid ${border}` : "none" }}>
                      <td className="px-3 py-2" style={{ color: mutedFg }}>{tx.date}</td>
                      <td className="px-3 py-2 font-medium" style={{ color: fg }}>{tx.desc}</td>
                      <td className="px-3 py-2 font-medium" style={{ color: tx.amount.startsWith("+") ? "#059669" : fg }}>{tx.amount}</td>
                      <td className="px-3 py-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                          style={{ background: tx.statusBg, color: tx.statusColor }}
                        >{tx.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Hero Section ─────────────────────────────────────────────────────────────
const HeroSection = () => {
  const fg = "hsl(210,14%,17%)";
  const mutedFg = "hsl(184,5%,55%)";

  const fadeUp = (delay = 0, y = 16) => ({
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
  });

  return (
    <section
      id="hero"
      className="lp-hero h-screen relative overflow-hidden flex flex-col"
    >
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4" type="video/mp4" />
      </video>

      {/* Navbar */}
      <Navbar />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center w-full flex-1 pt-6 pb-0 px-6 overflow-hidden" style={{ fontFamily: "var(--font-body)" }}>
        {/* Badge */}
        <motion.div {...fadeUp(0, 10)} className="mb-6">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm"
            style={{
              border: "1px solid hsl(0,0%,90%)",
              background: "rgba(255,255,255,0.85)",
              color: mutedFg,
              fontFamily: "var(--font-body)",
            }}
          >
            Built for inside sales teams 📞
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.1)}
          className="text-center text-5xl md:text-6xl lg:text-[5rem] leading-[0.95] tracking-tight max-w-xl mb-0"
          style={{ fontFamily: "var(--font-display)", color: fg }}
        >
          Dial More.{" "}
          <em style={{ fontStyle: "italic" }}>Close</em>{" "}
          Faster.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.2)}
          className="mt-4 text-center text-base md:text-lg max-w-[650px] leading-relaxed"
          style={{ color: mutedFg, fontFamily: "var(--font-body)" }}
        >
          DialFlow is the all-in-one sales CRM for inside sales teams. Log every call, track every lead, and coach your reps with real-time analytics from one unified workspace.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div {...fadeUp(0.3)} className="mt-5 flex items-center gap-3">
          <button
            className="rounded-full px-6 py-2.5 text-sm font-medium transition-colors duration-200"
            style={{ background: fg, color: "#fff", fontFamily: "var(--font-body)" }}
          >
            Try it free
          </button>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-8 w-full max-w-5xl"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 25px 80px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
              padding: "12px 16px",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <img
              src="/hero.png"
              alt="DialFlow Dashboard"
              className="w-full rounded-xl"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ─── Stats Marquee ────────────────────────────────────────────────────────────
const StatsMarquee = () => {
  const items = [
    "47 Calls Tracked Today", "₹3.6L Deal Closed", "21% Average Hit Rate",
    "312 Minutes Talk Time", "80 Leads in Pipeline", "12 Conversions Today",
    "21 Active Sales Reps", "4-Stage Lead Pipeline", "Real-time Analytics",
    "Role-based Dashboards", "Instant Call Logging", "Live Team Leaderboard",
  ];
  return (
    <div className="bg-black overflow-hidden py-3.5 border-y border-white/[0.04]">
      <style>{`
        @keyframes statsRoll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stats-track { animation: statsRoll 35s linear infinite; display: flex; width: max-content; }
      `}</style>
      <div className="stats-track">
        {[...items, ...items].map((s, i) => (
          <span key={i} className="mx-8 text-white/35 text-sm font-medium whitespace-nowrap flex items-center gap-3">
            <span className="h-1 w-1 rounded-full bg-white/15 inline-block" />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Features Section ─────────────────────────────────────────────────────────
const FeaturesSection = () => (
  <section id="features" className="bg-[#F5F5F5] px-6 py-24">
    <div className="max-w-[88rem] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-start">
        <div>
          <h2 className="text-black text-4xl md:text-5xl font-medium leading-tight mb-8" style={{ letterSpacing: "-0.03em" }}>
            Meet DialFlow.
          </h2>
          <a href="#demo"
            className="inline-flex items-center gap-3 bg-black text-white text-base font-medium pl-6 pr-2 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200">
            Try it free
            <span className="bg-white rounded-full p-2">
              <ArrowRight className="w-4 h-4 text-black" />
            </span>
          </a>
        </div>
        <p className="text-black/60 text-2xl md:text-3xl leading-relaxed">
          A full-stack sales intelligence platform built for modern inside sales teams. Track, call, convert, and coach from one unified workspace.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 – Lead Pipeline (2 cols) */}
        <div
          className="lg:col-span-2 rounded-2xl p-7 min-h-80 flex flex-col justify-between"
          style={{ background: "linear-gradient(145deg, #1C1B22 0%, #12103a 100%)" }}>
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 mb-5">
              <Target className="w-3.5 h-3.5 text-indigo-300" />
              <span className="text-white/65 text-xs font-medium">Lead Pipeline</span>
            </div>
            <h3 className="text-white text-2xl font-medium leading-snug mb-2" style={{ letterSpacing: "-0.02em" }}>
              Pipeline that<br />never leaks.
            </h3>
          </div>
          <div>
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {[
                { label: "New", count: 20, bg: "bg-white/15" },
                { label: "Contacted", count: 20, bg: "bg-blue-500/40" },
                { label: "Interested", count: 25, bg: "bg-violet-500/40" },
                { label: "Closed", count: 15, bg: "bg-emerald-500/40" },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-lg p-2.5 text-center`}>
                  <p className="text-white text-lg font-bold leading-none">{s.count}</p>
                  <p className="text-white/45 text-[9px] font-medium mt-1 truncate">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-white/40 text-sm max-w-xs">Track every lead from first contact to close. No guesswork, no gaps.</p>
          </div>
        </div>
        {/* Card 2 – Call Logging */}
        <div className="rounded-2xl p-7 min-h-80 flex flex-col justify-between" style={{ background: "#2B2644" }}>
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 mb-5">
              <PhoneCall className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-white/65 text-xs font-medium">Call Logging</span>
            </div>
            <h3 className="text-white text-2xl font-medium leading-snug" style={{ letterSpacing: "-0.02em" }}>
              Every call.<br />Captured.
            </h3>
          </div>
          <div className="space-y-2">
            {["Interested · 4m 12s", "Follow Up · 2m 45s", "Closed Won · 8m 03s"].map((log, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/[0.06] rounded-lg px-3 py-2">
                <div className={`h-1.5 w-1.5 rounded-full ${i === 2 ? "bg-emerald-400" : i === 0 ? "bg-violet-400" : "bg-blue-400"}`} />
                <span className="text-white/50 text-xs font-medium">{log}</span>
              </div>
            ))}
            <p className="text-white/35 text-sm pt-1">Log outcomes, notes, and duration on every dial.</p>
          </div>
        </div>
        {/* Card 3 – Analytics */}
        <div className="rounded-2xl p-7 min-h-80 flex flex-col justify-between" style={{ background: "#2B2644" }}>
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 mb-5">
              <BarChart2 className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-white/65 text-xs font-medium">Analytics</span>
            </div>
            <h3 className="text-white text-2xl font-medium leading-snug" style={{ letterSpacing: "-0.02em" }}>
              Metrics that<br />matter.
            </h3>
          </div>
          <div>
            <div className="flex items-end gap-1.5 h-16 mb-4">
              {[35, 55, 40, 70, 60, 88, 65].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all"
                  style={{
                    height: `${h}%`,
                    background: i === 5 ? "rgba(99,102,241,0.85)" : "rgba(255,255,255,0.14)",
                  }}
                />
              ))}
            </div>
            <p className="text-white/35 text-sm">Daily call volumes, hit rates, and conversion velocity at a glance.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── How it Works Flow Section ───────────────────────────────────────────────
const HowItWorksSection = () => {
  const steps = [
    {
      num: "01",
      icon: <Users className="w-5 h-5" />,
      title: "Add Lead",
      desc: "Capture prospect details: name, phone, source, and assign to a sales rep instantly.",
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      dot: "bg-indigo-500",
    },
    {
      num: "02",
      icon: <PhoneCall className="w-5 h-5" />,
      title: "Make the Call",
      desc: "BDA dials from their personal dashboard. All assigned leads are queued and ready.",
      color: "bg-blue-50 text-blue-600 border-blue-100",
      dot: "bg-blue-500",
    },
    {
      num: "03",
      icon: <Target className="w-5 h-5" />,
      title: "Log Outcome",
      desc: "Post-call modal captures result, duration, and notes. One tap to update lead status.",
      color: "bg-violet-50 text-violet-600 border-violet-100",
      dot: "bg-violet-500",
    },
    {
      num: "04",
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Track & Coach",
      desc: "Admin sees live call metrics, team rankings, and conversion rates across the floor.",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      dot: "bg-emerald-500",
    },
    {
      num: "05",
      icon: <Zap className="w-5 h-5" />,
      title: "Close & Convert",
      desc: "Lead moves to Closed. Revenue logged, leaderboard updated, pipeline refreshed.",
      color: "bg-amber-50 text-amber-600 border-amber-100",
      dot: "bg-amber-500",
    },
  ];

  return (
    <section id="howitworks" className="bg-[#F5F5F5] px-6 pb-24">
      <div className="max-w-[88rem] mx-auto">
        <div className="mb-12">
          <p className="text-black/40 text-sm mb-2">How it works</p>
          <h2 className="text-5xl md:text-6xl font-medium leading-none" style={{ letterSpacing: "-0.04em" }}>
            Five steps.<br />One platform.
          </h2>
        </div>
        {/* Desktop: horizontal flow */}
        <div className="hidden lg:flex items-stretch gap-0">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex items-stretch flex-1">
              <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-black/[0.05] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-black/20 text-xs font-black tracking-widest">{step.num}</span>
                  <div className={`${step.color} border rounded-xl p-2`}>{step.icon}</div>
                </div>
                <h4 className="text-black text-base font-bold mb-2" style={{ letterSpacing: "-0.01em" }}>{step.title}</h4>
                <p className="text-black/45 text-sm leading-relaxed flex-1">{step.desc}</p>
                <div className="mt-4 flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${step.dot}`} />
                  <div className={`h-1 flex-1 rounded-full ${step.dot} opacity-20`} />
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex items-center justify-center w-8 shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Mobile: vertical flow */}
        <div className="lg:hidden space-y-4">
          {steps.map((step, idx) => (
            <div key={step.num}>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/[0.05] flex items-start gap-4">
                <div className={`${step.color} border rounded-xl p-2 shrink-0 mt-0.5`}>{step.icon}</div>
                <div>
                  <p className="text-black/20 text-[10px] font-black tracking-widest mb-1">{step.num}</p>
                  <h4 className="text-black text-sm font-bold mb-1">{step.title}</h4>
                  <p className="text-black/45 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex justify-center my-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M4 9l4 4 4-4" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Admin Dashboard Showcase ─────────────────────────────────────────────────
const AdminShowcase = () => (
  <section id="team" className="bg-[#F5F5F5] px-6 pb-24">
    <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Left: text */}
      <div className="md:pr-12 md:pt-2">
        <p className="text-black/45 text-sm mb-2">Admin Dashboard</p>
        <h2 className="text-5xl md:text-6xl font-medium leading-none mb-6" style={{ letterSpacing: "-0.04em" }}>
          Command<br />your floor.
        </h2>
        <p className="text-black/55 text-base leading-relaxed max-w-sm mb-8">
          Admins get a live bird's-eye view of the entire sales floor: who's calling, who's converting, and who needs coaching, all in one glance.
        </p>
        <ul className="space-y-3 mb-8">
          {[
            "Real-time BDA Performance Board with rankings",
            "Today's KPIs: total calls, talk time, conversions",
            "Activity feed with colour-coded status pills",
            "Colour-coded hit rate badges per sales rep",
          ].map(item => (
            <li key={item} className="flex items-center gap-3 text-black/55 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <a href="#demo"
          className="inline-flex items-center gap-3 bg-black text-white text-base font-medium pl-6 pr-2 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200">
          View admin demo
          <span className="bg-white rounded-full p-2">
            <ArrowRight className="w-4 h-4 text-black" />
          </span>
        </a>
      </div>
      {/* Right: Admin mockup */}
      <div className="rounded-3xl overflow-hidden shadow-2xl border border-black/[0.05]" style={{ background: "#0c0c18" }}>
        <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-white/[0.05] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-white text-sm font-bold truncate">Good morning, Rajiv 👋</p>
            <p className="text-white/25 text-xs mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0" />
              <span className="truncate">Monday, June 3 · Team overview</span>
            </p>
          </div>
          <button className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0">Manage Team</button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 px-4 sm:px-6 py-4">
          {[
            { label: "Calls Today", value: "47", emoji: "📞", bg: "bg-blue-900/40" },
            { label: "Talk Time", value: "312m", emoji: "🕑", bg: "bg-violet-900/40" },
            { label: "Conversions", value: "12", emoji: "📈", bg: "bg-emerald-900/40" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/[0.04] rounded-xl px-2 sm:px-3 py-3 flex items-center gap-2">
              <div className={`${kpi.bg} h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center text-sm shrink-0`}>{kpi.emoji}</div>
              <div className="min-w-0">
                <p className="text-white text-sm sm:text-base font-bold leading-none">{kpi.value}</p>
                <p className="text-white/30 text-[10px] font-medium mt-0.5 truncate">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 sm:px-6 pb-6">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-2">
              <Users className="w-3 h-3" /> BDA Performance Board
            </p>
            <span className="text-white/20 text-[10px]">All time</span>
          </div>
          <div className="space-y-px">
            {[
              { name: "Rahul Sharma", calls: 42, conv: 11, rate: 26, arrow: "↑", color: "text-emerald-400" },
              { name: "Priya Patel", calls: 38, conv: 8, rate: 21, arrow: "↑", color: "text-emerald-400" },
              { name: "Amit Verma", calls: 35, conv: 7, rate: 20, arrow: "↑", color: "text-emerald-400" },
              { name: "Sneha Gupta", calls: 31, conv: 5, rate: 16, arrow: "→", color: "text-amber-400" },
              { name: "Vikram Singh", calls: 28, conv: 3, rate: 11, arrow: "↓", color: "text-white/25" },
            ].map((bda, i) => (
              <div key={bda.name} className="grid items-center py-2.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                style={{ gridTemplateColumns: "1fr auto auto auto", gap: "8px" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-white/20 font-bold w-3">{i + 1}</span>
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500/80 to-violet-600/80 flex items-center justify-center text-[9px] text-white font-bold shrink-0">
                    {bda.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="text-white/65 text-xs font-medium truncate">{bda.name}</span>
                </div>
                <span className="text-white/40 text-xs font-medium">{bda.calls}</span>
                <span className="text-emerald-400 text-xs font-semibold">{bda.conv}</span>
                <span className={`text-xs font-bold ${bda.color}`}>{bda.arrow}{bda.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Lead Pipeline Showcase ───────────────────────────────────────────────────
const PipelineShowcase = () => {
  const stages = [
    {
      label: "New", count: 20, topColor: "border-gray-300",
      badge: "bg-gray-100 text-gray-600",
      leads: ["Aryan Khanna", "Divya Menon", "Suresh Pillai", "Meghna Tiwari"],
    },
    {
      label: "Contacted", count: 20, topColor: "border-blue-400",
      badge: "bg-blue-100 text-blue-700",
      leads: ["Aditya Kapoor", "Pallavi Joshi", "Manish Trivedi", "Ritu Choudhary"],
    },
    {
      label: "Interested", count: 25, topColor: "border-violet-400",
      badge: "bg-violet-100 text-violet-700",
      leads: ["Siddharth Chopra", "Nisha Pandey", "Hemant Saxena", "Anuradha Singh"],
    },
    {
      label: "Closed", count: 15, topColor: "border-emerald-400",
      badge: "bg-emerald-100 text-emerald-700",
      leads: ["Prakash Nair", "Savita Sharma", "Dilip Gupta", "Pooja Reddy"],
    },
  ];
  return (
    <section id="pipeline" className="bg-[#F5F5F5] px-6 pb-24">
      <div className="max-w-[88rem] mx-auto">
        <div className="mb-12">
          <p className="text-black/40 text-sm mb-2">Lead Pipeline</p>
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-20">
            <h2 className="text-5xl md:text-6xl font-medium leading-none shrink-0" style={{ letterSpacing: "-0.04em" }}>
              80 leads.<br />Zero lost.
            </h2>
            <p className="text-black/50 text-base leading-relaxed max-w-md mb-1">
              Every lead moves through a clean, configurable 4-stage pipeline. Assign, track, and close with full call history and analytics on every contact.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:flex lg:gap-0 lg:items-stretch">
          {stages.map((stage, idx) => (
            <div key={stage.label} className="flex items-stretch lg:flex-1">
              <div className={`bg-white rounded-2xl border-t-4 ${stage.topColor} p-5 shadow-sm flex-1`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-black text-sm font-bold">{stage.label}</span>
                  <span className={`${stage.badge} text-xs font-bold px-2 py-0.5 rounded-full`}>{stage.count}</span>
                </div>
                <div className="space-y-2">
                  {stage.leads.map(lead => (
                    <div key={lead} className="bg-black/[0.04] rounded-lg px-3 py-2 text-xs font-medium text-black/65">
                      {lead}
                    </div>
                  ))}
                  <div className="rounded-lg px-3 py-2 text-xs font-medium text-black/30 text-center border border-dashed border-black/10">
                    +{stage.count - stage.leads.length} more
                  </div>
                </div>
              </div>
              {idx < stages.length - 1 && (
                <div className="hidden lg:flex items-center justify-center w-8 shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Analytics Showcase ───────────────────────────────────────────────────────
const AnalyticsShowcase = () => {
  const weekData = [
    { day: "Mon", calls: 42, conv: 8 },
    { day: "Tue", calls: 58, conv: 11 },
    { day: "Wed", calls: 47, conv: 9 },
    { day: "Thu", calls: 71, conv: 15 },
    { day: "Fri", calls: 63, conv: 13 },
    { day: "Sat", calls: 34, conv: 6 },
    { day: "Sun", calls: 21, conv: 4 },
  ];
  const maxCalls = Math.max(...weekData.map(d => d.calls));
  return (
    <section id="analytics" className="bg-[#F5F5F5] px-6 pb-24">
      <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Analytics mockup */}
        <div className="rounded-3xl overflow-hidden shadow-xl border border-black/[0.06] bg-white">
          <div className="px-6 pt-5 pb-4 border-b border-black/[0.05]">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-black text-sm font-bold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-black/30" />
                Performance Report
              </h4>
              <div className="flex gap-0.5 text-[10px] font-semibold bg-black/[0.05] rounded-lg p-0.5">
                {["Week", "Month", "Quarter"].map((p, i) => (
                  <span key={p} className={`px-2.5 py-1 rounded-md ${i === 0 ? "bg-black text-white" : "text-black/35"}`}>{p}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2.5 mt-4">
              {[
                { label: "Total Calls", value: "336" },
                { label: "Avg Duration", value: "3:48" },
                { label: "Conversions", value: "66" },
                { label: "Hit Rate", value: "19.6%" },
              ].map(s => (
                <div key={s.label} className="bg-black/[0.03] rounded-xl p-2.5">
                  <p className="text-black text-base font-bold leading-none">{s.value}</p>
                  <p className="text-black/35 text-[10px] font-medium mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="px-6 py-5">
            <p className="text-black/35 text-xs font-semibold mb-3">Daily Calls &amp; Conversions</p>
            <div className="flex items-end gap-1.5 mb-1.5" style={{ height: "72px" }}>
              {weekData.map((d) => {
                const totalH = Math.round((d.calls / maxCalls) * 68);
                const convH = Math.max(3, Math.round((d.conv / d.calls) * totalH));
                return (
                  <div
                    key={d.day}
                    className="flex-1 rounded-sm overflow-hidden relative"
                    style={{ height: `${totalH}px`, background: "rgba(0,0,0,0.07)" }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-emerald-400/70"
                      style={{ height: `${convH}px` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              {weekData.map((d) => (
                <span key={d.day} className="flex-1 text-center text-black/25 text-[10px] font-medium">{d.day}</span>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-black/[0.05]">
              <p className="text-black/35 text-xs font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" />
                Top Performers This Week
              </p>
              <div className="space-y-2.5">
                {[
                  { name: "Rahul Sharma", conv: 11, rate: 26 },
                  { name: "Priya Patel", conv: 8, rate: 21 },
                  { name: "Amit Verma", conv: 7, rate: 20 },
                ].map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className={`text-[10px] font-black ${i === 0 ? "text-amber-500" : "text-black/20"}`}>#{i + 1}</span>
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] text-white font-bold shrink-0">
                      {p.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-black/65 text-xs font-medium flex-1">{p.name}</span>
                    <span className="text-emerald-600 text-xs font-bold">{p.conv} conv.</span>
                    <span className="text-black/35 text-xs">{p.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Right: text */}
        <div className="md:pl-8 md:pt-2">
          <p className="text-black/40 text-sm mb-2">Analytics &amp; Reports</p>
          <h2 className="text-5xl md:text-6xl font-medium leading-none mb-6" style={{ letterSpacing: "-0.04em" }}>
            Data that<br />coaches.
          </h2>
          <p className="text-black/55 text-base leading-relaxed max-w-sm mb-8">
            Weekly, monthly, and quarterly performance reports that show exactly what's working and precisely where your team needs to improve.
          </p>
          <ul className="space-y-3">
            {[
              "Daily calls & conversion trend area charts",
              "Hourly call volume heatmaps",
              "Outcome distribution breakdown (doughnut)",
              "Hit rate badges per BDA, colour coded",
              "Podium-style top performer rankings",
              "Filter by Week · Month · Quarter",
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-black/55 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

// ─── BDA Experience Showcase ──────────────────────────────────────────────────
const BDAShowcase = () => (
  <section className="bg-[#F5F5F5] px-6 pb-24">
    <div className="max-w-[88rem] mx-auto">
      <div
        className="relative rounded-3xl overflow-hidden min-h-[560px]"
        style={{ background: "linear-gradient(145deg, #0d0b1e 0%, #17102e 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute rounded-full blur-3xl opacity-[0.18]"
            style={{ width: 500, height: 500, top: -100, right: -100, background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10 p-10 md:p-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-white/35 text-sm mb-3">BDA Experience</p>
            <h3 className="text-white text-4xl md:text-5xl font-medium leading-tight mb-5" style={{ letterSpacing: "-0.03em" }}>
              Every rep knows<br />exactly where<br />they stand.
            </h3>
            <p className="text-white/45 text-base max-w-md mb-8 leading-relaxed">
              Each BDA gets a personal dashboard showing their calls, talk time, conversions, team rank, and a live activity feed. Built to motivate and focus every single day.
            </p>
            <ul className="space-y-2.5">
              {[
                "Personal KPI strip: calls, talk time, rank",
                "Team leaderboard with their position highlighted",
                "Activity feed with colour-coded outcome pills",
                "Talk time bar chart over the past 7 days",
                "Post-call modal to log outcome & notes instantly",
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-white/45 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* BDA mockup */}
          <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.05]">
              <p className="text-white text-sm font-bold">Good morning, Rahul</p>
              <p className="text-white/25 text-xs mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Monday, June 3
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 px-5 py-4">
              {[
                { label: "Calls", value: "42", color: "text-blue-300" },
                { label: "Talk", value: "180m", color: "text-violet-300" },
                { label: "Conv.", value: "11", color: "text-emerald-300" },
                { label: "Rank", value: "#1", color: "text-amber-300" },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white/[0.05] rounded-xl px-2 py-2.5 text-center">
                  <p className={`text-base font-bold leading-none ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-white/30 text-[10px] font-medium mt-1">{kpi.label}</p>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-2.5 flex items-center gap-2">
                <Timer className="w-3 h-3" /> My Activity
              </p>
              <div className="space-y-2.5">
                {[
                  { text: "Called Prakash Nair → Closed Won", dot: "bg-emerald-400", time: "2:15 PM" },
                  { text: "Called Siddharth Chopra → Interested", dot: "bg-violet-400", time: "11:30 AM" },
                  { text: "Called Pallavi Joshi → Follow Up", dot: "bg-blue-400", time: "10:02 AM" },
                  { text: "Called Aditya Kapoor → Voicemail", dot: "bg-white/25", time: "9:15 AM" },
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${act.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/55 text-xs leading-snug">{act.text}</p>
                      <p className="text-white/20 text-[10px] font-medium mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Demo Access Section ──────────────────────────────────────────────────────
const DemoSection = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const accounts = [
    {
      role: "Admin",
      emoji: "👔",
      email: "admin@nexgen.demo",
      password: "Admin@2026",
      company: "nexgen",
      gradient: "from-indigo-600 to-violet-700",
      description: "Team overview, lead management, analytics & team controls",
    },
    {
      role: "Sales Rep (BDA)",
      emoji: "📞",
      email: "rahul.sharma@nexgen.demo",
      password: "BDA@2026",
      company: "nexgen",
      gradient: "from-blue-600 to-indigo-700",
      description: "Personal dashboard, my leads, call logging & leaderboard",
    },
  ];

  return (
    <section id="demo" className="bg-[#F5F5F5] px-6 pb-24">
      <div className="max-w-[88rem] mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-black/[0.05] rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-black/55 text-sm font-medium">Live Demo. No signup required.</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-medium leading-tight mb-4" style={{ letterSpacing: "-0.03em" }}>
            Try it right now.
          </h2>
          <p className="text-black/50 text-lg max-w-sm mx-auto">
            Real data. Real features. Pick a role and explore every corner of DialFlow instantly.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          {accounts.map(acc => (
            <div key={acc.role} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/[0.06]">
              <div className={`bg-gradient-to-r ${acc.gradient} px-6 py-4 flex items-center gap-3`}>
                <span className="text-2xl">{acc.emoji}</span>
                <div>
                  <p className="text-white text-base font-bold">{acc.role}</p>
                  <p className="text-white/55 text-xs font-medium mt-0.5">{acc.description}</p>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                {[
                  { label: "Email", value: acc.email, key: acc.role + "email" },
                  { label: "Password", value: acc.password, key: acc.role + "pass" },
                  { label: "Company Slug", value: acc.company, key: acc.role + "slug" },
                ].map(field => (
                  <div key={field.label} className="flex items-center justify-between gap-3 pb-3 border-b border-black/[0.05] last:pb-0 last:border-0">
                    <div>
                      <p className="text-black/30 text-[10px] font-semibold uppercase tracking-wider">{field.label}</p>
                      <p className="text-black text-sm font-semibold font-mono mt-0.5">{field.value}</p>
                    </div>
                    <button
                      onClick={() => copy(field.value, field.key)}
                      className="text-black/30 hover:text-black transition-colors text-xs font-medium px-2 py-1 rounded-lg hover:bg-black/[0.04]">
                      {copied === field.key ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <a
            href="/platform"
            className="inline-flex items-center gap-3 bg-black text-white text-lg font-medium pl-8 pr-2 py-2.5 rounded-full hover:bg-gray-800 transition-colors duration-200">
            Open DialFlow
            <span className="bg-white rounded-full p-2.5">
              <ArrowRight className="w-5 h-5 text-black" />
            </span>
          </a>
          <p className="text-black/30 text-sm mt-3 font-medium">No credit card. No setup. Just DialFlow.</p>
        </div>
      </div>
    </section>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <>
    <footer className="bg-black px-6 py-16">
      <div className="max-w-[88rem] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/favicon.svg" alt="DialFlow" className="w-7 h-7 rounded-lg" />
              <span className="text-2xl font-medium tracking-tight text-white" style={{ letterSpacing: "-0.03em" }}>DialFlow</span>
            </div>
            <p className="text-white/30 text-sm max-w-xs leading-relaxed">
              The intelligent sales CRM for inside sales teams. Built for dialers. Designed to convert.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/25 text-xs font-medium">All systems operational</span>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-4">
            <div className="flex flex-wrap gap-6">
              {["Features", "Pipeline", "Analytics", "Team", "Demo"].map(link => (
                <a key={link} href={`#${link.toLowerCase()}`}
                  className="text-white/30 hover:text-white text-sm font-medium transition-colors duration-200">
                  {link}
                </a>
              ))}
            </div>
            <a
              href="/platform"
              className="inline-flex items-center gap-3 bg-white text-black text-base font-medium pl-7 pr-2 py-2 rounded-full hover:bg-white/90 transition-colors duration-200">
              Start Demo
              <span className="bg-black/10 rounded-full p-2">
                <ArrowRight className="w-4 h-4 text-black" />
              </span>
            </a>
          </div>
        </div>
        <div className="border-t border-white/[0.08] pt-8">
          <p className="text-white/20 text-sm">© 2026 DialFlow. Built for sales teams that mean business.</p>
        </div>
      </div>
    </footer>
  </>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const LandingPage = () => {
  useEffect(() => {
    document.documentElement.classList.add('landing-page');
    document.body.classList.add('landing-page');
    const root = document.getElementById('root');
    if (root) root.classList.add('landing-page');
    return () => {
      document.documentElement.classList.remove('landing-page');
      document.body.classList.remove('landing-page');
      if (root) root.classList.remove('landing-page');
    };
  }, []);

  return (
  <div className="flex flex-col bg-[#F5F5F5]">
    <HeroSection />
    <StatsMarquee />
    <FeaturesSection />
    <HowItWorksSection />
    <AdminShowcase />
    <PipelineShowcase />
    <AnalyticsShowcase />
    <BDAShowcase />
    <DemoSection />
    <Footer />
  </div>
  );
};

export default LandingPage;
