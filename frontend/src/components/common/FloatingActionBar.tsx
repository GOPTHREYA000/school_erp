"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Trash2, Send } from 'lucide-react';

interface FloatingActionBarProps {
  count: number;
  onClear: () => void;
  actions: {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'primary' | 'danger';
  }[];
}

export default function FloatingActionBar({ count, onClear, actions }: FloatingActionBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[50]"
        >
          <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-8 min-w-[400px]">
             <div className="flex items-center gap-3 border-r border-white/20 pr-8">
               <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">
                 {count}
               </div>
               <p className="text-white text-sm font-medium">Selected</p>
               <button 
                 onClick={onClear}
                 className="text-slate-400 hover:text-white transition-colors"
               >
                 <X size={14} />
               </button>
             </div>

             <div className="flex items-center gap-3">
               {actions.map((action, idx) => {
                 const Icon = action.icon;
                 return (
                   <button
                     key={idx}
                     onClick={action.onClick}
                     className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                       action.variant === 'danger' 
                         ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' 
                         : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                     }`}
                   >
                     <Icon size={16} />
                     {action.label}
                   </button>
                 );
               })}
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
