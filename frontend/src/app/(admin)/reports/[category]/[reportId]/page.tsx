"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportTable from '@/components/reports/ReportTable';
import ExportButton from '@/components/reports/ExportButton';
import api from '@/lib/axios';
import { getReportConfig, reportsRegistry } from '@/lib/reportsRegistry';

export default function DynamicReportPage({ params }: { params: Promise<{ category: string; reportId: string }> }) {
  const unwrappedParams = use(params);
  const { category, reportId } = unwrappedParams;
  
  const config = getReportConfig(category, reportId);
  if (!config) return notFound();

  const [filters, setFilters] = useState({});
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 50,
    totalCount: 0
  });

  const fetchReport = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(config.apiEndpoint, {
        params: { ...filters, page }
      });
      const d = res.data?.data;
      if (d) {
        setData(d.results || d || []);
        if (d.current_page) {
          setPagination({
            currentPage: d.current_page || 1,
            totalPages: d.total_pages || 1,
            pageSize: d.page_size || 50,
            totalCount: d.count || 0
          });
        }
      }
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters, config.apiEndpoint]);

  useEffect(() => {
    fetchReport(1);
  }, [fetchReport]);

  const categoryTitle = reportsRegistry.find(c => c.id === category)?.title || category;

  // Breadcrumbs match "Home // Reports // Fee Balances" precisely
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Home</Link>
        <span>//</span>
        <Link href="/reports" className="hover:text-blue-600 transition-colors">Reports</Link>
        <span>//</span>
        <span className="text-slate-800">{config.title}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-slate-800">{config.title}</h1>
        </div>
        <ExportButton reportType={config.exportKey} filters={filters} />
      </div>

      <div className="mt-8">
        <ReportFilters 
          onFilterChange={setFilters} 
          {...config.filters}
        />
      </div>
      
      <div className="mt-6 border-t border-slate-100 pt-6">
        <ReportTable 
          columns={config.columns} 
          data={data} 
          loading={loading}
          pagination={pagination}
          onPageChange={fetchReport}
        />
      </div>
    </div>
  );
}
