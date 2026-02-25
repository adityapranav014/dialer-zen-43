import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const data = [
  { stage: "New", count: 42, pct: "100%" },
  { stage: "Contacted", count: 28, pct: "67%" },
  { stage: "Interested", count: 15, pct: "36%" },
  { stage: "Closed", count: 8, pct: "19%" },
];

const barColors = [
  "#1f1f1f",
  "#4a4a4a",
  "#7a7a7a",
  "#10b981",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="surface-elevated rounded-lg px-3 py-2 text-xs"
      >
        <p className="font-semibold text-[#1f1f1f]">{label}</p>
        <p className="text-[#1f1f1f]/40 mt-0.5">{payload[0].value} leads</p>
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
              tick={{ fill: "#1f1f1f", opacity: 0.4, fontSize: 11, fontWeight: 500 }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f6f7ed", radius: 6 }} />
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
            <span className="text-[#1f1f1f]/40">{d.stage}</span>
            <span className="font-semibold text-[#1f1f1f]">{d.pct}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadConversionChart;
