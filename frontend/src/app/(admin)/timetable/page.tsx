"use client";

import React, { useState } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import { Clock, Calendar } from 'lucide-react';

interface ClassSection { id: string; display_name: string; }
interface TimetableSlot {
  period: { name: string; start_time: string; end_time: string; type: string };
  subject: string | null;
  teacher: string | null;
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday',
};

export default function TimetablePage() {
  const { data: classes } = useApi<ClassSection[]>('/classes/');
  const [selectedClass, setSelectedClass] = useState('');
  const [timetable, setTimetable] = useState<Record<string, TimetableSlot[]> | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTimetable = async (csId: string) => {
    setSelectedClass(csId);
    setLoading(true);
    try {
      const res = await api.get(`/timetable/slots/weekly/?class_section_id=${csId}`);
      setTimetable(res.data.data?.timetable || {});
    } catch { setTimetable(null); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
        <p className="text-gray-500 text-sm mt-1">View weekly class schedule</p>
      </div>

      <div className="max-w-xs">
        <select value={selectedClass} onChange={e => loadTimetable(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
          <option value="">Select a class...</option>
          {classes?.map((c: ClassSection) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : timetable ? (
        <div className="space-y-4">
          {DAYS.map(day => {
            const slots = timetable[day] || [];
            return (
              <div key={day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">{DAY_LABELS[day]}</h3>
                </div>
                {slots.length === 0 ? (
                  <div className="px-6 py-4 text-gray-400 text-sm">No periods scheduled</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {slots.map((slot, i) => (
                      <div key={i} className={`flex items-center px-6 py-3 ${slot.period.type === 'BREAK' ? 'bg-amber-50' : ''}`}>
                        <div className="w-24 text-xs text-gray-500 font-mono">
                          {slot.period.start_time.slice(0,5)} – {slot.period.end_time.slice(0,5)}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {slot.subject || slot.period.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{slot.teacher || ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : selectedClass ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No timetable data available.</p>
        </div>
      ) : null}
    </div>
  );
}
