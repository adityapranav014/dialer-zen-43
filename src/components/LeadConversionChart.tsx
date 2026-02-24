import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { stage: "New", count: 42 },
  { stage: "Contacted", count: 28 },
  { stage: "Interested", count: 15 },
  { stage: "Closed", count: 8 },
];

const LeadConversionChart = () => {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="25%">
          <XAxis
            dataKey="stage"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "hsl(222, 47%, 10%)",
              border: "1px solid hsl(215, 25%, 20%)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(210, 40%, 96%)",
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(239, 84%, 67%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LeadConversionChart;
