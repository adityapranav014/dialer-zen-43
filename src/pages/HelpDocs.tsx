import {
  MessageCircleQuestion,
  Rocket,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Search,
  FileText,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";

/* ── Quick-start guides ── */
const guides = [
  {
    title: "Getting Started",
    desc: "Set up your account and make your first call",
    icon: Rocket,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    articles: [
      "Creating your DialFlow account",
      "Navigating the dashboard",
      "Making your first outbound call",
      "Understanding call statuses",
    ],
  },
  {
    title: "Managing Leads",
    desc: "Import, organize, and track your leads",
    icon: Users,
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    articles: [
      "Importing leads via CSV",
      "Adding leads manually",
      "Lead statuses explained",
      "Assigning leads to BDAs",
    ],
  },
  {
    title: "Analytics & Reports",
    desc: "Understand your performance metrics",
    icon: BarChart3,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    articles: [
      "Reading the dashboard stats",
      "Talk-time tracking",
      "Conversion rate insights",
      "Exporting reports",
    ],
  },
  {
    title: "Team Management",
    desc: "Add members and manage permissions",
    icon: Settings,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    articles: [
      "Inviting team members",
      "Admin vs BDA roles",
      "Monitoring BDA activity",
      "Removing team members",
    ],
  },
];

/* ── FAQs ── */
const faqs = [
  {
    q: "How do I reset my password?",
    a: "Go to the login page and click 'Forgot password'. You'll receive a reset link via email within a few minutes.",
  },
  {
    q: "Can I import leads from Excel files?",
    a: "Yes! DialFlow supports both .csv and .xlsx files. Go to Leads → Add Lead → CSV/Excel tab to upload your file.",
  },
  {
    q: "What's the difference between Admin and BDA roles?",
    a: "Admins can manage team members, view all leads, and access analytics for the entire team. BDAs can only view and manage their assigned leads.",
  },
  {
    q: "How is talk time calculated?",
    a: "Talk time is measured from the moment a call connects until it ends. It does not include ringing or hold time.",
  },
  {
    q: "Can I change the theme/appearance?",
    a: "Yes! Go to Profile → Appearance and choose between Light, Dark, or System (follows your device settings).",
  },
];

const HelpDocs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredGuides = searchQuery.trim()
    ? guides.filter(
        (g) =>
          g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.articles.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : guides;

  const filteredFaqs = searchQuery.trim()
    ? faqs.filter(
        (f) =>
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  return (
    <AppLayout title="Help & Docs">
      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/25" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search guides, FAQs..."
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/60 border border-border text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/15 transition-all duration-200"
        />
      </div>

      {/* Guides */}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30 px-1 mb-3">
        Guides
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {filteredGuides.map((guide) => (
          <div key={guide.title} className="surface-card p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className={`h-9 w-9 rounded-xl ${guide.color} flex items-center justify-center shrink-0`}>
                <guide.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{guide.title}</p>
                <p className="text-[11px] text-foreground/35">{guide.desc}</p>
              </div>
            </div>
            <div className="space-y-1">
              {guide.articles.map((article) => (
                <button
                  key={article}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[12px] text-foreground/50 hover:text-foreground hover:bg-accent transition-colors duration-200 text-left"
                >
                  <FileText className="h-3 w-3 shrink-0 text-foreground/20" />
                  <span className="truncate">{article}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredGuides.length === 0 && (
          <div className="col-span-full surface-card py-8 text-center">
            <p className="text-sm text-foreground/30">No guides match your search</p>
          </div>
        )}
      </div>

      {/* FAQs + Contact — two-column layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* FAQs — takes 2 cols */}
        <div className="lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30 px-1 mb-3">
            Frequently Asked Questions
          </p>
          <div className="surface-card p-0 overflow-hidden">
            {filteredFaqs.map((faq, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors duration-200 text-left ${
                    idx < filteredFaqs.length - 1 ? "border-b border-foreground/[0.04]" : ""
                  }`}
                >
                  <div className="h-7 w-7 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <MessageCircleQuestion className="h-3.5 w-3.5 text-foreground/30" />
                  </div>
                  <p className="flex-1 text-[13px] font-semibold text-foreground">{faq.q}</p>
                  <ChevronRight
                    className={`h-3.5 w-3.5 text-foreground/20 transition-transform duration-200 shrink-0 ${
                      expandedFaq === idx ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-3 pl-14">
                    <p className="text-[12px] text-foreground/50 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-foreground/30">No FAQs match your search</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support — takes 1 col */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30 px-1 mb-3">
            Contact Support
          </p>
          <div className="space-y-3">
            <div className="surface-card p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-foreground/35" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Email Support</p>
                <p className="text-[11px] text-foreground/35">support@dialflow.com</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-foreground/15 shrink-0" />
            </div>
            <div className="surface-card p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-foreground/35" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Phone Support</p>
                <p className="text-[11px] text-foreground/35">Mon–Fri, 9 AM – 6 PM</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-foreground/15 shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default HelpDocs;
