"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { reportsRegistry } from '@/lib/reportsRegistry';

export default function CategoryReportsPage({ params }: { params: Promise<{ category: string }> }) {
  const unwrappedParams = use(params);
  const { category } = unwrappedParams;
  
  const categoryConfig = reportsRegistry.find(c => c.id === category);
  if (!categoryConfig) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Home</Link>
        <span>//</span>
        <Link href="/reports" className="hover:text-blue-600 transition-colors">Reports</Link>
        <span>//</span>
        <span className="text-slate-800">{categoryConfig.title}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold font-sans tracking-tight text-slate-800">Reports</h1>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <div className="bg-slate-200 px-6 py-3 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-700">{categoryConfig.title}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-0">
          {categoryConfig.reports.map((report, index) => (
            <Link 
              key={report.id} 
              href={`/reports/${categoryConfig.id}/${report.id}`}
              className={`p-6 hover:bg-slate-50 transition-colors border-r border-b border-slate-100 flex flex-col items-start`}
            >
              <h3 className="text-base font-bold text-slate-800">{report.title}</h3>
              <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                {report.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
