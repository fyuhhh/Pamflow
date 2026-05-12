import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, ChevronLeft, Trash2, Plus, Copy, GripVertical, Save, X, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import SearchableSelect from './SearchableSelect';

const TemplateForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { success, error: showError } = useModal();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [draggedOptionIndex, setDraggedOptionIndex] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    company_id: user?.company_id || '',
    department_id: '',
    jenis_template: 'checklist',
    details: [
      {
        id: Date.now(),
        nama_detail: '',
        bentuk_laporan: 'Text Field',
        deskripsi: '',
        wajib_diisi: true,
        options: ['Opsi 1'],
        isExpanded: true
      }
    ]
  });

  useEffect(() => {
    fetchCompanies();
    if (isEditMode) {
      fetchTemplate();
    } else if (location.state?.prefilled) {
      const pre = location.state.prefilled;
      setFormData(prev => ({
        ...prev,
        ...pre,
        details: pre.details || prev.details
      }));
    }
  }, [id, location.state]);

  useEffect(() => {
    if (formData.company_id) {
      fetchDepartments(formData.company_id);
    } else {
      setDepartments([]);
    }
  }, [formData.company_id]);

  const fetchCompanies = async () => {
    try {
      const response = await authFetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
        if (!isSuperAdmin && user?.company_id) {
           setFormData(prev => ({ ...prev, company_id: user.company_id }));
        }
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchDepartments = async (companyId) => {
    if (!companyId) return;
    try {
      const response = await authFetch(`/api/departments?company_id=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
        
        // Handle prefilled department name if exists
        if (location.state?.prefilled?.target_dept_name && !formData.department_id) {
          const matched = data.find(d => d.name.toLowerCase() === location.state.prefilled.target_dept_name.toLowerCase());
          if (matched) {
            setFormData(prev => ({ ...prev, department_id: matched.id }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`/api/templates/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name,
          company_id: data.company_id,
          department_id: data.department_id,
          jenis_template: data.jenis_template || 'checklist',
          details: data.details || []
        });
      }
    } catch (err) {
      console.error('Error fetching template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addDetail = () => {
    setFormData({
      ...formData,
      details: [
        ...formData.details,
        {
          id: Date.now(),
          nama_detail: '',
          bentuk_laporan: 'Text Field',
          deskripsi: '',
          wajib_diisi: true,
          options: ['Opsi 1'],
          isExpanded: true
        }
      ]
    });
  };

  const removeDetail = (id) => {
    if (formData.details.length > 1) {
      setFormData({
        ...formData,
        details: formData.details.filter(detail => detail.id !== id)
      });
    }
  };

  const updateDetail = (id, field, value) => {
    setFormData({
      ...formData,
      details: formData.details.map(detail => 
        detail.id === id ? { ...detail, [field]: value } : detail
      )
    });
  };

  const addOption = (detailId) => {
    setFormData({
      ...formData,
      details: formData.details.map(detail => 
        detail.id === detailId 
          ? { ...detail, options: [...detail.options, `Opsi ${detail.options.length + 1}`] } 
          : detail
      )
    });
  };

  const removeOption = (detailId, optionIndex) => {
    setFormData({
      ...formData,
      details: formData.details.map(detail => 
        detail.id === detailId 
          ? { ...detail, options: detail.options.filter((_, idx) => idx !== optionIndex) } 
          : detail
      )
    });
  };

  const updateOption = (detailId, optionIndex, value) => {
    setFormData({
      ...formData,
      details: formData.details.map(detail => 
        detail.id === detailId 
          ? { ...detail, options: detail.options.map((opt, idx) => idx === optionIndex ? value : opt) } 
          : detail
      )
    });
  };

  const toggleExpand = (id) => {
    setFormData({
      ...formData,
      details: formData.details.map(detail => 
        detail.id === id ? { ...detail, isExpanded: !detail.isExpanded } : detail
      )
    });
  };

  const handleDuplicate = (id) => {
    const detailToDuplicate = formData.details.find(d => d.id === id);
    if (detailToDuplicate) {
      const newDetail = {
        ...JSON.parse(JSON.stringify(detailToDuplicate)),
        id: Date.now(),
        isExpanded: true
      };
      const index = formData.details.findIndex(d => d.id === id);
      const newDetails = [...formData.details];
      newDetails.splice(index + 1, 0, newDetail);
      setFormData({ ...formData, details: newDetails });
    }
  };

  const handleDragStart = (e, index, type, detailId) => {
    if (type === 'card') {
      setDraggedItemIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.target.style.opacity = '0.5';
    } else {
      setDraggedOptionIndex(index);
      setActiveDragId(detailId);
    }
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItemIndex(null);
    setDraggedOptionIndex(null);
    setActiveDragId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex, type, targetDetailId) => {
    e.preventDefault();
    if (type === 'card' && draggedItemIndex !== null && draggedItemIndex !== targetIndex) {
      const newDetails = [...formData.details];
      const draggedItem = newDetails[draggedItemIndex];
      newDetails.splice(draggedItemIndex, 1);
      newDetails.splice(targetIndex, 0, draggedItem);
      setFormData({ ...formData, details: newDetails });
    } else if (type === 'option' && draggedOptionIndex !== null && activeDragId === targetDetailId && draggedOptionIndex !== targetIndex) {
      setFormData({
        ...formData,
        details: formData.details.map(detail => {
          if (detail.id === targetDetailId) {
            const newOptions = [...detail.options];
            const draggedOpt = newOptions[draggedOptionIndex];
            newOptions.splice(draggedOptionIndex, 1);
            newOptions.splice(targetIndex, 0, draggedOpt);
            return { ...detail, options: newOptions };
          }
          return detail;
        })
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.company_id || !formData.department_id || !formData.jenis_template) {
      showError('Data Tidak Lengkap', 'Mohon lengkapi informasi dasar template (Nama, Perusahaan, Departemen, dan Jenis).');
      return;
    }
    setLoading(true);
    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode 
        ? `/api/templates/${id}`
        : `/api/templates`;
      const response = await authFetch(url, {
        method,
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        success('Berhasil', `Template berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}`);
        navigate('/pengaturan/template-tugas');
      } else {
        const errorData = await response.json();
        showError('Gagal', errorData.message || 'Gagal menyimpan template.');
      }
    } catch (err) {
      console.error('Error saving template:', err);
      showError('Kesalahan Jaringan', 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const setAllRequired = (val) => {
    setFormData({
      ...formData,
      details: formData.details.map(detail => ({ ...detail, wajib_diisi: val }))
    });
  };

  const labelClass = "text-[13px] font-semibold text-[#3F4254]";
  const requiredStar = <span className="text-[#F1416C] ml-0.5">*</span>;
  const inputClass = "w-full px-4 py-3 rounded-lg border border-[#E4E6EF] bg-white text-[13px] outline-none transition-all focus:border-[#0095E8] focus:ring-1 focus:ring-[#0095E8]/20 text-[#3F4254]";

  return (
    <div className="p-8 px-10 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/pengaturan/template-tugas')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E4E6EF] text-[#7E8299] hover:bg-gray-50 transition-all shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-[17px] font-bold text-[#181C32]">
          {isEditMode ? 'Edit Template' : 'Buat Template'}
        </h2>
      </div>

      {/* Notice Box */}
      <div className="flex items-center gap-2 mb-8 bg-[#F1FAFF] rounded-lg px-4 py-3 border border-[#D6EEFB]">
        <Info size={16} className="text-[#0095E8] flex-shrink-0" />
        <span className="text-[12px] text-[#0095E8] font-medium">Tanda (*) adalah wajib di isi</span>
      </div>

      {/* Main Form Content */}
      <div className="bg-white rounded-xl border border-[#F1F1F4] p-8 shadow-sm">
        <div className="space-y-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className={labelClass}>Perusahaan {requiredStar}</label>
            <div className="col-span-3">
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

          <div className="grid grid-cols-4 items-center gap-4">
            <label className={labelClass}>Departemen {requiredStar}</label>
            <div className="col-span-3">
              <SearchableSelect
                name="department_id"
                options={departments}
                value={formData.department_id}
                onChange={handleChange}
                placeholder="Pilih departemen"
              />
            </div>
          </div>

          {/* Jenis Template */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className={labelClass}>Jenis template {requiredStar}</label>
            <div className="col-span-3 relative">
              <select
                name="jenis_template"
                value={formData.jenis_template}
                onChange={handleChange}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="">Pilih jenis template</option>
                <option value="wo">WO</option>
                <option value="checklist">Checklist</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
            </div>
          </div>

          {/* Nama template */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className={labelClass}>Nama template {requiredStar}</label>
            <div className="col-span-3">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama template"
                className={inputClass}
              />
            </div>
          </div>

          <hr className="border-[#F1F1F4] my-8" />

          {/* Details Section */}
          <div className="space-y-4 pt-4">
            {Array.isArray(formData.details) && formData.details.map((detail, index) => (
              <div 
                key={detail.id} 
                className={`bg-white rounded-xl border overflow-hidden shadow-sm transition-all duration-200 ${draggedItemIndex === index ? 'border-[#0095E8] ring-1 ring-[#0095E8] opacity-50' : 'border-[#E4E6EF]'}`}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, index, 'card')}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index, 'card')}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F1F4]">
                  <div className="flex items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing p-1">
                      <GripVertical size={18} className="text-[#A1A5B7]" />
                    </div>
                    <span className="text-[13px] font-bold text-[#3F4254]">Detail Tugas ke {index + 1}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => handleDuplicate(detail.id)} title="Duplicate" className="text-[#A1A5B7] hover:text-[#0095E8] transition-colors">
                      <Copy size={18} />
                    </button>
                    <button type="button" onClick={() => removeDetail(detail.id)} className="text-[#A1A5B7] hover:text-[#F1416C] transition-colors">
                      <Trash2 size={18} />
                    </button>
                    <button type="button" onClick={() => toggleExpand(detail.id)} className="text-[#A1A5B7] hover:text-[#3F4254] transition-colors">
                      {detail.isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {detail.isExpanded && (
                  <div className="p-8 space-y-6 bg-white">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className={labelClass}>Nama detail tugas {requiredStar}</label>
                      <div className="col-span-3">
                        <input 
                          type="text" 
                          value={detail.nama_detail} 
                          onChange={(e) => updateDetail(detail.id, 'nama_detail', e.target.value)}
                          placeholder="Masukkan nama detail tugas" 
                          className={inputClass} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                      <div>
                        <label className={labelClass}>Bentuk laporan {requiredStar}</label>
                        <p className="text-[10px] text-[#A1A5B7] mt-0.5 leading-tight">Bentuk jawaban yang akan diisi oleh agen</p>
                      </div>
                      <div className="col-span-3 relative">
                        <select 
                          value={detail.bentuk_laporan} 
                          onChange={(e) => updateDetail(detail.id, 'bentuk_laporan', e.target.value)}
                          className={`${inputClass} appearance-none pr-10`}
                        >
                          <option value="">Pilih bentuk laporan detail tugas</option>
                          <option value="Text Field">Text Field</option>
                          <option value="Multiple Choice">Multiple Choice</option>
                          <option value="Dropdown">Dropdown</option>
                          <option value="Image">Image</option>
                          <option value="Multiple Images">Multiple Images</option>
                          <option value="Date">Date</option>
                          <option value="Time">Time</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
                      </div>
                    </div>

                    {/* Options Manager if needed */}
                    {(detail.bentuk_laporan === 'Multiple Choice' || detail.bentuk_laporan === 'Dropdown') && (
                      <div className="grid grid-cols-4 gap-4">
                        <div />
                        <div className="col-span-3 space-y-3 bg-[#F9F9F9] p-4 rounded-lg border border-[#E4E6EF]">
                          {detail.options.map((option, optIndex) => (
                            <div 
                              key={optIndex} 
                              className={`flex items-center gap-3 bg-white p-2 rounded-lg border transition-all ${draggedOptionIndex === optIndex && activeDragId === detail.id ? 'border-[#0095E8] bg-blue-50 opacity-50' : 'border-[#E4E6EF]'}`}
                              draggable="true"
                              onDragStart={(e) => handleDragStart(e, optIndex, 'option', detail.id)}
                              onDragEnd={handleDragEnd}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, optIndex, 'option', detail.id)}
                            >
                              <div className="cursor-grab active:cursor-grabbing p-1">
                                <GripVertical size={16} className="text-[#A1A5B7]" />
                              </div>
                              <span className="text-[11px] font-bold text-[#7E8299] w-4">{optIndex + 1}.</span>
                              <input 
                                type="text" 
                                value={option}
                                onChange={(e) => updateOption(detail.id, optIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border border-[#E4E6EF] rounded-lg text-[13px] outline-none focus:border-[#0095E8]"
                              />
                              <button type="button" onClick={() => removeOption(detail.id, optIndex)} className="text-[#A1A5B7] hover:text-[#F1416C] transition-colors p-1">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <button 
                            type="button" 
                            onClick={() => addOption(detail.id)}
                            className="flex items-center gap-2 text-[#0095E8] text-[12px] font-bold hover:underline"
                          >
                            <Plus size={14} /> Tambah Pilihan
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-4 items-start gap-4">
                      <label className={labelClass}>Deskripsi {requiredStar}</label>
                      <div className="col-span-3 relative">
                        <textarea 
                          value={detail.deskripsi}
                          onChange={(e) => updateDetail(detail.id, 'deskripsi', e.target.value)}
                          placeholder="Masukkan deskripsi detail tugas" 
                          rows="4" 
                          className={`${inputClass} resize-y min-h-[100px]`}
                        ></textarea>
                        <div className="text-right text-[10px] text-[#B5B5C3] mt-1">{detail.deskripsi.length}/500</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <div />
                      <div className="col-span-3 flex items-center gap-3">
                        <div 
                          className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${detail.wajib_diisi ? 'bg-[#0095E8]' : 'bg-[#E4E6EF]'}`}
                          onClick={() => updateDetail(detail.id, 'wajib_diisi', !detail.wajib_diisi)}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${detail.wajib_diisi ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="text-[13px] font-bold text-[#3F4254]">Wajib diisi</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Add Button */}
          <div className="flex justify-end pt-8 gap-4">
            <button 
              type="button" 
              onClick={() => setAllRequired(true)}
              className="flex items-center gap-2 text-[#50CD89] text-[13px] font-bold hover:underline"
            >
              <CheckCircle2 size={18} /> Set Semua Wajib
            </button>
            <button 
              type="button" 
              onClick={addDetail}
              className="flex items-center gap-2 text-[#0095E8] text-[13px] font-bold hover:underline"
            >
              <Plus size={18} /> Tambah Detail Tugas
            </button>
          </div>
        </div>
      </div>

      {/* Persistence Footer */}
      <div className="fixed bottom-0 left-[260px] right-0 bg-white border-t border-[#F1F1F4] px-10 py-6 flex justify-end gap-3 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => navigate('/pengaturan/template-tugas')}
          className="px-8 py-2.5 bg-white border border-[#E4E6EF] rounded-lg text-sm font-bold text-[#7E8299] hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-2.5 bg-[#0095E8] text-white rounded-lg text-sm font-bold hover:bg-[#0084CC] transition-colors disabled:opacity-50 shadow-sm"
        >
          <Save size={18} />
          {loading ? 'Menyimpan...' : 'Simpan Template'}
        </button>
      </div>
    </div>
  );
};

export default TemplateForm;
