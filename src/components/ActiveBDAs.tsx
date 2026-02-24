import { Phone, Coffee, Clock } from "lucide-react";

type BDAStatus = "calling" | "idle" | "break";

interface BDA {
  name: string;
  status: BDAStatus;
  leadName?: string;
}

const mockBDAs: BDA[] = [
  { name: "Arjun Mehta", status: "calling", leadName: "Priya Sharma" },
  { name: "Sarah Johnson", status: "idle" },
  { name: "Ravi Patel", status: "break" },
  { name: "Emma Wilson", status: "calling", leadName: "Rajesh Kumar" },
  { name: "Dev Kapoor", status: "idle" },
];

const statusConfig: Record<BDAStatus, { icon: typeof Phone; color: string; label: string }> = {
  calling: { icon: Phone, color: "text-success", label: "On Call" },
  idle: { icon: Clock, color: "text-muted-foreground", label: "Idle" },
  break: { icon: Coffee, color: "text-destructive", label: "Break" },
};

const ActiveBDAs = () => {
  return (
    <div className="space-y-3">
      {mockBDAs.map((bda) => {
        const cfg = statusConfig[bda.status];
        return (
          <div key={bda.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
                {bda.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{bda.name}</p>
                {bda.leadName && (
                  <p className="text-[11px] text-muted-foreground">→ {bda.leadName}</p>
                )}
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
              <cfg.icon className="h-3 w-3" />
              {cfg.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActiveBDAs;
