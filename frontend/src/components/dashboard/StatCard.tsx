"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  trend?: {
    value: number;
    label: string;
  };
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  green: 'bg-green-50 text-green-600 border-green-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
};

export default function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{value}</p>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="font-semibold">{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
              <span className="text-gray-400 font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-xl border ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
    </motion.div>
  );
}
