import React from 'react';
import { CreditCard, BellRing, Smartphone, ShieldAlert, Zap, ArrowRight, IndianRupee, MessageSquare, CheckCircle2 } from 'lucide-react';

const FeeManagement = () => {
  const points = [
    { icon: <Zap className="w-5 h-5" />, title: "Automated Fee Collection", desc: "No more manual data entry. Auto-generate receipts instantly." },
    { icon: <CreditCard className="w-5 h-5" />, title: "Online Payments", desc: "Accept UPI, Cards, and Net Banking with zero friction." },
    { icon: <BellRing className="w-5 h-5" />, title: "Smart Reminders", desc: "Automated SMS & WhatsApp alerts before due dates." },
    { icon: <ShieldAlert className="w-5 h-5" />, title: "Defaulter Tracking", desc: "Instantly identify pending dues and auto-apply late fees." }
  ];

  return (
    <section className="py-24 bg-white overflow-hidden relative" id="fee-management">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/50 rounded-l-[100px] -z-10 transform translate-x-1/2 md:translate-x-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left: Content */}
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 font-medium text-sm mb-6 border border-green-100">
              <IndianRupee className="w-4 h-4" />
              Revenue Optimization
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0B1F3A] leading-tight mb-6">
              Never Lose Track of Your <span className="text-blue-600">Revenue</span> Again
            </h2>
            
            <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-xl">
              Transform your finance department with an intelligent fee management system that accelerates collections and completely eliminates manual reconciliation.
            </p>
            
            <div className="space-y-6 mb-10">
              {points.map((pt, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    {pt.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{pt.title}</h4>
                    <p className="text-gray-600 text-sm">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="px-8 py-4 rounded-xl bg-[#0B1F3A] hover:bg-gray-800 text-white font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group">
              See How It Works
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          {/* Right: Abstract UI / Visual */}
          <div className="w-full lg:w-1/2 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent blur-3xl rounded-full translate-y-10"></div>
            
            {/* Mockup Container */}
            <div className="relative bg-white border border-gray-100 rounded-3xl shadow-2xl p-6 lg:p-8 transform hover:-translate-y-2 transition-transform duration-500">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Fee Dashboard</h3>
                  <p className="text-sm text-gray-500">Academic Year 2026-27</p>
                </div>
                <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                  ₹
                </div>
              </div>
              
              {/* Big Metric */}
              <div className="mb-8">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Collection This Month</p>
                <div className="flex items-end gap-3">
                  <h2 className="text-4xl font-extrabold text-[#0B1F3A]">₹42,50,000</h2>
                  <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded mb-1">↑ 18%</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-sm font-bold text-gray-700">
                  <span>Collection Target</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full w-[85%] relative">
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>
              
              {/* Recent Transactions list */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Recent Transactions</h4>
                
                {[
                  { name: "Rahul Sharma", grade: "Class 10-A", amount: "₹12,000", status: "Paid", time: "2 mins ago" },
                  { name: "Priya Patel", grade: "Class 8-B", amount: "₹9,500", status: "Paid", time: "15 mins ago" },
                  { name: "Amit Kumar", grade: "Class 12-Sci", amount: "₹15,000", status: "Pending", time: "Due Today" }
                ].map((txn, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600">
                        {txn.status === 'Paid' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Smartphone className="w-5 h-5 text-orange-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{txn.name}</p>
                        <p className="text-xs text-gray-500">{txn.grade}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0B1F3A]">{txn.amount}</p>
                      <p className={`text-xs font-medium ${txn.status === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>{txn.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              
            </div>
            
            {/* Floating whatsapp alert */}
            <div className="absolute -left-8 top-1/2 p-3 bg-white rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce">
              <div className="bg-[#25D366] text-white p-2 rounded-full">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Auto-sent</p>
                <p className="text-sm font-bold">Fee Reminder WhatsApp</p>
              </div>
            </div>
            
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default FeeManagement;
