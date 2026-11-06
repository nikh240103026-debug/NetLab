'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const axisTick = { fill: 'var(--muted)', fontSize: 11 };
const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  fontSize: 12,
  color: 'var(--ink)',
};
const cursorStyle = { fill: 'var(--accent-soft)' };

export function ScoreChart({ data }: { data: { name: string; score: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={axisTick} stroke="var(--border)" interval={0} />
        <YAxis domain={[0, 100]} tick={axisTick} stroke="var(--border)" />
        <Tooltip contentStyle={tooltipStyle} cursor={cursorStyle} formatter={(v) => [`${v}%`, 'Best score']} />
        <Bar dataKey="score" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ActivityChart({ data }: { data: { name: string; actions: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={axisTick} stroke="var(--border)" interval={1} />
        <YAxis allowDecimals={false} tick={axisTick} stroke="var(--border)" />
        <Tooltip contentStyle={tooltipStyle} cursor={cursorStyle} formatter={(v) => [String(v), 'Study actions']} />
        <Bar dataKey="actions" fill="var(--success)" radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PerChapterChart({ data }: { data: { name: string; percent: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={axisTick} stroke="var(--border)" interval={0} />
        <YAxis domain={[0, 100]} tick={axisTick} stroke="var(--border)" />
        <Tooltip contentStyle={tooltipStyle} cursor={cursorStyle} formatter={(v) => [`${v}%`, 'Correct']} />
        <Bar dataKey="percent" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
