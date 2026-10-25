import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SplitViewSliderProps {
  beforeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  afterCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  beforeLabel?: string;
  afterLabel?: string;
  width: number;
  height: number;
}

export const SplitViewSlider: React.FC<SplitViewSliderProps> = ({
  beforeCanvasRef,
  afterCanvasRef,
  beforeLabel = 'Original',
  afterLabel = 'Processed',
  width,
  height
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawComposite = useCallback(() => {
    const canvas = displayCanvasRef.current;
    const before = beforeCanvasRef.current;
    const after = afterCanvasRef.current;
    if (!canvas || !before || !after) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Draw the "After" image fully first
    ctx.drawImage(after, 0, 0, width, height);

    // Clip and draw the "Before" image on the left portion based on sliderPos
    const splitX = (sliderPos / 100) * width;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, height);
    ctx.clip();
    ctx.drawImage(before, 0, 0, width, height);
    ctx.restore();

    // Draw vertical divider line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, height);
    ctx.stroke();
  }, [beforeCanvasRef, afterCanvasRef, width, height, sliderPos]);

  useEffect(() => {
    drawComposite();
  }, [drawComposite]);

  const handlePointerDown = () => setIsDragging(true);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const pos = ((clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.min(100, Math.max(0, pos)));
    },
    [isDragging]
  );

  const handlePointerUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative select-none overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950 shadow-inner cursor-ew-resize group"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={displayCanvasRef}
        className="w-full h-auto block max-h-[380px] object-contain mx-auto"
        onPointerDown={handlePointerDown}
      />

      {/* Floating Labels */}
      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm text-slate-300 text-[11px] font-medium px-2.5 py-1 rounded-md border border-slate-700 pointer-events-none">
        {beforeLabel} ({Math.round(sliderPos)}%)
      </div>
      <div className="absolute top-3 right-3 bg-indigo-950/80 backdrop-blur-sm text-indigo-300 text-[11px] font-medium px-2.5 py-1 rounded-md border border-indigo-700 pointer-events-none">
        {afterLabel} ({Math.round(100 - sliderPos)}%)
      </div>

      {/* Interactive Draggable Handle icon */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center font-bold text-xs border-2 border-indigo-500">
          ↔
        </div>
      </div>
    </div>
  );
};
