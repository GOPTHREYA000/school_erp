"use client";

import React, { useState } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import { Plus, BookOpen } from 'lucide-react';

interface ClassSection {
  id: string;
  grade: string;
  section: string;
  display_name: string;
  class_teacher: string | null;
  max_capacity: number;
  is_active: boolean;
  student_count: number;
}

export default function ClassesPage() {
  const { data, loading, error, refetch } = useApi<ClassSection[]>('/classes/');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ grade: '1', section: 'A', max_capacity: 40 });
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('classes/', formData);
      setShowForm(false);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating class');
    } finally {
      setSaving(false);
    }
  };

  const grades = [
    'NURSERY','LKG','UKG','1','2','3','4','5','6','7','8','9','10',
    '11_SCIENCE','11_COMMERCE','11_ARTS','12_SCIENCE','12_COMMERCE','12_ARTS'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes & Sections</h1>
          <p className="text-gray-500 text-sm mt-1">Manage class sections for the academic year</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
          <Plus size={16} /> Add Class
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input placeholder="Section (A, B...)" value={formData.section}
              onChange={e => setFormData({...formData, section: e.target.value})}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
            <input type="number" placeholder="Max Capacity" value={formData.max_capacity}
              onChange={e => setFormData({...formData, max_capacity: Number(e.target.value)})}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Class'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>
      ) : data && data.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">No classes created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.map((c: ClassSection) => (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{c.display_name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{c.student_count} / {c.max_capacity} students</span>
              </div>
              <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((c.student_count / c.max_capacity) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
