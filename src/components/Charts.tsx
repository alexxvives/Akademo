'use client';

import { useEffect, useRef } from 'react';

// Types
interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface LineChartData {
  label: string;
  values: number[];
  color?: string;
}

// Color palette
const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

// Bar Chart Component
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Validate data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return;
    }

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height - 80; // Increased space for labels (was 60)
    const padding = 40;
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = (width - padding * 2) / data.length - 10;

    // Clear canvas
    ctx.clearRect(0, 0, width, rect.height);

    // Animation state
    let animationProgress = 0;
    const animationDuration = 1000; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      animationProgress = Math.min(elapsed / animationDuration, 1);
      const easeOut = 1 - Math.pow(1 - animationProgress, 3); // cubic ease-out

      ctx.clearRect(0, 0, width, rect.height);

      // Draw bars with animation
      data.forEach((item, index) => {
        const targetHeight = (item.value / maxValue) * chartHeight;
        const stagger = index * 0.1; // Stagger by 10% for each bar
        const staggeredProgress = Math.max(0, Math.min(1, (animationProgress - stagger) / (1 - stagger)));
        const animatedHeight = targetHeight * easeOut * (staggeredProgress > 0 ? 1 : 0);
        
        const x = padding + index * (barWidth + 10);
        const y = chartHeight - animatedHeight + 20;

        // Draw bar
        ctx.fillStyle = item.color || COLORS[index % COLORS.length];
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, animatedHeight, 4);
        ctx.fill();

        // Draw value
        if (showValues && animatedHeight > 10) {
          ctx.fillStyle = '#374151';
          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(item.value.toString(), x + barWidth / 2, y - 8);
        }

        // Draw label (horizontal) with better styling and spacing
        ctx.fillStyle = '#1F2937'; // Darker gray for better readability
        ctx.font = 'bold 18px system-ui'; // Slightly smaller, cleaner font
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x + barWidth / 2, chartHeight + 60); // More space from chart
      });

      if (animationProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [data, showValues]);

  return (
    <div>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
}

// Line Chart Component
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

// Donut Chart Component
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Validate data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;
    const innerRadius = radius * 0.6;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // If total is 0, show a gray circle indicating no data
    if (total === 0) {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#E5E7EB'; // gray-200
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      
      // Draw center circle
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw "0" in center
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

    // Animation state
    let animationProgress = 0;
    const animationDuration = 1000; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      animationProgress = Math.min(elapsed / animationDuration, 1);
      const easeOut = 1 - Math.pow(1 - animationProgress, 3); // cubic ease-out

      ctx.clearRect(0, 0, size, size);

      let currentAngle = -Math.PI / 2;

      data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * Math.PI * 2 * easeOut;
        
        ctx.fillStyle = item.color || COLORS[index % COLORS.length];
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fill();

        currentAngle += sliceAngle;
      });

      // Draw center circle
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw animated total in center
      const animatedTotal = Math.round(total * easeOut);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(animatedTotal.toString(), centerX, centerY);
      ctx.font = '12px system-ui';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Total', centerX, centerY + 20);

      if (animationProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [data, size]);

  return (
    <div>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div className="flex items-center justify-center gap-8">
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
                <p className="text-xs text-gray-500">{item.value} ({((item.value / (data || []).reduce((s, i) => s + i.value, 0)) * 100).toFixed(1)}%)</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
export function StatCard({ 
  title, 
  value, 
  change, 
  subtitle,
  icon,
  trend = 'neutral',
}: { 
  title: string;
  value: string | number;
  change?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' && (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-brand-50 rounded-lg text-brand-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
