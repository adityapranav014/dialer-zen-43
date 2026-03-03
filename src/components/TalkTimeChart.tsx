import { TrendingUp } from "lucide-react";

interface TalkTimeChartProps {
  minutes: number;
  goal: number;
}

const TalkTimeChart = ({ minutes, goal }: TalkTimeChartProps) => {
  const percentage = Math.min((minutes / goal) * 100, 100);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const displayTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  // SVG ring params
  const size = 72;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      {/* Compact ring */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-foreground tracking-tight leading-none">
            {hours > 0 ? hours : minutes}
          </span>
          <span className="text-[9px] text-foreground/30 font-medium">
            {hours > 0 ? "hrs" : "min"}
          </span>
        </div>
      </div>

      {/* Progress bar + labels */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-foreground/40">Talk time</span>
          <span className="text-foreground font-medium">{displayTime}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-foreground/30">of {goal}m goal</span>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            {Math.round(percentage)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalkTimeChart;
