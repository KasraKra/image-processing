import React, { useMemo } from 'react';
import { HistogramData } from '../utils/imageTransforms';

interface HistogramChartProps {
  inputHist: HistogramData;
  outputHist?: HistogramData;
  label?: string;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
  inputHist,
  outputHist,
  label = 'Intensity Histogram'
}) => {
  const maxVal = useMemo(() => {
    let max = 1;
    for (let i = 0; i < 256; i++) {
      if (inputHist.bins[i] > max) max = inputHist.bins[i];
      if (outputHist && outputHist.bins[i] > max) max = outputHist.bins[i];
    }
    return max;
  }, [inputHist, outputHist]);

  // Downsample to 64 bars for clean SVG visualization
  const bars = useMemo(() => {
    const barCount = 64;
    const step = 4;
    const res = [];
    for (let i = 0; i < barCount; i++) {
      let inSum = 0;
      let outSum = 0;
      for (let s = 0; s < step; s++) {
        const idx = i * step + s;
        inSum += inputHist.bins[idx] || 0;
        if (outputHist) outSum += outputHist.bins[idx] || 0;
      }
      res.push({
        x: (i / barCount) * 100,
        inHeight: (inSum / (maxVal * step)) * 100,
        outHeight: outputHist ? (outSum / (maxVal * step)) * 100 : 0
      });
    }
    return res;
  }, [inputHist, outputHist, maxVal]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300">{label}</span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-500/80 inline-block" />
            Input (Mean: {inputHist.mean.toFixed(1)})
          </span>
          {outputHist && (
            <span className="flex items-center gap-1 text-indigo-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
              Transformed (Mean: {outputHist.mean.toFixed(1)})
            </span>
          )}
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="h-24 w-full bg-slate-950/70 rounded-lg p-1.5 relative flex items-end">
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#334155" strokeDasharray="2,2" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeDasharray="2,2" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#334155" strokeDasharray="2,2" strokeWidth="0.5" />

          {bars.map((bar, idx) => (
            <g key={idx}>
              {/* Input bar */}
              <rect
                x={bar.x}
                y={100 - Math.min(100, Math.max(1, bar.inHeight))}
                width="1.2"
                height={Math.min(100, Math.max(1, bar.inHeight))}
                fill={outputHist ? '#64748b' : '#38bdf8'}
                opacity={outputHist ? 0.45 : 0.85}
              />
              {/* Output bar */}
              {outputHist && (
                <rect
                  x={bar.x + 0.3}
                  y={100 - Math.min(100, Math.max(1, bar.outHeight))}
                  width="1.2"
                  height={Math.min(100, Math.max(1, bar.outHeight))}
                  fill="#6366f1"
                  opacity={0.85}
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 px-1 font-mono">
        <span>0 (Dark)</span>
        <span>64</span>
        <span>128</span>
        <span>192</span>
        <span>255 (Bright)</span>
      </div>
    </div>
  );
};
