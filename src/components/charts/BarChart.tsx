'use client';

import { useEffect, useRef, useMemo } from 'react';
import { serializeChartData, COLORS } from './chart-types';
import type { ChartData } from './chart-types';

export function BarChart({ 
  data, 
  height = 300,
  showValues = true,
  title,
}: { 
  data: ChartData[]; 
  height?: number;
  showValues?: boolean;
  title?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stabilize data reference — only changes when actual values change
  const dataKey = serializeChartData(data || []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableData = useMemo(() => data, [dataKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!stableData || !Array.isArray(stableData) || stableData.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height - 80;
    const padding = 40;
    const maxValue = Math.max(...stableData.map(d => d.value));
    const barWidth = (width - padding * 2) / stableData.length - 10;

    let animFrame = 0;

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, width, rect.height);
      stableData.forEach((item, index) => {
        // Per-bar staggered ease-out for smooth sequential reveal
        const stagger = index * 0.1;
        const staggeredProgress = Math.max(0, Math.min(1, (progress - stagger) / (1 - stagger)));
        const easeOut = 1 - Math.pow(1 - staggeredProgress, 3);
        const animatedHeight = (item.value / maxValue) * chartHeight * easeOut;

        const x = padding + index * (barWidth + 10);
        const y = chartHeight - animatedHeight + 20;

        ctx.fillStyle = item.color || COLORS[index % COLORS.length];
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, animatedHeight, 4);
        ctx.fill();

        if (showValues && animatedHeight > 10) {
          ctx.fillStyle = '#374151';
          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(item.value.toString(), x + barWidth / 2, y - 8);
        }

        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x + barWidth / 2, chartHeight + 60);
      });
    };

    const duration = 1000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      draw(progress);
      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      }
    };
    animate();

    return () => { if (animFrame) cancelAnimationFrame(animFrame); };
  }, [stableData, showValues]);

  return (
    <div>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
}
