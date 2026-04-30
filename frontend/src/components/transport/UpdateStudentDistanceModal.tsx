"use client";

import React, { useState, useEffect } from 'react';
import { X, Navigation, MapPin } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useBranch } from '@/components/common/BranchContext';
import { useConfirm } from '@/components/common/ConfirmProvider';

interface UpdateStudentDistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentData: any | null; // StudentTransport object
}

export default function UpdateStudentDistanceModal({ isOpen, onClose, onSuccess, studentData }: UpdateStudentDistanceModalProps) {
  const { selectedBranch } = useBranch();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    distance_km: '',
    pickup_point: ''
  });

  // Pre-fill data
  useEffect(() => {
    if (isOpen && studentData) {
      setFormData({
        distance_km: studentData.distance_km,
        pickup_point: studentData.pickup_point || ''
      });
    }
  }, [isOpen, studentData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData || !formData.distance_km) return;

    setLoading(true);
    try {
      await api.patch(`/transport/students/${studentData.id}/`, {
        distance_km: parseFloat(formData.distance_km),
        pickup_point: formData.pickup_point
      });
      onSuccess();
    } catch (err: any) {
      toast.error("Failed to update student transport details: " + (err.response?.data?.detail || JSON.stringify(err.response?.data)));
    } finally {
      setLoading(false);
    }
  };

  const handleStopService = async () => {
    const isConfirmed = await confirm({
      title: 'Stop Transport Service',
      message: 'Are you sure you want to stop transport services for this student?',
      isDestructive: true
    });
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      await api.post('/transport/opt-out/', { student_id: studentData.student });
      onSuccess();
    } catch (err: any) {
      toast.error("Failed to stop service: " + (err.response?.data?.detail || JSON.stringify(err.response?.data)));
      setLoading(false);
    }
  };

  if (!isOpen || !studentData) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
           <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Update Transport Configuration
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                {studentData.student_name} ({studentData.admission_number})
              </p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors group">
              <X size={20} className="text-slate-400 group-hover:text-slate-900" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Distance (KM)</label>
              <input 
                type="number" 
                step="0.1" 
                className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500 font-black transition-all"
                value={formData.distance_km}
                onChange={e => setFormData({ ...formData, distance_km: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pickup Point</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-slate-400" size={16} />
                <input 
                  className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500 font-medium transition-all"
                  value={formData.pickup_point}
                  onChange={e => setFormData({ ...formData, pickup_point: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={handleStopService}
              disabled={loading}
              className="px-6 py-4 rounded-2xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all"
            >
              Stop Service
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
