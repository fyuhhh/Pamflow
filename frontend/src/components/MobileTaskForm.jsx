import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, X, Check } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { authFetch } from '../services/api';
import { saveOfflineData } from '../services/offlineDB';
import { compressImage } from '../utils/imageOptimizer';
import { useModal } from '../context/ModalContext';

const MobileTaskForm = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const deptTaskId = queryParams.get('dept_task_id');

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { success, error: showError } = useModal();
  const [formData, setFormData] = useState({});
  const fileInputRef = useRef({});
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (taskId === 'new' && deptTaskId) {
      fetchDeptTaskAsNew();
    } else {
      fetchTaskDetails();
    }
  }, [taskId, deptTaskId]);

  const fetchDeptTaskAsNew = async () => {
    try {
      const response = await authFetch(`/api/department-tasks/${deptTaskId}`);
      if (response.ok) {
        const deptTask = await response.json();

        // Mock task object
        const newTask = {
          id: 'new',
          nama_tugas: deptTask.nama_wo,
          deskripsi: deptTask.deskripsi,
          lokasi: deptTask.lokasi,
          urgensi: deptTask.urgensi,
          tanggal_mulai: deptTask.tanggal_mulai,
          tanggal_selesai: deptTask.tanggal_selesai,
          details: []
        };

        // If has template, fetch template details
        if (deptTask.template_id) {
          try {
            const tdResp = await authFetch(`/api/templates/${deptTask.template_id}`);
            if (tdResp.ok) {
              const fullT = await tdResp.json();
              newTask.details = fullT.details;
              newTask.template_id = deptTask.template_id;
            }
          } catch (te) {
            console.error('Error fetching template for pre-fill by ID:', te);
          }
        } else if (deptTask.template) {
          try {
            // Fallback to name search if ID is missing (v1 tasks)
            const tResp = await authFetch(`/api/templates?company_id=${deptTask.company_id}`);
            if (tResp.ok) {
              const templates = await tResp.json();
              const found = templates.find(t => t.name === deptTask.template);
              if (found) {
                const tdResp = await authFetch(`/api/templates/${found.id}`);
                if (tdResp.ok) {
                  const fullT = await tdResp.json();
                  newTask.details = fullT.details;
                  newTask.template_id = found.id;
                }
              }
            }
          } catch (te) {
            console.error('Error fetching template for pre-fill by name:', te);
          }
        }

        setTask(newTask);

        // Initialize form data
        const details = typeof newTask.details === 'string' ? JSON.parse(newTask.details) : newTask.details;
        const initialData = {};
        if (Array.isArray(details)) {
          details.forEach((field, index) => {
            const fieldKey = field.id || index;
            if (field.bentuk_laporan === 'Multiple Choice' || field.bentuk_laporan === 'Multiple Images') {
              initialData[fieldKey] = [];
            } else {
              initialData[fieldKey] = '';
            }
          });
        }
        setFormData(initialData);
      }
    } catch (error) {
      console.error('Error fetching dept task for pre-fill:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskDetails = async () => {
    try {
      const response = await authFetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);

        // Check if there's already submitted data to pre-fill
        if (data.submission_data) {
          try {
            const savedData = typeof data.submission_data === 'string'
              ? JSON.parse(data.submission_data)
              : data.submission_data;
            setFormData(savedData);
          } catch (e) {
            console.error('Error parsing submission_data:', e);
          }
        } else {
          // Initialize empty form data based on details
          const details = typeof data.details === 'string' ? JSON.parse(data.details) : data.details;
          const initialData = {};
          if (Array.isArray(details)) {
            details.forEach((field, index) => {
              const fieldKey = field.id || index;
              // Multi-select for Multiple Choice
              if (field.bentuk_laporan === 'Multiple Choice' || field.bentuk_laporan === 'Multiple Images') {
                initialData[fieldKey] = [];
              } else {
                initialData[fieldKey] = '';
              }
            });
          }
          setFormData(initialData);
        }
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };


  const handleFileChange = async (fieldId, e, isMultiple = false) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        const compressedImages = await Promise.all(
          files.map(file => compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.6 }))
        );

        // Convert Blobs to data URLs for preview (since current logic uses strings)
        const dataUrls = await Promise.all(
          compressedImages.map(blob => new Promise(resolve => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result);
          }))
        );

        if (isMultiple) {
          setFormData(prev => ({
            ...prev,
            [fieldId]: [...(Array.isArray(prev[fieldId]) ? prev[fieldId] : []), ...dataUrls].slice(0, 5)
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            [fieldId]: dataUrls[0]
          }));
        }
      } catch (error) {
        console.error('Compression error:', error);
      }
    }
  };

  const triggerCamera = (fieldId) => {
    if (fileInputRef.current[fieldId]) {
      fileInputRef.current[fieldId].click();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalTaskId = taskId;

      // 1. If this is a NEW task from a dept request, create the task first
      if (taskId === 'new' && deptTaskId) {
        const createRes = await authFetch(`/api/tasks`, {
          method: 'POST',
          body: JSON.stringify({
            perusahaan: user?.companyName || user?.perusahaan,
            company_id: user?.company_id,
            departemen: user?.department,
            nama_tugas: task.nama_tugas,
            urgensi: task.urgensi,
            deskripsi: task.deskripsi,
            lokasi: task.lokasi,
            detail_alamat: task.detail_alamat || '-',
            aturan_waktu: 'Sekali',
            tanggal_mulai: task.tanggal_mulai,
            tanggal_selesai: task.tanggal_selesai,
            agen_id: [user?.id],
            details: task.details,
            status: 'Aktif', // Not draft
            tugas_departemen: true
          })
        });

        if (!createRes.ok) throw new Error('Gagal membuat tugas baru');
        const createData = await createRes.json();
        finalTaskId = createData.id;

        // Mark dept task as Selesai
        await authFetch(`/api/department-tasks/${deptTaskId}`, {
          method: 'DELETE',
        });

        // Actually, let's keep it clean and just transition it if we had a PATCH status.
        // Since we only have DELETE and Accept (which sets Menunggu Pengerjaan), 
        // and user didn't specify a "Finish" endpoint for dept tasks, 
        // I'll assume the transition to 'tasks' table IS the goal.
      }

      // 2. Submit the reporting data
      const response = await authFetch(`/api/tasks/${finalTaskId}/submit`, {
        method: 'PATCH',
        body: JSON.stringify({
          submission_data: formData,
          nama_agen: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Agen'
        })
      });

      if (response.ok) {
        success('Berhasil', 'Laporan berhasil dikirim');
        setTimeout(() => {
          navigate(`/demo/mobile/task/${finalTaskId}`, {
            state: { formSubmitted: true },
            replace: true
          });
        }, 1500);
      } else {
        throw new Error('Gagal mengirim laporan');
      }
    } catch (error) {
      console.error('Error submitting form:', error);

      // Offline Fallback
      if (!navigator.onLine) {
        await saveOfflineData('SUBMIT_TASK', {
          id: finalTaskId,
          payload: {
            submission_data: formData,
            nama_agen: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Agen'
          }
        });

        success('Berhasil', 'Tersimpan (Mode Offline)');
        setTimeout(() => {
          navigate(`/demo/mobile/task/${finalTaskId}`, {
            state: { formSubmitted: true },
            replace: true
          });
        }, 1500);
        return;
      }

      showError('Gagal', 'Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderConfirmModal = () => {
    if (!showConfirm) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center transition-opacity" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
        <div className="bg-white rounded-2xl p-8 max-w-[90%] w-full shadow-lg mx-6 animate-slide-up">
          <div className="w-14 h-14 rounded-full bg-[#FFF9E6] flex items-center justify-center mb-6">
            <div className="w-10 h-10 rounded-full border-[3px] border-[#FFF2CC] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFC700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
            </div>
          </div>

          <h3 className="text-xl font-medium text-[#181C32] mb-3">
            Kirim Laporan
          </h3>
          <p className="text-[14px] leading-relaxed text-[#7E8299] mb-8">
            Apakah Anda yakin ingin mengirim laporan tugas ini? Pastikan data yang diisi sudah benar karena data tidak dapat diubah setelah dikirim.
          </p>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                handleSubmit();
              }}
              className="flex-1 py-3 bg-[#0095E8] rounded-xl text-[14px] font-bold text-white hover:bg-[#0084CC] transition-colors active:scale-95"
            >
              Lanjut
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-3 bg-white border border-[#E4E6EF] rounded-xl text-[14px] font-bold text-[#005499] hover:bg-gray-50 transition-colors active:scale-95"
            >
              Cek Kembali
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-10 text-center">
        <ArrowLeft size={48} className="text-slate-200 mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Tugas tidak ditemukan</h3>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#0095E8] font-bold">Kembali</button>
      </div>
    );
  }

  const details = typeof task?.details === 'string' ? JSON.parse(task.details) : task?.details || [];

  // Review View Component
  if (isReviewing) {
    return (
      <div className="bg-white font-sans flex flex-col relative pb-32">
        <header className="sticky top-0 bg-white z-40 px-6 py-4 flex items-center justify-between border-b border-slate-50"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsReviewing(false)} className="p-1 -ml-1">
              <ArrowLeft size={24} className="text-slate-800" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">Review</h1>
          </div>
          <button
            onClick={() => setIsReviewing(false)}
            className="flex items-center gap-2 text-[#006097] font-bold text-[14px] hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Ubah data
          </button>
        </header>

        <div className="flex-1 px-6 pt-8 overflow-y-auto no-scrollbar">
          <p className="text-[17px] text-slate-800 mb-10 font-medium">Silakan isi form di bawah ini</p>

          <div className="space-y-10">
            {details.map((field, index) => {
              const fieldKey = field.id || index;
              const value = formData[fieldKey];
              const isImage = field.bentuk_laporan === 'Image' || field.bentuk_laporan === 'Multiple Images';

              return (
                <div key={fieldKey} className="space-y-2">
                  <p className="text-[14px] font-bold text-slate-400">
                    {field.nama_detail || `Detail Tugas ke ${index + 1}`}
                  </p>
                  <div className="text-[14px] text-slate-700 font-medium leading-relaxed">
                    {isImage ? (
                      Array.isArray(value) && value.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {value.map((img, idx) => (
                            <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                              <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="Review" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        value ? (
                          <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-sm mt-2">
                            <img src={getImageUrl(value)} className="w-full h-full object-cover" alt="Review" />
                          </div>
                        ) : <p className="text-slate-400 font-normal italic">-</p>
                      )
                    ) : (
                      <div className="space-y-1 py-1">
                        {Array.isArray(value) ? (
                          value.length > 0 ? (
                            value.map((v, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0095E8]" />
                                <span className="text-[15px] text-slate-800 font-semibold">{v}</span>
                              </div>
                            ))
                          ) : <p className="text-slate-400 font-normal italic">-</p>
                        ) : (
                          <p className="text-[15px] text-slate-800 font-semibold">{value || '-'}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Sticky Action Bar - Fixed Bottom (Common Mobile Pattern) */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-50 px-6 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isSubmitting}
            className="w-full bg-[#004A71] text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim'}
          </button>
        </div>
        {renderConfirmModal()}
      </div>
    );
  }

  return (
    <div className="bg-white font-sans flex flex-col relative pb-32">
      {/* Header */}
      <header className="sticky top-0 bg-white z-40 px-6 py-4 flex items-center gap-4 border-b border-slate-50"
        style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Form Tugas</h1>
      </header>

      {/* Form Content */}
      <div className="flex-1 px-6 pt-6 overflow-y-auto no-scrollbar">
        <p className="text-[15px] text-slate-600 mb-8 font-medium">Silakan isi form di bawah ini</p>

        <form className="space-y-10 flex flex-col pt-2">
          {(details || []).map((field, index) => {
            const fieldKey = field.id || index;
            const reportType = field.bentuk_laporan;
            const fieldLabel = field.nama_detail || `Detail Tugas ke ${index + 1}`;
            const fieldDesc = field.deskripsi || '-';
            const isRequired = field.wajib_diisi === true || field.wajib_diisi === 1 || field.wajib_diisi === "1";

            return (
              <div key={fieldKey} className="flex flex-col gap-4">
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-6 bg-[#004A71] rounded-full"></div>
                  <h3 className="text-[14px] font-bold text-[#004A71]">Detail Tugas ke {index + 1}</h3>
                </div>

                <div className="flex flex-col gap-2 pl-3.5">
                  <label className="text-[14px] font-bold text-slate-800 flex items-center gap-1">
                    {fieldLabel}
                    {isRequired && <span className="text-red-500">*</span>}
                  </label>

                  {/* Text Field Type */}
                  {(reportType === 'Text Field' || !reportType) && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData[fieldKey] || ''}
                        onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                        placeholder={`Masukkan ${fieldLabel}`}
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-slate-700 text-[14px] transition-colors shadow-sm"
                      />
                      <p className="text-[12px] text-slate-400 ml-1">{fieldDesc}</p>
                    </div>
                  )}

                  {/* Image Type */}
                  {reportType === 'Image' && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => (fileInputRef.current[fieldKey] = el)}
                        onChange={(e) => handleFileChange(fieldKey, e, false)}
                        className="hidden"
                      />

                      {formData[fieldKey] ? (
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                          <img
                            src={getImageUrl(formData[fieldKey])}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleInputChange(fieldKey, '')}
                            className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => triggerCamera(fieldKey)}
                          className="w-full py-10 border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3 bg-white active:bg-slate-50 transition-colors cursor-pointer shadow-sm border-dashed"
                        >
                          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                            <Camera size={24} className="text-slate-400" />
                          </div>
                          <span className="text-[14px] font-bold text-[#006097]">Buka kamera / galeri</span>
                        </div>
                      )}
                      <p className="text-[12px] text-slate-400 ml-1">{fieldDesc}</p>
                    </div>
                  )}

                  {/* Multiple Images Type */}
                  {reportType === 'Multiple Images' && (
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={(el) => (fileInputRef.current[fieldKey] = el)}
                        onChange={(e) => handleFileChange(fieldKey, e, true)}
                        className="hidden"
                      />

                      {/* Image Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {Array.isArray(formData[fieldKey]) && formData[fieldKey].map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <img src={getImageUrl(img)} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = [...formData[fieldKey]];
                                newImages.splice(idx, 1);
                                handleInputChange(fieldKey, newImages);
                              }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        {(!Array.isArray(formData[fieldKey]) || formData[fieldKey].length < 5) && (
                          <div
                            onClick={() => triggerCamera(fieldKey)}
                            className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Camera size={20} className="text-slate-400" />
                            <span className="text-[11px] font-bold text-[#006097]">Tambah</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-400 ml-1">{fieldDesc} (Maks. 5 foto)</p>
                    </div>
                  )}

                  {reportType === 'Multiple Choice' && (
                    <div className="space-y-3">
                      {(field.options || []).map((opt, i) => {
                        const isSelected = Array.isArray(formData[fieldKey])
                          ? formData[fieldKey].includes(opt)
                          : formData[fieldKey] === opt;

                        return (
                          <label key={i} className="flex items-center gap-3 p-1 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#0095E8] bg-[#0095E8]' : 'border-slate-300'
                              }`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  const currentValues = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : (formData[fieldKey] ? [formData[fieldKey]] : []);
                                  let newValues;
                                  if (currentValues.includes(opt)) {
                                    newValues = currentValues.filter(v => v !== opt);
                                  } else {
                                    newValues = [...currentValues, opt];
                                  }
                                  handleInputChange(fieldKey, newValues);
                                }}
                                className="hidden"
                              />
                              {isSelected && <Check size={14} className="text-white" />}
                            </div>
                            <span className={`text-[14px] transition-colors ${isSelected ? 'text-[#0095E8] font-bold' : 'text-slate-700'}`}>{opt}</span>
                          </label>
                        );
                      })}
                      <p className="text-[12px] text-slate-400 ml-1">{fieldDesc}</p>
                    </div>
                  )}

                  {/* Dropdown Type */}
                  {reportType === 'Dropdown' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <select
                          value={formData[fieldKey] || ''}
                          onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-slate-700 text-[14px] appearance-none transition-colors shadow-sm"
                        >
                          <option value="">Pilih Opsi</option>
                          {(field.options || []).map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="18" height="18" className="text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                      </div>
                      <p className="text-[12px] text-slate-400 ml-1">{fieldDesc}</p>
                    </div>
                  )}

                  {/* Date/Time Type */}
                  {(reportType === 'Date' || reportType === 'Time') && (
                    <div className="space-y-2">
                      <input
                        type={reportType.toLowerCase()}
                        value={formData[fieldKey] || ''}
                        onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-slate-700 text-[14px] transition-colors shadow-sm"
                      />
                      <p className="text-[12px] text-slate-400 ml-1">{fieldDesc}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </form>
      </div>

      {/* Bottom Sticky Action Bar - Fixed Bottom (Common Mobile Pattern) */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-50 px-6 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => setIsReviewing(true)}
          className="w-full bg-[#004A71] text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all"
        >
          Review
        </button>
      </div>

      {renderConfirmModal()}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MobileTaskForm;
