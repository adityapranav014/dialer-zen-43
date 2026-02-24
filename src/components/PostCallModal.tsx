import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare } from "lucide-react";

interface PostCallModalProps {
  open: boolean;
  onClose: () => void;
  leadName: string;
  duration: number;
}

const dispositions = ["Interested", "Not Interested", "Follow Up", "Voicemail", "Wrong Number", "Closed Won"];

const PostCallModal = ({ open, onClose, leadName, duration }: PostCallModalProps) => {
  const [selectedDisposition, setSelectedDisposition] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSave = () => {
    console.log("Saved:", { disposition: selectedDisposition, notes, duration });
    setSelectedDisposition(null);
    setNotes("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="bg-card border border-border rounded-t-[var(--radius)] md:rounded-[var(--radius)] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Post-Call Log</h2>
                  <p className="text-sm text-muted-foreground">
                    {leadName} · {formatDuration(duration)}
                  </p>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-5">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Disposition</label>
                <div className="grid grid-cols-2 gap-2">
                  {dispositions.map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDisposition(d)}
                      className={`text-sm px-3 py-2 rounded-md border transition-all ${
                        selectedDisposition === d
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/50"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add call notes..."
                  rows={3}
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!selectedDisposition}
                className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save & Continue
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PostCallModal;
