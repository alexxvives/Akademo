// Chart shared types and constants

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  label: string;
  values: number[];
  color?: string;
}

// Stable serialization for chart data to avoid re-animating on reference changes
export function serializeChartData(data: ChartData[]): string {
  return data.map(d => `${d.label}:${d.value}:${d.color || ''}`).join('|');
}

// Color palette
export const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];
