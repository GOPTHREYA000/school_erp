"use client";

import React, { useState } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import { Receipt, AlertTriangle, Plus, DollarSign } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  student: string;
  student_name: string;
  month: string;
  net_amount: string;
  paid_amount: string;
  outstanding_amount: string;
  due_date: string;
  status: string;
}

interface FeeApprovalRequest {
  id: string;
  student_name: string;
  admission_number: string;
  standard_total: string;
  offered_total: string;
  reason: string;
  status: string;
  requested_by_name: string;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700',
  PAID: 'bg-green-50 text-green-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  WAIVED: 'bg-purple-50 text-purple-700',
};

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'APPROVALS'>('INVOICES');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: invoices, loading: invLoading, error: invError, refetch: refetchInvoices } = useApi<Invoice[]>(
    `/fees/invoices/?status=${statusFilter}`
  );

  const { data: approvals, loading: appLoading, refetch: refetchApprovals } = useApi<FeeApprovalRequest[]>(
    '/fees/approvals/?status=PENDING'
  );

  const [showPayForm, setShowPayForm] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('CASH');
  const [paying, setPaying] = useState(false);
  const [processingApproval, setProcessingApproval] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setProcessingApproval(id);
    try {
      await api.post(`/fees/approvals/${id}/approve/`);
      refetchApprovals();
      refetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Approval failed');
    } finally { setProcessingApproval(null); }
  };

  const handleReject = async (id: string) => {
    const remarks = prompt("Reason for rejection:");
    if (remarks === null) return;
    
    setProcessingApproval(id);
    try {
      await api.post(`/fees/approvals/${id}/reject/`, { remarks });
      refetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Rejection failed');
    } finally { setProcessingApproval(null); }
  };

  const handlePay = async (invoiceId: string) => {
    setPaying(true);
    try {
      await api.post('/payments/offline/', {
        invoice_id: invoiceId,
        amount: payAmount,
        payment_mode: payMode,
        payment_date: new Date().toISOString().split('T')[0],
      });
      setShowPayForm(null);
      setPayAmount('');
      refetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Payment failed');
    } finally { setPaying(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage student fee invoices, payments, and approvals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 pb-px">
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'INVOICES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Fee Invoices
        </button>
        <button
          onClick={() => setActiveTab('APPROVALS')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'APPROVALS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Fee Approvals
          {approvals && approvals.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px]">
              {approvals.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'INVOICES' ? (
        <>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
        {['', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Invoices */}
      {invLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : invError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">{invError}</div>
      ) : invoices && invoices.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <Receipt className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">No invoices found</p>
          <p className="text-gray-400 text-sm mt-1">Generate invoices from the Fee Structure settings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices?.map((inv: Invoice) => (
            <div key={inv.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{inv.invoice_number}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[inv.status] || 'bg-gray-100'}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{inv.student_name} • Due: {inv.due_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">₹{Number(inv.net_amount).toLocaleString()}</p>
                  {Number(inv.outstanding_amount) > 0 && (
                    <p className="text-sm text-red-600 font-medium">₹{Number(inv.outstanding_amount).toLocaleString()} due</p>
                  )}
                </div>
              </div>

              {/* Pay button */}
              {['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status) && showPayForm !== inv.id && (
                <button onClick={() => { setShowPayForm(inv.id); setPayAmount(inv.outstanding_amount); }}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                  <DollarSign size={14} /> Record Payment
                </button>
              )}

              {/* Payment Form */}
              {showPayForm === inv.id && (
                <div className="mt-3 flex items-end gap-3 bg-gray-50 p-4 rounded-xl">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Amount</label>
                    <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Mode</label>
                    <select value={payMode} onChange={e => setPayMode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-1">
                      {['CASH','CHEQUE','NEFT','UPI'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <button onClick={() => handlePay(inv.id)} disabled={paying}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    {paying ? '...' : 'Pay'}
                  </button>
                  <button onClick={() => setShowPayForm(null)}
                    className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        </>
      ) : (
        /* Approvals Tab */
        <div className="space-y-4">
          {appLoading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : approvals && approvals.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-200 mb-4">
                <Receipt size={32} />
              </div>
              <p className="text-gray-900 font-bold">No pending fee approvals</p>
              <p className="text-gray-500 text-sm mt-1">New enrollment reductions will appear here for review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {approvals?.map((req: FeeApprovalRequest) => (
                <div key={req.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-lg">{req.student_name}</h3>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{req.admission_number}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>Requested by <span className="font-semibold text-gray-700">{req.requested_by_name}</span></span>
                        <span>•</span>
                        <span>{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Reason for reduction</p>
                        <p className="text-sm text-blue-900 italic">"{req.reason || 'No reason provided'}"</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 min-w-[200px]">
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <span className="text-xs text-gray-400 line-through">₹{Number(req.standard_total).toLocaleString()}</span>
                          <span className="text-xl font-black text-gray-900">₹{Number(req.offered_total).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                          Saved ₹{(Number(req.standard_total) - Number(req.offered_total)).toLocaleString()} ({(100 - (Number(req.offered_total) / Number(req.standard_total) * 100)).toFixed(1)}%)
                        </p>
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={processingApproval === req.id}
                          className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm shadow-blue-100"
                        >
                          {processingApproval === req.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={processingApproval === req.id}
                          className="flex-1 md:flex-none bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 disabled:opacity-50 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
