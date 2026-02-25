import { useState } from "react";
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
  { id: "Interested", label: "Interested", icon: ThumbsUp, color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100/60 border-emerald-200/60 data-[selected=true]:border-emerald-400 data-[selected=true]:bg-emerald-50" },
  { id: "Not Interested", label: "Not Interested", icon: ThumbsDown, color: "text-red-500", bg: "bg-red-50 hover:bg-red-100/60 border-red-200/60 data-[selected=true]:border-red-400 data-[selected=true]:bg-red-50" },
  { id: "Follow Up", label: "Follow Up", icon: Calendar, color: "text-[#1f1f1f]", bg: "bg-[#f6f7ed] hover:bg-[#f6f7ed]/80 border-black/[0.06] data-[selected=true]:border-[#1f1f1f]/30 data-[selected=true]:bg-[#f6f7ed]" },
  { id: "Voicemail", label: "Voicemail", icon: Voicemail, color: "text-amber-600", bg: "bg-amber-50 hover:bg-amber-100/60 border-amber-200/60 data-[selected=true]:border-amber-400 data-[selected=true]:bg-amber-50" },
  { id: "Wrong Number", label: "Wrong Number", icon: AlertCircle, color: "text-[#1f1f1f]/40", bg: "bg-[#f4f4f4] hover:bg-[#f4f4f4]/80 border-black/[0.06] data-[selected=true]:border-[#1f1f1f]/20 data-[selected=true]:bg-[#f4f4f4]" },
  { id: "Closed Won", label: "Closed Won", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100/60 border-emerald-200/60 data-[selected=true]:border-emerald-400 data-[selected=true]:bg-emerald-50" },
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 pb-0 sm:pb-0">
        <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 bg-white border border-black/[0.06] shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Phone className="h-3 w-3 text-emerald-600" />
                </div>
                <h2 className="text-base font-semibold text-[#1f1f1f]">Post-Call Log</h2>
              </div>
              <div className="flex items-center gap-2 pl-8">
                <span className="text-sm text-[#1f1f1f]/50">{leadName}</span>
                <span className="text-[#1f1f1f]/15">·</span>
                <span className="flex items-center gap-1 text-xs font-mono text-emerald-600">
                  <Clock className="h-3 w-3" />
                  {formatDuration(duration)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-[#f4f4f4] hover:bg-[#f6f7ed] flex items-center justify-center text-[#1f1f1f]/40 hover:text-[#1f1f1f] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-[#1f1f1f]/40 mb-3 block">
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
                    <span className={`text-[11px] font-medium leading-tight ${isSelected ? d.color : "text-[#1f1f1f]/40"}`}>
                      {d.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[11px] font-medium uppercase tracking-wider text-[#1f1f1f]/40 mb-2 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLogging}
              placeholder="Summarize the call..."
              rows={3}
              className="w-full bg-[#f4f4f4] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 focus:border-[#1f1f1f]/15 resize-none transition-all"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!selectedDisposition || isLogging}
            className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              selectedDisposition
                ? "bg-[#1f1f1f] text-white hover:bg-[#1f1f1f]/90 active:scale-[0.98]"
                : "bg-[#f4f4f4] text-[#1f1f1f]/40"
            }`}
          >
            {isLogging ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </>
  );
};

export default PostCallModal;
