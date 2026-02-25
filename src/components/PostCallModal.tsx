import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Phone, ThumbsUp, ThumbsDown, Calendar, Voicemail, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useCallLogs } from "@/hooks/useCallLogs";
import { toast } from "sonner";

interface PostCallModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  duration: number;
}

const dispositions = [
  { id: "Interested", label: "Interested", icon: ThumbsUp, color: "text-success", bg: "bg-success/10 hover:bg-success/20 border-success/20 data-[selected=true]:border-success data-[selected=true]:bg-success/15" },
  { id: "Not Interested", label: "Not Interested", icon: ThumbsDown, color: "text-destructive", bg: "bg-destructive/10 hover:bg-destructive/20 border-destructive/20 data-[selected=true]:border-destructive data-[selected=true]:bg-destructive/15" },
  { id: "Follow Up", label: "Follow Up", icon: Calendar, color: "text-primary", bg: "bg-primary/10 hover:bg-primary/20 border-primary/20 data-[selected=true]:border-primary data-[selected=true]:bg-primary/15" },
  { id: "Voicemail", label: "Voicemail", icon: Voicemail, color: "text-warning", bg: "bg-warning/10 hover:bg-warning/20 border-warning/20 data-[selected=true]:border-warning data-[selected=true]:bg-warning/15" },
  { id: "Wrong Number", label: "Wrong Number", icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted hover:bg-muted/80 border-border data-[selected=true]:border-muted-foreground/50 data-[selected=true]:bg-muted" },
  { id: "Closed Won", label: "Closed Won", icon: CheckCircle2, color: "text-success", bg: "bg-success/10 hover:bg-success/20 border-success/20 data-[selected=true]:border-success data-[selected=true]:bg-success/20" },
];

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const PostCallModal = ({ open, onClose, leadId, leadName, duration }: PostCallModalProps) => {
  const { logCall, isLogging } = useCallLogs();
  const [selectedDisposition, setSelectedDisposition] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    if (!selectedDisposition) return;

    try {
      await logCall({
        leadId,
        durationSeconds: duration,
        notes,
        outcome: selectedDisposition,
      });
      toast.success("Call logged successfully");
      setSelectedDisposition(null);
      setNotes("");
      onClose();
    } catch (error) {
      console.error("Failed to log call:", error);
      toast.error("Failed to save call log");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/70 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 pb-0 sm:pb-0"
          >
            <div
              className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 border border-border/80"
              style={{
                background: "hsl(var(--card))",
                boxShadow: "0 -8px 40px -8px hsl(0 0% 0% / 0.5), 0 0 0 1px hsl(var(--border) / 0.5)",
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center">
                      <Phone className="h-3 w-3 text-success" />
                    </div>
                    <h2 className="text-base font-bold text-foreground">Post-Call Log</h2>
                  </div>
                  <div className="flex items-center gap-2 pl-8">
                    <span className="text-sm text-muted-foreground">{leadName}</span>
                    <span className="text-border">·</span>
                    <span className="flex items-center gap-1 text-xs font-mono text-success">
                      <Clock className="h-3 w-3" />
                      {formatDuration(duration)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  Call Outcome
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {dispositions.map((d) => {
                    const isSelected = selectedDisposition === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDisposition(d.id)}
                        data-selected={isSelected}
                        disabled={isLogging}
                        className={`flex flex-col items-center gap-2 px-2 py-3 rounded-xl border text-center transition-all duration-150 ${d.bg}`}
                      >
                        <d.icon className={`h-4 w-4 ${d.color}`} />
                        <span className={`text-[11px] font-semibold leading-tight ${isSelected ? d.color : "text-muted-foreground"}`}>
                          {d.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLogging}
                  placeholder="Summarize the call..."
                  rows={3}
                  className="w-full bg-muted/60 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 resize-none transition-all"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!selectedDisposition || isLogging}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  background: selectedDisposition ? "var(--gradient-brand)" : undefined,
                  backgroundColor: !selectedDisposition ? "hsl(var(--muted))" : undefined,
                  color: "white",
                  boxShadow: selectedDisposition ? "0 4px 24px -4px hsl(var(--primary) / 0.4)" : "none",
                }}
              >
                {isLogging ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PostCallModal;
