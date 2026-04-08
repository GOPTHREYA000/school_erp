"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { 
  Users, Calendar, Receipt, BookOpen, Clock, CheckCircle2, AlertCircle, 
  User, ChevronDown, FileText, PenTool, Megaphone 
} from 'lucide-react';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_section: string;
  photo_url?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  month: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
}

interface AttendanceRecord {
  date: string;
  status: string;
}

interface HomeworkItem {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  status: string;
}

export default function ParentDashboard({ user }: { user: any }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [childDropdownOpen, setChildDropdownOpen] = useState(false);

  // Load children list
  useEffect(() => {
    api.get('parent/children/')
      .then(res => {
        const data = res.data.data || res.data.results || res.data;
        const list = Array.isArray(data) ? data : [];
        setChildren(list);
        if (list.length > 0) setSelectedChild(list[0].id);
      })
      .catch(err => console.error('Failed to load children:', err))
      .finally(() => setLoading(false));
  }, []);

  // Load child-specific data when child or tab changes
  useEffect(() => {
    if (!selectedChild) return;
    
    if (activeTab === 'overview' || activeTab === 'fees') {
      api.get(`parent/children/${selectedChild}/fees/invoices/`)
        .then(res => {
          const data = res.data.data || res.data.results || res.data;
          setInvoices(Array.isArray(data) ? data : []);
        })
        .catch(() => setInvoices([]));
    }
    if (activeTab === 'overview' || activeTab === 'attendance') {
      api.get(`parent/children/${selectedChild}/attendance/`)
        .then(res => {
          const data = res.data.data || res.data.results || res.data;
          setAttendance(Array.isArray(data) ? data : []);
        })
        .catch(() => setAttendance([]));
    }
    if (activeTab === 'overview' || activeTab === 'homework') {
      api.get(`parent/children/${selectedChild}/homework/`)
        .then(res => {
          const data = res.data.data || res.data.results || res.data;
          setHomework(Array.isArray(data) ? data : []);
        })
        .catch(() => setHomework([]));
    }
  }, [selectedChild, activeTab]);

  const currentChild = children.find(c => c.id === selectedChild);
  const totalDue = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
  const attendanceRate = attendance.length > 0 
    ? Math.round((attendance.filter(a => a.status === 'PRESENT').length / attendance.length) * 100) 
    : 0;
  const pendingHw = homework.filter(h => h.status !== 'SUBMITTED').length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'fees', label: 'Fees', icon: Receipt },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'homework', label: 'Homework', icon: PenTool },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <Users className="mx-auto text-slate-200 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Children Linked</h2>
          <p className="text-gray-500 text-sm">Your account doesn&apos;t have any children linked yet. Please contact the school administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header with child selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Welcome, {user?.first_name}
          </h1>
          <p className="text-gray-500 mt-1">View your children&apos;s academic progress and fee details.</p>
        </div>

        {/* Child Selector Dropdown */}
        {children.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setChildDropdownOpen(!childDropdownOpen)}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:border-blue-300 transition-all shadow-sm"
            >
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {currentChild?.first_name?.charAt(0)}
              </div>
              <span className="font-bold text-slate-900 text-sm">{currentChild?.first_name} {currentChild?.last_name}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {childDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => { setSelectedChild(child.id); setChildDropdownOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      child.id === selectedChild ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {child.first_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{child.first_name} {child.last_name}</p>
                      <p className="text-xs text-slate-400">{child.class_section} • {child.admission_number}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Child Info Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <User className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">{currentChild?.first_name} {currentChild?.last_name}</h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {currentChild?.class_section} • Adm #{currentChild?.admission_number}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
                  <Receipt size={16} className="text-rose-600" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fee Due</span>
              </div>
              <p className="text-2xl font-black text-slate-900">₹{totalDue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{attendanceRate}%</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <PenTool size={16} className="text-amber-600" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending HW</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{pendingHw}</p>
            </div>
          </div>

          {/* Recent Invoices */}
          {invoices.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                <Receipt size={16} className="text-blue-500" />
                <h3 className="font-bold text-gray-900">Recent Fee Invoices</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {invoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between px-6 py-3.5">
                    <div>
                      <p className="font-bold text-slate-900">{inv.invoice_number}</p>
                      <p className="text-xs text-slate-400">{inv.month}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">₹{(inv.total_amount || 0).toLocaleString()}</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                        inv.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">All Fee Invoices</h3>
          </div>
          {invoices.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-900">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{inv.month}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-slate-900">₹{(inv.total_amount || 0).toLocaleString()}</p>
                    {inv.balance > 0 && (
                      <p className="text-xs text-rose-500 font-bold">Balance: ₹{inv.balance.toLocaleString()}</p>
                    )}
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                      inv.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="mx-auto text-slate-200 mb-3" size={32} />
              <p className="text-slate-400 text-sm font-medium">No invoices found</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Attendance History</h3>
            <span className="text-sm font-bold text-emerald-600">{attendanceRate}% present</span>
          </div>
          {attendance.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {attendance.slice(0, 30).map((record, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/50 transition-colors">
                  <span className="text-sm text-slate-700">{record.date}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                    record.status === 'ABSENT' ? 'bg-rose-50 text-rose-700' :
                    record.status === 'LATE' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Calendar className="mx-auto text-slate-200 mb-3" size={32} />
              <p className="text-slate-400 text-sm font-medium">No attendance records found</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'homework' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Homework Assignments</h3>
          </div>
          {homework.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {homework.map(hw => (
                <div key={hw.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-900">{hw.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{hw.subject} • Due {hw.due_date}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    hw.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {hw.status || 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <PenTool className="mx-auto text-slate-200 mb-3" size={32} />
              <p className="text-slate-400 text-sm font-medium">No homework assignments found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
