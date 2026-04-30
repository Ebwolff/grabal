'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useSidebar } from '@/context/SidebarContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <>
      <Sidebar />
      <Topbar />
      <motion.main
        animate={{ marginLeft: collapsed ? 68 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="pt-14 min-h-screen"
      >
        <div className="p-6">
          {children}
        </div>
      </motion.main>
    </>
  );
}
