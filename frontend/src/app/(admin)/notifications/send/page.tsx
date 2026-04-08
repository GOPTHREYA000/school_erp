"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { Send, Megaphone, Users, Type, AlignLeft } from 'lucide-react';
import { useAuth } from '@/components/common/AuthProvider';

export default function SendNotificationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_role: 'PARENT',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('notifications/dispatch/', formData);
      toast.success(res.data.detail || 'Notifications sent successfully');
      setFormData({ ...formData, title: '', message: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <Megaphone className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Push Notifications</h1>
          <p className="text-slate-500 font-medium mt-1">
            Send instant in-app alerts to users in your branch or school.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-slate-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Audience */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              Target Audience
            </label>
            <select
              value={formData.target_role}
              onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="PARENT">Parents</option>
              <option value="TEACHER">Teachers</option>
              <option value="ACCOUNTANT">Accountants</option>
              {user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' ? (
                <option value="BRANCH_ADMIN">Branch Admins</option>
              ) : null}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Type size={16} className="text-slate-400" />
              Notification Title
            </label>
            <input
              type="text"
              placeholder="e.g., Tomorrow's Holiday, Important Notice..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <AlignLeft size={16} className="text-slate-400" />
              Message Content
            </label>
            <textarea
              placeholder="Type your notification message here..."
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              required
            />
            <p className="text-xs text-slate-400 font-medium">Keep it short and concise for best readability on mobile devices.</p>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:-cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
