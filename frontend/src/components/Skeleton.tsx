'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ className = 'h-4 w-full', rounded }: SkeletonProps) {
  return <div className={`skeleton ${rounded ? 'rounded-full' : ''} ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card p-5">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-[250px] w-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-industrial-border">
        <Skeleton className="h-4 w-32" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-industrial-border">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-3"><Skeleton className="h-3 w-16" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-industrial-border/30">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="p-3"><Skeleton className="h-3 w-20" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-3 w-96" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><SkeletonChart /></div>
        <SkeletonChart />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="card p-12 flex flex-col items-center justify-center text-center"
    >
      <div className="p-4 rounded-2xl bg-surface-elevated mb-4">
        <Icon size={32} className="text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm">{description}</p>
    </motion.div>
  );
}

export function ErrorState({ title = 'Erro ao carregar dados', onRetry }: {
  title?: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="card p-8 border-danger/30 flex flex-col items-center text-center"
    >
      <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center mb-3">
        <span className="text-danger text-lg">!</span>
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-4">Verifique sua conexão e tente novamente.</p>
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-light transition-colors">
          Tentar Novamente
        </button>
      )}
    </motion.div>
  );
}
