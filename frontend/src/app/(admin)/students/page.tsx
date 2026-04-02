"use client";

import React, { useState, useEffect } from 'react';
import { useApi } from '@/lib/hooks';
import api from '@/lib/axios';
import DateInput from '@/components/DateInput';
import { Plus, Search, Users, Filter, Receipt, Building2 } from 'lucide-react';

interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  class_section: string;
  class_section_display: string;
  status: string;
  branch: string;
  branch_name: string;
  roll_number: number | null;
  proposed_fee?: number;
}

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [branchFilter, setBranchFilter] = useState('');
  const { data: students, loading, error, refetch } = useApi<Student[]>(
    `/students/?status=${statusFilter}&search=${search}&branch_id=${branchFilter}`
  );

  const [user, setUser] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [feeStructure, setFeeStructure] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    // Identity
    first_name: '', last_name: '', date_of_birth: '', gender: 'MALE',
    blood_group: 'UNKNOWN', nationality: 'Indian', religion: '', 
    caste_category: 'OC', aadhar_number: '', mother_tongue: '',
    identification_mark_1: '', identification_mark_2: '', health_status: '',
    
    // Organization
    tenant: '', branch: '', academic_year: '', class_section: '',
    admission_number: '', 

    // Parents
    father_name: '', father_phone: '', father_email: '', father_qualification: '', 
    father_occupation: '', father_aadhaar: '',
    mother_name: '', mother_phone: '', mother_qualification: '', 
    mother_occupation: '', mother_aadhaar: '',
    guardian_name: '', guardian_phone: '', guardian_relation: '',

    // Address
    address_line1: '', apartment_name: '', address_line2: '', landmark: '',
    city: '', mandal: '', district: '', state: '', pincode: '',

    // Academic
    previous_school_name: '', previous_class: '', previous_school_ay: '',
    source: 'WALK_IN',

    // Documents
    doc_tc_submitted: false, doc_bonafide_submitted: false,
    doc_birth_cert_submitted: false, doc_caste_cert_submitted: false,
    doc_aadhaar_submitted: false,

    // Staff
    admission_staff_name: '', admission_staff_phone: '',

    // Fees
    offered_total: 0, standard_total: 0, reason: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me/').then(res => {
      const u = res.data.data;
      setUser(u);
      if (u.role === 'SUPER_ADMIN') {
        api.get('/tenants/').then(r => setTenants(r.data));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          tenant: u.tenant_id,
          branch: u.branch_id || '' 
        }));
      }
    });
  }, []);

  useEffect(() => {
    if (formData.tenant) {
      api.get(`/tenants/branches/?tenant_id=${formData.tenant}`).then(res => {
        setBranches(res.data);
        if (res.data.length === 1 && !formData.branch) {
          setFormData(prev => ({ ...prev, branch: res.data[0].id }));
        }
      });
    } else {
      setBranches([]);
    }
  }, [formData.tenant]);

  useEffect(() => {
    if (formData.branch) {
      // Reset dependent fields when branch changes
      setAcademicYears([]);
      setFormData(prev => ({ ...prev, academic_year: '', class_section: '' }));
      
      api.get(`/tenants/academic-years/?branch_id=${formData.branch}`).then(res => {
        setAcademicYears(res.data);
        const active = res.data.find((ay: any) => ay.is_active);
        if (active && !formData.academic_year) {
          setFormData(prev => ({ ...prev, academic_year: active.id }));
        } else if (res.data.length > 0 && !formData.academic_year) {
          setFormData(prev => ({ ...prev, academic_year: res.data[0].id }));
        }
      });
    } else {
      setAcademicYears([]);
    }
  }, [formData.branch]);

  // Fetch classes when branch/AY changes
  useEffect(() => {
    if (formData.branch && formData.academic_year) {
      api.get(`/classes/?branch_id=${formData.branch}&academic_year_id=${formData.academic_year}`)
        .then(res => setClasses(res.data));
    } else {
      setClasses([]);
    }
  }, [formData.branch, formData.academic_year]);

  // Fetch fee structure when class changes
  useEffect(() => {
    if (formData.class_section) {
      const cls = classes.find(c => c.id === formData.class_section);
      if (cls) {
        api.get(`/fees/structures/?branch_id=${formData.branch}&academic_year_id=${formData.academic_year}&grade=${cls.grade}`)
          .then(res => {
            const structure = res.data[0]; // Assuming one structure per grade
            setFeeStructure(structure);
            if (structure) {
              const total = (structure.items || []).reduce((acc: number, item: any) => acc + Number(item.amount), 0);
              setFormData(prev => ({ ...prev, standard_total: total, offered_total: total }));
            } else {
              setFormData(prev => ({ ...prev, standard_total: 0, offered_total: 0 }));
            }
          });
      }
    } else {
      setFeeStructure(null);
      setFormData(prev => ({ ...prev, standard_total: 0, offered_total: 0 }));
    }
  }, [formData.class_section, classes]);

  const goToNextTab = () => {
    const tabs = ['personal', 'parents', 'address', 'academic', 'admission', 'fees'];
    const nextIndex = tabs.indexOf(activeTab) + 1;
    if (nextIndex < tabs.length) {
      setActiveTab(tabs[nextIndex]);
    }
  };

  const handleEnroll = async () => {
    if (!formData.branch || !formData.academic_year || !formData.class_section) {
      alert("Please select Branch, Academic Year, and Class Section.");
      return;
    }

    if (formData.offered_total < formData.standard_total && !formData.reason) {
      alert("Please provide a reason for the fee reduction.");
      return;
    }

    setSaving(true);
    try {
      // 1. Create Student
      const res = await api.post('/students/', formData);
      const student = res.data;
      
      // 2. Creation logic handles fee locking in backend if we want, 
      // but let's be explicit if we need to or trust the backend Student creation to handle it.
      // Actually, per PRD, the application/enrollment creates the StudentFeeItems.
      // I'll assume the backend StudentViewSet.create handles this if the payload has offered_total.
      
      setShowForm(false);
      setActiveTab('personal');
      setFormData({ 
        first_name: '', last_name: '', date_of_birth: '', gender: 'MALE', 
        blood_group: 'UNKNOWN', nationality: 'Indian', religion: '', 
        caste_category: 'OC', aadhar_number: '', mother_tongue: '',
        identification_mark_1: '', identification_mark_2: '', health_status: '',
        admission_number: '', 
        tenant: user?.role === 'SUPER_ADMIN' ? '' : user?.tenant,
        branch: user?.role === 'BRANCH_ADMIN' ? user?.branch_id : '', 
        academic_year: '', class_section: '',
        father_name: '', father_phone: '', father_email: '', father_qualification: '', 
        father_occupation: '', father_aadhaar: '',
        mother_name: '', mother_phone: '', mother_qualification: '', 
        mother_occupation: '', mother_aadhaar: '',
        guardian_name: '', guardian_phone: '', guardian_relation: '',
        address_line1: '', apartment_name: '', address_line2: '', landmark: '',
        city: '', mandal: '', district: '', state: '', pincode: '',
        previous_school_name: '', previous_class: '', previous_school_ay: '',
        source: 'WALK_IN',
        doc_tc_submitted: false, doc_bonafide_submitted: false,
        doc_birth_cert_submitted: false, doc_caste_cert_submitted: false,
        doc_aadhaar_submitted: false,
        admission_staff_name: '', admission_staff_phone: '',
        offered_total: 0, standard_total: 0, reason: ''
      });
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">Manage enrolled students</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
              if (activeTab !== 'fees') goToNextTab();
            }
          }}
          className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Form Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 scrollbar-hide">
            {[
              { id: 'personal', label: 'Student Info' },
              { id: 'parents', label: 'Parents' },
              { id: 'address', label: 'Address' },
              { id: 'academic', label: 'Academic' },
              { id: 'admission', label: 'Admission' },
              { id: 'fees', label: 'Fees' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all relative ${
                  activeTab === tab.id 
                    ? 'text-blue-600 bg-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">First Name <span className="text-red-500">*</span></label>
                    <input placeholder="Enter first name" required value={formData.first_name}
                      onChange={e => setFormData(prev => ({...prev, first_name: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Last Name <span className="text-red-500">*</span></label>
                    <input placeholder="Enter last name" required value={formData.last_name}
                      onChange={e => setFormData(prev => ({...prev, last_name: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <DateInput 
                    label="Date of Birth"
                    required
                    value={formData.date_of_birth}
                    onChange={val => setFormData(prev => ({...prev, date_of_birth: val}))}
                    className="space-y-1.5"
                  />
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Gender <span className="text-red-500">*</span></label>
                    <select value={formData.gender} onChange={e => setFormData(prev => ({...prev, gender: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                      <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Blood Group</label>
                    <select value={formData.blood_group} onChange={e => setFormData(prev => ({...prev, blood_group: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                      <option value="UNKNOWN">Select Blood Group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Mother Tongue</label>
                    <input placeholder="e.g. Telugu, English..." value={formData.mother_tongue}
                      onChange={e => setFormData(prev => ({...prev, mother_tongue: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Religion</label>
                    <input placeholder="e.g. Hindu, Muslim, Christian..." value={formData.religion}
                      onChange={e => setFormData(prev => ({...prev, religion: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Caste Category</label>
                    <select value={formData.caste_category} onChange={e => setFormData(prev => ({...prev, caste_category: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                      <option value="OC">Open Category (OC)</option>
                      <option value="BC">Backward Class (BC)</option>
                      <option value="SC">Scheduled Caste (SC)</option>
                      <option value="ST">Scheduled Tribe (ST)</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Aadhaar Card Number</label>
                    <input placeholder="12 digit number" maxLength={12} value={formData.aadhar_number}
                      onChange={e => setFormData(prev => ({...prev, aadhar_number: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="lg:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Identification Mark 1</label>
                    <input placeholder="e.g. A mole on right hand" value={formData.identification_mark_1}
                      onChange={e => setFormData(prev => ({...prev, identification_mark_1: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="lg:col-span-4 space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Health Status / Medical Conditions</label>
                    <textarea 
                      placeholder="Mention any allergies or chronic conditions..." 
                      value={formData.health_status}
                      onChange={e => setFormData(prev => ({...prev, health_status: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[80px]" 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'parents' && (
              <div className="space-y-8">
                {/* Father Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Father's Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Full Name <span className="text-red-500">*</span></label>
                      <input required value={formData.father_name} onChange={e => setFormData(prev => ({...prev, father_name: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Phone Number <span className="text-red-500">*</span></label>
                      <input required value={formData.father_phone} onChange={e => setFormData(prev => ({...prev, father_phone: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Occupation</label>
                      <input value={formData.father_occupation} onChange={e => setFormData(prev => ({...prev, father_occupation: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Qualification</label>
                      <input value={formData.father_qualification} onChange={e => setFormData(prev => ({...prev, father_qualification: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Aadhaar Number</label>
                      <input maxLength={12} value={formData.father_aadhaar} onChange={e => setFormData(prev => ({...prev, father_aadhaar: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Mother Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-pink-600 uppercase tracking-widest border-l-4 border-pink-500 pl-3">Mother's Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Full Name <span className="text-red-500">*</span></label>
                      <input required value={formData.mother_name} onChange={e => setFormData(prev => ({...prev, mother_name: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-pink-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Phone Number</label>
                      <input value={formData.mother_phone} onChange={e => setFormData(prev => ({...prev, mother_phone: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-pink-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Qualification</label>
                      <input value={formData.mother_qualification} onChange={e => setFormData(prev => ({...prev, mother_qualification: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-pink-500" />
                    </div>
                  </div>
                </div>

                {/* Guardian Info */}
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex gap-6 items-end">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Guardian Name (Optional)</label>
                      <input value={formData.guardian_name} onChange={e => setFormData(prev => ({...prev, guardian_name: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-500" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Relation</label>
                      <input value={formData.guardian_relation} onChange={e => setFormData(prev => ({...prev, guardian_relation: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'address' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Plot / House / Flat No. <span className="text-red-500">*</span></label>
                    <input required value={formData.address_line1} onChange={e => setFormData(prev => ({...prev, address_line1: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Apartment Name</label>
                    <input value={formData.apartment_name} onChange={e => setFormData(prev => ({...prev, apartment_name: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Colony / Area <span className="text-red-500">*</span></label>
                    <input required value={formData.address_line2} onChange={e => setFormData(prev => ({...prev, address_line2: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Landmark</label>
                    <input value={formData.landmark} onChange={e => setFormData(prev => ({...prev, landmark: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">City / Village <span className="text-red-500">*</span></label>
                    <input required value={formData.city} onChange={e => setFormData(prev => ({...prev, city: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Mandal</label>
                    <input value={formData.mandal} onChange={e => setFormData(prev => ({...prev, mandal: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">District</label>
                    <input value={formData.district} onChange={e => setFormData(prev => ({...prev, district: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">State <span className="text-red-500">*</span></label>
                    <input required value={formData.state} onChange={e => setFormData(prev => ({...prev, state: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Pincode <span className="text-red-500">*</span></label>
                    <input required maxLength={6} value={formData.pincode} onChange={e => setFormData(prev => ({...prev, pincode: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Previous School Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">School Name & Location</label>
                      <input value={formData.previous_school_name} onChange={e => setFormData(prev => ({...prev, previous_school_name: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Standard / Class</label>
                      <input value={formData.previous_class} onChange={e => setFormData(prev => ({...prev, previous_class: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Academic Year</label>
                      <input placeholder="e.g. 2023-24" value={formData.previous_school_ay} onChange={e => setFormData(prev => ({...prev, previous_school_ay: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Documents Checklist</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                      { id: 'doc_tc_submitted', label: 'TC / Record Sheet' },
                      { id: 'doc_bonafide_submitted', label: 'Bonafide Cert' },
                      { id: 'doc_birth_cert_submitted', label: 'Birth Certificate' },
                      { id: 'doc_caste_cert_submitted', label: 'Caste Certificate' },
                      { id: 'doc_aadhaar_submitted', label: 'Aadhaar Card' }
                    ].map(doc => (
                      <label key={doc.id} className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl hover:bg-emerald-50/50 cursor-pointer transition-colors group">
                        <input 
                          type="checkbox" 
                          checked={(formData as any)[doc.id]} 
                          onChange={e => setFormData(prev => ({...prev, [doc.id]: e.target.checked}))}
                          className="w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500" 
                        />
                        <span className="text-xs font-bold text-gray-600 group-hover:text-emerald-700">{doc.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Source of Information</label>
                  <select value={formData.source} onChange={e => setFormData(prev => ({...prev, source: e.target.value}))}
                    className="w-full max-w-xs px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500">
                    <option value="WALK_IN">Walk-in</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="WEBSITE">Website</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'admission' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* School/Branch Logic */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  {user?.role === 'SUPER_ADMIN' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">School / Tenant</label>
                      <select required value={formData.tenant} onChange={e => setFormData(prev => ({...prev, tenant: e.target.value, branch: '', academic_year: ''}))}
                        className="w-full px-4 py-2.5 border border-white bg-white rounded-xl text-sm focus:ring-2 focus:ring-slate-200 shadow-sm outline-none">
                        <option value="">Select School</option>
                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Branch <span className="text-red-500">*</span></label>
                    <select required disabled={user?.role === 'BRANCH_ADMIN'} value={formData.branch} onChange={e => setFormData(prev => ({...prev, branch: e.target.value, academic_year: ''}))}
                      className="w-full px-4 py-2.5 border border-white bg-white rounded-xl text-sm focus:ring-2 focus:ring-slate-200 shadow-sm outline-none disabled:opacity-50">
                      <option value="">Select Branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Academic Year <span className="text-red-500">*</span></label>
                    <select required value={formData.academic_year} onChange={e => setFormData(prev => ({...prev, academic_year: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-white bg-white rounded-xl text-sm focus:ring-2 focus:ring-slate-200 shadow-sm outline-none">
                      <option value="">Select Year</option>
                      {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Class / Section <span className="text-red-500">*</span></label>
                  <select required value={formData.class_section} onChange={e => setFormData(prev => ({...prev, class_section: e.target.value}))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/50">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Admission No. (Optional)</label>
                  <input placeholder="Auto-generated if empty" value={formData.admission_number} onChange={e => setFormData(prev => ({...prev, admission_number: e.target.value}))}
                    className="w-full px-4 py-2.5 border border-gray-100 bg-gray-50/50 rounded-xl text-sm font-mono focus:border-blue-500 outline-none" />
                </div>

                <div className="lg:col-span-3 pt-6 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Processed By (Staff Name)</label>
                    <input value={formData.admission_staff_name} onChange={e => setFormData(prev => ({...prev, admission_staff_name: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-slate-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Staff Contact</label>
                    <input value={formData.admission_staff_phone} onChange={e => setFormData(prev => ({...prev, admission_staff_phone: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-slate-500" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="bg-slate-50/80 p-8 rounded-3xl border border-slate-100 shadow-inner space-y-8 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 tracking-tight">Fee Configuration</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase">Set and lock fees for this academic year</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Agreed Total Fee <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300 group-focus-within:text-blue-600 transition-colors">₹</span>
                        <input 
                          type="number" 
                          required
                          value={formData.offered_total}
                          onChange={e => setFormData(prev => ({...prev, offered_total: Number(e.target.value)}))}
                          className="w-full pl-12 pr-6 py-5 border-2 border-white bg-white rounded-3xl text-3xl font-black text-gray-900 focus:border-blue-600 shadow-xl shadow-blue-900/5 outline-none transition-all" 
                        />
                      </div>
                      {formData.offered_total < formData.standard_total && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 text-xs font-black animate-pulse uppercase tracking-tight">
                          <span>⚠️ Reduction of ₹{(formData.standard_total - formData.offered_total).toLocaleString()} requires admin approval</span>
                        </div>
                      )}
                    </div>

                    {formData.offered_total < formData.standard_total && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason for Reduction <span className="text-red-500">*</span></label>
                        <textarea 
                          placeholder="Provide a valid reason (e.g. Merit, Sibling...)"
                          required
                          value={formData.reason}
                          onChange={e => setFormData({...formData, reason: e.target.value})}
                          className="w-full px-6 py-4 border border-slate-200 bg-white rounded-2xl text-sm font-medium focus:border-blue-600 outline-none min-h-[120px] shadow-sm transition-all"
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Standard Fee Breakdown</p>
                    {feeStructure ? (
                      <div className="space-y-4">
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                          {(feeStructure.items || []).map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-50 shadow-sm transition-transform hover:scale-[1.02]">
                              <span className="text-sm font-bold text-slate-600">{item.category_name}</span>
                              <span className="text-sm font-black text-slate-900">₹{Number(item.amount).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Grand Total</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{formData.standard_total.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 space-y-4 text-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <Receipt size={32} />
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest italic animate-pulse">
                          {formData.class_section ? 'Fee Structure Missing' : 'Select class to load fees'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="px-8 py-6 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-8 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-widest">
              Cancel
            </button>
            <div className="flex gap-4">
              {activeTab !== 'fees' ? (
                <button 
                  type="button" 
                  onClick={goToNextTab}
                  className="bg-slate-900 text-white px-10 py-3 rounded-2xl text-sm font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 tracking-widest uppercase"
                >
                  Next Step
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleEnroll}
                  disabled={saving}
                  className="bg-blue-600 text-white px-12 py-4 rounded-2xl text-sm font-black hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-200 tracking-[0.15em] uppercase animate-pulse">
                  {saving ? 'Processing...' : 'Complete Enrollment'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            placeholder="Search by name or admission number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        
        {/* Branch Filter (Hidden if Branch Admin) */}
        {user?.role === 'SCHOOL_ADMIN' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl">
            <Building2 size={14} className="text-gray-400" />
            <select 
              value={branchFilter} 
              onChange={e => setBranchFilter(e.target.value)}
              className="text-sm font-medium bg-transparent focus:outline-none pr-2"
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl">
          <Filter size={14} className="text-gray-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm font-medium bg-transparent focus:outline-none pr-2">
            <option value="ACTIVE">Active Students</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={refetch} className="px-4 py-1.5 bg-red-100 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">Retry</button>
        </div>
      ) : students && students.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center space-y-4 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Users size={40} />
          </div>
          <div>
            <p className="text-gray-900 font-semibold text-lg">No students enrolled</p>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">Start by clicking "Add Student" to enroll your first student in the system.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-600 font-medium text-sm hover:underline"
          >
            Enroll a student now
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                   <th className="px-6 py-4 font-semibold text-gray-600">Admission No.</th>
                   <th className="px-6 py-4 font-semibold text-gray-600">Student Name</th>
                   <th className="px-6 py-4 font-semibold text-gray-600">Branch</th>
                   <th className="px-6 py-4 font-semibold text-gray-600">Class & Section</th>
                   <th className="px-6 py-4 font-semibold text-gray-600">Agreed Fee</th>
                   <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {students?.map((s: Student) => (
                   <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-6 py-4">
                       <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md group-hover:bg-white transition-colors">
                         {s.admission_number}
                       </span>
                     </td>
                     <td className="px-6 py-4 font-semibold text-gray-900">{s.first_name} {s.last_name}</td>
                     <td className="px-6 py-4 text-gray-600 uppercase text-[10px] font-bold tracking-tight">
                       {s.branch_name || '-'}
                     </td>
                     <td className="px-6 py-4 text-gray-500 italic">
                       {s.class_section_display || 'Not Assigned'}
                     </td>
                     <td className="px-6 py-4 text-right md:text-left">
                       {(s.proposed_fee !== undefined && s.proposed_fee !== null && s.proposed_fee > 0) ? (
                         <span className="font-black text-gray-900">₹{Number(s.proposed_fee).toLocaleString()}</span>
                       ) : s.status === 'PENDING_APPROVAL' ? (
                         <span className="text-blue-500 text-[10px] font-bold uppercase italic">Awaiting Approval</span>
                       ) : (
                         <span className="text-gray-400">-</span>
                       )}
                     </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 
                        s.status === 'PENDING_APPROVAL' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          s.status === 'ACTIVE' ? 'bg-emerald-500' : 
                          s.status === 'PENDING_APPROVAL' ? 'bg-blue-500' :
                          'bg-slate-400'
                        }`} />
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
