"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface BranchContextType {
  selectedBranch: string;
  setSelectedBranch: (id: string) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedBranch');
    if (saved) setSelectedBranch(saved);
  }, []);

  const handleSetBranch = (id: string) => {
    setSelectedBranch(id);
    localStorage.setItem('selectedBranch', id);
  };

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch: handleSetBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
