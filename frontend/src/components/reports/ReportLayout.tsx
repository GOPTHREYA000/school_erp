import React from 'react';

interface ReportLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function ReportLayout({ title, description, children, actions }: ReportLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
