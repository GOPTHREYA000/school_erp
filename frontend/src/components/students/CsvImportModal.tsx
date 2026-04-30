import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Download, RefreshCw, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branchId: string;
}

export default function CsvImportModal({ isOpen, onClose, onSuccess, branchId }: Props) {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [ayId, setAyId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [importStats, setImportStats] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch academic years from the tenant endpoint (set by school admin)
  useEffect(() => {
    if (!isOpen) return;
    const fetchAcademicYears = async () => {
      try {
        const res = await api.get('tenants/academic-years/');
        const raw = res.data?.data ?? res.data?.results ?? res.data;
        const years = Array.isArray(raw) ? raw : [];
        setAcademicYears(years);
        
        // Auto-select the current academic year if one is marked
        const current = years.find((ay: any) => ay.is_current === true);
        if (current) {
          setAyId(current.id);
        }
      } catch (e) {
        console.error('Failed to fetch academic years:', e);
        toast.error('Could not load academic years.');
      }
    };
    fetchAcademicYears();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setErrors([]);
        setSuccessMsg('');
        setImportStats(null);
      } else {
         toast.error("Please upload a .csv file.");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file.");
    if (!ayId) return toast.error("Please select an academic year.");

    setUploading(true);
    setErrors([]);
    setSuccessMsg('');
    setImportStats(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('branch_id', branchId);
    formData.append('academic_year_id', ayId);

    try {
      const res = await api.post('students/import-csv/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data;
      setSuccessMsg(data.message || 'Import successful.');
      setImportStats({
        imported: data.imported_count || 0,
        skipped: data.skipped_duplicates || 0,
      });
      toast.success(data.message || 'Import successful.');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        setErrors(data.errors);
        toast.error(data.detail || "Import aborted. Please fix the file errors.");
      } else {
        toast.error(data?.detail || "Import failed.");
        setErrors([data?.detail || "An unexpected error occurred."]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setErrors([]);
    setSuccessMsg('');
    setImportStats(null);
    setUploading(false);
    setAyId('');
    onClose();
  };

  const downloadTemplate = () => {
    const headers = [
      // Required
      'first_name', 'last_name', 'date_of_birth', 'gender', 'grade', 'section',
      // Optional — identity
      'admission_number', 'roll_number', 'blood_group', 'religion', 'caste_category',
      'aadhar_number', 'mother_tongue', 'nationality',
      // Parent — Father
      'father_name', 'father_phone', 'father_email', 'father_occupation', 'father_qualification', 'father_aadhaar',
      // Parent — Mother
      'mother_name', 'mother_phone', 'mother_email', 'mother_occupation', 'mother_qualification', 'mother_aadhaar',
      // Guardian
      'guardian_name', 'guardian_phone', 'guardian_relation',
      // Address
      'address', 'city', 'district', 'state', 'pincode',
      // Previous school
      'previous_school_name', 'previous_class', 'previous_school_ay',
      // Emergency
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
      // Financial Migration
      'total_fee', 'fee_paid', 'concession_amount', 'fee_due_date', 'past_due_amount', 'past_due_year'
    ];
    const sample = [
      'John', 'Doe', '2015-05-20', 'MALE', '5', 'A',
      '', '', 'A+', 'Hindu', 'OC',
      '123456789012', 'English', 'Indian',
      'James Doe', '9876543210', 'james@example.com', 'Engineer', 'B.Tech', '987654321098',
      'Jane Doe', '9876543211', 'jane@example.com', 'Teacher', 'M.A.', '876543210987',
      '', '', '',
      '123 Main St', 'Hyderabad', 'Rangareddy', 'Telangana', '500001',
      'ABC School', 'Grade 4', '2024-25',
      'James Doe', '9876543210', 'Father',
      '45000', '15000', '5000', '2025-06-01', '0', ''
    ];
    const csv = headers.join(',') + '\n' + sample.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "student_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const selectedAy = academicYears.find((a: any) => a.id === ayId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bulk Import Students</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Upload a CSV to import students, parents, and fee records at once.</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
               <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Target Academic Year (Optional)</label>
               <select 
                 value={ayId} 
                 onChange={e => setAyId(e.target.value)}
                 className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
               >
                 <option value="">Auto-Detect Current Year...</option>
                 {academicYears.map((ay: any) => (
                   <option key={ay.id} value={ay.id}>
                     {ay.name || ay.display_name || `${ay.start_date?.substring(0,4)}-${ay.end_date?.substring(0,4)}`}
                     {ay.is_current ? ' (Current)' : ''}
                   </option>
                 ))}
               </select>
            </div>
            
            <button 
              onClick={downloadTemplate}
              className="px-4 py-2 border border-gray-200 text-slate-600 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 h-[42px]"
            >
              <Download size={14} /> Template
            </button>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 leading-relaxed">
              <strong>All columns are optional!</strong> If omitted, system defaults will apply. Missing branches, classes, and admission numbers are auto-generated.
              <br />
              <strong>Financial Migration (Optional):</strong> Fill `total_fee`, `fee_paid`, `concession_amount`, and `past_due_amount` to migrate existing financial balances & past-year dues. If left blank, standard fees will be generated automatically.
              <br />
              <strong>Date formats:</strong> YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY accepted.
              <br />
              <strong>Grade values:</strong> NURSERY, LKG, UKG, 1, 2, 3, ..., 10, 11_SCIENCE, etc. Duplicates (same name+DOB) skipped.
            </div>
          </div>

          <div 
            onDragOver={e => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
              file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-slate-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                  setErrors([]);
                  setSuccessMsg('');
                  setImportStats(null);
                }
              }}
            />
            
            {file ? (
              <>
                <FileText className="text-blue-500 mb-3" size={32} />
                <h3 className="text-sm font-bold text-blue-900">{file.name}</h3>
                <p className="text-xs text-blue-600/70 mt-1">{(file.size / 1024).toFixed(2)} KB • Click to change</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-3 text-slate-400">
                   <Upload size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Click to upload or drag and drop</h3>
                <p className="text-xs text-slate-500 mt-1">CSV file only (UTF-8). First row must be headers.</p>
              </>
            )}
          </div>

          {errors.length > 0 && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-rose-600 font-bold mb-2 text-sm">
                <AlertCircle size={16} /> Import Failed — All changes rolled back
              </div>
              <p className="text-xs text-rose-600/80 mb-2">
                {errors.length} error{errors.length !== 1 ? 's' : ''} found. No students were imported. Fix the issues below and re-upload.
              </p>
              <ul className="text-xs text-rose-700/80 space-y-1 list-disc list-inside max-h-48 overflow-y-auto pr-2 font-mono">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-800">{successMsg}</p>
                  {importStats && (
                    <p className="text-xs text-emerald-600/80 mt-0.5">
                      {importStats.imported} imported{importStats.skipped > 0 ? ` · ${importStats.skipped} duplicates skipped` : ''} · Fees and parent accounts created automatically
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={handleClose} 
            disabled={uploading}
            className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            disabled={!file || !ayId || uploading || !!successMsg}
            className={`px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${
              file && ayId && !uploading && !successMsg
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <><RefreshCw size={16} className="animate-spin" /> Processing...</>
            ) : (
              'Upload & Import Data'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
