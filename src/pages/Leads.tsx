import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import LeadCard, { LeadStatus } from "@/components/LeadCard";
import PostCallModal from "@/components/PostCallModal";
import BottomNav from "@/components/BottomNav";
import { PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: LeadStatus;
  updated_at: string;
}

const filters: LeadStatus[] = ["new", "contacted", "interested", "closed"];

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<LeadStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [callingLead, setCallingLead] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setLeads(data as unknown as Lead[]);
      setLoading(false);
    };
    fetchLeads();
  }, []);

  const handleCall = (name: string) => {
    setCallingLead(name);
    setTimeout(() => setModalOpen(true), 2000);
  };

  const filteredLeads = leads.filter((l) => {
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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full h-10 pl-9 pr-3 bg-muted border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                name={lead.name}
                phone={lead.phone}
                status={lead.status}
                lastActivity={timeAgo(lead.updated_at)}
                onCall={() => handleCall(lead.name)}
              />
            ))}
            {filteredLeads.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">No leads found</p>
            )}
          </div>
        )}
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
