import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const data = [
  { stage: "New", count: 42, pct: "100%" },
  { stage: "Contacted", count: 28, pct: "67%" },
  { stage: "Interested", count: 15, pct: "36%" },
  { stage: "Closed", count: 8, pct: "19%" },
];

const barColors = [
  "hsl(243, 75%, 65%)",
  "hsl(252, 78%, 60%)",
  "hsl(261, 82%, 58%)",
  "hsl(158, 64%, 52%)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="glass rounded-lg px-3 py-2 text-xs shadow-xl"
        style={{ border: "1px solid hsl(var(--border))" }}
      >
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-muted-foreground mt-0.5">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

const LeadConversionChart = () => {
  return (
    <div className="space-y-3">
      <div className="w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="28%">
            <XAxis
              dataKey="stage"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 15%, 52%)", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)", radius: 6 }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={barColors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stage conversion pills */}
      <div className="flex gap-2 flex-wrap">
        {data.map((d, i) => (
          <div key={d.stage} className="flex items-center gap-1.5 text-[11px]">
            <span className="h-2 w-2 rounded-sm" style={{ background: barColors[i] }} />
            <span className="text-muted-foreground">{d.stage}</span>
            <span className="font-semibold text-foreground">{d.pct}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadConversionChart;
