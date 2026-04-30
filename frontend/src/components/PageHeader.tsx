'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  accent?: string;
  description?: string;
  badge?: React.ReactNode;
}

export function PageHeader({ title, accent, description, badge }: PageHeaderProps) {
  return (
    <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {title} {accent && <span className="text-primary-light">{accent}</span>}
          </h2>
          {description && (
            <p className="text-xs text-slate-500 mt-1 max-w-xl">{description}</p>
          )}
        </div>
        {badge && badge}
      </div>
    </motion.header>
  );
}
