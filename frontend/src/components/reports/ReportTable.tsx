import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ReportTableProps {
  columns: Column[];
  data: any[];
  loading: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
  };
  onPageChange?: (page: number) => void;
}

export default function ReportTable({ columns, data, loading, pagination, onPageChange }: ReportTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-6 py-4">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map(col => (
                    <td key={col.key + i} className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-lg font-medium">No results found</span>
                    <span className="text-xs">Try adjusting your filters or date range</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-6 py-4 font-medium whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || loading}
              className="p-1 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-sm font-semibold text-slate-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages || loading}
              className="p-1 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
