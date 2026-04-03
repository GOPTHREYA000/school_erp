"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import Link from 'next/link';
import { Plus, Search, Users, Filter, Receipt, Building2 } from 'lucide-react';
import StudentForm from '@/components/students/StudentForm';

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
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [branchFilter, setBranchFilter] = useState('');
  const { data: students, loading, error, refetch } = useApi<Student[]>(
    `/students/?status=${statusFilter}&search=${search}&branch_id=${branchFilter}`
  );

  const [user, setUser] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('auth/me/').then(res => {
      const u = res.data.data;
      setUser(u);
      if (u.role === 'SUPER_ADMIN') {
        api.get('tenants/').then(r => setTenants(r.data));
      }
    });

    api.get('/tenants/branches/').then(res => {
      const arr = res.data?.data ?? res.data;
      setBranches(Array.isArray(arr) ? arr : []);
    });
  }, []);

  const handleEnroll = async (formData: any) => {
    try {
      const payload = { ...formData };
      if (payload.roll_number === '') payload.roll_number = null;
      if (payload.admission_number === '') delete payload.admission_number;
      
      const res = await api.post('students/', payload);
      const student = res.data;
      router.push(`/students/${student.id}/pay-admission`);
      setShowForm(false);
      refetch();
    } catch (err: any) {
      console.error('Enrollment Error:', err.response?.data);
      const errorData = err.response?.data;
      let errorMsg = 'Error creating student';
      if (errorData) {
        if (typeof errorData === 'string') errorMsg = errorData;
        else if (errorData.detail) errorMsg = errorData.detail;
        else {
          errorMsg = Object.entries(errorData)
            .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('\n');
        }
      }
      alert(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">Manage enrolled students</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} /> Add Student
        </button>
      </div>

      {showForm && (
        <StudentForm 
          title="Enroll New Student"
          submitLabel="Complete Enrollment"
          onSubmit={handleEnroll}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            placeholder="Search by name or admission number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        
        {/* Branch Filter (Hidden if Branch Admin) */}
        {user?.role === 'SCHOOL_ADMIN' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl">
            <Building2 size={14} className="text-gray-400" />
            <select 
              value={branchFilter} 
              onChange={e => setBranchFilter(e.target.value)}
              className="text-sm font-medium bg-transparent focus:outline-none pr-2"
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl">
          <Filter size={14} className="text-gray-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm font-medium bg-transparent focus:outline-none pr-2">
            <option value="ACTIVE">Active Students</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={refetch} className="px-4 py-1.5 bg-red-100 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">Retry</button>
        </div>
      ) : students && students.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center space-y-4 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Users size={40} />
          </div>
          <div>
            <p className="text-gray-900 font-semibold text-lg">No students enrolled</p>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">Start by clicking "Add Student" to enroll your first student in the system.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-600 font-medium text-sm hover:underline"
          >
            Enroll a student now
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                   <th className="px-6 py-4 font-semibold text-gray-600">Admission No.</th>
                   <th className="px-6 py-4 font-semibold text-gray-600">Student Name</th>
                   <th className="px-6 py-4 font-semibold text-gray-600">Branch</th>
                   <th className="px-6 py-4 font-semibold text-gray-600">Class & Section</th>
                   <th className="px-6 py-4 font-semibold text-gray-600">Agreed Fee</th>
                   <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {students?.map((s: Student) => (
                   <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-6 py-4">
                       <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md group-hover:bg-white transition-colors">
                         {s.admission_number}
                       </span>
                     </td>
                     <td className="px-6 py-4 font-semibold text-gray-900">
                       <Link href={`/students/${s.id}`} className="hover:text-blue-600 transition-colors">
                         {s.first_name} {s.last_name}
                       </Link>
                     </td>
                     <td className="px-6 py-4 text-gray-600 uppercase text-[10px] font-bold tracking-tight">
                       {s.branch_name || '-'}
                     </td>
                     <td className="px-6 py-4 text-gray-500 italic">
                       {s.class_section_display || 'Not Assigned'}
                     </td>
                     <td className="px-6 py-4 text-right md:text-left">
                       {(s.proposed_fee !== undefined && s.proposed_fee !== null && s.proposed_fee > 0) ? (
                         <span className="font-black text-gray-900">₹{Number(s.proposed_fee).toLocaleString()}</span>
                       ) : s.status === 'PENDING_APPROVAL' ? (
                         <span className="text-blue-500 text-[10px] font-bold uppercase italic">Awaiting Approval</span>
                       ) : (
                         <span className="text-gray-400">-</span>
                       )}
                     </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 
                        s.status === 'PENDING_APPROVAL' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          s.status === 'ACTIVE' ? 'bg-emerald-500' : 
                          s.status === 'PENDING_APPROVAL' ? 'bg-blue-500' :
                          'bg-slate-400'
                        }`} />
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
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
