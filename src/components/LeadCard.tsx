import { Phone, Clock, MessageSquare } from "lucide-react";
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
    className: "bg-[#f6f7ed] text-[#1f1f1f] border border-black/[0.06]",
    dot: "bg-[#1f1f1f]",
  },
  contacted: {
    label: "Contacted",
    className: "bg-blue-50 text-blue-600 border border-blue-200/60",
    dot: "bg-blue-500",
  },
  interested: {
    label: "Interested",
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200/60",
    dot: "bg-emerald-500",
  },
  closed: {
    label: "Closed",
    className: "bg-purple-50 text-purple-600 border border-purple-200/60",
    dot: "bg-purple-500",
  },
};

// Color hash for avatar backgrounds
const avatarColors = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
  "bg-cyan-100 text-cyan-600",
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
    <div
      className="surface-card flex items-center gap-4 cursor-default hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all"
    >
      {/* Avatar */}
      <div
        className={`h-11 w-11 rounded-xl ${avatarGradient} flex items-center justify-center text-xs font-bold shrink-0`}
      >
        {getInitials(name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-semibold text-[#1f1f1f] text-sm truncate">{name}</h3>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${cfg.className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#1f1f1f]/40">
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
          className="h-8 w-8 rounded-lg bg-[#f4f4f4] hover:bg-[#f6f7ed] flex items-center justify-center transition-colors text-[#1f1f1f]/40 hover:text-[#1f1f1f]"
          title="Add note"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleCall}
          className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-[#1f1f1f] text-white shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
          title="Call lead"
        >
          <Phone className="h-4 w-4 relative z-10" />
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
