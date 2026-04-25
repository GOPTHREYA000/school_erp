"use client";

import React from 'react';
import Link from 'next/link';
import { 
  UserPlus, BookOpen, Receipt, 
  Users, Bus, AlertCircle, ArrowRight 
} from 'lucide-react';

const categories = [
  { 
    href: '/reports/admit', 
    label: 'Admissions', 
    description: 'Applicant lists, conversion rates, and admission counts.',
    icon: UserPlus,
    color: 'from-blue-500 to-indigo-600'
  },
  { 
    href: '/reports/academics', 
    label: 'Academics', 
    description: 'Student strength, daily attendance, marks & ranks.',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-600'
  },
  { 
    href: '/reports/payments', 
    label: 'Financial', 
    description: 'Fee collections, balances, expenses & income state.',
    icon: Receipt,
    color: 'from-amber-500 to-orange-600'
  },
  { 
    href: '/reports/staff', 
    label: 'Staff & HR', 
    description: 'Teacher attendance and leave reports.',
    icon: Users,
    color: 'from-purple-500 to-pink-600'
  },
  { 
    href: '/reports/bus', 
    label: 'Transport', 
    description: 'Bus allocations, transport fee balances.',
    icon: Bus,
    color: 'from-cyan-500 to-blue-600'
  },
  { 
    href: '/reports/past-dues', 
    label: 'Past Dues', 
    description: 'Overdue fee defualters, aging reports.',
    icon: AlertCircle,
    color: 'from-rose-500 to-red-600'
  },
];

export default function ReportsHub() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-sans tracking-tight">Reports Center</h1>
          <p className="text-slate-300 mt-2 max-w-xl">
            Access, generate, and export comprehensive analytics across all your school operations. Select a category below to get started.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link 
              key={cat.href} 
              href={cat.href}
              className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all flex flex-col items-start gap-4"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800">{cat.label}</h3>
                <p className="text-sm text-slate-500 mt-1">{cat.description}</p>
              </div>
              <div className="w-full flex items-center justify-between mt-2 pt-4 border-t border-slate-50 text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View Reports</span>
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
