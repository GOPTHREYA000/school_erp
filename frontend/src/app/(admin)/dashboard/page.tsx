"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me/')
      .then(res => setUser(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-4 rounded-xl bg-gray-200 h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Welcome back,</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{user?.first_name || 'Admin'} {user?.last_name || ''}</p>
          <div className="inline-block mt-3 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
            {user?.role || 'Guest'}
          </div>
        </div>
        
        {/* Metric Cards placeholders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Pending Fees</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹ —</p>
        </div>
      </div>
      
      {/* Empty State / Content area placeholder */}
      <div className="border-2 border-dashed border-gray-200 rounded-3xl h-96 flex items-center justify-center flex-col text-center p-8">
        <p className="text-gray-500 font-medium">Select a module from the sidebar to begin.</p>
        <p className="text-gray-400 text-sm mt-2">The system is ready for configuration.</p>
      </div>
    </div>
  );
}
