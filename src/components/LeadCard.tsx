import { Phone, Clock, ArrowRight } from "lucide-react";
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

const statusColors: Record<LeadStatus, string> = {
  new: "bg-primary/20 text-primary",
  contacted: "bg-muted text-muted-foreground",
  interested: "bg-success/20 text-success",
  closed: "bg-destructive/20 text-destructive",
};

const LeadCard = ({ name, phone, status, lastActivity, onCall }: LeadCardProps) => {
  const [calling, setCalling] = useState(false);

  const handleCall = () => {
    setCalling(true);
    onCall();
    setTimeout(() => setCalling(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card flex items-center justify-between gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[status]}`}>
            {status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {lastActivity}
        </p>
      </div>

      <button
        onClick={handleCall}
        className="relative flex items-center justify-center h-12 w-12 rounded-full bg-success text-success-foreground shrink-0 transition-transform active:scale-95"
      >
        {calling && (
          <span className="absolute inset-0 rounded-full bg-success animate-pulse-ring" />
        )}
        <Phone className="h-5 w-5" />
      </button>
    </motion.div>
  );
};

export default LeadCard;
