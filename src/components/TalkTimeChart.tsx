import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface TalkTimeChartProps {
  minutes: number;
  goal: number;
}

const TalkTimeChart = ({ minutes, goal }: TalkTimeChartProps) => {
  const percentage = Math.min((minutes / goal) * 100, 100);
  const data = [
    { value: percentage },
    { value: 100 - percentage },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={56}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="hsl(239, 84%, 67%)" />
              <Cell fill="hsl(215, 25%, 20%)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{minutes}</span>
          <span className="text-[10px] text-muted-foreground">min</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {Math.round(percentage)}% of {goal}m goal
      </p>
    </div>
  );
};

export default TalkTimeChart;
