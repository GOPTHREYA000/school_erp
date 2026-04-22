"use client";

import React, { useState, useEffect } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import { Plus, Receipt, TrendingDown, Check, X, FileText, Search, CreditCard, Wallet, Landmark, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useBranch } from '@/components/common/BranchContext';
import Drawer from '@/components/common/Drawer';
import DateInput from '@/components/DateInput';
import FloatingActionBar from '@/components/common/FloatingActionBar';

interface Expense {
  id: string;
  title: string;
  amount: string;
  expense_date: string;
  status: string;
  category_name: string;
  vendor_name: string | null;
  payment_mode: string;
  requested_by_name: string;
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-100',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
};

const modeIcons: Record<string, any> = {
  CASH: Wallet,
  BANK_TRANSFER: Landmark,
  UPI: CreditCard,
  CHEQUE: FileText,
};

export default function ExpensesPage() {
  const { selectedBranch } = useBranch();
  const [activeTab, setActiveTab] = useState<'APPROVALS' | 'HISTORY'>('APPROVALS');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({ 
    title: '', 
    amount: '', 
    payment_mode: 'CASH',
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    branch: selectedBranch
  });

  const { data: expenses, loading, error, refetch } = useApi<Expense[]>(
    `/expenses/?status=${activeTab === 'APPROVALS' ? 'SUBMITTED' : statusFilter}&branch_id=${selectedBranch}`
  );

  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.get('auth/me/').then(res => setUser(res.data.data));
  }, []);

  const isAdmin = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  const handleUpdateStatus = async (id: string, s: string) => {
    let reason = '';
    if (s === 'REJECTED') {
      reason = prompt('Enter rejection reason:') || '';
      if (!reason) return;
    }
    try {
      await api.patch(`expenses/${id}/status/`, { status: s, reason });
      refetch();
    } catch { toast.error('Failed to update status'); }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.post('/expenses/bulk-approve/', { expense_ids: selectedIds });
      const approved = res.data?.data?.approved || 0;
      toast.success(`${approved} expense(s) approved successfully.`);
      setSelectedIds([]);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to approve expenses.');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('expenses/', { ...formData, branch: selectedBranch });
      setShowDrawer(false);
      setFormData({ title: '', amount: '', payment_mode: 'CASH', expense_date: new Date().toISOString().split('T')[0], category: '', branch: selectedBranch });
      refetch();
    } catch (err: any) { toast.error('Error: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data))); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Expense Desk</h1>
          <p className="text-gray-500 text-sm mt-1">Operational spend tracking and reimbursement approvals.</p>
        </div>
        <button onClick={() => setShowDrawer(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all group">
          <Plus size={18} className="group-hover:scale-110 transition-transform" /> 
          Log Expense
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-100 pb-px">
        <button
          onClick={() => setActiveTab('APPROVALS')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'APPROVALS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Review Requests
          {activeTab !== 'APPROVALS' && expenses?.filter(e => e.status === 'SUBMITTED').length ? (
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'HISTORY' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Expense Ledger
        </button>
      </div>

      {activeTab === 'HISTORY' && (
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            <input placeholder="Search title or vendor..." className="w-full pl-9 pr-4 py-2 border border-gray-100 rounded-xl text-xs focus:ring-2 ring-blue-500 outline-none" />
          </div>
          {['', 'APPROVED', 'REJECTED', 'DRAFT'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                statusFilter === s ? 'bg-slate-900 text-white shadow-md' : 'bg-white border text-slate-400 hover:bg-gray-50'
              }`}>{s || 'All History'}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border animate-pulse" />)}</div>
      ) : expenses && expenses.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-4 transition-transform hover:rotate-12">
            <Receipt size={32} />
          </div>
          <p className="text-gray-900 font-bold">Queue is empty</p>
          <p className="text-gray-400 text-sm mt-1">No expenses found for the current selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {expenses?.map((e: Expense) => {
             const ModeIcon = modeIcons[e.payment_mode] || Wallet;
             return (
               <div key={e.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                       {activeTab === 'APPROVALS' && isAdmin && (
                         <input 
                           type="checkbox" 
                           checked={selectedIds.includes(e.id)} 
                           onChange={() => setSelectedIds(prev => prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id])} 
                           className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                         />
                       )}
                       <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                          <ModeIcon size={20} />
                       </div>
                       <div>
                          <h3 className="font-bold text-slate-900">{e.title}</h3>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                             <span>{e.category_name}</span>
                             <span>•</span>
                             <span>{e.expense_date}</span>
                             {e.requested_by_name && (
                               <>
                                 <span>•</span>
                                 <span className="text-blue-500">By {e.requested_by_name}</span>
                               </>
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between md:justify-end">
                       <div className="text-right">
                          <p className="text-lg font-black text-slate-900">₹{Number(e.amount).toLocaleString()}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${statusStyles[e.status]}`}>
                             {e.status}
                          </span>
                       </div>

                       {isAdmin && e.status === 'SUBMITTED' && activeTab === 'APPROVALS' && (
                         <div className="flex gap-2">
                            <button onClick={() => handleUpdateStatus(e.id, 'APPROVED')}
                              className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm" title="Approve">
                              <Check size={18} />
                            </button>
                            <button onClick={() => handleUpdateStatus(e.id, 'REJECTED')}
                              className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm" title="Reject">
                              <X size={18} />
                            </button>
                         </div>
                       )}
                    </div>
                 </div>
               </div>
             );
          })}
        </div>
      )}

      {/* Slide-over Drawer for Log Expense */}
      <Drawer 
        isOpen={showDrawer} 
        onClose={() => setShowDrawer(false)} 
        title="Log New Expense"
      >
        <form onSubmit={handleAdd} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description / Title</label>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Electricity Bill - March"
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
               <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                 className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 ring-blue-500 outline-none" />
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</label>
               <select value={formData.payment_mode} onChange={e => setFormData({...formData, payment_mode: e.target.value})}
                 className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none">
                 <option value="CASH">Cash</option>
                 <option value="BANK_TRANSFER">Bank Transfer</option>
                 <option value="UPI">UPI / Digital</option>
                 <option value="CHEQUE">Cheque</option>
               </select>
             </div>
          </div>

          <DateInput 
             label="Expense Date"
             value={formData.expense_date}
             onChange={val => setFormData({...formData, expense_date: val})}
          />

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
             <AlertCircle className="text-amber-500 shrink-0" size={18} />
             <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
               Submitted expenses will go to the Branch Manager / Admin queue for approval before being finalized in the ledger.
             </p>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
            {saving ? 'Processing...' : 'Submit for Approval'}
          </button>
        </form>
      </Drawer>

      <FloatingActionBar 
        count={selectedIds.length}
        onClear={() => setSelectedIds([])}
        actions={[
          { label: 'Approve Selected', icon: Check, onClick: handleBulkApprove },
        ]}
      />
    </div>
  );
}
