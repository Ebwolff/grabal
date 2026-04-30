'use client';

import React from 'react';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface FinancialChartProps {
  data: ChartDataPoint[];
  title?: string;
  type?: 'area' | 'line';
  series: { key: string; name: string; color: string }[];
  height?: number;
  formatValue?: (v: number) => string;
}

const defaultFormat = (v: number) => `R$ ${(v / 1000000).toFixed(2)}M`;

function CustomTooltip({ active, payload, label, formatValue }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 border border-industrial-border shadow-xl">
      <p className="text-[10px] text-slate-400 font-semibold mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-bold">{(formatValue || defaultFormat)(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function FinancialChart({ data, title, type = 'area', series, height = 280, formatValue }: FinancialChartProps) {
  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const SeriesComponent = type === 'area' ? Area : Line;

  return (
    <div className="card p-5">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <div className="flex gap-3">
            {series.map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] text-slate-400 font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {series.map(s => (
              <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a233240" vertical={false} />
          <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false}
            tickFormatter={(v) => (formatValue || defaultFormat)(v)} />
          <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
          {series.map(s => (
            type === 'area' ? (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.name}
                stroke={s.color} strokeWidth={2} fill={`url(#gradient-${s.key})`} />
            ) : (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.name}
                stroke={s.color} strokeWidth={2} dot={false} />
            )
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
