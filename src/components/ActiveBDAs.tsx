import { Phone, Coffee, Clock, Wifi } from "lucide-react";
import { motion } from "framer-motion";

type BDAStatus = "calling" | "idle" | "break";

interface BDA {
  name: string;
  status: BDAStatus;
  leadName?: string;
  callDuration?: number; // seconds
}

const mockBDAs: BDA[] = [
  { name: "Arjun Mehta", status: "calling", leadName: "Priya Sharma", callDuration: 187 },
  { name: "Sarah Johnson", status: "idle" },
  { name: "Ravi Patel", status: "break" },
  { name: "Emma Wilson", status: "calling", leadName: "Rajesh Kumar", callDuration: 52 },
  { name: "Dev Kapoor", status: "idle" },
];

const statusConfig: Record<BDAStatus, {
  icon: typeof Phone;
  bgColor: string;
  textColor: string;
  dotColor: string;
  label: string;
  ring?: string;
}> = {
  calling: {
    icon: Phone,
    bgColor: "bg-success/15",
    textColor: "text-success",
    dotColor: "bg-success",
    label: "On Call",
    ring: "ring-success/30",
  },
  idle: {
    icon: Wifi,
    bgColor: "bg-muted",
    textColor: "text-muted-foreground",
    dotColor: "bg-muted-foreground/50",
    label: "Ready",
  },
  break: {
    icon: Coffee,
    bgColor: "bg-warning/15",
    textColor: "text-warning",
    dotColor: "bg-warning",
    label: "On Break",
  },
};

const avatarColors = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-orange-500 to-amber-700",
  "from-pink-500 to-rose-700",
];

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const ActiveBDAs = () => {
  return (
    <div className="space-y-3">
      {mockBDAs.map((bda, index) => {
        const cfg = statusConfig[bda.status];
        const initials = bda.name.split(" ").map(n => n[0]).join("");
        const avatarColor = avatarColors[index % avatarColors.length];

        return (
          <motion.div
            key={bda.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            className="flex items-center justify-between gap-3 py-0.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar with status ring */}
              <div className="relative shrink-0">
                <div
                  className={`h-9 w-9 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-xs font-bold text-white`}
                >
                  {initials}
                </div>
                {/* Live status ring */}
                {bda.status === "calling" && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card"
                    style={{ animation: "livePulse 2s ease-in-out infinite" }}
                  />
                )}
                {bda.status === "break" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-warning border-2 border-card" />
                )}
                {bda.status === "idle" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-muted-foreground/40 border-2 border-card" />
                )}
              </div>

              {/* Name & context */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{bda.name}</p>
                {bda.leadName ? (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Phone className="h-2.5 w-2.5 text-success" />
                    <span className="truncate">{bda.leadName}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">{cfg.label}</p>
                )}
              </div>
            </div>

            {/* Status + timer */}
            <div className="flex items-center gap-2 shrink-0">
              {bda.callDuration && (
                <span className="text-[11px] font-mono text-success tabular-nums">
                  {formatDuration(bda.callDuration)}
                </span>
              )}
              <span
                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor}`}
              >
                <cfg.icon className="h-2.5 w-2.5" />
                {cfg.label}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActiveBDAs;
