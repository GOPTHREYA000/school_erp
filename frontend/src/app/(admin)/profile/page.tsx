"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { UserCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [passData, setPassData] = useState({ old_password: '', new_password: '', confirm: '' });
  const [passStatus, setPassStatus] = useState({ loading: false, error: '', success: false });

  useEffect(() => {
    api.get('auth/me/')
      .then(res => setUser(res.data.data))
      .catch(err => toast.error('Failed to load profile profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassStatus({ loading: false, error: '', success: false });
    
    if (passData.new_password !== passData.confirm) {
      return setPassStatus(p => ({ ...p, error: "New passwords do not match." }));
    }

    setPassStatus(p => ({ ...p, loading: true }));
    try {
      await api.put('auth/password/change/', {
        old_password: passData.old_password,
        new_password: passData.new_password
      });
      setPassStatus({ loading: false, error: '', success: true });
      setPassData({ old_password: '', new_password: '', confirm: '' });
    } catch (err: any) {
      setPassStatus({ 
        loading: false, 
        error: err.response?.data?.error || 'Failed to change password.', 
        success: false 
      });
    }
  };

  if (loading) return <div className="animate-pulse bg-gray-200 h-96 rounded-2xl w-full" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold">
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h1>
            <p className="text-gray-500 mt-1">{user?.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-900 text-white">
              <UserCircle size={16} />
              {user?.role?.replace('_', ' ') || 'Unknown Role'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <KeyRound className="text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
        </div>
        
        <form onSubmit={handleChangePassword} className="p-6 space-y-5 max-w-md">
          {passStatus.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {passStatus.error}
            </div>
          )}
          {passStatus.success && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100 flex items-center gap-2">
              <CheckCircle2 size={16} /> Password updated successfully.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Current Password</label>
            <input 
              type="password" required 
              value={passData.old_password} onChange={e => setPassData({...passData, old_password: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-shadow" 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <input 
              type="password" required minLength={8}
              value={passData.new_password} onChange={e => setPassData({...passData, new_password: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-shadow" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
            <input 
              type="password" required minLength={8}
              value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-shadow" 
            />
          </div>

          <button 
            type="submit" 
            disabled={passStatus.loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {passStatus.loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
