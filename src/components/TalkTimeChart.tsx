import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
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

  const data = [
    { value: percentage },
    { value: 100 - percentage },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={68}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="hsl(var(--foreground))" />
              <Cell fill="hsl(var(--muted))" />
            </Pie>

          </PieChart>
        </ResponsiveContainer>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-foreground tracking-tight">
            {hours > 0 ? hours : minutes}
          </span>
          <span className="text-[11px] text-foreground/35 font-medium">
            {hours > 0 ? "hours" : "min"}
          </span>
        </div>
      </div>

      {/* Progress bar + label */}
      <div className="w-full">
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
