import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/common/AuthProvider';
import api from '@/lib/axios';

interface ReportFiltersProps {
  onFilterChange: (filters: any) => void;
  showDateRange?: boolean;
  showAcademicYear?: boolean;
  showClassSection?: boolean;
  showStatus?: boolean;
  statusOptions?: { value: string; label: string }[];
  showAdSource?: boolean;
  showPaymentMode?: boolean;
  showVendor?: boolean;
  showExpenseCategory?: boolean;
}

export default function ReportFilters({
  onFilterChange,
  showDateRange = true,
  showAcademicYear = true,
  showClassSection = true,
  showStatus = false,
  statusOptions = [],
  showAdSource = false,
  showPaymentMode = false,
  showVendor = false,
  showExpenseCategory = false
}: ReportFiltersProps) {
  const { user } = useAuth();
  
  const [filters, setFilters] = useState<any>({
    branch_id: '',
    academic_year_id: '',
    startDate: '',
    endDate: '',
    class_id: '',
    section_id: '',
    status: ''
  });

  const [branches, setBranches] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classSections, setClassSections] = useState<any[]>([]);

  useEffect(() => {
    // Only school admin can see all branches filter
    if (user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN') {
      fetchBranches();
    }
    if (showAcademicYear) fetchAcademicYears();
    if (showClassSection) fetchClassSections();
  }, [user, showAcademicYear, showClassSection]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/tenants/branches/');
      setBranches(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get('/tenants/academic-years/');
      setAcademicYears(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchClassSections = async () => {
    try {
      const res = await api.get('/classes/');
      const data = res.data?.data || res.data?.results || res.data;
      setClassSections(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch class sections:', e);
    }
  };

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Only pass non-empty values
    const cleanFilters: any = {};
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) cleanFilters[k] = v;
    });
    onFilterChange(cleanFilters);
  };

  // Derive unique grades from class sections for the grade dropdown
  const uniqueGrades = [...new Set(classSections.map((cs: any) => cs.grade))].sort();

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
      {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-xs font-semibold text-slate-500 uppercase">Branch</label>
          <select 
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={filters.branch_id}
            onChange={(e) => handleChange('branch_id', e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {showAcademicYear && (
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-xs font-semibold text-slate-500 uppercase">Academic Year</label>
          <select 
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={filters.academic_year_id}
            onChange={(e) => handleChange('academic_year_id', e.target.value)}
          >
            <option value="">Current Year</option>
            {academicYears.map((ay: any) => (
              <option key={ay.id} value={ay.id}>{ay.name}</option>
            ))}
          </select>
        </div>
      )}

      {showDateRange && (
        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 align-bottom">
            <label className="text-xs font-semibold text-slate-500 uppercase">Start Date</label>
            <input 
              type="date" 
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={filters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 align-bottom">
            <label className="text-xs font-semibold text-slate-500 uppercase">End Date</label>
            <input 
              type="date" 
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={filters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
          </div>
        </div>
      )}

      {showClassSection && (
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-xs font-semibold text-slate-500 uppercase">Class</label>
          <select 
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={filters.class_id}
            onChange={(e) => handleChange('class_id', e.target.value)}
          >
            <option value="">All Classes</option>
            {uniqueGrades.map((grade: any) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>
      )}

      {showStatus && (
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
          <select 
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      {showAdSource && (
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-xs font-semibold text-slate-500 uppercase">Source</label>
          <select 
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={filters.source}
            onChange={(e) => handleChange('source', e.target.value)}
          >
            <option value="">All Sources</option>
            {['WALKIN', 'WEBSITE', 'REFERRAL', 'CAMPAIGN', 'OTHER'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {showPaymentMode && (
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-xs font-semibold text-slate-500 uppercase">Payment Mode</label>
          <select 
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={filters.payment_mode}
            onChange={(e) => handleChange('payment_mode', e.target.value)}
          >
            <option value="">All Modes</option>
            {['CASH', 'CHEQUE', 'UPI', 'BANK_TRANSFER', 'CARD'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {showExpenseCategory && (
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-xs font-semibold text-slate-500 uppercase">Exp. Category</label>
          <select 
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={filters.expense_category_id}
            onChange={(e) => handleChange('expense_category_id', e.target.value)}
          >
            <option value="">All Categories</option>
          </select>
        </div>
      )}

      {showVendor && (
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-xs font-semibold text-slate-500 uppercase">Vendor</label>
          <select 
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={filters.vendor_id}
            onChange={(e) => handleChange('vendor_id', e.target.value)}
          >
            <option value="">All Vendors</option>
          </select>
        </div>
      )}
    </div>
  );
}
