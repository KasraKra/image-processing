import React from 'react';

interface TransferCurveChartProps {
  type: 'log' | 'power_law';
  gamma?: number;
  c?: number;
  effectiveC?: number;
}

export const TransferCurveChart: React.FC<TransferCurveChartProps> = ({
  type,
  gamma = 1.0,
  c = 1.0,
  effectiveC = 45.98
}) => {
  // Generate points for the curve
  const points: { x: number; y: number }[] = [];
  const steps = 60;

  for (let i = 0; i <= steps; i++) {
    const r = (i / steps) * 255;
    let s = 0;

    if (type === 'log') {
      s = effectiveC * Math.log(1 + r);
    } else {
      // Power-law: s = 255 * c * (r / 255)^gamma
      s = 255 * c * Math.pow(r / 255, gamma);
    }

    s = Math.min(255, Math.max(0, s));
    // Normalize to 0..100 for SVG coordinates (with inverted Y)
    points.push({
      x: (r / 255) * 100,
      y: 100 - (s / 255) * 100
    });
  }

  const pathD = points.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300">
          Transfer Function Curve <code className="text-indigo-400 font-mono text-[11px]">s = T(r)</code>
        </span>
        <span className="text-[11px] font-mono text-cyan-400">
          {type === 'log'
            ? `s = ${effectiveC.toFixed(1)} · ln(1 + r)`
            : `s = ${c.toFixed(1)} · r^${gamma.toFixed(2)}`}
        </span>
      </div>

      <div className="h-28 w-full bg-slate-950/70 rounded-lg p-2 relative">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
          <line x1="25" y1="0" x2="25" y2="100" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
          <line x1="75" y1="0" x2="75" y2="100" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />

          {/* 45 degree identity line (s = r) */}
          <line x1="0" y1="100" x2="100" y2="0" stroke="#475569" strokeDasharray="3,3" strokeWidth="1" />

          {/* Transfer curve */}
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        {/* Legend notes */}
        <div className="absolute top-2 left-3 text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
          {type === 'log' && 'Curves upward: expands dark inputs'}
          {type === 'power_law' && gamma < 1 && 'γ < 1: expands dark levels'}
          {type === 'power_law' && gamma > 1 && 'γ > 1: compresses dark, expands bright'}
          {type === 'power_law' && gamma === 1 && 'γ = 1: Linear identity'}
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
        <span>r = 0 (Input)</span>
        <span>Identity: ---</span>
        <span>r = 255 (Input)</span>
      </div>
    </div>
  );
};
