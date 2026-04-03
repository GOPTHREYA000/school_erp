"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  IndianRupee,
  RefreshCw
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import FinanceChart from '@/components/dashboard/FinanceChart';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any[]>([]);
  const [feeStats, setFeeStats] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Fetch user first to determine role
      const meRes = await api.get('auth/me/');
      const userData = meRes.data.data;
      setUser(userData);

      const role = userData.role;
      const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN'].includes(role);
      const isAccountant = role === 'ACCOUNTANT';
      const canViewFinance = isAdmin || isAccountant;
      const canViewAttendance = true; // All staff can see attendance

      const promises = [];
      
      if (canViewFinance) {
        promises.push(api.get('reports/finance/summary/?days=30').then(res => setFinanceData(res.data.data)).catch(err => console.error(err)));
        promises.push(api.get('reports/fees/stats/').then(res => setFeeStats(res.data.data)).catch(err => console.error(err)));
      }
      
      if (canViewAttendance) {
        promises.push(api.get('reports/attendance/stats/').then(res => setAttendanceStats(res.data.data)).catch(err => console.error(err)));
      }

      await Promise.all(promises);
    } catch (err) {
      console.error('Dashboard Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-100 animate-pulse rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />
          <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  const studentCount = attendanceStats.reduce((acc, curr) => acc + curr.total, 0);
  const avgAttendance = attendanceStats.length > 0 
    ? Math.round(attendanceStats.reduce((acc, curr) => acc + curr.percentage, 0) / attendanceStats.length)
    : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-gray-900 tracking-tight"
          >
            Management Dashboard
          </motion.h1>
          <p className="text-gray-500 mt-1">Real-time overview of your school's performance.</p>
        </div>
        
        <button 
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Updating...' : 'Sync Data'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={studentCount || '0'} 
          icon={Users} 
          color="blue"
          trend={{ value: 12, label: 'vs last month' }}
        />
        <StatCard 
          title="Avg. Attendance" 
          value={`${avgAttendance}%`} 
          icon={Calendar} 
          color="purple"
          trend={{ value: 2, label: 'vs yesterday' }}
        />
        <StatCard 
          title="Fee Collection" 
          value={`₹${(feeStats?.total_paid || 0).toLocaleString()}`} 
          icon={TrendingUp} 
          color="green" 
          trend={{ value: 8, label: 'this week' }}
        />
        <StatCard 
          title="Outstanding" 
          value={`₹${(feeStats?.total_outstanding || 0).toLocaleString()}`} 
          icon={AlertCircle} 
          color="red"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <FinanceChart 
            title="Finance Overview (30 Days)" 
            data={financeData}
          />
        </div>
        <div className="xl:col-span-1">
          <AttendanceChart 
            title="Class Attendance" 
            data={attendanceStats}
          />
        </div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900 text-lg font-bold">Recent Fee Collected</h3>
            <button className="text-blue-600 text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {/* Minimal placeholder for list */}
            {feeStats?.total_paid > 0 ? (
              <p className="text-gray-500 text-sm italic">Fee collection records summarized in the charts above.</p>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <IndianRupee className="text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm">No recent transactions</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900 text-lg font-bold">Inquiry Pipeline</h3>
            <div className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">Live</div>
          </div>
          <div className="flex items-center justify-center h-40">
             <div className="text-center">
                <TrendingUp className="text-blue-200 w-12 h-12 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">Inquiry analytics being calibrated</p>
                <p className="text-gray-400 text-xs mt-1">Tracking conversions from Phase 1</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
