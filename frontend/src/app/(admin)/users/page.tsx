"use client";

import React, { useState, useEffect } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import { Plus, Search, Shield, UserCog, Trash2, Mail, Lock, Phone, Building2, User } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  is_active: boolean;
  branch: string | null;
  branch_name: string | null;
}

interface Branch {
  id: string;
  name: string;
}

const ROLE_RANKS: Record<string, number> = {
  SUPER_ADMIN: 0,
  SCHOOL_ADMIN: 1,
  BRANCH_ADMIN: 2,
  ACCOUNTANT: 3,
  TEACHER: 3,
  PARENT: 4,
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SCHOOL_ADMIN: 'School Admin',
  BRANCH_ADMIN: 'Branch Admin',
  ACCOUNTANT: 'Accountant',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
};

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const { data, loading, error, refetch } = useApi<User[]>('/users/');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', password: '', role: 'TEACHER', phone: '', branch: ''
  });
  const { data: branches } = useApi<Branch[]>('/tenants/branches/');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me/')
      .then(res => setCurrentUser(res.data.data))
      .catch(console.error);
  }, []);

  const myRank = currentUser ? ROLE_RANKS[currentUser.role] : 99;
  const allowedRolesToCreate = Object.keys(ROLE_RANKS).filter(r => {
    return ROLE_RANKS[r] > myRank || currentUser?.role === 'SUPER_ADMIN';
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users/', formData);
      setShowForm(false);
      setFormData({ first_name: '', last_name: '', email: '', password: '', role: 'TEACHER', phone: '', branch: '' });
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userToDelete: User) => {
    const isSchoolAdmin = userToDelete.role === 'SCHOOL_ADMIN';
    
    let warningMsg = `Are you sure you want to delete ${userToDelete.first_name} ${userToDelete.last_name}?`;
    
    if (isSchoolAdmin) {
      warningMsg = `DANGER: You are about to delete a School Admin (${userToDelete.first_name} ${userToDelete.last_name}).\n\nThis will completely wipe out their ENTIRE school, including all their branch admins, teachers, students, and records.\n\nType 'DELETE' to confirm.`;
      
      const confirmText = window.prompt(warningMsg);
      if (confirmText !== 'DELETE') return;
    } else {
      if (!window.confirm(warningMsg)) return;
    }

    try {
      await api.delete(`/users/${userToDelete.id}/`);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error deleting user. You may not have permission.');
    }
  };

  const filteredUsers = data?.filter(u => 
    u.first_name.toLowerCase().includes(search.toLowerCase()) || 
    u.last_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-gray-500 text-sm mt-1">Manage platform access based on your permission level</p>
        </div>
        {allowedRolesToCreate.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} /> Add User
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <UserCog size={18} />
              </div>
              New User Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
            {/* First Name */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <User size={18} />
              </div>
              <input 
                placeholder="First Name" 
                required 
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
              />
            </div>
            
            {/* Last Name */}
            <input 
              placeholder="Last Name" 
              required 
              value={formData.last_name}
              onChange={e => setFormData({...formData, last_name: e.target.value})}
              className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
            />
            
            {/* Email */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                placeholder="Email Address" 
                required 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                placeholder="Temporary Password" 
                required 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
              />
            </div>

            {/* Role */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Shield size={18} />
              </div>
              <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
              >
                {allowedRolesToCreate.map(role => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
            </div>

            {/* Branch Selector (Conditional) */}
            {!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(formData.role) && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Building2 size={18} />
                </div>
                <select 
                  required
                  value={formData.branch} 
                  onChange={e => setFormData({...formData, branch: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                >
                  <option value="">Select Branch</option>
                  {branches?.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Phone (Optional) */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Phone size={18} />
              </div>
              <input 
                placeholder="Phone Number (Optional)" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-50">
            <button 
              type="submit" 
              disabled={saving}
              className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all transform active:scale-95"
            >
              {saving ? 'Creating...' : 'Create User'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="p-6 text-red-600 bg-red-50">{error}</div>
        ) : filteredUsers?.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Name</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Email</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Role</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Branch</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers?.map(u => {
                const canDelete = currentUser 
                  ? (ROLE_RANKS[u.role] > ROLE_RANKS[currentUser.role] || currentUser.role === 'SUPER_ADMIN') 
                    && u.id !== currentUser.id 
                  : false;

                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{u.first_name} {u.last_name}</td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium 
                        ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 
                          u.role === 'SCHOOL_ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        <Shield size={12} />
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.branch_name ? (
                        <span className="text-gray-700 font-medium flex items-center gap-1.5">
                          <Building2 size={14} className="text-gray-400" />
                          {u.branch_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Global / Group</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? 
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span> :
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Inactive
                        </span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(u)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded bg-white hover:bg-red-50 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
