"use client";

import React, { useState } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';

interface Student { id: string; first_name: string; last_name: string; }
interface ClassSection { id: string; display_name: string; }

export default function AttendancePage() {
  const { data: classes } = useApi<ClassSection[]>('/classes/');
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, string>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ saved: number } | null>(null);

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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        class_section_id: selectedClass,
        date,
        records: Object.entries(records).map(([student_id, status]) => ({ student_id, status })),
      };
      const res = await api.post('/attendance/bulk/', payload);
      setResult(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error submitting attendance');
    } finally { setSubmitting(false); }
  };

  const statusColors: Record<string, string> = {
    PRESENT: 'bg-green-500', ABSENT: 'bg-red-500', LATE: 'bg-yellow-500', HALF_DAY: 'bg-orange-500',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Mark daily attendance for your class</p>
      </div>

      {/* Selector */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select value={selectedClass} onChange={e => loadStudents(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
            <option value="">Select a class...</option>
            {classes?.map((c: ClassSection) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl font-medium">
          ✅ Attendance saved for {result.saved} students!
        </div>
      )}

      {/* Student Grid */}
      {loadingStudents ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : students.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {students.map((s: Student) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-3">
                <span className="font-medium text-gray-900 text-sm">{s.first_name} {s.last_name}</span>
                <div className="flex gap-2">
                  {['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'].map(st => (
                    <button key={st} onClick={() => setRecords({...records, [s.id]: st})}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        records[s.id] === st
                          ? `${statusColors[st]} text-white shadow-sm`
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {st === 'HALF_DAY' ? '½' : st.charAt(0)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : `Submit Attendance (${students.length} students)`}
            </button>
          </div>
        </div>
      ) : selectedClass ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No students in this class section.</p>
        </div>
      ) : null}
    </div>
  );
}
