import { useState } from "react";

var _spkId = 0;

export default function Sparkline({ data, color, width, height }) {
  var w = width || 80;
  var h = height || 24;
  var idRef = useState(function () { return "spk" + (++_spkId); })[0];
  if (!data || data.length < 2) return null;

  var min = Math.min.apply(null, data);
  var max = Math.max.apply(null, data);
  var range = max - min || 1;
  var pad = 1;

  var pts = data.map(function (v, i) {
    var x = pad + (i / (data.length - 1)) * (w - pad * 2);
    var y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return x.toFixed(1) + " " + y.toFixed(1);
  });

  var line = "M" + pts.join(" L");
  var area = line + " L" + (w - pad).toFixed(1) + " " + (h - pad).toFixed(1) + " L" + pad.toFixed(1) + " " + (h - pad).toFixed(1) + " Z";

  return (
    <svg width={w} height={h} viewBox={"0 0 " + w + " " + h} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={idRef} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color || "var(--brand)"} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color || "var(--brand)"} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={"url(#" + idRef + ")"} />
      <path d={line} fill="none" stroke={color || "var(--brand)"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
