'use client';

import { useEffect, useRef, useMemo } from 'react';
import { serializeChartData, COLORS } from './chart-types';
import type { ChartData } from './chart-types';

export function DonutChart({ 
  data, 
  size = 200,
  title,
}: { 
  data: ChartData[];
  size?: number;
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
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;
    const innerRadius = radius * 0.6;
    const total = stableData.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#6B7280';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('0', centerX, centerY);
      ctx.font = '12px system-ui';
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText('Sin datos', centerX, centerY + 20);
      return;
    }

    let animFrame = 0;

    const drawDonut = (progress: number) => {
      const easeOut = 1 - Math.pow(1 - progress, 3);
      ctx.clearRect(0, 0, size, size);

      let currentAngle = -Math.PI / 2;
      stableData.forEach((item, index) => {
        const sliceAngle = (item.value / total) * Math.PI * 2 * easeOut;
        ctx.fillStyle = item.color || COLORS[index % COLORS.length];
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fill();
        currentAngle += sliceAngle;
      });

      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fill();

      const animatedTotal = Math.round(total * easeOut);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(animatedTotal.toString(), centerX, centerY);
      ctx.font = '12px system-ui';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Total', centerX, centerY + 20);
    };

    const duration = 1000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      drawDonut(progress);
      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      }
    };
    animate();

    return () => { if (animFrame) cancelAnimationFrame(animFrame); };
  }, [stableData, size]);

  return (
    <div>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
        <canvas ref={canvasRef} style={{ width: `${size}px`, height: `${size}px` }} />
        <div className="space-y-2">
          {(data || []).map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.value} ({(() => { const total = (data || []).reduce((s, i) => s + i.value, 0); return total === 0 ? '0.0' : ((item.value / total) * 100).toFixed(1); })()}%)</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
