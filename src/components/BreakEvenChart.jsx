import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { eur } from "../utils";

var BRAND_HEX = "#E8431A";
var ERR_HEX = "#D92D20";
var GRID_COLOR = "#e0ddd6";

export default function BreakEvenChart({ monthlyRevenue, monthlyCosts, growthRate, t }) {
  var data = useMemo(function () {
    var rows = [];
    var rev = monthlyRevenue || 0;
    var cost = monthlyCosts || 0;
    var g = growthRate || 0;
    var cumRev = 0;
    var cumCost = 0;
    for (var m = 1; m <= 12; m++) {
      var mr = m === 1 ? rev : rev * Math.pow(1 + g, m - 1);
      cumRev += mr;
      cumCost += cost;
      rows.push({
        month: "M" + m,
        revenue: Math.round(cumRev),
        costs: Math.round(cumCost),
      });
    }
    return rows;
  }, [monthlyRevenue, monthlyCosts, growthRate]);

  var breakEvenMonth = useMemo(function () {
    for (var i = 0; i < data.length; i++) {
      if (data[i].revenue >= data[i].costs && data[i].costs > 0) return data[i].month;
    }
    return null;
  }, [data]);

  if (!monthlyRevenue && !monthlyCosts) return null;

  function CustomTooltip(props) {
    var active = props.active;
    var payload = props.payload;
    if (!active || !payload || !payload.length) return null;
    var d = payload[0].payload;
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "var(--sp-2) var(--sp-3)", fontSize: 12, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>{d.month}</div>
        <div style={{ color: BRAND_HEX }}>{(t.breakeven_revenue || "Revenus") + " : " + eur(d.revenue)}</div>
        <div style={{ color: ERR_HEX }}>{(t.breakeven_costs || "Charges") + " : " + eur(d.costs)}</div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={BRAND_HEX} stopOpacity={0.25} />
              <stop offset="95%" stopColor={BRAND_HEX} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ERR_HEX} stopOpacity={0.18} />
              <stop offset="95%" stopColor={ERR_HEX} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={function (v) { return v >= 1000 ? Math.round(v / 1000) + "k" : v; }} width={40} />
          <Tooltip content={<CustomTooltip />} />
          {breakEvenMonth ? (
            <ReferenceLine x={breakEvenMonth} stroke={BRAND_HEX} strokeDasharray="4 4" strokeWidth={1.5} label={{ value: t.breakeven_point || "Equilibre", position: "top", fontSize: 10, fill: BRAND_HEX, fontWeight: 600 }} />
          ) : null}
          <Area type="monotone" dataKey="revenue" stroke={BRAND_HEX} strokeWidth={2} fillOpacity={1} fill="url(#gradRevenue)" name={t.breakeven_revenue || "Revenus"} />
          <Area type="monotone" dataKey="costs" stroke={ERR_HEX} strokeWidth={2} fillOpacity={1} fill="url(#gradCosts)" name={t.breakeven_costs || "Charges"} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
