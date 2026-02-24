import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import LeadCard, { LeadStatus } from "@/components/LeadCard";
import PostCallModal from "@/components/PostCallModal";
import BottomNav from "@/components/BottomNav";
import { PhoneCall } from "lucide-react";

const mockLeads = [
  { id: 1, name: "Priya Sharma", phone: "+91 98765 43210", status: "new" as LeadStatus, lastActivity: "Just now" },
  { id: 2, name: "Rajesh Kumar", phone: "+91 87654 32109", status: "contacted" as LeadStatus, lastActivity: "2h ago" },
  { id: 3, name: "Anita Desai", phone: "+91 76543 21098", status: "interested" as LeadStatus, lastActivity: "Yesterday" },
  { id: 4, name: "Vikram Singh", phone: "+91 65432 10987", status: "new" as LeadStatus, lastActivity: "3h ago" },
  { id: 5, name: "Meera Joshi", phone: "+91 54321 09876", status: "closed" as LeadStatus, lastActivity: "2 days ago" },
  { id: 6, name: "Arjun Reddy", phone: "+91 43210 98765", status: "contacted" as LeadStatus, lastActivity: "5h ago" },
];

const filters: LeadStatus[] = ["new", "contacted", "interested", "closed"];

const Leads = () => {
  const [activeFilter, setActiveFilter] = useState<LeadStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [callingLead, setCallingLead] = useState<string>("");
  const [search, setSearch] = useState("");

  const handleCall = (name: string) => {
    setCallingLead(name);
    setTimeout(() => setModalOpen(true), 2000);
  };

  const filteredLeads = mockLeads.filter((l) => {
    const matchesFilter = activeFilter === "all" || l.status === activeFilter;
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <PhoneCall className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Leads</span>
          </div>
          <span className="text-xs text-muted-foreground">{filteredLeads.length} leads</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full h-10 pl-9 pr-3 bg-muted border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter("all")}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
              activeFilter === "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            All
          </button>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap capitalize transition-all ${
                activeFilter === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Lead list */}
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              name={lead.name}
              phone={lead.phone}
              status={lead.status}
              lastActivity={lead.lastActivity}
              onCall={() => handleCall(lead.name)}
            />
          ))}
        </div>
      </main>

      <PostCallModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadName={callingLead}
        duration={127}
      />
      <BottomNav />
    </div>
  );
};

export default Leads;
