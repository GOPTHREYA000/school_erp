"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Receipt, AlertCircle, Download } from 'lucide-react';

export default function FeeReportsPage() {
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('reports/fees/defaulters/')
      .then(res => setDefaulters(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
            <Receipt size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Reports</h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
          <Download size={16} />
          Export PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">Defaulters List</h3>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold">
            <AlertCircle size={14} />
            {defaulters.length} Pending
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Outstanding</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Loading defaulters...</td></tr>
              ) : defaulters.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No pending dues found.</td></tr>
              ) : (
                defaulters.map((d, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.student_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{d.class_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{d.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-red-600 font-bold text-right">₹{d.outstanding.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{new Date(d.due_date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
