import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/common/AuthProvider';
import api from '@/lib/axios';
import { Search } from 'lucide-react';

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
    status: '',
    source: '',
    payment_mode: '',
    vendor_id: '',
    expense_category_id: ''
  });

  const [branches, setBranches] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classSections, setClassSections] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN') {
      fetchBranches();
    }
    if (showAcademicYear) fetchAcademicYears();
    if (showClassSection) fetchClassSections();
  }, [user, showAcademicYear, showClassSection]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('tenants/branches/');
      const raw = res.data?.data ?? res.data;
      setBranches(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error('Failed to fetch branches:', e);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get('tenants/academic-years/');
      const raw = res.data?.data ?? res.data;
      setAcademicYears(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error('Failed to fetch academic years:', e);
    }
  };

  const fetchClassSections = async () => {
    try {
      const res = await api.get('classes/');
      const raw = res.data?.data ?? res.data?.results ?? res.data;
      setClassSections(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error('Failed to fetch class sections:', e);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    // Only pass non-empty values
    const cleanFilters: any = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) cleanFilters[k] = v;
    });
    onFilterChange(cleanFilters);
  };

  // Derive unique grades from class sections for the grade dropdown
  const uniqueGrades = [...new Set(classSections.map((cs: any) => cs.grade))].sort();

  const selectClass = "p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Branch</label>
            <select 
              className={selectClass}
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
              className={selectClass}
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
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Start Date</label>
              <input 
                type="date" 
                className={selectClass}
                value={filters.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">End Date</label>
              <input 
                type="date" 
                className={selectClass}
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
              className={selectClass}
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
              className={selectClass}
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
              className={selectClass}
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
              className={selectClass}
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
              className={selectClass}
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
              className={selectClass}
              value={filters.vendor_id}
              onChange={(e) => handleChange('vendor_id', e.target.value)}
            >
              <option value="">All Vendors</option>
            </select>
          </div>
        )}

        {/* Generate Report Button */}
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Search size={16} />
          Generate Report
        </button>
      </div>
    </div>
  );
}
