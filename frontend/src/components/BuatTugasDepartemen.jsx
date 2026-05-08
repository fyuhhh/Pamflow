import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Info, MapPin, ChevronDown, CheckCircle, X, FileText, Image, AlertTriangle, Send } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import CustomDatePicker from './CustomDatePicker';
import SearchableSelect from './SearchableSelect';

const BuatTugasDepartemen = ({ taskType = 'wo' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError } = useModal();
  const user = JSON.parse(localStorage.getItem('user'));
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

  useEffect(() => {
    // Priority: useLocation state, fallback to window.history.state
    const state = location.state || window.history.state?.usr;
    console.log('DEBUG: Checking for audit state:', state);

    if (state?.fromAudit) {
      console.log('DEBUG: Audit data found! Processing...', state);
      setAuditData(state);
      setFormData(prev => ({
        ...prev,
        nama_wo: `Perbaikan ${state.templateName || 'Temuan'} - ${state.shift || ''}`,
        departemen_tujuan: state.targetDept || 'ENGINEERING',
        deskripsi: `WO dibuat otomatis dari audit #SES-${state.session_id}.`,
        urgensi: 'Kritis',
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        checklist_session_id: state.session_id,
        wo_items: (state.brokenItems || []).map(item => ({
          id: item.id,
          name: item.name,
          original_notes: item.notes || 'Temuan audit',
          original_photo: item.photo_url || '',
          status: 'pending'
        }))
      }));
    }
  }, [location.state]);
  
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
    setLoading(true);

    try {
      const response = await authFetch('/api/department-tasks', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        success('Berhasil', 'Tugas departemen berhasil dibuat!');
        navigate('/tugas-departemen/terkirim');
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

  const inputClass = (field) => `w-full px-4 py-3 rounded-lg border text-[13px] outline-none transition-all ${
    errors[field] ? 'border-[#F1416C] bg-[#FFF5F8]' : 'border-[#E4E6EF] bg-white focus:border-[#0095E8] focus:ring-1 focus:ring-[#0095E8]/20'
  }`;

  const labelClass = "text-[13px] font-semibold text-[#3F4254]";
  const requiredStar = <span className="text-[#F1416C] ml-0.5">*</span>;

  return (
    <div className="p-8 px-10 pb-24">
      {/* Notice */}
      <div className="flex items-center gap-2 mb-8 bg-[#F1FAFF] rounded-lg px-4 py-3 border border-[#D6EEFB]">
        <Info size={16} className="text-[#0095E8] flex-shrink-0" />
        <span className="text-[12px] text-[#0095E8] font-medium">Tanda (*) adalah wajib di isi</span>
      </div>

      {/* Audit Findings Section */}
      {auditData && formData.wo_items.length > 0 && (
        <div className="bg-white rounded-xl border border-[#F1416C]/20 p-8 mb-6 overflow-hidden relative">
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
              <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-[#FFF5F8] border border-[#F1416C]/10 group transition-all hover:bg-white hover:shadow-md">
                <div className="w-6 text-[11px] font-mono text-[#F1416C]/50 pt-0.5">{idx + 1}</div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[#181C32]">{item.name}</p>
                  {item.original_notes && (
                    <p className="text-[12px] text-[#F1416C] mt-1 font-medium bg-white/50 px-2 py-1 rounded inline-block border border-[#F1416C]/5">
                      Catatan: {item.original_notes}
                    </p>
                  )}
                  
                  {item.original_photo && (
                    <div className="mt-3 w-32 h-20 rounded-lg overflow-hidden border border-[#F1416C]/20 bg-white">
                      <img src={item.original_photo} className="w-full h-full object-cover" alt="Temuan" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="px-2 py-1 bg-[#F1416C] text-white rounded text-[10px] font-bold uppercase tracking-wider">
                    Rusak
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const newItems = formData.wo_items.filter((_, i) => i !== idx);
                      setFormData({ ...formData, wo_items: newItems });
                    }}
                    className="p-1.5 rounded-lg bg-white border border-[#E4E6EF] text-[#F1416C] hover:bg-[#FFF5F8] transition-all shadow-sm"
                    title="Batalkan item ini"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-[#F1FAFF] rounded-lg border border-[#D6EEFB] flex items-start gap-3">
            <Info size={16} className="text-[#0095E8] mt-0.5" />
            <p className="text-[12px] text-[#0095E8] leading-relaxed">
              Daftar di atas adalah item yang akan diperbaiki. Anda dapat menghapus item yang tidak perlu dikerjakan sekarang dengan mengklik ikon silang di kanan item.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#F1F1F4] p-8">
        <h2 className="text-[15px] font-bold text-[#0095E8] mb-8">Informasi Tugas</h2>

        <div className="space-y-6">
          {/* Perusahaan */}
          <div className="flex items-center gap-8">
            <label className="w-48 text-[13px] font-semibold text-[#3F4254]">
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
          <div className="flex items-center gap-8">
            <label className="w-48 text-[13px] font-semibold text-[#3F4254]">
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
          <div className="flex items-center gap-8">
            <label className="w-48 text-[13px] font-semibold text-[#3F4254]">
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
          <div className="flex items-center gap-8">
            <label className="w-48 text-[13px] font-semibold text-[#3F4254]">
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
          <div className="flex items-center gap-8">
            <label className="w-48 text-[13px] font-semibold text-[#3F4254]">
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

          <div className="grid grid-cols-4 items-start gap-4">
            <label className={labelClass}>Nama {isChecklist ? 'Checklist' : 'WO'} {requiredStar}</label>
            <div className="col-span-3">
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
          <div className="grid grid-cols-4 items-start gap-4">
            <label className={labelClass}>Deskripsi {requiredStar}</label>
            <div className="col-span-3 relative">
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
          <div className="grid grid-cols-4 items-start gap-4">
            <div>
              <label className="text-[13px] font-semibold text-[#0095E8]">Titik lokasi</label>
              <p className="text-[10px] text-[#A1A5B7] mt-0.5">Pilih titik lokasi pekerjaan</p>
            </div>
            <div className="col-span-3">
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
          <div className="grid grid-cols-4 items-start gap-4">
            <label className={labelClass}>Detail alamat</label>
            <div className="col-span-3 relative">
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
          <div className="grid grid-cols-4 items-start gap-4">
            <div>
              <label className="text-[13px] font-semibold text-[#0095E8]">Lampiran</label>
              <p className="text-[10px] text-[#A1A5B7] mt-0.5 leading-tight">Pastikan file yang diunggah sesuai dengan panduan kriteria</p>
            </div>
            <div className="col-span-3">
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
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-[13px] font-semibold text-[#0095E8]">Tenggat waktu {requiredStar}</label>
            <div className="col-span-3 flex items-center gap-3">
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
          <div className="grid grid-cols-4 items-start gap-4">
            <label className={labelClass}>Urgensi {requiredStar}</label>
            <div className="col-span-3 relative">
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
        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-[#F1F1F4]">
          <button
            onClick={() => navigate('/tugas-departemen/terkirim')}
            className="px-8 py-2.5 border border-[#E4E6EF] rounded-lg text-[13px] font-bold text-[#7E8299] hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2.5 bg-[#0095E8] rounded-lg text-[13px] font-bold text-white hover:bg-[#0084CC] transition-colors disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Buat'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default BuatTugasDepartemen;
