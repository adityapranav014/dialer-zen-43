import { Phone, Coffee, Clock, Wifi } from "lucide-react";

type BDAStatus = "calling" | "idle" | "break";

interface BDA {
  name: string;
  status: BDAStatus;
  leadName?: string;
  callDuration?: number;
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
}> = {
  calling: {
    icon: Phone,
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
    dotColor: "bg-emerald-500",
    label: "On Call",
  },
  idle: {
    icon: Wifi,
    bgColor: "bg-[#f4f4f4]",
    textColor: "text-[#1f1f1f]/40",
    dotColor: "bg-[#1f1f1f]/20",
    label: "Ready",
  },
  break: {
    icon: Coffee,
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    dotColor: "bg-amber-500",
    label: "On Break",
  },
};

const avatarColors = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
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
          <div
            key={bda.name}
            className="flex items-center justify-between gap-3 py-0.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div
                  className={`h-9 w-9 rounded-xl ${avatarColor} flex items-center justify-center text-xs font-bold`}
                >
                  {initials}
                </div>
                {bda.status === "calling" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                )}
                {bda.status === "break" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-500 border-2 border-white" />
                )}
                {bda.status === "idle" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#1f1f1f]/20 border-2 border-white" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1f1f1f] truncate">{bda.name}</p>
                {bda.leadName ? (
                  <p className="text-[11px] text-[#1f1f1f]/35 flex items-center gap-1">
                    <Phone className="h-2.5 w-2.5 text-emerald-500" />
                    <span className="truncate">{bda.leadName}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-[#1f1f1f]/35">{cfg.label}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {bda.callDuration && (
                <span className="text-[11px] font-mono text-emerald-600 tabular-nums">
                  {formatDuration(bda.callDuration)}
                </span>
              )}
              <span
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor}`}
              >
                <cfg.icon className="h-2.5 w-2.5" />
                {cfg.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActiveBDAs;
