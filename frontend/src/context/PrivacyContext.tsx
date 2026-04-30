'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
  isPrivate: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivate, setIsPrivate] = useState(false);

  // Persistir preferência
  useEffect(() => {
    const saved = localStorage.getItem('gb-privacy-mode');
    if (saved === 'true') setIsPrivate(true);
  }, []);

  const togglePrivacy = () => {
    setIsPrivate((prev) => {
      const next = !prev;
      localStorage.setItem('gb-privacy-mode', String(next));
      return next;
    });
  };

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
