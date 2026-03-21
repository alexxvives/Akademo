'use client';

import { useEffect, useRef } from 'react';
import { COLORS } from './chart-types';
import type { LineChartData } from './chart-types';

export function LineChart({ 
  data, 
  labels,
  height = 300,
  title,
}: { 
  data: LineChartData[];
  labels: string[];
  height?: number;
  title?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Validate data
    if (!data || !Array.isArray(data) || data.length === 0 || !labels || labels.length === 0) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height - 60;
    const padding = 40;
    const maxValue = Math.max(...data.flatMap(d => d.values));
    const pointSpacing = (width - padding * 2) / (labels.length - 1);

    ctx.clearRect(0, 0, width, rect.height);

    // Draw grid lines
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 20 + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw lines
    data.forEach((line, lineIndex) => {
      ctx.strokeStyle = line.color || COLORS[lineIndex % COLORS.length];
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      line.values.forEach((value, index) => {
        const x = padding + index * pointSpacing;
        const y = 20 + chartHeight - (value / maxValue) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw points
      ctx.fillStyle = line.color || COLORS[lineIndex % COLORS.length];
      line.values.forEach((value, index) => {
        const x = padding + index * pointSpacing;
        const y = 20 + chartHeight - (value / maxValue) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Draw labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    labels.forEach((label, index) => {
      const x = padding + index * pointSpacing;
      ctx.fillText(label, x, chartHeight + 40);
    });
  }, [data, labels]);

  return (
    <div>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
          <div className="flex flex-wrap gap-4">
            {(data || []).map((line, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: line.color || COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600">{line.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
}
