"use client";

import React, { useState, useEffect } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { Plus, Receipt, Check, X, FileText, Search, CreditCard, Wallet, Landmark } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useBranch } from '@/components/common/BranchContext';
import Modal from '@/components/common/Modal';
import FloatingActionBar from '@/components/common/FloatingActionBar';

interface Expense {
  id: string;
  voucher_number: number | null;
  title: string;
  amount: string;
  expense_date: string;
  status: string;
  category_name: string;
  vendor_display: string | null;
  payment_mode: string;
  submitted_by_name: string | null;
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
  const [activeTab, setActiveTab] = useState<'APPROVALS' | 'HISTORY'>('HISTORY');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({ 
    title: '', 
    amount: '', 
    payment_mode: 'CASH',
    expense_date: new Date().toISOString().split('T')[0],
    category_name: '',
    vendor_name: '',
    voucher_number: '',
  });

  const branchParam = selectedBranch && selectedBranch !== 'all' ? `branch_id=${selectedBranch}` : '';

  const { data: expenses, loading, error, refetch } = useApi<Expense[]>(
    `/expenses/?status=${activeTab === 'APPROVALS' ? 'SUBMITTED' : statusFilter}${branchParam ? `&${branchParam}` : ''}`
  );
  const { data: categoriesData } = useApi<any>(`/expenses/categories/${branchParam ? `?${branchParam}` : ''}`);
  const { data: vendorsData } = useApi<any>(`/vendors/${branchParam ? `?${branchParam}` : ''}`);
  
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const vendors = Array.isArray(vendorsData) ? vendorsData : [];

  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    api.get('auth/me/').then(res => {
      const u = res.data.data;
      setUser(u);
      if (u?.role === 'TEACHER') router.replace('/teacher-dashboard');
    });
  }, []);

  const isAdmin = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user?.role);
  const canLogExpense = user?.role === 'ACCOUNTANT';

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

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomVendor, setIsCustomVendor] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_name.trim()) { toast.error('Expense type is required'); return; }
    setSaving(true);
    try {
      await api.post('expenses/', formData);
      setShowDrawer(false);
      setFormData({ title: '', amount: '', payment_mode: 'CASH', expense_date: new Date().toISOString().split('T')[0], category_name: '', vendor_name: '', voucher_number: '' });
      setIsCustomCategory(false);
      setIsCustomVendor(false);
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
        {canLogExpense && (
          <button onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-all group">
            <Plus size={18} className="group-hover:scale-110 transition-transform" /> 
            Log Expense
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-100 pb-px">
        {isAdmin && (
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
        )}
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  {activeTab === 'APPROVALS' && isAdmin && <th className="px-5 py-4 w-12"></th>}
                  <th className="px-5 py-4 whitespace-nowrap">Voucher No#</th>
                  <th className="px-5 py-4 whitespace-nowrap">Expense Type</th>
                  <th className="px-5 py-4 min-w-[200px]">Description</th>
                  <th className="px-5 py-4 whitespace-nowrap">Vendor Name</th>
                  <th className="px-5 py-4 whitespace-nowrap">Payment Date</th>
                  <th className="px-5 py-4 whitespace-nowrap">Payment Mode</th>
                  <th className="px-5 py-4 whitespace-nowrap text-right">Amount</th>
                  {isAdmin && activeTab === 'APPROVALS' && <th className="px-5 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses?.map((e: Expense) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                    {activeTab === 'APPROVALS' && isAdmin && (
                      <td className="px-5 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(e.id)} 
                          onChange={() => setSelectedIds(prev => prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id])} 
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                      {e.voucher_number || '-'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">
                        {e.category_name}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-800 font-medium">
                      {e.title || '-'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {e.vendor_display || '-'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(e.expense_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {e.payment_mode === 'CASH' ? 'Cash' : 'Online'}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-black text-slate-900">
                      {Number(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    {isAdmin && e.status === 'SUBMITTED' && activeTab === 'APPROVALS' && (
                      <td className="px-5 py-4">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleUpdateStatus(e.id, 'APPROVED')}
                             className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all" title="Approve">
                             <Check size={16} />
                           </button>
                           <button onClick={() => handleUpdateStatus(e.id, 'REJECTED')}
                             className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-all" title="Reject">
                             <X size={16} />
                           </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Log Expense */}
      <Modal 
        isOpen={showDrawer} 
        onClose={() => setShowDrawer(false)} 
        title="Log New Expense"
        maxWidth="md"
      >
        <div className="p-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Voucher No.</label>
                <input required type="number" value={formData.voucher_number || ''} onChange={e => setFormData({...formData, voucher_number: e.target.value})}
                  placeholder="e.g. 101"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description / Title</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Electricity Bill"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-center">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Date</label>
                <div className="text-sm font-semibold text-slate-700">
                  Today, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-center">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expense Type</label>
                <input
                  required
                  value={formData.category_name}
                  onChange={e => setFormData({...formData, category_name: e.target.value})}
                  placeholder="e.g. Electricity Bill"
                  className="w-full text-sm font-medium text-slate-700 outline-none bg-transparent placeholder:text-slate-300" />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-center">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vendor Name <span className="text-slate-300 font-normal normal-case">(optional)</span></label>
              <input
                value={formData.vendor_name}
                onChange={e => setFormData({...formData, vendor_name: e.target.value})}
                placeholder="e.g. ABC Suppliers"
                className="w-full text-sm font-medium text-slate-700 outline-none bg-transparent placeholder:text-slate-300" />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-center relative">
                 <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount (₹)</label>
                 <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                   placeholder="0.00"
                   className="w-full text-lg font-bold text-slate-700 outline-none bg-transparent" />
               </div>
               <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-center">
                 <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Mode</label>
                 <select required value={formData.payment_mode} onChange={e => setFormData({...formData, payment_mode: e.target.value})}
                   className="w-full text-sm font-medium text-slate-700 outline-none bg-transparent appearance-none">
                   <option value="CASH">Cash</option>
                   <option value="BANK_TRANSFER">Bank Transfer</option>
                   <option value="UPI">UPI / Digital</option>
                   <option value="CHEQUE">Cheque</option>
                 </select>
               </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-slate-900 hover:bg-black text-white py-3.5 mt-2 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50">
              {saving ? 'Processing...' : 'SUBMIT'}
            </button>
          </form>
        </div>
      </Modal>

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
