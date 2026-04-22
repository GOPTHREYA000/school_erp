"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Receipt, CreditCard, Banknote, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PayAdmissionPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [admissionFee, setAdmissionFee] = useState<number>(0);
  const [tuitionPayment, setTuitionPayment] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (studentId) {
      api.get(`/students/${studentId}/`).then(res => {
        setStudent(res.data?.data ?? res.data);
        setLoading(false);
      }).catch(err => {
        toast.error('Failed to load student details');
        setLoading(false);
      });
    }
  }, [studentId]);

  const totalAmount = Number(admissionFee) + Number(tuitionPayment);

  const handleSubmit = async () => {
    if (totalAmount <= 0) {
      toast.error("Please enter a payment amount.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('payments/initial-payment/', {
        student_id: studentId,
        admission_fee: admissionFee,
        tuition_payment: tuitionPayment,
        payment_mode: paymentMode,
        reference_number: referenceNumber,
        payment_date: new Date().toISOString().split('T')[0]
      });
      
      setResult(res.data.data);
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error processing payment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading student details...</div>;
  if (!student) return <div className="p-8 text-center text-red-500">Student not found.</div>;

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-12 bg-white rounded-[3rem] border border-gray-100 shadow-2xl text-center space-y-8 animate-in zoom-in-95">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payment Successful!</h1>
          <p className="text-gray-500 font-medium">Admission for {student.first_name} has been finalized.</p>
        </div>
        
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-left space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Total Paid</span>
            <span className="font-black text-gray-900 text-lg">₹{Number(result?.total_paid).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Receipts Generated</span>
            <div className="text-right">
              {result?.receipt_codes?.map((code: string) => (
                <div key={code} className="font-mono font-bold text-blue-600">{code}</div>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={() => router.push('/students')}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
        >
          Go to Student List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-50 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Receipt size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admission Payment</h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Student: {student.first_name} {student.last_name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Finalized Academic Fee</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{Number(student.fee_stats?.total_fee || student.proposed_fee || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Payment Inputs */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Breakdown</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Admission Fee (One-time)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input 
                      type="number"
                      value={admissionFee}
                      onChange={e => setAdmissionFee(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl text-lg font-black outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Paying towards Academic Fee</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input 
                      type="number"
                      value={tuitionPayment}
                      onChange={e => setTuitionPayment(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl text-lg font-black outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic">Remaining will be balance to pay later.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMode('CASH')}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all ${
                    paymentMode === 'CASH' 
                      ? 'border-blue-600 bg-blue-50 text-blue-600' 
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <Banknote size={24} />
                  <span className="text-xs font-black uppercase tracking-widest">Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all ${
                    paymentMode === 'UPI' 
                      ? 'border-blue-600 bg-blue-50 text-blue-600' 
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <CreditCard size={24} />
                  <span className="text-xs font-black uppercase tracking-widest">UPI</span>
                </button>
              </div>

              {paymentMode === 'UPI' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <input 
                    placeholder="Transaction ID / Reference Number"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-600 transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="flex flex-col">
            <div className="flex-1 bg-slate-900 rounded-[2rem] p-10 text-white space-y-10 shadow-2xl shadow-slate-900/20">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Total Amount to Pay</p>
                <p className="text-6xl font-black tracking-tighter">₹{totalAmount.toLocaleString()}</p>
              </div>

              <div className="space-y-6 pt-10 border-t border-slate-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Admission Fee</span>
                  <span className="font-black">₹{Number(admissionFee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Initial Academic</span>
                  <span className="font-black">₹{Number(tuitionPayment).toLocaleString()}</span>
                </div>
                <div className="pt-4 flex justify-between items-center text-sm text-emerald-400">
                  <span className="font-bold uppercase tracking-widest text-[10px]">Processing via</span>
                  <span className="font-black flex items-center gap-2">
                    {paymentMode === 'CASH' ? <Banknote size={16} /> : <CreditCard size={16} />}
                    {paymentMode}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving || totalAmount <= 0}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 transition-all flex items-center justify-center gap-3"
              >
                {saving ? 'Processing...' : (
                  <>
                    Confirm & Pay <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <AlertCircle size={18} className="text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                Confirming this payment will generate official fee receipts and finalize the admission. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
