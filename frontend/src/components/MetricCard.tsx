'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  invertChange?: boolean;
  icon?: LucideIcon | React.ReactNode;
  iconColor?: string;
  className?: string;
  accentColor?: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
}

export function MetricCard({
  title, value, change, changeLabel = 'vs safra anterior',
  invertChange, icon, iconColor = 'text-primary-light',
  className, accentColor, subtitle, trend
}: MetricCardProps) {
  const { isPrivate } = usePrivacy();

  // Support both old API (trend prop) and new API (change prop)
  const effectiveChange = change ?? (trend ? (trend.isPositive ? trend.value : -trend.value) : undefined);

  const isPositive = effectiveChange !== undefined && (invertChange ? effectiveChange < 0 : effectiveChange > 0);
  const isNegative = effectiveChange !== undefined && (invertChange ? effectiveChange > 0 : effectiveChange < 0);

  // Render icon: if it's a JSX element, render directly. Otherwise treat as component ref.
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as LucideIcon;
    return <IconComp size={14} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015, y: -2 }}
      transition={{ duration: 0.3 }}
      className={cn("card p-5 relative overflow-hidden group", className)}
    >
      {/* Top row: title + icon */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">{title}</p>
        {icon && (
          <div className={cn("p-1.5 rounded-lg bg-surface-elevated", iconColor)}>
            {renderIcon()}
          </div>
        )}
      </div>

      {/* Value */}
      <h3 className={cn(
        "text-2xl font-bold tracking-tight text-white mb-1.5 privacy-mask",
        isPrivate && "privacy-hidden"
      )}>
        {value}
      </h3>

      {/* Change badge */}
      {effectiveChange !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
            isPositive && "text-success bg-success/10",
            isNegative && "text-danger bg-danger/10",
            !isPositive && !isNegative && "text-slate-400 bg-slate-800"
          )}>
            {isPositive ? <ArrowUpRight size={12} /> : isNegative ? <ArrowDownRight size={12} /> : <Minus size={10} />}
            {effectiveChange !== 0 ? `${Math.abs(effectiveChange).toFixed(1)}%` : '—'}
          </span>
          <span className="text-[9px] text-slate-600">{changeLabel}</span>
        </div>
      )}

      {subtitle && (
        <p className="text-[9px] text-slate-500 mt-2">{subtitle}</p>
      )}

      {/* Subtle accent border on hover */}
      <div
        className="absolute left-0 top-0 w-[3px] h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-xl"
        style={{ backgroundColor: accentColor || 'var(--color-primary-light)' }}
      />
    </motion.div>
  );
}
