"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, Bus, Navigation, MapPin, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useBranch } from '@/components/common/BranchContext';

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EnrollStudentModal({ isOpen, onClose, onSuccess }: EnrollStudentModalProps) {
  const { selectedBranch } = useBranch();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form State
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [routes, setRoutes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    route_id: '',
    distance_km: '',
    pickup_point: ''
  });

  // Fetch students on search
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        api.get(`/students/?search=${searchQuery}&branch_id=${selectedBranch}&status=ACTIVE`)
          .then(res => setStudents(res.data?.results || res.data?.data || res.data || []));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedBranch]);

  // Fetch routes
  useEffect(() => {
    if (isOpen) {
      api.get(`/transport/routes/?branch_id=${selectedBranch}`)
        .then(res => setRoutes(res.data?.results || res.data?.data || res.data || []));
    }
  }, [isOpen, selectedBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !formData.route_id || !formData.distance_km) return;

    setLoading(true);
    try {
      await api.post('/transport/opt-in/', {
        student_id: selectedStudent.id,
        route_id: formData.route_id,
        distance_km: parseFloat(formData.distance_km),
        pickup_point: formData.pickup_point
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSearchQuery('');
        setSelectedStudent(null);
        setFormData({ route_id: '', distance_km: '', pickup_point: '' });
        onSuccess();
      }, 1500);
    } catch (err: any) {
      toast.error("Registration failed: " + (err.response?.data?.message || "Internal error"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
           <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Bus className="text-blue-600" size={20} />
                Transport Registration
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Enroll student for bus service</p>
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
               <h3 className="text-2xl font-black text-slate-900">Successfully Registered!</h3>
               <p className="text-slate-500 mt-2">The student's fee structure has been updated.</p>
            </div>
          ) : (
            <>
              {/* Student Search */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">1. Select Student</label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-200 rounded-2xl group animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
                          {selectedStudent.first_name[0]}
                       </div>
                       <div>
                          <p className="font-bold text-slate-900">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">{selectedStudent.admission_number} • {selectedStudent.class_section_display}</p>
                       </div>
                    </div>
                    <button type="button" onClick={() => setSelectedStudent(null)} className="text-xs font-bold text-blue-600 hover:underline">Change</button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                      autoFocus
                      placeholder="Search by name or admission number..."
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500 transition-all font-medium"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    {students.length > 0 && searchQuery.length > 2 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-10 max-h-48 overflow-y-auto scrollbar-hide py-2 animate-in fade-in slide-in-from-top-2">
                         {students.map(s => (
                           <button 
                             key={s.id} 
                             type="button" 
                             onClick={() => setSelectedStudent(s)}
                             className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                           >
                             <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600 text-[10px]">{s.first_name[0]}</div>
                             <div>
                                <p className="text-sm font-bold text-slate-900">{s.first_name} {s.last_name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{s.admission_number}</p>
                             </div>
                           </button>
                         ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Route Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">2. Assign Route</label>
                <div className="relative">
                   <Navigation className="absolute left-4 top-3.5 text-slate-400" size={18} />
                   <select 
                     className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500 transition-all font-bold appearance-none cursor-pointer"
                     value={formData.route_id}
                     onChange={e => {
                       const routeId = e.target.value;
                       const routeInfo = routes?.find(r => r.id === routeId);
                       setFormData({ 
                         ...formData, 
                         route_id: routeId,
                         distance_km: routeInfo ? String(routeInfo.distance_km) : ''
                       });
                     }}
                     required
                   >
                     <option value="" disabled>Select a bus route...</option>
                     {routes?.map(r => (
                       <option key={r.id} value={r.id}>{r.name} ({r.start_point} → {r.end_point})</option>
                     ))}
                   </select>
                </div>
              </div>

              {/* Distance & Pickup */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Distance (KM)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g. 5.5"
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
                      placeholder="e.g. Apollo Circle"
                      className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500 font-medium transition-all"
                      value={formData.pickup_point}
                      onChange={e => setFormData({ ...formData, pickup_point: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
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
                  disabled={loading || !selectedStudent || !formData.route_id}
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Confirm Enrollment</>
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
