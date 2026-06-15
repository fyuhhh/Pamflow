import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Info, MapPin, ChevronDown, CheckCircle, ChevronRight, X, FileText, Image, AlertTriangle, Send } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

import { motion } from 'framer-motion';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import CustomDatePicker from './CustomDatePicker';
import SearchableSelect from './SearchableSelect';

// Helper: always return a proper array
const safeArr = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

const BuatTugasDepartemen = ({ taskType = 'wo' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError } = useModal();
  const user = JSON.parse(localStorage.getItem('user'));
  const isMobile = location.pathname.startsWith('/demo/mobile');
  const basePath = isMobile ? '/demo/mobile' : '/tugas-departemen';
  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0] : 'User';
  const currentCompanyId = user?.company_id || 1;
  const role = user?.role?.toLowerCase();
  const isSuperAdmin = role === 'super admin' || role?.includes('super admin') || role?.includes('superadmin');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [urgensiOpen, setUrgensiOpen] = useState(false);
  const [deptAsalOpen, setDeptAsalOpen] = useState(false);
  const [deptTujuanOpen, setDeptTujuanOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const fileInputRef = useRef(null);
  const isChecklist = taskType === 'checklist';

  const initialFormData = {
    perusahaan: 'Ewalk Pentacity Mall',
    company_id: '1',
    departemen_asal: user?.department || '',
    nama_peminta: userName,
    departemen_tujuan: '',
    template: '',
    nama_wo: '',
    jenis_tugas: taskType,
    deskripsi: '',
    lokasi: '',
    detail_alamat: '',
    lampiran: null,
    tanggal_selesai: '',
    urgensi: '',
    template_id: '',
    wo_items: [],
    checklist_session_id: null
  };

  const [formData, setFormData] = useState(initialFormData);
  const [auditData, setAuditData] = useState(null);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [batchPayloads, setBatchPayloads] = useState([]);
  const [showBatchConfirmModal, setShowBatchConfirmModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    // Priority: useLocation state, fallback to window.history.state
    const state = location.state || window.history.state?.usr;
    console.log('DEBUG: Checking for audit state:', state);

    if (state?.fromAudit && state.brokenItems && state.brokenItems.length > 0) {
      console.log('DEBUG: Audit data found! Processing...', state);
      setAuditData(state);

      const isBatch = state.isBatchWO;
      const itemsToProcess = isBatch ? [state.brokenItems[currentBatchIndex || 0]] : state.brokenItems;

      const taskTitle = isBatch 
        ? `Perbaikan ${state.templateName || 'Temuan'} - ${itemsToProcess[0]?.name || ''}`
        : `Perbaikan ${state.templateName || 'Temuan'} - ${state.shift || ''}`;

      setFormData(prev => ({
        ...prev,
        nama_wo: taskTitle,
        departemen_tujuan: state.targetDept || 'ENGINEERING',
        deskripsi: `WO dibuat otomatis dari audit #SES-${state.session_id}${isBatch ? ` untuk item ${itemsToProcess[0]?.name || ''}` : ''}.`,
        urgensi: 'Kritis',
        tanggal_mulai: prev.tanggal_mulai || new Date().toISOString().split('T')[0],
        tanggal_selesai: prev.tanggal_selesai || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        checklist_session_id: state.session_id,
        wo_items: itemsToProcess.map(item => ({
          id: item.id,
          name: item.name,
          original_notes: item.notes || '',
          original_photos: safeArr(item.photo_urls).length > 0 ? safeArr(item.photo_urls) : (item.photo_url ? [item.photo_url] : []),
          original_video: item.video_url || '',
          status: 'pending'
        }))
      }));
    }
  }, [location.state, currentBatchIndex]);
  
  // Watch formData changes for debug
  useEffect(() => {
    if (formData.checklist_session_id) {
       console.log('DEBUG: FormData updated with audit session:', formData.checklist_session_id);
    }
  }, [formData]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await authFetch('/api/companies');
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
          
          // Lockdown logic
          if (!isSuperAdmin && currentCompanyId) {
            setFormData(prev => ({ 
              ...prev, 
              company_id: currentCompanyId,
              perusahaan: user?.orgId || prev.perusahaan
            }));
          } else if (data.length > 0 && !formData.company_id) {
            // Default to ID 1 or first entry
            const defaultCompany = data.find(c => c.id === 1 || c.companyId === 'PAM') || data[0];
            setFormData(prev => ({ 
              ...prev, 
              company_id: defaultCompany.id,
              perusahaan: defaultCompany.name || defaultCompany.companyId || 'Ewalk Pentacity Mall'
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    };
    fetchCompanies();
  }, []);

  const fetchDepartments = async (companyId) => {
    if (!companyId) {
      setDepartments([]);
      return;
    }
    try {
      const response = await authFetch(`/api/departments?company_id=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    if (formData.company_id) {
      fetchDepartments(formData.company_id);
    }
  }, [formData.company_id]);

  useEffect(() => {
    const fetchTemplates = async () => {
      // Only fetch templates when both company and destination department are selected
      if (!formData.company_id || !formData.departemen_tujuan) {
        setTemplates([]);
        setFormData(prev => ({ ...prev, template: '', template_id: '' }));
        return;
      }

      try {
        // Build query params: company_id + jenis_template + department_id (from tujuan)
        let params = new URLSearchParams({
          company_id: formData.company_id,
          jenis_template: taskType
        });

        // Always filter by destination department
        if (departments.length > 0) {
          const targetDept = departments.find(d => 
            String(d.name).toLowerCase() === String(formData.departemen_tujuan).toLowerCase()
          );
          if (targetDept) {
            params.append('department_id', targetDept.id);
          }
        }

        const response = await authFetch(`/api/templates?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
      }

      // Reset template selection when department changes
      setFormData(prev => ({ ...prev, template: '', template_id: '' }));
    };

    fetchTemplates();
  }, [formData.company_id, formData.departemen_tujuan, departments]);


  const urgensiOptions = ['Rendah', 'Normal', 'Kritis'];



  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'company_id') {
      const selectedCompany = companies.find(c => String(c.id) === String(value));
      setFormData({ 
        ...formData, 
        company_id: value,
        perusahaan: selectedCompany ? (selectedCompany.name || selectedCompany.companyId) : ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      showError('Format Tidak Didukung', 'Format file tidak didukung. Gunakan PDF, PNG, JPG, atau JPEG.');
      return;
    }

    // Validate file size
    const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 3 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('File Terlalu Besar', file.type === 'application/pdf' ? 'PDF maksimum 10 MB' : 'Gambar maksimum 3 MB');
      return;
    }

    setUploading(true);
    const formPayload = new FormData();
    formPayload.append('file', file);

    try {
      const response = await authFetch('/api/upload', {
        method: 'POST',
        body: formPayload
      });
      if (response.ok) {
        const data = await response.json();
        setUploadedFile({
          url: data.url,
          filename: data.filename,
          size: data.size,
          type: file.type
        });
        setFormData(prev => ({ ...prev, lampiran: data.url }));
      } else {
        showError('Gagal', 'Gagal mengunggah file.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showError('Kesalahan Unggah', 'Terjadi kesalahan saat mengunggah file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFormData(prev => ({ ...prev, lampiran: null }));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.company_id) { newErrors.perusahaan = 'Perusahaan wajib dipilih'; isValid = false; }
    if (!formData.departemen_tujuan) { newErrors.departemen_tujuan = 'Departemen tujuan wajib dipilih'; isValid = false; }
    if (!formData.nama_wo.trim()) { newErrors.nama_wo = `Nama ${isChecklist ? 'Checklist' : 'WO'} wajib diisi`; isValid = false; }
    if (!formData.deskripsi.trim()) { newErrors.deskripsi = 'Deskripsi wajib diisi'; isValid = false; }
    if (!formData.tanggal_mulai) { newErrors.tanggal_mulai = 'Tanggal mulai wajib diisi'; isValid = false; }
    if (!formData.tanggal_selesai) { newErrors.tanggal_selesai = 'Tanggal selesai wajib diisi'; isValid = false; }
    if (formData.tanggal_selesai && formData.tanggal_mulai && formData.tanggal_selesai < formData.tanggal_mulai) {
      newErrors.tanggal_selesai = 'Tanggal selesai tidak boleh sebelum tanggal mulai'; 
      isValid = false;
    }
    if (!formData.urgensi) { newErrors.urgensi = 'Urgensi wajib dipilih'; isValid = false; }

    setErrors(newErrors);
    if (!isValid) window.scrollTo({ top: 0, behavior: 'smooth' });
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Batch WO logic
    if (auditData?.isBatchWO && auditData.brokenItems) {
      setBatchPayloads(prev => {
        const newBatch = [...prev];
        newBatch[currentBatchIndex] = formData;
        return newBatch;
      });
      
      if (currentBatchIndex < auditData.brokenItems.length - 1) {
        success('Disimpan', `WO untuk item "${auditData.brokenItems[currentBatchIndex].name}" telah disiapkan. Lanjut ke item berikutnya.`);
        setCurrentBatchIndex(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setShowBatchConfirmModal(true);
      }
      return;
    }

    // Normal single WO submit
    setLoading(true);
    try {
      const response = await authFetch('/api/department-tasks', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        success('Berhasil', 'Tugas departemen berhasil dibuat!');
        navigate(`${basePath}/terkirim`);
      } else {
        const errorData = await response.json();
        showError('Gagal', errorData.message || 'Gagal membuat tugas departemen.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showError('Kesalahan Jaringan', 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBatch = async () => {
    setLoading(true);
    setShowBatchConfirmModal(false);
    let successCount = 0;
    
    try {
      for (const payload of batchPayloads) {
        const response = await authFetch('/api/department-tasks', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          successCount++;
        }
      }
      
      if (successCount === batchPayloads.length) {
        success('Berhasil', `${successCount} Work Order berhasil dibuat secara berurutan.`);
      } else {
        showError('Sebagian Berhasil', `${successCount} dari ${batchPayloads.length} WO berhasil dibuat.`);
      }
      navigate(`${basePath}/terkirim`);
    } catch (err) {
      console.error('Batch submit error:', err);
      showError('Kesalahan Jaringan', 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) => `w-full px-5 py-4 rounded-2xl border text-[14px] font-normal outline-none transition-all ${
    errors[field] 
      ? 'border-[#F1416C] bg-[#FFF5F8] text-[#F1416C]' 
      : 'border-slate-100 bg-slate-50 focus:bg-white focus:border-[#0095E8] focus:ring-4 focus:ring-blue-50 text-slate-700'
  } placeholder:text-slate-300 placeholder:font-normal`;

  const labelClass = `${isMobile ? 'w-full' : 'w-48'} text-[13px] text-[#3F4254]`;
  const requiredStar = <span className="text-[#F1416C] ml-0.5">*</span>;

  return (
    <div className={`${isMobile ? 'p-4 pb-24' : 'p-8 px-10 pb-24'}`}>
      {/* Notice */}
      <div className="flex items-center gap-2 mb-8 bg-[#F1FAFF] rounded-lg px-4 py-3 border border-[#D6EEFB]">
        <Info size={16} className="text-[#0095E8] flex-shrink-0" />
        <span className="text-[12px] text-[#0095E8] font-medium">Tanda (*) adalah wajib di isi</span>
      </div>

      {/* Batch Banner */}
      {auditData?.isBatchWO && auditData.brokenItems && auditData.brokenItems.length > 0 && (
        <div className={`mx-0 mb-6 bg-[#E8FFF3] border border-[#50CD89]/30 rounded-xl ${isMobile ? 'p-4' : 'p-5'} flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#50CD89] shadow-sm">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#181C32] mb-1">Pembuatan WO Masal (Item {currentBatchIndex + 1} dari {auditData.brokenItems.length})</p>
              <p className="text-[13px] text-[#3F4254]">
                Sedang mengonfigurasi Work Order untuk temuan: <span className="font-bold">{auditData.brokenItems[currentBatchIndex]?.name}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-[#A1A5B7] mb-1">Progress</p>
            <div className="w-32 h-2 bg-white rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-[#50CD89] transition-all duration-500" 
                style={{ width: `${((currentBatchIndex) / auditData.brokenItems.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Audit Findings Section */}
      {auditData && formData.wo_items.length > 0 && (
        <div className={`bg-white rounded-xl border border-[#F1416C]/20 ${isMobile ? 'p-4' : 'p-8'} mb-6 overflow-hidden relative`}>
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <AlertTriangle size={80} className="text-[#F1416C]" />
          </div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#FFF5F8] flex items-center justify-center text-[#F1416C]">
               <AlertTriangle size={18} />
            </div>
            <h2 className="text-[15px] font-bold text-[#F1416C]">Detail Temuan Audit (#SES-{auditData.session_id})</h2>
          </div>

          <div className="space-y-3">
            {formData.wo_items.map((item, idx) => (
              <div key={idx} className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-5 p-5 rounded-2xl bg-white border-2 border-[#FFF5F8] shadow-sm hover:border-[#F1416C]/20 hover:shadow-md transition-all`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FFF5F8] border border-[#F1416C]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[15px] font-bold text-[#F1416C]">{idx + 1}</span>
                  </div>
                  {isMobile && <p className="text-[16px] font-bold text-[#181C32] truncate">{item.name}</p>}
                </div>
                
                <div className="flex-1 min-w-0">
                  {!isMobile && <p className="text-[16px] font-bold text-[#181C32] truncate">{item.name}</p>}
                  {item.original_notes && (
                    <p className="text-[13px] text-[#F1416C] mt-1.5 font-medium bg-[#FFF5F8] px-3 py-1.5 rounded-lg inline-block border border-[#F1416C]/10">
                      Catatan: {item.original_notes}
                    </p>
                  )}
                  
                  {safeArr(item.original_photos).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {safeArr(item.original_photos).map((photo, pIdx) => (
                        <div 
                          key={pIdx}
                          className="w-28 h-20 rounded-xl overflow-hidden border border-[#E4E6EF] shadow-sm cursor-pointer group/photo relative"
                          onClick={() => setZoomedImage(photo)}
                        >
                          <img src={getImageUrl(photo)} className="w-full h-full object-cover transition-transform group-hover/photo:scale-110" alt={`Temuan ${pIdx + 1}`} />
                          <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/20 transition-colors flex items-center justify-center">
                            <Image size={16} className="text-white opacity-0 group-hover/photo:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.original_video && (
                    <div className="mt-3 w-48 h-28 rounded-xl overflow-hidden border border-[#E4E6EF] bg-black relative flex items-center justify-center">
                      <video src={getImageUrl(item.original_video)} className="w-full h-full object-contain" controls playsInline webkit-playsinline="true" preload="metadata" />
                    </div>
                  )}
                </div>
                
                <div className={`flex ${isMobile ? 'flex-row' : 'flex-col'} items-center ${isMobile ? 'justify-between' : 'justify-center'} gap-3 ${isMobile ? 'border-t' : 'border-l'} border-[#F1F1F4] ${isMobile ? 'pt-4' : 'pl-5'}`}>
                  <div className="px-3 py-1.5 bg-[#F1416C] text-white rounded-md text-[11px] font-extrabold uppercase tracking-widest shadow-sm shadow-[#F1416C]/20">
                    Rusak
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const newItems = formData.wo_items.filter((_, i) => i !== idx);
                      setFormData({ ...formData, wo_items: newItems });
                    }}
                    className="p-2 rounded-xl bg-white border border-[#E4E6EF] text-[#A1A5B7] hover:text-[#F1416C] hover:bg-[#FFF5F8] hover:border-[#F1416C]/30 transition-all shadow-sm flex items-center gap-2"
                    title="Batalkan item ini"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-[#F1FAFF] rounded-lg border border-[#D6EEFB] flex items-start gap-3">
            <Info size={16} className="text-[#3F4254] mt-0.5" />
            <p className="text-[12px] text-[#3F4254] leading-relaxed">
              Daftar di atas adalah item yang akan diperbaiki. Anda dapat menghapus item yang tidak perlu dikerjakan sekarang dengan mengklik ikon silang di kanan item.
            </p>
          </div>
        </div>
      )}

      <div className={`bg-white rounded-xl border border-[#F1F1F4] ${isMobile ? 'p-4' : 'p-8'}`}>
        <h2 className="text-[15px] font-semibold text-[#0095E8] mb-8">Informasi Tugas</h2>

        <div className="space-y-6">
          {/* Perusahaan */}
          <div className={`flex ${isMobile ? 'flex-col items-start' : 'items-center'} gap-2 md:gap-8`}>
            <label className={`${isMobile ? 'w-full' : 'w-48'} text-[13px] text-[#3F4254]`}>
              Perusahaan <span className="text-[#F1416C]">*</span>
            </label>
            <div className="flex-1 max-w-4xl">
              <SearchableSelect
                name="company_id"
                options={companies}
                value={formData.company_id}
                onChange={handleChange}
                placeholder="Pilih perusahaan"
                disabled={!isSuperAdmin}
              />
            </div>
          </div>

          {/* Departemen Asal - Auto-filled & locked from user's department */}
          <div className={`flex ${isMobile ? 'flex-col items-start' : 'items-center'} gap-2 md:gap-8`}>
            <label className={`${isMobile ? 'w-full' : 'w-48'} text-[13px] text-[#3F4254]`}>
              Departemen asal <span className="text-[#F1416C]">*</span>
            </label>
            <div className="flex-1 max-w-4xl">
              <input
                type="text"
                value={formData.departemen_asal}
                readOnly
                className="w-full px-4 py-3 rounded-lg border border-[#E4E6EF] bg-[#F5F8FA] text-[13px] text-[#3F4254] font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Nama Peminta */}
          <div className={`flex ${isMobile ? 'flex-col items-start' : 'items-center'} gap-2 md:gap-8`}>
            <label className={`${isMobile ? 'w-full' : 'w-48'} text-[13px] text-[#3F4254]`}>
              Nama peminta <span className="text-[#F1416C]">*</span>
            </label>
            <div className="flex-1 max-w-4xl">
              <input
                type="text"
                value={formData.nama_peminta}
                readOnly
                className="w-full px-4 py-3 rounded-lg border border-[#E4E6EF] bg-[#F5F8FA] text-[13px] text-[#A1A5B7] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Departemen Tujuan */}
          <div className={`flex ${isMobile ? 'flex-col items-start' : 'items-center'} gap-2 md:gap-8`}>
            <label className={`${isMobile ? 'w-full' : 'w-48'} text-[13px] font-semibold text-[#3F4254]`}>
              Departemen tujuan <span className="text-[#F1416C]">*</span>
            </label>
            <div className="flex-1 max-w-4xl">
              <SearchableSelect
                name="departemen_tujuan"
                options={departments}
                value={formData.departemen_tujuan}
                valueField="name"
                onChange={handleChange}
                placeholder="Pilih departemen tujuan"
              />
            </div>
          </div>

          {/* Template */}
          <div className={`flex ${isMobile ? 'flex-col items-start' : 'items-center'} gap-2 md:gap-8`}>
            <label className={`${isMobile ? 'w-full' : 'w-48'} text-[13px] text-[#3F4254]`}>
              Template
            </label>
            <div className="flex-1 max-w-4xl">
              <SearchableSelect
                name="template"
                options={templates}
                value={formData.template}
                valueField="name"
                onChange={(e) => {
                  const val = e.target.value;
                  const selectedTpl = templates.find(t => t.name === val);
                  setFormData({...formData, template: val, template_id: selectedTpl?.id || ''});
                }}
                placeholder="Pilih template"
              />
            </div>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} items-start gap-2 md:gap-4`}>
            <label className={`${isMobile ? 'w-full' : 'w-52'} text-[13px] text-[#3F4254]`}>Nama {isChecklist ? 'Checklist' : 'WO'} {requiredStar}</label>
            <div className={`${isMobile ? 'w-full' : 'col-span-3'}`}>
              <input
                type="text"
                name="nama_wo"
                value={formData.nama_wo}
                onChange={handleChange}
                placeholder={`Masukkan nama ${isChecklist ? 'Checklist' : 'WO'}`}
                className={inputClass('nama_wo')}
              />
              {errors.nama_wo && <p className="text-[11px] text-[#F1416C] mt-1">{errors.nama_wo}</p>}
            </div>
          </div>

          {/* Deskripsi */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} items-start gap-2 md:gap-4`}>
            <label className={`${isMobile ? 'w-full' : 'w-52'} text-[13px] text-[#3F4254]`}>Deskripsi {requiredStar}</label>
            <div className={`${isMobile ? 'w-full' : 'col-span-3'} relative`}>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                placeholder="Masukkan deskripsi"
                maxLength={1000}
                rows={4}
                className={`${inputClass('deskripsi')} resize-y`}
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-[#A1A5B7]">{formData.deskripsi.length}/1000</span>
              {errors.deskripsi && <p className="text-[11px] text-[#F1416C] mt-1">{errors.deskripsi}</p>}
            </div>
          </div>

          {/* Titik Lokasi */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} items-start gap-2 md:gap-4`}>
            <div className={`${isMobile ? 'w-full' : ''}`}>
              <label className={`${isMobile ? 'w-full' : 'w-52'} text-[13px] text-[#3F4254]`}>Titik lokasi</label>
              <p className="text-[10px] text-[#A1A5B7] mt-0.5">Pilih titik lokasi pekerjaan</p>
            </div>
            <div className={`${isMobile ? 'w-full' : 'col-span-3'}`}>
              <div className="relative mb-2">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
                <input
                  type="text"
                  name="lokasi"
                  value={formData.lokasi}
                  onChange={handleChange}
                  placeholder="Nama jalan / lokasi / gedung"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#E4E6EF] bg-white text-[13px] outline-none focus:border-[#0095E8]"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E4E6EF] rounded-lg text-[12px] text-[#3F4254] font-semibold hover:bg-gray-50 transition-colors">
                <MapPin size={14} className="text-[#0095E8]" /> Pilih Lewat Peta
              </button>
            </div>
          </div>

          {/* Detail Alamat */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} items-start gap-2 md:gap-4`}>
            <label className={`${isMobile ? 'w-full' : 'w-52'} text-[13px] text-[#3F4254]`}>Detail alamat</label>
            <div className={`${isMobile ? 'w-full' : 'col-span-3'} relative`}>
              <textarea
                name="detail_alamat"
                value={formData.detail_alamat}
                onChange={handleChange}
                placeholder="Masukkan detail alamat .."
                maxLength={256}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-[#E4E6EF] bg-white text-[13px] outline-none focus:border-[#0095E8] resize-y"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-[#A1A5B7]">{formData.detail_alamat.length}/256</span>
            </div>
          </div>

          {/* Lampiran */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} items-start gap-2 md:gap-4`}>
            <div className={`${isMobile ? 'w-full' : ''}`}>
              <label className={`${isMobile ? 'w-full' : 'w-52'} text-[13px] text-[#3F4254]`}>Lampiran</label>
              <p className="text-[10px] text-[#A1A5B7] mt-0.5 leading-tight">Pastikan file yang diunggah sesuai dengan panduan kriteria</p>
            </div>
            <div className={`${isMobile ? 'w-full' : 'col-span-3'}`}>
              {uploadedFile ? (
                <div className="flex items-center gap-4 bg-[#F1FAFF] border border-[#D6EEFB] rounded-xl px-5 py-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#E4E6EF] flex items-center justify-center flex-shrink-0">
                    {uploadedFile.type === 'application/pdf' 
                      ? <FileText size={20} className="text-[#F1416C]" />
                      : <Image size={20} className="text-[#0095E8]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#3F4254] truncate">{uploadedFile.filename}</p>
                    <p className="text-[11px] text-[#A1A5B7]">{formatFileSize(uploadedFile.size)}</p>
                  </div>
                  <button 
                    onClick={removeFile}
                    className="w-7 h-7 rounded-full bg-white border border-[#E4E6EF] flex items-center justify-center text-[#A1A5B7] hover:text-[#F1416C] hover:border-[#F1416C] transition-all flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-6">
                  <div 
                    className={`bg-[#F1FAFF] border-2 border-dashed border-[#B5D8F5] rounded-xl p-6 flex flex-col items-center gap-3 min-w-[200px] cursor-pointer hover:bg-[#E1F1FF] transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0095E8" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="12" y2="12" />
                      <line x1="15" y1="15" x2="12" y2="12" />
                    </svg>
                    <p className="text-[11px] text-[#3F4254] text-center">
                      {uploading ? 'Mengunggah...' : 'Pilih atau letakkan PDF atau gambar'}
                    </p>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="px-4 py-1.5 bg-white border border-[#0095E8] rounded-lg text-[11px] text-[#0095E8] font-bold hover:bg-[#F1FAFF] transition-colors"
                    >
                      Pilih file
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-2 text-[11px] text-[#7E8299]">
                    <p>• PDF Maksimum 10 MB</p>
                    <p>• PNG, JPG, JPEG maksimum 3 MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tenggat Waktu */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} items-start gap-2 md:gap-4`}>
            <label className={`${isMobile ? 'w-full' : 'w-52'} text-[13px] text-[#3F4254]`}>Tenggat waktu {requiredStar}</label>
            <div className={`${isMobile ? 'w-full' : 'col-span-3'} flex items-center gap-3`}>
              <div className="flex-1">
                <CustomDatePicker
                  value={formData.tanggal_mulai}
                  onChange={(val) => { setFormData({ ...formData, tanggal_mulai: val }); setErrors({ ...errors, tanggal_mulai: null }); }}
                  placeholder="Pilih tanggal mulai"
                  hasError={!!errors.tanggal_mulai}
                  minDate={new Date().toISOString().split('T')[0]}
                />
                {errors.tanggal_mulai && <p className="text-[11px] text-[#F1416C] mt-1">{errors.tanggal_mulai}</p>}
              </div>
              <span className="text-[#A1A5B7] text-lg self-start mt-2">~</span>
              <div className="flex-1">
                <CustomDatePicker
                  value={formData.tanggal_selesai}
                  onChange={(val) => { setFormData({ ...formData, tanggal_selesai: val }); setErrors({ ...errors, tanggal_selesai: null }); }}
                  placeholder="Pilih tanggal selesai"
                  hasError={!!errors.tanggal_selesai}
                  minDate={formData.tanggal_mulai || new Date().toISOString().split('T')[0]}
                />
                {errors.tanggal_selesai && <p className="text-[11px] text-[#F1416C] mt-1">{errors.tanggal_selesai}</p>}
              </div>
            </div>
          </div>

          {/* Urgensi */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} items-start gap-2 md:gap-4`}>
            <label className={`${isMobile ? 'w-full' : 'w-52'} text-[13px] text-[#3F4254]`}>Urgensi {requiredStar}</label>
            <div className={`${isMobile ? 'w-full' : 'col-span-3'} relative`}>
              <button
                type="button"
                onClick={() => setUrgensiOpen(!urgensiOpen)}
                className={`w-full px-4 py-3 rounded-lg border text-[13px] text-left flex items-center justify-between transition-all ${
                  errors.urgensi ? 'border-[#F1416C] bg-[#FFF5F8]' : 'border-[#E4E6EF] bg-white hover:border-[#0095E8]'
                }`}
              >
                <span className={formData.urgensi ? 'text-[#3F4254]' : 'text-[#A1A5B7]'}>
                  {formData.urgensi || 'Masukkan urgensi'}
                </span>
                <ChevronDown size={16} className={`text-[#A1A5B7] transition-transform ${urgensiOpen ? 'rotate-180' : ''}`} />
              </button>
              {urgensiOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E4E6EF] rounded-lg shadow-lg z-20">
                  {urgensiOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setFormData({ ...formData, urgensi: opt }); setUrgensiOpen(false); setErrors({ ...errors, urgensi: null }); }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                        formData.urgensi === opt
                          ? 'text-[#0095E8] bg-[#F1FAFF] font-semibold'
                          : 'text-[#3F4254] hover:bg-[#F1FAFF] hover:text-[#0095E8]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {errors.urgensi && <p className="text-[11px] text-[#F1416C] mt-1">{errors.urgensi}</p>}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className={`flex ${isMobile ? 'flex-col-reverse px-2' : 'justify-end'} gap-4 mt-12 pt-8 border-t border-slate-100`}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`${basePath}/checklist-riwayat`)}
            className={`px-8 py-4 rounded-2xl text-[14px] font-bold border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all ${isMobile ? 'w-full' : ''}`}
          >
            Batal
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSubmit}
            disabled={loading}
            className={`px-12 py-4 bg-[#0095E8] text-white rounded-2xl text-[15px] font-bold hover:bg-[#0084CC] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50 ${isMobile ? 'w-full' : ''}`}
          >
            {loading ? (
               <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              auditData?.isBatchWO && currentBatchIndex < (auditData?.brokenItems?.length || 0) - 1 ? (
                <>Item Selanjutnya <ChevronRight size={20} /></>
              ) : (
                <><Send size={20} /> Kirim {isChecklist ? 'Checklist' : 'Work Order'}</>
              )
            )}
          </motion.button>
        </div>
      </div>

      {/* Modal Konfirmasi Batch */}
      {showBatchConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && setShowBatchConfirmModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#181C32] px-6 py-6 text-white flex items-center justify-between">
              <h3 className="text-[16px] font-bold flex items-center gap-2">
                <CheckCircle size={18} className="text-[#50CD89]" />
                Konfirmasi Work Order Masal
              </h3>
              <button 
                onClick={() => !loading && setShowBatchConfirmModal(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[14px] text-[#3F4254] mb-2 font-medium">
                Anda telah mengonfigurasi <span className="font-bold text-[#0095E8]">{batchPayloads.length} item</span> Work Order dari temuan audit.
              </p>
              <p className="text-[13px] text-[#A1A5B7] leading-relaxed mb-6">
                Apakah Anda yakin ingin membuat semuanya sekaligus? Masing-masing item akan menjadi Work Order yang terpisah.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBatchConfirmModal(false)}
                  disabled={loading}
                  className="flex-1 py-3 bg-white border border-[#E4E6EF] text-[#7E8299] rounded-xl text-[13px] font-bold hover:bg-[#F5F8FA] transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitBatch}
                  disabled={loading}
                  className="flex-[1.5] py-3 bg-[#0095E8] text-white rounded-xl text-[13px] font-bold hover:bg-[#0084CC] transition-all shadow-lg shadow-[#0095E8]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Membuat...' : `Kirim Semua WO (${batchPayloads.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setZoomedImage(null)} />
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center pointer-events-none">
            <img src={getImageUrl(zoomedImage)} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl pointer-events-auto" alt="Zoomed Temuan" />
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute -top-4 -right-4 sm:top-0 sm:-right-12 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all pointer-events-auto border border-white/20"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BuatTugasDepartemen;
