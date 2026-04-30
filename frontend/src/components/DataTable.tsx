'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { usePrivacy } from '@/context/PrivacyContext';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  private?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  emptyMessage?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  icon,
  title,
  subtitle,
  footer,
  emptyMessage = 'Nenhum registro encontrado.',
  sortKey,
  sortDir = 'asc',
  onSort,
  className,
}: DataTableProps<T>) {
  const { isPrivate } = usePrivacy();

  return (
    <div className={cn('card overflow-hidden', className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="px-5 py-4 border-b border-industrial-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            {title && (
              <h4 className="text-sm font-semibold text-white">{title}</h4>
            )}
          </div>
          {subtitle && (
            <span className="text-[10px] text-slate-500 font-semibold">
              {subtitle}
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-striped">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-left',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer select-none hover:text-primary-light transition-colors'
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                >
                  <div className={cn(
                    'flex items-center gap-1',
                    col.align === 'center' && 'justify-center',
                    col.align === 'right' && 'justify-end'
                  )}>
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc'
                        ? <ChevronUp size={12} className="text-primary-light" />
                        : <ChevronDown size={12} className="text-primary-light" />
                    )}
                    {col.sortable && sortKey !== col.key && (
                      <ArrowUpDown size={10} className="text-slate-700" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-sm text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <motion.tr
                  key={keyExtractor(row)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                        col.private && 'privacy-mask',
                        col.private && isPrivate && 'privacy-hidden'
                      )}
                    >
                      {col.render
                        ? col.render(row[col.key], row, i)
                        : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
    </div>
  );
}
