import { Phone, Clock, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export type LeadStatus = "new" | "contacted" | "interested" | "closed";

interface LeadCardProps {
  name: string;
  phone: string;
  status: LeadStatus;
  lastActivity: string;
  onCall: () => void;
}

const statusConfig: Record<LeadStatus, { label: string; className: string; dot: string }> = {
  new: {
    label: "New",
    className: "bg-primary/15 text-primary border border-primary/25",
    dot: "bg-primary",
  },
  contacted: {
    label: "Contacted",
    className: "bg-muted text-muted-foreground border border-border",
    dot: "bg-muted-foreground",
  },
  interested: {
    label: "Interested",
    className: "bg-success/15 text-success border border-success/25",
    dot: "bg-success",
  },
  closed: {
    label: "Closed",
    className: "bg-destructive/15 text-destructive border border-destructive/25",
    dot: "bg-destructive",
  },
};

// Color hash for avatar backgrounds
const avatarColors = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
];

const getAvatarColor = (name: string) => {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const LeadCard = ({ name, phone, status, lastActivity, onCall }: LeadCardProps) => {
  const [calling, setCalling] = useState(false);
  const cfg = statusConfig[status];
  const avatarGradient = getAvatarColor(name);

  const handleCall = () => {
    setCalling(true);
    onCall();
    setTimeout(() => setCalling(false), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bento-card flex items-center gap-4 cursor-default"
    >
      {/* Avatar */}
      <div
        className={`h-11 w-11 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg`}
      >
        {getInitials(name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-semibold text-foreground text-sm truncate">{name}</h3>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${cfg.className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {phone}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {lastActivity}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
          title="Add note"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleCall}
          className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-success text-white shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 glow-success"
          title="Call lead"
        >
          {calling && (
            <>
              <span className="absolute inset-0 rounded-xl bg-success animate-pulse-ring opacity-60" />
              <span className="absolute inset-0 rounded-xl bg-success animate-pulse-ring opacity-40" style={{ animationDelay: "0.4s" }} />
            </>
          )}
          <Phone className="h-4 w-4 relative z-10" />
        </button>
      </div>
    </motion.div>
  );
};

export default LeadCard;
