"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import { useAuth } from '@/components/common/AuthProvider';
import { useBranch } from '@/components/common/BranchContext';
import { toast } from 'react-hot-toast';
import {
  Calendar, ArrowRight, CheckCircle2, AlertTriangle, Clock,
  Users, Receipt, FileX2, ChevronRight, ArrowUpRight,
  Lock, Unlock, RotateCcw, Loader2, Eye, Play, Pause,
  UserMinus, UserPlus, Ban, GraduationCap, ShieldAlert,
  ArrowLeftRight, X, Check
} from 'lucide-react';

/* ═══════════════ TYPES ═══════════════ */

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: string;
}

interface ClosingLog {
  id: string;
  academic_year_name: string;
  target_year_name: string;
  status: string;
  total_students: number;
  promoted_count: number;
  detained_count: number;
  dropout_count: number;
  graduated_count: number;
  carry_forwards_created: number;
  total_carry_forward_amount: string;
  initiated_by_name: string;
  initiated_at: string;
  completed_at: string;
}

interface PromotionPreview {
  student_id: string;
  student_name: string;
  admission_number: string;
  current_class: string;
  current_grade: string;
  target_grade: string;
  target_class: string;
  outstanding_dues: string;
  action: string;
}

interface CarryForward {
  id: string;
  student_name: string;
  admission_number: string;
  source_year_name: string;
  target_year_name: string;
  carry_forward_amount: string;
  paid_amount: string;
  written_off_amount: string;
  remaining_amount: string;
  status: string;
}

interface WriteOff {
  id: string;
  student_name: string;
  admission_number: string;
  amount: string;
  reason: string;
  status: string;
  requested_by_name: string;
  requested_at: string;
  approved_by_name: string;
  admin_remarks: string;
}

interface PromotionMap {
  id: string;
  branch: string;
  academic_year: string;
  from_grade: string;
  to_grade: string;
}

interface ClassSectionRow {
  id: string;
  branch: string;
  academic_year: string;
  grade: string;
  section: string;
  display_name: string;
}

interface PromoteStudentRow {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  roll_number: number | null;
  class_section_display: string | null;
}

/* ═══════════════ STATUS CHIPS ═══════════════ */

const yearStatusStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  PLANNING: { bg: 'bg-slate-100', text: 'text-slate-600', icon: <Clock size={12} /> },
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <Unlock size={12} /> },
  CLOSING: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Pause size={12} /> },
  CLOSED: { bg: 'bg-red-50', text: 'text-red-600', icon: <Lock size={12} /> },
};

const cfStatusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  PARTIALLY_PAID: 'bg-blue-50 text-blue-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  WRITTEN_OFF: 'bg-slate-100 text-slate-500',
};

const woStatusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-blue-50 text-blue-700',
  REJECTED: 'bg-red-50 text-red-600',
  EXECUTED: 'bg-emerald-50 text-emerald-700',
};

const closingLogStatusStyles: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-red-50 text-red-600',
  ROLLED_BACK: 'bg-amber-50 text-amber-700',
};

/* ═══════════════ GRADE LIST (for promotion map) ═══════════════ */

const GRADES = [
  'NURSERY', 'LKG', 'UKG',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
];

/* ═══════════════ MAIN PAGE ═══════════════ */

export default function AcademicTransitionPage() {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [activeTab, setActiveTab] = useState<'overview' | 'promotion' | 'carryforwards' | 'writeoffs'>('overview');

  const tabs = [
    { key: 'overview' as const, label: 'Year Overview', icon: Calendar },
    { key: 'promotion' as const, label: 'Promotion Engine', icon: ArrowUpRight },
    { key: 'carryforwards' as const, label: 'Carry-Forwards', icon: Receipt },
    { key: 'writeoffs' as const, label: 'Write-Offs', icon: FileX2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Academic Year Transition</h1>
        <p className="text-gray-500 text-sm mt-1">Manage year closings, student promotions, and financial carry-forwards.</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-gray-100 pb-px overflow-x-auto scrollbar-hide">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <YearOverviewTab branch={selectedBranch} user={user} />}
      {activeTab === 'promotion' && <PromotionTab branch={selectedBranch} user={user} />}
      {activeTab === 'carryforwards' && <CarryForwardTab branch={selectedBranch} />}
      {activeTab === 'writeoffs' && <WriteOffTab branch={selectedBranch} user={user} />}
    </div>
  );
}


/* ═══════════════ TAB 1: YEAR OVERVIEW ═══════════════ */

function YearOverviewTab({ branch, user }: { branch: string; user: any }) {
  const { data: years, loading, error, refetch } = useApi<AcademicYear[]>(
    `tenants/academic-years/?branch_id=${branch}`
  );
  const { data: closingLogs, refetch: refetchLogs } = useApi<ClosingLog[]>(
    `/academic-year-closing/logs/`
  );
  const [targetYearId, setTargetYearId] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [closingResult, setClosingResult] = useState<any>(null);
  const [confirmingLogId, setConfirmingLogId] = useState<string | null>(null);

  const activeYear = years?.find(y => y.is_active);
  const otherYears = years?.filter(y => !y.is_active) || [];
  const planningYears = otherYears.filter(y => y.status === 'PLANNING');

  const handleInitiateClosing = async () => {
    if (!targetYearId) { toast.error('Select a target academic year first.'); return; }
    setIsClosing(true);
    try {
      const res = await api.post('/academic-year-closing/initiate/', {
        target_academic_year_id: targetYearId,
      });
      setClosingResult(res.data.data);
      toast.success('Year closing initiated. Review the preview below.');
      refetch();
      refetchLogs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to initiate closing.');
    } finally { setIsClosing(false); }
  };

  const handleConfirmClosing = async (logId: string) => {
    setConfirmingLogId(logId);
    try {
      const res = await api.post('/academic-year-closing/confirm/', { closing_log_id: logId });
      toast.success('Academic year closed successfully!');
      setClosingResult(null);
      refetch();
      refetchLogs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to confirm closing.');
    } finally { setConfirmingLogId(null); }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-2xl border animate-pulse" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-bold">Could not load academic years</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Year Card */}
      {activeYear && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                Current Year
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                activeYear.status === 'ACTIVE' ? 'bg-emerald-400/20 text-emerald-100' :
                activeYear.status === 'CLOSING' ? 'bg-amber-400/20 text-amber-100' : 'bg-white/20'
              }`}>
                {activeYear.status}
              </div>
            </div>
            <h2 className="text-4xl font-black tracking-tight mt-3">{activeYear.name}</h2>
            <p className="text-blue-100 mt-2 text-sm">
              {activeYear.start_date} → {activeYear.end_date}
            </p>

            {/* Close Year Action */}
            {activeYear.status === 'ACTIVE' && user?.role && user.role === 'SUPER_ADMIN' && (
              <div className="mt-6 flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1 block">Target Year</label>
                  <select
                    value={targetYearId}
                    onChange={e => setTargetYearId(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white backdrop-blur-sm focus:outline-none focus:ring-2 ring-white/30"
                  >
                    <option value="" className="text-gray-900">Select next year...</option>
                    {planningYears.map(y => (
                      <option key={y.id} value={y.id} className="text-gray-900">{y.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleInitiateClosing}
                  disabled={isClosing || !targetYearId}
                  className="px-6 py-2.5 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all disabled:opacity-50 shadow-lg flex items-center gap-2"
                >
                  {isClosing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Initiate Year Closing
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Closing Preview */}
      {closingResult && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-500" size={24} />
            <div>
              <h3 className="font-bold text-amber-800">Year Closing Preview</h3>
              <p className="text-amber-600 text-sm">Review the numbers below, then confirm to seal the year.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Students to Process" value={closingResult.students_to_process} />
            <Stat label="Students with Dues" value={closingResult.students_with_dues} />
            <Stat label="Est. Carry-Forward" value={`₹${Number(closingResult.estimated_carry_forward_amount).toLocaleString('en-IN')}`} />
            <Stat label="Status" value={closingResult.status} />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleConfirmClosing(closingResult.closing_log_id)}
              disabled={confirmingLogId !== null}
              className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {confirmingLogId ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Confirm & Close Year
            </button>
            <button
              onClick={() => setClosingResult(null)}
              className="px-6 py-2.5 bg-white text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-50 border border-amber-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* All Years Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          All Academic Years
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {years && years.length === 0 && (
            <p className="text-sm text-slate-500 col-span-full py-8 text-center border border-dashed rounded-2xl">
              No academic years found for this organization. Add years under Setup → Academic Years.
            </p>
          )}
          {years?.map(year => {
            const style = yearStatusStyles[year.status] || yearStatusStyles.PLANNING;
            return (
              <div key={year.id} className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${year.is_active ? 'ring-2 ring-blue-200' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900">{year.name}</h4>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-1 ${style.bg} ${style.text}`}>
                    {style.icon}{year.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{year.start_date} → {year.end_date}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Closing History */}
      {closingLogs && closingLogs.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              Closing History
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-3xl">
              Promotion, detain, dropout, and graduated columns reflect live counts from student academic records for that closed year (all branches in your organization).
            </p>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="px-4 py-4 font-bold text-slate-600">Year</th>
                  <th className="px-4 py-4 font-bold text-slate-600">Target</th>
                  <th className="px-4 py-4 font-bold text-slate-600 text-center" title="Student academic records for this year (current data)">Promo</th>
                  <th className="px-4 py-4 font-bold text-slate-600 text-center">Detain</th>
                  <th className="px-4 py-4 font-bold text-slate-600 text-center">Dropout</th>
                  <th className="px-4 py-4 font-bold text-slate-600 text-center">Grad</th>
                  <th className="px-4 py-4 font-bold text-slate-600">Carry-Fwd</th>
                  <th className="px-4 py-4 font-bold text-slate-600">Amount</th>
                  <th className="px-4 py-4 font-bold text-slate-600">Status</th>
                  <th className="px-4 py-4 font-bold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {closingLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-900">{log.academic_year_name}</td>
                    <td className="px-4 py-4 text-slate-500">{log.target_year_name}</td>
                    <td className="px-4 py-4 text-center tabular-nums">{log.promoted_count}</td>
                    <td className="px-4 py-4 text-center tabular-nums">{log.detained_count}</td>
                    <td className="px-4 py-4 text-center tabular-nums">{log.dropout_count}</td>
                    <td className="px-4 py-4 text-center tabular-nums">{log.graduated_count}</td>
                    <td className="px-4 py-4 tabular-nums">{log.carry_forwards_created}</td>
                    <td className="px-4 py-4 font-bold tabular-nums">₹{Number(log.total_carry_forward_amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${closingLogStatusStyles[log.status]}`}>
                        {log.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-xs whitespace-nowrap">{new Date(log.initiated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══════════════ TAB 2: PROMOTION ENGINE ═══════════════ */

function PromotionTab({ branch, user }: { branch: string; user: any }) {
  void user;
  const { data: years, loading: yearsLoading, error: yearsError } = useApi<AcademicYear[]>(
    `tenants/academic-years/?branch_id=${branch}`
  );
  const { data: promotionMaps, refetch: refetchMaps } = useApi<PromotionMap[]>(
    `/promotion-maps/?branch_id=${branch}`
  );

  const activeYear = years?.find(y => y.is_active);

  const [fromYearId, setFromYearId] = useState('');
  const [toYearId, setToYearId] = useState('');
  const [fromSectionId, setFromSectionId] = useState('');
  const [toSectionId, setToSectionId] = useState('');
  const [sameGradeSection, setSameGradeSection] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [promoting, setPromoting] = useState(false);

  const [advTargetYearId, setAdvTargetYearId] = useState('');
  const [preview, setPreview] = useState<PromotionPreview[] | null>(null);
  const [previewMeta, setPreviewMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [newFromGrade, setNewFromGrade] = useState('');
  const [newToGrade, setNewToGrade] = useState('');
  const [addingMap, setAddingMap] = useState(false);

  useEffect(() => {
    if (!activeYear?.id) return;
    setFromYearId(prev => prev || activeYear.id);
  }, [activeYear?.id]);

  useEffect(() => {
    setFromSectionId('');
  }, [fromYearId]);

  useEffect(() => {
    setToSectionId('');
  }, [toYearId]);

  const fromClassesUrl =
    branch && fromYearId ? `classes/?branch_id=${branch}&academic_year_id=${fromYearId}` : null;
  const { data: fromClasses, loading: fromClassesLoading } = useApi<ClassSectionRow[]>(fromClassesUrl);

  const toClassesUrl =
    branch && toYearId ? `classes/?branch_id=${branch}&academic_year_id=${toYearId}` : null;
  const { data: toClasses, loading: toClassesLoading } = useApi<ClassSectionRow[]>(toClassesUrl);

  const studentsUrl = fromSectionId ? `classes/${fromSectionId}/students/` : null;
  const { data: classStudents, loading: studentsLoading, refetch: refetchStudents } = useApi<
    PromoteStudentRow[]
  >(studentsUrl);

  const fromSection = useMemo(
    () => fromClasses?.find(c => c.id === fromSectionId),
    [fromClasses, fromSectionId]
  );
  const toSection = useMemo(() => toClasses?.find(c => c.id === toSectionId), [toClasses, toSectionId]);

  useEffect(() => {
    if (!sameGradeSection || !fromSection || !toClasses?.length) return;
    const match = toClasses.find(c => c.grade === fromSection.grade && c.section === fromSection.section);
    if (match) setToSectionId(match.id);
  }, [sameGradeSection, fromSection, toClasses]);

  useEffect(() => {
    if (!classStudents?.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(classStudents.map(s => s.id));
  }, [fromSectionId, classStudents]);

  const toggleRow = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const allSelected = !!classStudents?.length && selectedIds.length === classStudents.length;
  const toggleAll = () => {
    if (!classStudents?.length) return;
    setSelectedIds(allSelected ? [] : classStudents.map(s => s.id));
  };

  const handleQuickPromote = async () => {
    if (!branch || !toYearId || !toSectionId || selectedIds.length === 0) {
      toast.error('Choose target year, target class, and at least one student.');
      return;
    }
    if (fromYearId === toYearId && fromSectionId === toSectionId) {
      toast.error('Source and target class must be different.');
      return;
    }
    setPromoting(true);
    try {
      const res = await api.post('/students/promote/', {
        student_ids: selectedIds,
        target_academic_year_id: toYearId,
        target_class_section_id: toSectionId,
      });
      const msg =
        res.data?.message || `Promoted ${res.data?.promoted_count ?? selectedIds.length} student(s).`;
      toast.success(msg);
      await refetchStudents();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Promotion failed.');
    } finally {
      setPromoting(false);
    }
  };

  const handlePreview = async () => {
    if (!advTargetYearId || !branch) {
      toast.error('Select branch and target year.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/promotions/preview/', {
        target_academic_year_id: advTargetYearId,
        branch_id: branch,
        scope: 'BRANCH',
      });
      setPreview(res.data.data.promotions);
      setPreviewMeta(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Preview failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!preview || !advTargetYearId) return;
    const overrideList = Object.entries(overrides)
      .filter(([_, action]) => action !== 'PROMOTE')
      .map(([student_id, action]) => ({ student_id, action }));

    setIsExecuting(true);
    try {
      const res = await api.post('/promotions/execute/', {
        target_academic_year_id: advTargetYearId,
        branch_id: branch,
        scope: 'BRANCH',
        overrides: overrideList,
      });
      const d = res.data.data;
      toast.success(`Done! Promoted: ${d.promoted}, Detained: ${d.detained}, Graduated: ${d.graduated}`);
      setPreview(null);
      setPreviewMeta(null);
      setOverrides({});
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Promotion failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddMap = async () => {
    if (!newFromGrade || !newToGrade || !branch) return;
    const ayId = activeYear?.id;
    if (!ayId) {
      toast.error('No active academic year.');
      return;
    }
    setAddingMap(true);
    try {
      await api.post('/promotion-maps/', {
        branch: branch,
        academic_year: ayId,
        from_grade: newFromGrade,
        to_grade: newToGrade,
      });
      toast.success(`${newFromGrade} → ${newToGrade} mapping saved.`);
      setNewFromGrade('');
      setNewToGrade('');
      refetchMaps();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to add mapping.');
    } finally {
      setAddingMap(false);
    }
  };

  const handleDeleteMap = async (id: string) => {
    try {
      await api.delete(`/promotion-maps/${id}/`);
      toast.success('Mapping removed.');
      refetchMaps();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  if (yearsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-bold">Could not load academic years</p>
        <p className="text-sm mt-1">{yearsError}</p>
        <p className="text-xs mt-2 text-red-700">Promotion needs academic years for this organization.</p>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 text-sm">
        Select a branch in the header to promote students.
      </div>
    );
  }

  const fromYearLabel = years?.find(y => y.id === fromYearId)?.name ?? '—';
  const sectionTitle = fromSection ? fromSection.display_name : 'this class';

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            Promote by class
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Pick the class you are moving students from, then the target year and class. Students load
            automatically; uncheck anyone who should stay put for now.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
          <input
            type="checkbox"
            className="mt-1 rounded border-slate-300"
            checked={sameGradeSection}
            onChange={e => setSameGradeSection(e.target.checked)}
          />
          <span className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Same grade &amp; section in target year</span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Only the academic year changes (e.g. UKG-A → UKG-A in the next session). Target class is filled
              automatically when it exists.
            </span>
          </span>
        </label>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From (current)</p>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Academic year</label>
              <select
                value={fromYearId}
                onChange={e => setFromYearId(e.target.value)}
                disabled={yearsLoading}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 ring-blue-200 focus:outline-none disabled:opacity-60"
              >
                <option value="">{yearsLoading ? 'Loading…' : 'Select year…'}</option>
                {years?.map(y => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                    {y.is_active ? ' (active)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Class</label>
              <select
                value={fromSectionId}
                onChange={e => setFromSectionId(e.target.value)}
                disabled={!fromYearId || fromClassesLoading}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 ring-blue-200 focus:outline-none disabled:opacity-60"
              >
                <option value="">
                  {!fromYearId ? 'Choose a year first…' : fromClassesLoading ? 'Loading classes…' : 'Select class…'}
                </option>
                {fromClasses?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200/80 p-4 space-y-3 bg-emerald-50/30">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">To (target)</p>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Academic year</label>
              <select
                value={toYearId}
                onChange={e => setToYearId(e.target.value)}
                disabled={yearsLoading}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 ring-emerald-200 focus:outline-none disabled:opacity-60"
              >
                <option value="">{yearsLoading ? 'Loading…' : 'Select target year…'}</option>
                {years?.map(y => (
                  <option key={y.id} value={y.id}>
                    {y.name} ({y.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Class</label>
              <select
                value={toSectionId}
                onChange={e => setToSectionId(e.target.value)}
                disabled={!toYearId || toClassesLoading}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 ring-emerald-200 focus:outline-none disabled:opacity-60"
              >
                <option value="">
                  {!toYearId ? 'Choose target year first…' : toClassesLoading ? 'Loading classes…' : 'Select class…'}
                </option>
                {toClasses?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {fromSectionId && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-sm font-bold text-slate-800">
                Students in {sectionTitle}
                <span className="ml-2 text-xs font-normal text-slate-500">({fromYearLabel})</span>
              </h4>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">
                  {selectedIds.length} of {classStudents?.length ?? 0} selected
                </span>
                <button
                  type="button"
                  onClick={handleQuickPromote}
                  disabled={
                    promoting ||
                    !toYearId ||
                    !toSectionId ||
                    selectedIds.length === 0 ||
                    studentsLoading
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                >
                  {promoting ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeftRight size={16} />}
                  Promote selected
                </button>
              </div>
            </div>

            {studentsLoading ? (
              <div className="flex justify-center py-12 border rounded-xl">
                <Loader2 className="animate-spin text-blue-500" size={28} />
              </div>
            ) : !classStudents?.length ? (
              <p className="text-sm text-slate-500 py-8 text-center border border-dashed rounded-xl">
                No active students in this class for the selected year.
              </p>
            ) : (
              <div className="border rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-3 py-3 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300"
                          checked={allSelected}
                          onChange={toggleAll}
                          aria-label="Select all students"
                        />
                      </th>
                      <th className="px-3 py-3 text-left font-bold text-slate-600">#</th>
                      <th className="px-3 py-3 text-left font-bold text-slate-600">Admission</th>
                      <th className="px-3 py-3 text-left font-bold text-slate-600">Roll</th>
                      <th className="px-3 py-3 text-left font-bold text-slate-600">Name</th>
                      <th className="px-3 py-3 text-left font-bold text-slate-600">Target class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => toggleRow(s.id)}
                          />
                        </td>
                        <td className="px-3 py-2 tabular-nums text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-700">{s.admission_number}</td>
                        <td className="px-3 py-2 text-slate-600">{s.roll_number ?? '—'}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {s.first_name} {s.last_name}
                        </td>
                        <td className="px-3 py-2">
                          {toSection ? (
                            <span className="font-semibold text-emerald-700">{toSection.display_name}</span>
                          ) : (
                            <span className="text-slate-400">Choose target class</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <details className="bg-white rounded-2xl border shadow-sm group">
        <summary className="cursor-pointer list-none px-6 py-4 flex items-center justify-between gap-2 text-sm font-bold text-slate-800">
          <span className="flex items-center gap-2">
            <ChevronRight
              size={18}
              className="text-slate-400 transition-transform group-open:rotate-90"
            />
            Advanced: grade maps &amp; whole-branch promotion
          </span>
          <span className="text-xs font-normal text-slate-500">Optional — uses mapped grades for every class</span>
        </summary>
        <div className="px-6 pb-6 space-y-8 border-t border-slate-100 pt-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black">
                1
              </div>
              Grade promotion map
            </h3>
            <p className="text-xs text-slate-400">
              Define how each grade maps to the next for automated branch-wide runs.
            </p>
            <div className="flex flex-wrap gap-2">
              {promotionMaps?.map(pm => (
                <div
                  key={pm.id}
                  className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 text-sm group"
                >
                  <span className="font-bold text-slate-700">{pm.from_grade}</span>
                  <ArrowRight size={14} className="text-slate-400" />
                  <span className="font-bold text-emerald-600">{pm.to_grade}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteMap(pm.id)}
                    className="p-0.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {(!promotionMaps || promotionMaps.length === 0) && (
                <p className="text-sm text-slate-400 italic">No mappings configured yet. Add below.</p>
              )}
            </div>
            <div className="flex items-end gap-3 pt-2 border-t border-slate-100 flex-wrap">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">From grade</label>
                <select
                  value={newFromGrade}
                  onChange={e => setNewFromGrade(e.target.value)}
                  className="border rounded-xl px-3 py-2 text-sm focus:ring-2 ring-blue-200 focus:outline-none"
                >
                  <option value="">Select…</option>
                  {GRADES.map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <ArrowRight size={20} className="text-slate-300 mb-2 hidden sm:block" />
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">To grade</label>
                <select
                  value={newToGrade}
                  onChange={e => setNewToGrade(e.target.value)}
                  className="border rounded-xl px-3 py-2 text-sm focus:ring-2 ring-blue-200 focus:outline-none"
                >
                  <option value="">Select…</option>
                  {GRADES.map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddMap}
                disabled={addingMap || !newFromGrade || !newToGrade}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {addingMap ? <Loader2 size={16} className="animate-spin" /> : 'Add'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black">
                2
              </div>
              Preview &amp; execute (entire branch)
            </h3>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Promote to year</label>
                <select
                  value={advTargetYearId}
                  onChange={e => setAdvTargetYearId(e.target.value)}
                  disabled={yearsLoading}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 ring-blue-200 focus:outline-none disabled:opacity-60"
                >
                  <option value="">{yearsLoading ? 'Loading years…' : 'Select target year…'}</option>
                  {years?.filter(y => !y.is_active).map(y => (
                    <option key={y.id} value={y.id}>
                      {y.name} ({y.status})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handlePreview}
                disabled={isLoading || !advTargetYearId}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                Preview
              </button>
            </div>

            {previewMeta && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Stat label="Total students" value={previewMeta.total_students} />
                  <Stat label="Students with dues" value={previewMeta.students_with_dues} />
                  <Stat
                    label="Total outstanding"
                    value={`₹${Number(previewMeta.total_outstanding).toLocaleString('en-IN')}`}
                  />
                  <Stat
                    label="Unmapped classes"
                    value={previewMeta.unmapped_classes?.length || 0}
                    highlight={previewMeta.unmapped_classes?.length > 0}
                  />
                </div>

                {previewMeta.unmapped_classes?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      <strong>Missing promotion maps:</strong> {previewMeta.unmapped_classes.join(', ')}.
                    </p>
                  </div>
                )}

                <div className="bg-white rounded-xl border overflow-hidden max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-slate-600">Student</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-600">Current</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-600">Target</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-600">Dues</th>
                        <th className="px-4 py-3 text-left font-bold text-slate-600 w-40">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {preview?.map(s => (
                        <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{s.student_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{s.admission_number}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{s.current_class}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`font-bold ${s.action === 'NEEDS_MAPPING' ? 'text-red-500' : 'text-emerald-600'}`}
                            >
                              {s.target_grade || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {Number(s.outstanding_dues) > 0 ? (
                              <span className="text-rose-600 font-bold">
                                ₹{Number(s.outstanding_dues).toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-emerald-500 text-xs">Clear</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={overrides[s.student_id] || 'PROMOTE'}
                              onChange={e =>
                                setOverrides(prev => ({ ...prev, [s.student_id]: e.target.value }))
                              }
                              className="w-full border rounded-lg px-2 py-1.5 text-xs font-bold focus:ring-2 ring-blue-200 focus:outline-none"
                            >
                              <option value="PROMOTE">Promote</option>
                              <option value="DETAIN">Detain</option>
                              <option value="DROPOUT">Mark dropout</option>
                              <option value="GRADUATE">Graduate</option>
                              <option value="TRANSFER">Transfer</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200"
                  >
                    {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    Execute promotions ({preview?.length || 0} students)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
/* ═══════════════ TAB 3: CARRY-FORWARDS ═══════════════ */

function CarryForwardTab({ branch }: { branch: string }) {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: carryForwards, loading } = useApi<CarryForward[]>(
    `/fees/carry-forwards/?branch_id=${branch}${statusFilter ? `&status=${statusFilter}` : ''}`
  );

  const totalPending = carryForwards
    ?.filter(cf => cf.status !== 'PAID' && cf.status !== 'WRITTEN_OFF')
    .reduce((sum, cf) => sum + Number(cf.remaining_amount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Records</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{carryForwards?.length || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Outstanding</p>
          <p className="text-3xl font-black text-rose-600 mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fully Cleared</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            {carryForwards?.filter(cf => cf.status === 'PAID').length || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'WRITTEN_OFF'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              statusFilter === s ? 'bg-slate-900 text-white' : 'bg-white border text-slate-500 hover:bg-slate-50'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="mx-auto animate-spin text-blue-500" size={24} /></div>
        ) : !carryForwards?.length ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto text-emerald-300 mb-3" size={32} />
            <p className="font-bold text-slate-900">All clear!</p>
            <p className="text-slate-400 text-sm">No carry-forward records found.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600">Student</th>
                <th className="px-6 py-4 font-bold text-slate-600">Source Year</th>
                <th className="px-6 py-4 font-bold text-slate-600">Carried</th>
                <th className="px-6 py-4 font-bold text-slate-600">Paid</th>
                <th className="px-6 py-4 font-bold text-slate-600">Remaining</th>
                <th className="px-6 py-4 font-bold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {carryForwards.map(cf => (
                <tr key={cf.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{cf.student_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{cf.admission_number}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{cf.source_year_name}</td>
                  <td className="px-6 py-4 font-bold">₹{Number(cf.carry_forward_amount).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">₹{Number(cf.paid_amount).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${Number(cf.remaining_amount) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ₹{Number(cf.remaining_amount).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${cfStatusStyles[cf.status]}`}>
                      {cf.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


/* ═══════════════ TAB 4: WRITE-OFFS ═══════════════ */

function WriteOffTab({ branch, user }: { branch: string; user: any }) {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: writeOffs, loading, refetch } = useApi<WriteOff[]>(
    `/fees/write-offs/?branch_id=${branch}${statusFilter ? `&status=${statusFilter}` : ''}`
  );
  const [processing, setProcessing] = useState<string | null>(null);

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
    let remarks = '';
    if (action === 'REJECT') {
      const input = prompt('Reason for rejection:');
      if (input === null) return;
      remarks = input;
    }
    setProcessing(id);
    try {
      await api.post(`/fees/write-offs/${id}/review/`, { action, remarks });
      toast.success(action === 'APPROVE' ? 'Write-off approved and executed.' : 'Write-off rejected.');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed.');
    } finally { setProcessing(null); }
  };

  const pendingCount = writeOffs?.filter(w => w.status === 'PENDING').length || 0;
  const totalWrittenOff = writeOffs
    ?.filter(w => w.status === 'EXECUTED')
    .reduce((sum, w) => sum + Number(w.amount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approval</p>
          <p className={`text-3xl font-black mt-1 ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Written Off</p>
          <p className="text-3xl font-black text-red-600 mt-1">₹{totalWrittenOff.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Requests</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{writeOffs?.length || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['', 'PENDING', 'APPROVED', 'EXECUTED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              statusFilter === s ? 'bg-slate-900 text-white' : 'bg-white border text-slate-500 hover:bg-slate-50'
            }`}>
            {s || 'All'}
            {s === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="mx-auto animate-spin text-blue-500" size={24} /></div>
        ) : !writeOffs?.length ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto text-emerald-300 mb-3" size={32} />
            <p className="font-bold text-slate-900">No write-offs</p>
            <p className="text-slate-400 text-sm">Write-off requests will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600">Student</th>
                <th className="px-6 py-4 font-bold text-slate-600">Amount</th>
                <th className="px-6 py-4 font-bold text-slate-600">Reason</th>
                <th className="px-6 py-4 font-bold text-slate-600">Requested By</th>
                <th className="px-6 py-4 font-bold text-slate-600">Status</th>
                <th className="px-6 py-4 font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {writeOffs.map(wo => (
                <tr key={wo.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{wo.student_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{wo.admission_number}</p>
                  </td>
                  <td className="px-6 py-4 font-black text-rose-600">₹{Number(wo.amount).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={wo.reason}>{wo.reason}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{wo.requested_by_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${woStatusStyles[wo.status]}`}>
                      {wo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {wo.status === 'PENDING' && user?.role && user.role === 'SUPER_ADMIN' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(wo.id, 'APPROVE')}
                          disabled={processing === wo.id}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                        >
                          {processing === wo.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReview(wo.id, 'REJECT')}
                          disabled={processing === wo.id}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : wo.status === 'EXECUTED' ? (
                      <span className="text-xs text-slate-400">Completed</span>
                    ) : (
                      <span className="text-xs text-slate-400">{wo.admin_remarks || '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


/* ═══════════════ REUSABLE STAT ═══════════════ */

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-black mt-1 ${highlight ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}
