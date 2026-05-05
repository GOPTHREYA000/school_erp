"use client";

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { CheckCircle, XCircle, Clock, ShieldCheck, AlertTriangle, Inbox } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/common/ConfirmProvider';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface ApprovalRequest {
  id: string;
  student: string;
  student_name: string;
  branch_name: string;
  standard_total: number;
  offered_total: number;
  reduction_amount: number;
  reason: string;
  status: ApprovalStatus;
  requested_by_name: string;
  reviewed_by_name: string | null;
  admin_remarks: string;
  created_at: string;
  reviewed_at: string | null;
}

export default function AdminApprovalsQueue() {
  const [activeTab, setActiveTab] = useState<ApprovalStatus>('PENDING');
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();

  const fetchApprovals = useCallback(() => {
    setLoading(true);
    api.get(`fees/approvals/?status=${activeTab}`)
      .then(res => {
        const data = res.data?.results ?? res.data?.data ?? res.data;
        setRequests(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Failed to load approval requests'))
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const handleApprove = async (id: string, studentName: string) => {
    const ok = await confirm({
      title: 'Approve Fee Reduction',
      message: `Are you sure you want to approve the fee reduction for ${studentName}? This will activate the student's enrollment.`,
      confirmText: 'Approve',
      isDestructive: false,
    });
    if (!ok) return;

    try {
      await api.post(`fees/approvals/${id}/approve/`, { remarks: '' });
      toast.success(`Fee reduction for ${studentName} approved`);
      fetchApprovals();
    } catch {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (id: string, studentName: string) => {
    const ok = await confirm({
      title: 'Reject Fee Reduction',
      message: `Are you sure you want to reject the fee reduction request for ${studentName}? The student's status will remain unchanged.`,
      confirmText: 'Reject',
      isDestructive: true,
    });
    if (!ok) return;

    try {
      await api.post(`fees/approvals/${id}/reject/`, { remarks: '' });
      toast.success(`Fee reduction for ${studentName} rejected`);
      fetchApprovals();
    } catch {
      toast.error('Failed to reject request');
    }
  };

  const tabs: { key: ApprovalStatus; label: string; icon: React.ReactNode }[] = [
    { key: 'PENDING', label: 'Pending', icon: <Clock size={14} /> },
    { key: 'APPROVED', label: 'Approved', icon: <CheckCircle size={14} /> },
    { key: 'REJECTED', label: 'Rejected', icon: <XCircle size={14} /> },
  ];

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Principal Approvals Queue</h1>
          <p className="text-gray-500 text-sm">Review pending fee waivers and concession requests.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4 pt-2" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.key === 'PENDING' && !loading && (
                  <span className="ml-1 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {requests.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-10 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Inbox size={48} strokeWidth={1.5} />
            <p className="mt-4 font-semibold text-gray-500">No {activeTab.toLowerCase()} requests</p>
            <p className="text-sm">
              {activeTab === 'PENDING'
                ? 'All fee concession requests have been reviewed.'
                : `No requests have been ${activeTab.toLowerCase()} yet.`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {requests.map(req => (
              <li key={req.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        FEE CONCESSION
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{req.student_name}</span>
                      {req.branch_name && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {req.branch_name}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        — Requested by {req.requested_by_name}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      {req.reason || (
                        <span>
                          Reduction of <span className="font-bold text-red-600">₹{Number(req.reduction_amount).toLocaleString('en-IN')}</span> requested
                          {' '}(Standard: ₹{Number(req.standard_total).toLocaleString('en-IN')} → Offered: ₹{Number(req.offered_total).toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Submitted {formatTimeAgo(req.created_at)}
                      </span>
                      {req.reviewed_by_name && (
                        <span>
                          Reviewed by <span className="font-medium text-gray-500">{req.reviewed_by_name}</span>
                        </span>
                      )}
                      {req.admin_remarks && (
                        <span className="italic">"{req.admin_remarks}"</span>
                      )}
                    </div>
                  </div>

                  {activeTab === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleReject(req.id, req.student_name)}
                        className="text-red-600 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 flex items-center text-sm font-medium transition-colors"
                      >
                        <XCircle size={16} className="mr-1.5" /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.id, req.student_name)}
                        className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg flex items-center text-sm font-medium shadow-sm transition-colors"
                      >
                        <CheckCircle size={16} className="mr-1.5" /> Approve
                      </button>
                    </div>
                  )}

                  {activeTab === 'APPROVED' && (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                      <CheckCircle size={16} /> Approved
                    </span>
                  )}

                  {activeTab === 'REJECTED' && (
                    <span className="flex items-center gap-1 text-red-600 text-sm font-medium bg-red-50 px-3 py-1.5 rounded-lg">
                      <XCircle size={16} /> Rejected
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
