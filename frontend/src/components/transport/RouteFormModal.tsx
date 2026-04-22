"use client";

import React, { useState } from 'react';
import { X, Bus, MapPin, Navigation, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useBranch } from '@/components/common/BranchContext';

interface RouteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RouteFormModal({ isOpen, onClose, onSuccess }: RouteFormModalProps) {
  const { selectedBranch } = useBranch();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    start_point: '',
    end_point: '',
    distance_km: '',
    stops: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.distance_km || !selectedBranch) return;

    setLoading(true);
    try {
      await api.post('/transport/routes/', {
        ...formData,
        branch_id: selectedBranch,
        distance_km: parseFloat(formData.distance_km),
        is_active: true
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({ name: '', start_point: '', end_point: '', distance_km: '', stops: '' });
        onSuccess();
      }, 1500);
    } catch (err: any) {
      toast.error("Failed to create route: " + (err.response?.data?.detail || JSON.stringify(err.response?.data)));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
           <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Bus className="text-blue-600" size={20} />
                Create Bus Route
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define a new transport path</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors group">
              <X size={20} className="text-slate-400 group-hover:text-slate-900" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {success ? (
            <div className="py-12 text-center animate-in fade-in zoom-in duration-300">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 size={48} />
               </div>
               <h3 className="text-2xl font-black text-slate-900">Route Created!</h3>
               <p className="text-slate-500 mt-2">The new route is now available for student registration.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Route Name</label>
                <div className="relative">
                   <Navigation className="absolute left-4 top-3.5 text-slate-400" size={18} />
                   <input 
                     placeholder="e.g. Route A, Red Bus"
                     className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500 transition-all font-bold"
                     value={formData.name}
                     onChange={e => setFormData({ ...formData, name: e.target.value })}
                     required
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Point</label>
                  <input 
                    placeholder="e.g. School"
                    className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500 font-medium transition-all"
                    value={formData.start_point}
                    onChange={e => setFormData({ ...formData, start_point: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">End Point</label>
                  <input 
                    placeholder="e.g. City Center"
                    className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500 font-medium transition-all"
                    value={formData.end_point}
                    onChange={e => setFormData({ ...formData, end_point: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Distance (KM)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g. 15.5"
                    className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500 font-black transition-all"
                    value={formData.distance_km}
                    onChange={e => setFormData({ ...formData, distance_km: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Intermediate Stops</label>
                  <input 
                    placeholder="e.g. Stop 1, Stop 2"
                    className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500 font-medium transition-all"
                    value={formData.stops}
                    onChange={e => setFormData({ ...formData, stops: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || !formData.name || !formData.distance_km}
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Save Route</>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
