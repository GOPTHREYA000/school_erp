"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { ClipboardCheck, Users, Percent } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AttendanceReportsPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('reports/attendance/stats/')
      .then(res => setStats(res.data.data))
      .catch(err => toast.error('Failed to load attendance stats', { id: 'attendance-report-err' }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
          <ClipboardCheck size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full py-12 text-center text-gray-400">Loading attendance data...</div>
        ) : stats.length === 0 ? (
           <div className="col-span-full py-12 text-center text-gray-400">No shared attendance data found for this period.</div>
        ) : (
          stats.map((s, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`p-4 rounded-xl ${s.percentage > 90 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                <Percent size={20} strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider truncate">{s.class_name}</p>
                <div className="flex items-end gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-900 leading-none">{s.percentage}%</p>
                  <p className="text-gray-400 text-xs mb-0.5">Average</p>
                </div>
                <div className="mt-3 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                   <div 
                     className={`h-full transition-all duration-1000 ${s.percentage > 90 ? 'bg-green-500' : 'bg-amber-500'}`} 
                     style={{ width: `${s.percentage}%` }} 
                   />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
