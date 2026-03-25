/**
 * DonutChart — Shared SVG donut chart used across CapTable, Salary, Affiliation pages.
 *
 * Props:
 *   data     — Object { key: number } (segment values)
 *   palette  — Array of hex colors (Recharts exception: hex not CSS vars)
 *   size     — Optional diameter (default 80)
 */
export default function DonutChart({ data, palette, size }) {
  var s = size || 80;
  var r = s * 0.375;          // ~30 for size=80
  var cx = s / 2;
  var cy = s / 2;
  var sw = s * 0.125;         // ~10 for size=80
  var circ = 2 * Math.PI * r;

  var total = 0;
  var entries = [];
  Object.keys(data || {}).forEach(function (k) {
    total += data[k];
    entries.push({ key: k, value: data[k] });
  });

  if (total <= 0) {
    return (
      <svg width={s} height={s} viewBox={"0 0 " + s + " " + s} style={{ flexShrink: 0 }} role="img" aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth={sw} opacity={0.6} />
      </svg>
    );
  }

  var segs = entries.reduce(function (acc, e) {
    var prev = acc.length > 0 ? acc[acc.length - 1].end : 0;
    var pct = e.value / total;
    acc.push({ key: e.key, pct: pct, start: prev, end: prev + pct });
    return acc;
  }, []);

  return (
    <svg width={s} height={s} viewBox={"0 0 " + s + " " + s} style={{ flexShrink: 0 }} role="img" aria-hidden="true">
      {segs.map(function (seg, i) {
        var dash = seg.pct * circ;
        return (
          <circle key={seg.key} cx={cx} cy={cy} r={r} fill="none"
            stroke={(palette || [])[i % (palette || []).length] || "var(--text-muted)"}
            strokeWidth={sw}
            strokeDasharray={dash + " " + (circ - dash)}
            strokeDashoffset={-seg.start * circ}
            transform={"rotate(-90 " + cx + " " + cy + ")"}
            style={{ transition: "stroke-dasharray 0.3s" }}
          />
        );
      })}
    </svg>
  );
}
