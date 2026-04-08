"use client";

import React, { useState, useEffect } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import DateInput from '@/components/DateInput';
import { CheckCircle, XCircle, Clock, Users, Zap, Check, ShieldCheck, AlertCircle, Calendar } from 'lucide-react';
import { useBranch } from '@/components/common/BranchContext';

interface Student { id: string; first_name: string; last_name: string; admission_no: string; }
interface ClassSection { id: string; display_name: string; }

export default function AttendancePage() {
  const { selectedBranch } = useBranch();
  const { data: classes } = useApi<ClassSection[]>(`/classes/?teacher_only=true&branch_id=${selectedBranch}`);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, string>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ saved: number } | null>(null);

  // Auto-select if only one class is available (typical for teachers)
  useEffect(() => {
    if (classes && classes.length === 1 && !selectedClass) {
      loadStudents(classes[0].id);
    }
  }, [classes]);

  const loadStudents = async (csId: string) => {
    setSelectedClass(csId);
    setLoadingStudents(true);
    setResult(null);
    try {
      const res = await api.get(`/classes/${csId}/students/`);
      const s = res.data.data || res.data;
      setStudents(s);
      const defaults: Record<string, string> = {};
      s.forEach((st: Student) => { defaults[st.id] = 'PRESENT'; });
      setRecords(defaults);
    } catch { setStudents([]); }
    finally { setLoadingStudents(false); }
  };

  const markAll = (status: string) => {
    const newRecords: Record<string, string> = {};
    students.forEach(st => { newRecords[st.id] = status; });
    setRecords(newRecords);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        class_section_id: selectedClass,
        date,
        records: Object.entries(records).map(([student_id, status]) => ({ student_id, status })),
      };
      const res = await api.post('attendance/bulk/', payload);
      setResult(res.data.data);
      // Success animation/feedback would go here
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error submitting attendance');
    } finally { setSubmitting(false); }
  };

  const statusColors: Record<string, string> = {
    PRESENT: 'bg-emerald-500', 
    ABSENT: 'bg-rose-500', 
    LATE: 'bg-amber-500', 
    HALF_DAY: 'bg-slate-500',
  };

  const attendanceStats = {
    total: students.length,
    present: Object.values(records).filter(r => r === 'PRESENT').length,
    absent: Object.values(records).filter(r => r === 'ABSENT').length,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
             <Calendar size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest">Morning Register</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Daily Attendance</h1>
          <p className="text-gray-500 text-sm">Efficient classroom management and record-keeping.</p>
        </div>

        <div className="flex gap-4 items-end bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex-1 min-w-[160px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Select Class</label>
            <select value={selectedClass} onChange={e => loadStudents(e.target.value)}
              className="w-full px-4 py-2 border-none bg-slate-50 rounded-xl text-sm font-bold focus:ring-2 ring-blue-500 transition-all">
              <option value="">Select class...</option>
              {classes?.map((c: ClassSection) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
            </select>
          </div>
          <div className="w-[140px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Session Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2 border-none bg-slate-50 rounded-xl text-sm font-bold focus:ring-2 ring-blue-500" />
          </div>
        </div>
      </div>

      {students.length > 0 && !loadingStudents && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total Students</p>
                  <p className="text-xl font-black text-slate-900">{attendanceStats.total}</p>
               </div>
               <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                  <Users size={18} />
               </div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-tighter">Marked Present</p>
                  <p className="text-xl font-black text-emerald-700">{attendanceStats.present}</p>
               </div>
               <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <Check size={18} />
               </div>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-rose-600/70 uppercase tracking-tighter">Marked Absent</p>
                  <p className="text-xl font-black text-rose-700">{attendanceStats.absent}</p>
               </div>
               <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                  <AlertCircle size={18} />
               </div>
            </div>
        </div>
      )}

      {loadingStudents ? (
        <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-white border rounded-2xl animate-pulse" />)}</div>
      ) : students.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-200">
              <div className="flex items-center gap-2">
                 <Zap size={16} className="text-amber-400" />
                 <span className="text-sm font-bold">Quick Toggles</span>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => markAll('PRESENT')} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-xs font-black uppercase tracking-widest rounded-xl transition-all">All Present</button>
                 <button onClick={() => markAll('ABSENT')} className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-xs font-black uppercase tracking-widest rounded-xl transition-all">All Absent</button>
              </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {students.map((s: Student) => (
                <div key={s.id} className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{s.first_name} {s.last_name}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">adm: {s.admission_no}</span>
                  </div>
                  
                  <div className="flex gap-1.5 mt-3 md:mt-0">
                    {['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'].map(st => (
                      <button 
                        key={st} 
                        onClick={() => setRecords({...records, [s.id]: st})}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                          records[s.id] === st
                            ? `${statusColors[st]} text-white shadow-lg shadow-${statusColors[st].replace('bg-', '')}/40 scale-105`
                            : 'bg-white border border-gray-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-gray-100 bg-slate-50/50">
              <button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {submitting ? 'Authenticating & Saving...' : `Finalize & Submit (${students.length} Records)`}
              </button>
            </div>
          </div>
        </div>
      ) : selectedClass ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
          <Zap className="mx-auto text-slate-100 mb-4 animate-bounce" size={48} />
          <p className="text-slate-900 font-bold">Class directory not synced.</p>
          <p className="text-slate-400 text-sm mt-1">Check class assignments or try another group.</p>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-16 text-center flex flex-col items-center">
           <Zap className="text-blue-500 mb-4" size={32} />
           <p className="text-blue-900 font-bold uppercase tracking-widest text-xs">Ready for Morning Register</p>
           <p className="text-blue-600/70 text-sm mt-1 max-w-xs">Select your class section above to begin marking the daily attendance.</p>
        </div>
      )}

      {result && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 z-50">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
             <Check size={16} />
          </div>
          <div>
             <p className="text-sm font-black uppercase tracking-widest">Attendance Synchronized</p>
             <p className="text-xs text-slate-400 font-bold">Successfully logged {result.saved} student records.</p>
          </div>
          <button onClick={() => setResult(null)} className="ml-4 p-2 hover:bg-slate-800 rounded-xl">
             <XCircle size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
