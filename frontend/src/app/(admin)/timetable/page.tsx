"use client";

import React, { useState } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import { Clock, Calendar, LayoutGrid, Settings2 } from 'lucide-react';
import TimetableSetupWizard from '@/components/timetable/TimetableSetupWizard';

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
  const [activeTab, setActiveTab] = useState<'view' | 'setup'>('view');

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and view class schedules</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab('view')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'view' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
              <LayoutGrid size={16} /> View Schedule
           </button>
           <button 
             onClick={() => setActiveTab('setup')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'setup' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
              <Settings2 size={16} /> Setup & Generate
           </button>
        </div>
      </div>

      {activeTab === 'view' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="max-w-xs">
            <select value={selectedClass} onChange={e => loadTimetable(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white font-medium focus:ring-2 ring-blue-500 outline-none">
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
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/50">
          <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">No timetable data available for this class.</p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/50">
          <LayoutGrid className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">Select a class section to view its weekly timetable.</p>
        </div>
      )}
      </div>
      ) : (
        <TimetableSetupWizard />
      )}
    </div>
  );
}
