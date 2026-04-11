"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import Link from 'next/link';
import { Plus, Search, Users, Filter, Receipt, Building2, UserPlus, CheckCircle, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import StudentForm from '@/components/students/StudentForm';
import { useBranch } from '@/components/common/BranchContext';
import Drawer from '@/components/common/Drawer';
import FloatingActionBar from '@/components/common/FloatingActionBar';

interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  class_section: string;
  class_section_display: string;
  status: string;
  branch: string;
  branch_name: string;
  roll_number: number | null;
  proposed_fee?: number;
}

export default function StudentsPage() {
  const { selectedBranch } = useBranch();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);

  const { data: students, loading, error, refetch } = useApi<Student[]>(
    `/students/?status=${statusFilter}&search=${search}&branch_id=${selectedBranch}`
  );

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.get('auth/me/').then(res => setUser(res.data.data));
  }, []);

  const handleEnroll = async (formData: any) => {
    try {
      const payload = { ...formData };
      delete payload.branch_name;
      delete payload.class_section_display;
      // Clean integer fields — DRF IntegerField rejects '' (needs null or a number)
      if (payload.roll_number === '' || payload.roll_number === undefined) {
        payload.roll_number = null;
      }
      await api.post('/students/', payload);
      setShowDrawer(false);
      refetch();
    } catch (err: any) {
      alert("Failed to enroll: " + JSON.stringify(err.response?.data));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Directory</h1>
           <p className="text-gray-500 text-sm mt-1">Manage enrollments, academic mapping, and student lifecycle.</p>
        </div>
        <button 
          onClick={() => setShowDrawer(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 group"
        >
          <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
          Enroll Student
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
           <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
           <input 
             placeholder="Search by name or admission number..." 
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="w-full pl-11 pr-4 py-2.5 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 ring-blue-500" 
           />
        </div>
        
        <div className="flex gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
           {['ACTIVE', 'PENDING_APPROVAL', 'ARCHIVED'].map(s => (
             <button key={s} onClick={() => setStatusFilter(s)}
               className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                 statusFilter === s ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
               }`}>
               {s.replace('_', ' ')}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-slate-300">
             <Users size={64} className="mx-auto mb-4 opacity-20" />
             <p className="font-bold whitespace-nowrap uppercase tracking-widest text-xs opacity-50">Syncing Directory...</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center text-rose-500">
             <AlertTriangle size={32} className="mx-auto mb-2" />
             <p className="font-bold">Failed to load data</p>
             <p className="text-sm opacity-60">{error}</p>
          </div>
        ) : students && students.length === 0 ? (
          <div className="p-20 text-center text-slate-400">
             <Users size={64} className="mx-auto mb-4 opacity-10" />
             <p className="font-bold text-slate-900">No students found</p>
             <p className="text-sm">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-gray-100">
              <tr>
                 <th className="px-6 py-4 w-10">
                    <input type="checkbox" onChange={(e) => {
                       if (e.target.checked) setSelectedIds(students?.map(s => s.id) || []);
                       else setSelectedIds([]);
                    }} />
                 </th>
                 <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Admission</th>
                 <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Student Name</th>
                 <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Context</th>
                 <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Mapping</th>
                 <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students?.map((s) => (
                <tr key={s.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.includes(s.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-6 py-4">
                     <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                  </td>
                  <td className="px-6 py-4">
                     <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-200">
                       {s.admission_number}
                     </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <Link href={`/students/${s.id}`} className="hover:text-blue-600 transition-colors">
                      {s.first_name} {s.last_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                       <Building2 size={10} />
                       {s.branch_name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic">
                    {s.class_section_display || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                      s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 
                      s.status === 'PENDING_APPROVAL' ? 'bg-blue-50 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-over Drawer for Enrollment */}
      <Drawer 
        isOpen={showDrawer} 
        onClose={() => setShowDrawer(false)} 
        title="Student Enrollment"
      >
        <div className="bg-blue-50/50 p-4 rounded-2xl mb-6 border border-blue-100">
           <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-1">
             <ShieldCheck size={16} /> 
             Authenticated Admission
           </h4>
           <p className="text-[11px] text-blue-700 opacity-80">All data entered here automatically links to the selected branch and initiates the financial lifecycle.</p>
        </div>
        <StudentForm onSubmit={handleEnroll} onCancel={() => setShowDrawer(false)} />
      </Drawer>

      {/* Bulk Actions */}
      <FloatingActionBar 
        count={selectedIds.length}
        onClear={() => setSelectedIds([])}
        actions={[
          { label: 'Bulk ID Generation', icon: Receipt, onClick: () => alert('Generating IDs...') },
          { label: 'Archive Selected', icon: Trash2, variant: 'danger', onClick: () => alert('Mock Archive') },
        ]}
      />
    </div>
  );
}
