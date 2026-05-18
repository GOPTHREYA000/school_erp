"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

interface BranchContextType {
  selectedBranch: string;
  setSelectedBranch: (id: string) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [localBranch, setLocalBranch] = useState<string>('');

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedBranch');
    if (saved) setLocalBranch(saved);
  }, []);

  const handleSetBranch = (id: string) => {
    setLocalBranch(id);
    localStorage.setItem('selectedBranch', id);
  };

  const hasGlobalSelector = ['SUPER_ADMIN'].includes(user?.role || '');
  const selectedBranch = (!hasGlobalSelector && (user?.branch_id || user?.branch)) 
    ? (user?.branch_id || user?.branch || '') 
    : localBranch;

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
