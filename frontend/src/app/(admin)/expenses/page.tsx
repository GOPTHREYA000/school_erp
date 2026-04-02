"use client";

import React, { useState } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import DateInput from '@/components/DateInput';
import { Plus, Receipt, TrendingDown } from 'lucide-react';

interface Expense {
  id: string;
  title: string;
  amount: string;
  expense_date: string;
  status: string;
  category_name: string;
  vendor_name: string | null;
  payment_mode: string;
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700', SUBMITTED: 'bg-blue-50 text-blue-700',
  APPROVED: 'bg-green-50 text-green-700', REJECTED: 'bg-red-50 text-red-700',
};

export default function ExpensesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, loading, error, refetch } = useApi<Expense[]>(`/expenses/?status=${statusFilter}`);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', amount: '', expense_date: '', payment_mode: 'CASH' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/expenses/', formData);
      setShowForm(false);
      setFormData({ title: '', amount: '', expense_date: '', payment_mode: 'CASH' });
      refetch();
    } catch { alert('Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage school expenses</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input placeholder="Title" required value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm col-span-2" />
            <input type="number" placeholder="Amount (₹)" required value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
            <DateInput
              required
              value={formData.expense_date}
              onChange={val => setFormData({...formData, expense_date: val})}
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Expense'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex gap-2 flex-wrap">
        {['', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{s || 'All'}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : data && data.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <TrendingDown className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">No expenses found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Title</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Category</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.map((e: Expense) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{e.title}</td>
                  <td className="px-6 py-4 text-gray-600">{e.category_name}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">₹{Number(e.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">{e.expense_date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[e.status]}`}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
