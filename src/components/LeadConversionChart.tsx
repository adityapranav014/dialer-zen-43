import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useLeadFunnel } from "@/hooks/useLeadFunnel";
import { useStatusConfig } from "@/hooks/useStatusConfig";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="surface-elevated rounded-xl px-3 py-2 text-xs"
      >
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-foreground/40 mt-0.5">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

const LeadConversionChart = () => {
  const { funnel, isLoading } = useLeadFunnel();
  const { statuses } = useStatusConfig();

  // Dynamic bar colors from status config
  const barColors = statuses.map((s) => s.hex);

  // Compute percentage relative to the first stage (max)
  const maxCount = funnel.length > 0 ? funnel[0].count : 1;
  const data = funnel.map((item) => ({
    ...item,
    pct: maxCount > 0 ? `${Math.round((item.count / maxCount) * 100)}%` : "0%",
  }));

  if (isLoading) {
    return (
      <div className="h-20 flex items-center justify-center">
        <span className="text-xs text-foreground/30">Loading…</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="w-full h-20">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="28%">
            <XAxis
              dataKey="stage"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "lab(var(--foreground))", opacity: 0.4, fontSize: 11, fontWeight: 500 }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "lab(var(--accent))", radius: 6 }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stage conversion pills */}
      <div className="flex gap-2 flex-wrap">
        {data.map((d, i) => (
          <div key={d.stage} className="flex items-center gap-1.5 text-[11px]">
            <span className="h-2 w-2 rounded-sm" style={{ background: barColors[i % barColors.length] }} />
            <span className="text-foreground/40">{d.stage}</span>
            <span className="font-bold text-foreground">{d.pct}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadConversionChart;
