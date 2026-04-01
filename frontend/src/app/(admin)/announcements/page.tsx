"use client";

import React, { useState } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import { Plus, Megaphone, Eye, Send } from 'lucide-react';

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  target_audience: string;
  is_published: boolean;
  published_at: string | null;
  read_count: number;
}

export default function AnnouncementsPage() {
  const { data, loading, refetch } = useApi<AnnouncementItem[]>('/announcements/');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '', target_audience: 'ALL' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/announcements/', formData);
      setShowForm(false); refetch();
    } catch { alert('Error'); }
    finally { setSaving(false); }
  };

  const handlePublish = async (id: string) => {
    await api.patch(`/announcements/${id}/publish/`);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Broadcast messages to parents, teachers, or all</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <input placeholder="Title" required value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
          <textarea placeholder="Announcement body..." required value={formData.body}
            onChange={e => setFormData({...formData, body: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm h-28" />
          <select value={formData.target_audience} onChange={e => setFormData({...formData, target_audience: e.target.value})}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
            <option value="ALL">All</option><option value="PARENTS">Parents</option><option value="TEACHERS">Teachers</option>
          </select>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">{saving ? 'Creating...' : 'Create Draft'}</button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : data && data.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <Megaphone className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.map((a: AnnouncementItem) => (
            <div key={a.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      a.is_published ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>{a.is_published ? 'Published' : 'Draft'}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{a.target_audience}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{a.body.slice(0, 150)}...</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    {a.published_at && <span>Published: {new Date(a.published_at).toLocaleDateString()}</span>}
                    <span className="flex items-center gap-1"><Eye size={12} /> {a.read_count} reads</span>
                  </div>
                </div>
                {!a.is_published && (
                  <button onClick={() => handlePublish(a.id)}
                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700">
                    <Send size={12} /> Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
