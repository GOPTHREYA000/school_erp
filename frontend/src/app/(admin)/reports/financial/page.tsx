"use client";

import React from 'react';
import { TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function FinancialReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <TrendingUp size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 text-gray-900">Income Statement</h3>
          <p className="text-gray-500 text-sm mb-6">Detailed breakdown of all revenue sources.</p>
          <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <p className="text-gray-400 text-sm">Detailed Ledger View Coming Soon</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 text-gray-900">Expense Analysis</h3>
          <p className="text-gray-500 text-sm mb-6">Categorized expenses and vendor payments.</p>
          <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <p className="text-gray-400 text-sm">Category Breakdown Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
