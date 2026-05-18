import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Info, MapPin, ChevronDown, ChevronRight, ChevronLeft, ChevronUp, AlertTriangle, GripVertical, Link as LinkIcon, Trash2, Plus, Copy, CheckCircle, X } from 'lucide-react';
import { authFetch } from '../services/api';
import { hasPermission } from '../utils/permissions';
import { useModal } from '../context/ModalContext';
import CustomDatePicker from './CustomDatePicker';
import CustomTimePicker from './CustomTimePicker';
import SearchableSelect from './SearchableSelect';
import { getImageUrl } from '../utils/imageUrl';
import API_URL from '../config';

const InfoTooltip = ({ text }) => (
  <div className="relative flex items-center group cursor-help ml-1">
    <Info size={14} className="text-[#B5B5C3] group-hover:text-[#7E8299] transition-colors" />
    <div className="absolute bottom-[100%] mb-2 left-1/2 -translate-x-1/2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 w-max bg-[#333333] text-white text-xs py-2 px-3 rounded z-50 shadow-md">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#333333]"></div>
    </div>
  </div>
);

const BuatTugas = ({ taskType = 'checklist' }) => {
  const navigate = useNavigate();
  const { success, error: showError } = useModal();
  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [dropdownPengulanganOpen, setDropdownPengulanganOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [draggedOptionIndex, setDraggedOptionIndex] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [agens, setAgens] = useState([]);
  const [managers, setManagers] = useState([]);
  const [sourceDeptTask, setSourceDeptTask] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  const currentCompanyId = user?.company_id || 1;
  const role = user?.role?.toLowerCase();
  const isSuperAdmin = role === 'super admin' || role?.includes('super admin') || role?.includes('superadmin');

  const location = useLocation();
  const [auditData, setAuditData] = useState(null);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);

  useEffect(() => {
    const state = location.state || window.history.state?.usr;
    if (state?.fromAudit && state.brokenItems && state.brokenItems.length > 0) {
      setAuditData(state);

      const isBatch = state.isBatchWO;
      const itemsToProcess = isBatch ? [state.brokenItems[currentBatchIndex || 0]] : state.brokenItems;

      // Auto-generate locked 2-field audit template per item
      const buildAuditTemplate = (item, idx) => [
        {
          id: `kondisi_${Date.now()}_${idx}`,
          nama_detail: 'Kondisi Fisik Barang',
          bentuk_laporan: 'Text Field',
          deskripsi: 'Deskripsikan kondisi fisik barang saat ini secara detail',
          wajib_diisi: true,
          isAuditLocked: true,
          isExpanded: true
        },
        {
          id: `foto_${Date.now()}_${idx}`,
          nama_detail: 'Foto Kondisi Barang',
          bentuk_laporan: 'Multiple Images',
          deskripsi: 'Ambil foto kondisi barang (maks. 5 foto)',
          wajib_diisi: true,
          isAuditLocked: true,
          isExpanded: true
        }
      ];

      const firstItem = itemsToProcess[0];
      const taskTitle = `Kerusakan ${firstItem?.name || (state.templateName || 'Temuan')}`;

      setFormData(prev => ({
        ...prev,
        nama_tugas: taskTitle,
        departemen: state.targetDept || prev.departemen,
        deskripsi: `WO dibuat otomatis dari audit #SES-${state.session_id}${isBatch ? ` untuk item ${firstItem?.name || ''}` : ''}.`,
        urgensi: 'Tinggi',
        aturan_waktu: 'Waktu Fleksibel',
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        tugas_departemen: true,
        isAuditTemplate: true,
        auditItemName: firstItem?.name || '',
        auditOriginalPhotos: firstItem?.photo_urls || (firstItem?.photo_url ? [firstItem.photo_url] : []),
        auditOriginalVideo: firstItem?.video_url || '',
        auditOriginalNotes: firstItem?.notes || '',
        checklist_session_id: state.session_id,
        details: buildAuditTemplate(firstItem, 0)
      }));
    }
  }, [location.state, currentBatchIndex]);

  const [formData, setFormData] = useState(() => {
    const base = {
      perusahaan: 'Ewalk Pentacity Mall',
      company_id: '1',
      departemen: user?.department || 'IT',
      nama_tugas: '',
      urgensi: '',
      nomor_perintah_kerja: '',
      deskripsi: '',
      lokasi: '',
      detail_alamat: '',
      aturan_waktu: 'Sesuai Waktu',
      tanggal_mulai: '',
      waktu_mulai: '',
      tanggal_selesai: '',
      waktu_selesai: '',
      pengulangan: false,
      jenis_pengulangan: '',
      waktu_berakhir: 'Pada tanggal',
      tanggal_pengulangan_berakhir: '',
      kali_pengulangan: 0,
      tugas_departemen: true,
      dept_task_id: null,
      agen_id: '',
      verifikasi_kehadiran: false,
      maksimum_radius: '',
      selfie: 'Tidak',
      persetujuan: 'Ya',
      admin_pemeriksa_id: '',
      checklist_session_id: null,
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
    };

    return base;
  });

  useEffect(() => {
    fetchCompanies();
    fetchAgens();
  }, []);

  const fetchAgens = async () => {
    try {
      if (!user?.department) return;

      // Fetch users from the same department
      const response = await authFetch(`/api/users?department=${encodeURIComponent(user.department)}&company_id=${currentCompanyId}&type=agen`);
      if (response.ok) {
        const data = await response.json();
        setAgens(data);
      }
    } catch (err) {
      console.error('Error fetching agens:', err);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await authFetch(`/api/users?company_id=${currentCompanyId}&role=Manager`);
      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
    }
  };



  const fetchCompanies = async () => {
    try {
      const response = await authFetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);

        // If not super admin, force the numeric company_id
        if (!isSuperAdmin && currentCompanyId) {
          const myComp = data.find(c => String(c.id) === String(currentCompanyId));
          setFormData(prev => ({
            ...prev,
            company_id: currentCompanyId,
            perusahaan: myComp ? (myComp.name || myComp.companyId) : 'Ewalk Pentacity Mall'
          }));
        } else if (data.length > 0) {
          // If company_id is already 1, just ensure name is synced
          const comp1 = data.find(c => String(c.id) === "1" || c.companyId === 'PAM');
          if (comp1) {
            setFormData(prev => ({
              ...prev,
              company_id: comp1.id,
              perusahaan: comp1.name || comp1.companyId
            }));
          } else if (!formData.company_id) {
            setFormData(prev => ({
              ...prev,
              company_id: data[0].id,
              perusahaan: data[0].name || data[0].companyId
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchDepartments = async (companyId) => {
    if (!companyId) {
      setDepartments([]);
      return;
    }
    try {
      const response = await authFetch(`/api/departments?company_id=${companyId}`);
      if (response.ok) {
        let data = await response.json();

        // Filter based on audit relations if applicable
        const state = location.state || window.history.state?.usr;
        if (state?.availableTargetDepts && state.availableTargetDepts.length > 0) {
          data = data.filter(d => state.availableTargetDepts.includes(d.name));
        }

        setDepartments(data);

        // Update formData.departemen if current one is not in the list
        if (data.length > 0) {
          const exists = data.some(d => d.name === formData.departemen);
          if (!exists && !fetchingTaskRef.current) {
            setFormData(prev => ({ ...prev, departemen: data[0].name }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${mins}`;
    } catch { return '-'; }
  };

  const fetchingTaskRef = React.useRef(false);
  const templateAutoAppliedRef = React.useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deptTaskId = params.get('from_dept_task');

    if (auditData?.fromAudit) {
      setSourceDeptTask({ isAudit: true, ...auditData });
    } else if (deptTaskId) {
      const fetchDeptTask = async () => {
        try {
          const response = await authFetch(`/api/department-tasks/${deptTaskId}`);
          if (response.ok) {
            const task = await response.json();
            setSourceDeptTask(task);

            // Parse wo_items if present
            let sourceItems = [];
            if (task.wo_items) {
              sourceItems = typeof task.wo_items === 'string' ? JSON.parse(task.wo_items) : task.wo_items;
            }

            // If sourced from audit checklist → auto-generate locked 2-field template per item
            const isFromAuditWO = sourceItems.length > 0 && task.checklist_session_id;

            let resolvedDetails;
            if (isFromAuditWO) {
              const firstItem = sourceItems[0];
              resolvedDetails = [
                {
                  id: `kondisi_${Date.now()}`,
                  nama_detail: 'Kondisi Fisik Barang',
                  bentuk_laporan: 'Text Field',
                  deskripsi: 'Deskripsikan kondisi fisik barang saat ini secara detail',
                  wajib_diisi: true,
                  isAuditLocked: true,
                  isExpanded: true
                },
                {
                  id: `foto_${Date.now() + 1}`,
                  nama_detail: 'Foto Kondisi Barang',
                  bentuk_laporan: 'Multiple Images',
                  deskripsi: 'Ambil foto kondisi barang (maks. 5 foto)',
                  wajib_diisi: true,
                  isAuditLocked: true,
                  isExpanded: true
                }
              ];

              setAuditData({
                session_id: task.checklist_session_id,
                templateName: task.template || 'Work Order',
                shift: '',
                brokenItems: sourceItems,
                fromAudit: true
              });
            } else {
              resolvedDetails = sourceItems.length > 0
                ? sourceItems.map((item, idx) => ({
                    id: Date.now() + idx,
                    nama_detail: item.name,
                    bentuk_laporan: 'Checkbox',
                    deskripsi: item.original_notes || 'Perbaikan temuan audit',
                    wajib_diisi: true,
                    options: ['Selesai Diperbaiki'],
                    isExpanded: idx === 0,
                    original_photos: item.original_photos || (item.original_photo ? [item.original_photo] : []),
                    original_video: item.original_video || item.video_url || ''
                  }))
                : (task.details || []);
            }

            const autoTaskTitle = isFromAuditWO
              ? `Kerusakan ${sourceItems[0]?.name || task.nama_wo || ''}`
              : (task.nama_wo || '');

            setFormData(prev => ({
              ...prev,
              nama_tugas: autoTaskTitle,
              perusahaan: task.perusahaan || prev.perusahaan,
              departemen: task.departemen_tujuan || prev.departemen,
              urgensi: task.urgensi || '',
              nomor_perintah_kerja: '',
              deskripsi: task.deskripsi || '',
              lokasi: task.lokasi || '',
              detail_alamat: task.detail_alamat || '',
              aturan_waktu: 'Waktu Fleksibel',
              tanggal_mulai: task.tanggal_mulai ? task.tanggal_mulai.substring(0, 10) : '',
              tanggal_selesai: task.tanggal_selesai ? task.tanggal_selesai.substring(0, 10) : '',
              dept_task_id: task.id,
              tugas_departemen: true,
              isAuditTemplate: isFromAuditWO,
              auditItemName: isFromAuditWO ? (sourceItems[0]?.name || '') : '',
              auditOriginalPhotos: isFromAuditWO ? (sourceItems[0]?.original_photos || (sourceItems[0]?.original_photo ? [sourceItems[0].original_photo] : [])) : [],
              auditOriginalVideo: isFromAuditWO ? (sourceItems[0]?.original_video || '') : '',
              auditOriginalNotes: isFromAuditWO ? (sourceItems[0]?.original_notes || '') : '',
              checklist_session_id: isFromAuditWO ? task.checklist_session_id : null,
              details: resolvedDetails
            }));
          }
        } catch (err) {
          console.error('Error fetching source department task:', err);
        }
      };
      fetchDeptTask();
    }
  }, [location.state, location.search]);

  useEffect(() => {
    if (formData.company_id) {
      fetchDepartments(formData.company_id);
    }
  }, [formData.company_id]);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!formData.company_id) {
        setTemplates([]);
        return;
      }

      try {
        let params = new URLSearchParams({
          company_id: formData.company_id,
          jenis_template: taskType
        });
        if (formData.departemen && departments.length > 0) {
          const selectedDept = departments.find(d => String(d.name).toLowerCase() === String(formData.departemen).toLowerCase());
          if (selectedDept) {
            params.append('department_id', selectedDept.id);
          }
        }

        const response = await authFetch(`/api/templates?${params.toString()}`);
        if (response.ok) {
          let data = await response.json();

          // CRITICAL: If coming from a WO and that WO's template is NOT in this dept's list,
          // we MUST fetch it specifically so it can be selected and applied.
          if (sourceDeptTask?.template_id) {
            const exists = data.some(t => String(t.id) === String(sourceDeptTask.template_id));
            if (!exists) {
              const specResp = await authFetch(`/api/templates/${sourceDeptTask.template_id}`);
              if (specResp.ok) {
                const specTpl = await specResp.json();
                if (specTpl) {
                  data = [specTpl, ...data];
                }
              }
            }
          }

          // Filter by department for non-super admins, 
          // BUT ALWAYS ALLOW the template from the source WO/Checklist
          if (!isSuperAdmin) {
            data = data.filter(t =>
              t.department_name === user.department ||
              (sourceDeptTask?.template_id && String(t.id) === String(sourceDeptTask.template_id))
            );
          }

          setTemplates(data);
          console.log(`Fetched ${data.length} templates (including source if needed)`);
        }
      } catch (err) {
        console.error('Error fetching templates from backend:', err);
      }
    };


    fetchTemplates();
  }, [formData.company_id, formData.departemen, departments, sourceDeptTask]);


  // Auto-apply template from source WO
  useEffect(() => {
    if (sourceDeptTask?.template_id && !sourceDeptTask.isAudit && templates.length > 0 && !templateAutoAppliedRef.current) {
      const templateId = String(sourceDeptTask.template_id);
      const exists = templates.find(t => String(t.id) === templateId);

      if (exists) {
        console.log('Auto-applying template from source WO:', exists.name);
        handleTemplateChange(templateId);
        templateAutoAppliedRef.current = true;
      }
    }
  }, [sourceDeptTask, templates]);


  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const selectedTemplate = templates.find(t => String(t.id) === String(templateId));
    if (selectedTemplate && selectedTemplate.details) {
      try {
        // Deep copy details and assign fresh IDs to avoid conflicts
        const newDetails = selectedTemplate.details.map((detail, index) => ({
          ...detail,
          id: Date.now() + index,
          isExpanded: index === 0 // Expand only first one for better UX
        }));
        setFormData(prev => ({ ...prev, details: newDetails }));
      } catch (err) {
        console.error('Error applying template details:', err);
      }
    }
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
        ...JSON.parse(JSON.stringify(detailToDuplicate)), // Deep clone
        id: Date.now(),
        isExpanded: true
      };

      const index = formData.details.findIndex(d => d.id === id);
      const newDetails = [...formData.details];
      newDetails.splice(index + 1, 0, newDetail);

      setFormData({
        ...formData,
        details: newDetails
      });
    }
  };

  // --- Reordering Logic ---
  const handleDragStart = (e, index, type, detailId) => {
    if (type === 'card') {
      setDraggedItemIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      // Set a ghost image or styling if needed
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

  const { taskId } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (taskId) {
      setIsEditMode(true);
      fetchTask(taskId);
    }
  }, [taskId]);

  // Helper to correctly parse DB date without timezone shift
  const toLocalDateStr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchTask = async (id) => {
    setLoading(true);
    try {
      const response = await authFetch(`/api/tasks/${id}`);
      if (response.ok) {
        const data = await response.json();

        // Prevent editing if task is in progress or completed
        if (data.progres === 'Berlangsung' || data.progres === 'Selesai') {
          setLoading(false);
          showError('Tidak Dapat Diedit', `Tugas ini tidak dapat diedit karena sedang ${data.progres.toLowerCase()}.`);
          navigate('/tugas-agen/ringkasan');
          return;
        }

        const formattedData = {
          ...formData, // Fallback to current defaults for any missing fields
          ...data,
          tanggal_mulai: toLocalDateStr(data.tanggal_mulai),
          tanggal_selesai: toLocalDateStr(data.tanggal_selesai),
          tanggal_pengulangan_berakhir: toLocalDateStr(data.tanggal_pengulangan_berakhir),
          waktu_mulai: data.waktu_mulai || '',
          waktu_selesai: data.waktu_selesai || '',
          pengulangan: !!data.pengulangan,
          tugas_departemen: !!data.tugas_departemen,
          verifikasi_kehadiran: !!data.verifikasi_kehadiran,
          persetujuan: data.butuh_persetujuan ? 'Ya' : 'Tidak',
          details: data.details || formData.details,
          agen_id: data.agen_id && data.agen_id.length > 0 ? data.agen_id[0] : ''
        };
        setFormData(formattedData);
      }
    } catch (err) {
      console.error('Error fetching task details:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    if (!formData.perusahaan) { newErrors.perusahaan = 'Perusahaan wajib dipilih'; isValid = false; }
    if (!formData.departemen) { newErrors.departemen = 'Departemen wajib dipilih'; isValid = false; }
    if (!formData.nama_tugas.trim()) { newErrors.nama_tugas = 'Nama tugas wajib diisi'; isValid = false; }
    if (!formData.urgensi) { newErrors.urgensi = 'Urgensi wajib dipilih'; isValid = false; }

    if (formData.aturan_waktu === 'Sesuai Waktu') {
      if (!formData.tanggal_mulai) { newErrors.tanggal_mulai = 'Tanggal wajib dipilih'; isValid = false; }
      if (!formData.waktu_mulai) { newErrors.waktu_mulai = 'Waktu wajib diisi'; isValid = false; }
      if (!formData.tanggal_selesai) { newErrors.tanggal_selesai = 'Tanggal wajib dipilih'; isValid = false; }
      if (!formData.waktu_selesai) { newErrors.waktu_selesai = 'Waktu wajib diisi'; isValid = false; }

      if (formData.tanggal_selesai && formData.tanggal_selesai < formData.tanggal_mulai) {
        newErrors.tanggal_selesai = 'Tanggal selesai tidak boleh sebelum tanggal mulai'; isValid = false;
      }

      if (formData.tanggal_mulai === formData.tanggal_selesai && formData.waktu_mulai && formData.waktu_selesai) {
        if (timeToMinutes(formData.waktu_mulai) >= timeToMinutes(formData.waktu_selesai)) {
          newErrors.waktu_mulai = 'Waktu mulai tidak boleh lebih atau sama dari waktu selesai';
          newErrors.waktu_selesai = 'Waktu selesai tidak boleh lebih atau sama dari waktu mulai';
          isValid = false;
        }
      }
    } else if (formData.aturan_waktu === 'Waktu Fleksibel') {
      if (!formData.tanggal_mulai) { newErrors.tanggal_mulai = 'Tanggal wajib dipilih'; isValid = false; }
      if (!formData.tanggal_selesai) { newErrors.tanggal_selesai = 'Tanggal wajib dipilih'; isValid = false; }

      if (formData.tanggal_selesai && formData.tanggal_selesai < formData.tanggal_mulai) {
        newErrors.tanggal_selesai = 'Tanggal selesai tidak boleh sebelum tanggal mulai'; isValid = false;
      }
    } else if (formData.aturan_waktu === 'Tanpa Tanggal Berakhir') {
      if (!formData.tanggal_mulai) { newErrors.tanggal_mulai = 'Tanggal wajib dipilih'; isValid = false; }
      if (!formData.waktu_mulai) { newErrors.waktu_mulai = 'Waktu wajib diisi'; isValid = false; }
    }

    if (formData.pengulangan) {
      if (!formData.jenis_pengulangan) {
        newErrors.jenis_pengulangan = 'Pengulangan wajib dipilih'; isValid = false;
      }
      if (formData.waktu_berakhir === 'Pada tanggal' && !formData.tanggal_pengulangan_berakhir) {
        newErrors.pengulangan = 'Waktu berakhir wajib diisi'; isValid = false;
      }
      if (formData.waktu_berakhir === 'Setelah' && (!formData.kali_pengulangan || formData.kali_pengulangan <= 0)) {
        newErrors.pengulangan = 'Jumlah kali pengulangan wajib diisi'; isValid = false;
      }
    }

    if (!formData.tugas_departemen && !formData.agen_id) {
      newErrors.agen_id = 'Agen wajib dipilih'; isValid = false;
    }

    if (formData.verifikasi_kehadiran && !formData.selfie) {
      newErrors.selfie = 'Pilihan selfie wajib diisi'; isValid = false;
    }

    if (!formData.persetujuan) {
      newErrors.persetujuan = 'Persetujuan wajib dipilih'; isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }

    return isValid;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    if (name === 'company_id') {
      const selectedCompany = companies.find(c => String(c.id) === String(val));
      setFormData({
        ...formData,
        company_id: val,
        perusahaan: selectedCompany ? (selectedCompany.name || selectedCompany.companyId) : ''
      });
    } else {
      setFormData({ ...formData, [name]: val });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const initialFormData = {
    perusahaan: user?.orgId || 'Ewalk Pentacity Mall',
    company_id: currentCompanyId || 1,
    departemen: user?.department || 'IT',
    nama_tugas: '',
    urgensi: '',
    nomor_perintah_kerja: '',
    deskripsi: '',
    lokasi: '',
    detail_alamat: '',
    aturan_waktu: 'Sesuai Waktu',
    tanggal_mulai: '',
    waktu_mulai: '',
    tanggal_selesai: '',
    waktu_selesai: '',
    pengulangan: false,
    jenis_pengulangan: '',
    waktu_berakhir: 'Pada tanggal',
    tanggal_pengulangan_berakhir: '',
    kali_pengulangan: 0,
    tugas_departemen: true,
    dept_task_id: null,
    agen_id: '',
    verifikasi_kehadiran: false,
    maksimum_radius: '',
    selfie: 'Tidak',
    persetujuan: 'Tidak',
    admin_pemeriksa_id: '',
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
  };

  const handleSubmit = async (statusOverride = null) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const payload = {
        ...formData,
        jenis_tugas: formData.jenis_tugas || taskType,
        status: statusOverride || 'Pending',
        agen_id: formData.agen_id ? [formData.agen_id] : [],
        creator_id: user?.id,
        creator_name: user?.firstName || user?.username,
        editor_id: user?.id,
        editor_name: user?.firstName || user?.username
      };

      const endpoint = isEditMode ? `/api/tasks/${taskId}` : '/api/tasks';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await authFetch(endpoint, {
        method: method,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (statusOverride === 'Draft') {
          success('Berhasil', 'Tugas disimpan sebagai draf.');
          navigate('/tugas-agen/draf');
        } else if (isEditMode) {
          success('Berhasil', 'Tugas berhasil diperbarui!');
          setIsEditMode(false);
          navigate('/tugas-agen/buat');
        } else if (auditData?.isBatchWO) {
          if (currentBatchIndex < auditData.brokenItems.length - 1) {
            success('Berhasil', `WO untuk item "${auditData.brokenItems[currentBatchIndex].name}" berhasil dibuat.`);
            setCurrentBatchIndex(prev => prev + 1);
            setStep(1);
            setErrors({});
            setShowModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            success('Berhasil', 'Semua WO berhasil dibuat secara berurutan!');
            navigate('/tugas-departemen/terkirim');
          }
        } else {
          success('Berhasil', 'Tugas berhasil dibuat!');
          setFormData(initialFormData);
          setStep(1);
          setErrors({});
          setShowModal(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        const errorData = await response.json();
        showError('Gagal', errorData.message || 'Gagal menyimpan tugas.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showError('Kesalahan Jaringan', 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const getRecurrenceSummary = () => {
    if (!formData.pengulangan) return null;

    let total = 0;
    let endDate = null;
    const start = formData.tanggal_mulai ? new Date(formData.tanggal_mulai) : null;
    const freq = formData.jenis_pengulangan;

    if (!freq) {
      return {
        total: '-',
        formattedEnd: '-',
        text: "Silakan pilih jenis pengulangan (Setiap Hari/Minggu/Bulan) untuk melihat ringkasan jadwal."
      };
    }

    if (formData.waktu_berakhir === 'Setelah') {
      total = parseInt(formData.kali_pengulangan) || 0;

      if (start && total > 0) {
        const lastDate = new Date(start);
        if (freq === 'Setiap Hari') lastDate.setDate(lastDate.getDate() + (total - 1));
        else if (freq === 'Setiap Minggu') lastDate.setDate(lastDate.getDate() + (total - 1) * 7);
        else if (freq === 'Setiap Bulan') lastDate.setMonth(lastDate.getMonth() + (total - 1));
        endDate = lastDate;
      }
    } else if (formData.waktu_berakhir === 'Pada tanggal' && formData.tanggal_pengulangan_berakhir) {
      const targetEnd = new Date(formData.tanggal_pengulangan_berakhir);
      if (start) {
        if (targetEnd < start) {
          return { total: '!', formattedEnd: 'Invalid', text: "Tanggal berakhir tidak boleh sebelum tanggal mulai." };
        }
        let current = new Date(start);
        while (current <= targetEnd && total < 100) {
          total++;
          if (freq === 'Setiap Hari') current.setDate(current.getDate() + 1);
          else if (freq === 'Setiap Minggu') current.setDate(current.getDate() + 7);
          else if (freq === 'Setiap Bulan') current.setMonth(current.getMonth() + 1);
          else break;
        }
      } else {
        endDate = targetEnd;
        total = '?';
      }
    }

    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    const formattedEnd = endDate ? endDate.toLocaleDateString('id-ID', options) : 'Belum ditentukan';
    const formattedStart = start ? start.toLocaleDateString('id-ID', options) : 'Belum ditentukan';

    let summaryText = '';
    if (!start) {
      summaryText = `Tugas dijadwalkan ${total > 0 ? total + ' kali ' : ''}${freq.toLowerCase()}. Silakan pilih tanggal mulai untuk rincian tanggal.`;
    } else if (total > 0) {
      summaryText = `Tugas ini akan dijadwalkan sebanyak ${total} kali ${freq.toLowerCase()}, dimulai dari ${formattedStart} sampai dengan ${formattedEnd}.`;
    } else {
      summaryText = "Lengkapi konfigurasi waktu berakhir untuk melihat ringkasan.";
    }

    return {
      total: total || '-',
      formattedEnd,
      formattedStart,
      text: summaryText
    };
  };

  const summary = getRecurrenceSummary();

  return (
    <div className="p-8 px-10 pb-24">
      {/* Header Stepper */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? 'bg-[#0095E8] text-white' : 'bg-[#E4E6EF] text-[#7E8299]'}`}>
              1
            </div>
            <span className={`mt-2 text-sm font-semibold ${step === 1 ? 'text-[#0095E8]' : 'text-[#7E8299]'}`}>Tugas</span>
          </div>
          <div className="w-32 h-[2px] bg-[#E4E6EF] mx-4 mb-6"></div>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-[#0095E8] text-white' : 'bg-[#E4E6EF] text-[#7E8299]'}`}>
              2
            </div>
            <span className={`mt-2 text-sm font-semibold ${step === 2 ? 'text-[#0095E8]' : 'text-[#7E8299]'}`}>Detail Tugas</span>
          </div>
        </div>
      </div>

      {auditData?.isBatchWO && auditData.brokenItems && auditData.brokenItems.length > 0 && (
        <div className="mx-0 mb-6 bg-[#E8FFF3] border border-[#50CD89]/30 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#50CD89] shadow-sm">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#181C32] mb-1">Pembuatan WO Masal (Item {currentBatchIndex + 1} dari {auditData.brokenItems.length})</p>
              <p className="text-[13px] text-[#3F4254]">
                Sedang membuat Work Order untuk temuan: <span className="font-bold">{auditData.brokenItems[currentBatchIndex]?.name}</span>
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

      <div className="bg-white rounded-xl shadow-sm border border-[#F1F1F4] overflow-hidden">
        {/* Tugas bagian dari WO Banner (Image 2) */}
        {sourceDeptTask && (
          <div className="mx-8 mt-8 bg-[#E8FFF3] border border-[#50CD89] border-opacity-20 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#50CD89] border border-[#50CD89] border-opacity-10 shadow-sm">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#181C32] mb-0.5">Tugas bagian dari WO</p>
                <p className="text-[12px] text-[#3F4254]">
                  Diterima oleh <span className="font-semibold text-[#181C32]">{sourceDeptTask.accepted_by_name || 'Admin'}</span> pada {formatDateTime(sourceDeptTask.waktu_diterima)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#50CD89] border-opacity-10">
              <div>
                <p className="text-[11px] text-[#A1A5B7] font-semibold mb-1">ID WO</p>
                <p className="text-[13px] font-semibold text-[#3F4254]">{sourceDeptTask.jenis_tugas === 'checklist' ? 'CHK' : 'WO'}-{sourceDeptTask.dept_id_asal || sourceDeptTask.departemen_asal?.substring(0, 3).toUpperCase() || 'GEN'}{String(sourceDeptTask.id).padStart(5, '0')}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#A1A5B7] font-semibold mb-1">Departemen Asal</p>
                <p className="text-[13px] font-semibold text-[#3F4254]">{sourceDeptTask.departemen_asal}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#A1A5B7] font-semibold mb-1">Lampiran</p>
                {sourceDeptTask.lampiran ? (
                  <a
                    href={`${API_URL}${sourceDeptTask.lampiran}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[#0095E8] font-semibold hover:underline flex items-center gap-1.5"
                  >
                    <LinkIcon size={13} /> Lihat Gambar
                  </a>
                ) : <p className="text-[13px] text-[#3F4254]">-</p>}
              </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="mx-8 mt-8 p-4 bg-[#F9F9F9] border border-[#F1F1F4] rounded-lg flex items-center gap-3">
          <Info size={18} className="text-[#A1A5B7]" />
          <span className="text-sm text-[#7E8299]">Tanda (<span className="text-[#F1416C]">*</span>) adalah wajib di isi</span>
        </div>

        {step === 1 && (
          <div className="p-8 space-y-10">
            {/* INORMASI TUGAS */}
            <div>
              <h3 className="text-base font-bold text-[#181C32] mb-6">Informasi Tugas</h3>

              {/* AUDIT REFERENCE PANEL — when auto-template is active */}
              {formData.isAuditTemplate && (
                <div className="bg-white rounded-xl border border-[#F1416C]/20 p-6 mb-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF5F8] flex items-center justify-center text-[#F1416C]">
                      <AlertTriangle size={16} />
                    </div>
                    <h2 className="text-[14px] font-bold text-[#F1416C]">
                      Referensi Temuan Audit — {formData.auditItemName}
                    </h2>
                    <span className="ml-auto px-2 py-0.5 bg-[#FFF5F8] border border-[#F1416C]/20 text-[#F1416C] text-[10px] font-bold rounded uppercase">Rusak</span>
                  </div>

                  {formData.auditOriginalNotes && (
                    <p className="text-[12px] text-[#F1416C] bg-[#FFF5F8] border border-[#F1416C]/10 px-3 py-2 rounded-lg font-medium mb-3">
                      📝 Catatan: {formData.auditOriginalNotes}
                    </p>
                  )}

                  {formData.auditOriginalPhotos && formData.auditOriginalPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.auditOriginalPhotos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          className="w-28 h-20 rounded-xl overflow-hidden border border-[#F1416C]/15 bg-white cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                          onClick={() => setZoomedImage(photo)}
                        >
                          <img src={getImageUrl(photo)} className="w-full h-full object-cover" alt={`Temuan ${pIdx + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-3 bg-[#FFF8F0] border border-[#FFA800]/20 rounded-lg">
                    <span className="text-[#FFA800] mt-0.5">🔒</span>
                    <p className="text-[11px] text-[#845E2D] leading-relaxed">
                      Agen akan mengisi <strong>Kondisi Fisik Barang</strong> (deskripsi) dan <strong>Foto Kondisi Barang</strong> (upload gambar). Template ini dikunci otomatis oleh sistem dan tidak dapat diubah.
                    </p>
                  </div>
                </div>
              )}

              {/* OLD audit panel — only show if NOT using auto-template (legacy/non-audit WO) */}
              {auditData && !formData.isAuditTemplate && formData.details.length > 0 && (
                <div className="bg-white rounded-xl border border-[#F1416C]/20 p-8 mb-8 overflow-hidden relative shadow-sm">
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
                    {formData.details.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-[#FFF5F8] border border-[#F1416C]/10 group transition-all hover:bg-white hover:shadow-md">
                        <div className="w-6 text-[11px] font-mono text-[#F1416C]/50 pt-0.5">{idx + 1}</div>
                        <div className="flex-1">
                          <p className="text-[13px] font-bold text-[#181C32]">{item.nama_detail}</p>
                          {item.deskripsi && (
                            <p className="text-[12px] text-[#F1416C] mt-1 font-medium bg-white/50 px-2 py-1 rounded inline-block border border-[#F1416C]/5">
                              Catatan: {item.deskripsi}
                            </p>
                          )}
                          {item.original_photos && item.original_photos.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.original_photos.map((photo, pIdx) => (
                                <div key={pIdx} className="w-32 h-20 rounded-lg overflow-hidden border border-[#F1416C]/20 bg-white cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setZoomedImage(photo)}>
                                  <img src={getImageUrl(photo)} className="w-full h-full object-cover" alt={`Temuan ${pIdx + 1}`} />
                                </div>
                              ))}
                            </div>
                          )}
                          {item.original_video && (
                            <div className="mt-3 w-48 h-28 rounded-lg overflow-hidden border border-[#F1416C]/20 bg-black relative flex items-center justify-center">
                              <video src={getImageUrl(item.original_video)} className="w-full h-full object-contain" controls playsInline webkit-playsinline="true" preload="metadata" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="px-2 py-1 bg-[#F1416C] text-white rounded text-[10px] font-bold uppercase tracking-wider">Rusak</div>
                          <button type="button" onClick={() => { const newDetails = formData.details.filter((_, i) => i !== idx); setFormData({ ...formData, details: newDetails }); }} className="p-1.5 rounded-lg bg-white border border-[#E4E6EF] text-[#F1416C] hover:bg-[#FFF5F8] transition-all shadow-sm" title="Batalkan item ini">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-[#F1FAFF] rounded-lg border border-[#D6EEFB] flex items-start gap-3">
                    <Info size={16} className="text-[#0095E8] mt-0.5" />
                    <p className="text-[12px] text-[#0095E8] leading-relaxed">
                      Daftar di atas adalah temuan audit yang akan dikirimkan ke agen. Anda dapat membatalkan item tertentu dengan mengklik ikon (x) di sebelah kanan.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6">

                <div className="flex items-center gap-8">
                  <label className="w-56 text-sm text-[#3F4254]">
                    Perusahaan <span className="text-[#F1416C]">*</span>
                  </label>
                  <div className="flex-1">
                    <SearchableSelect
                      name="company_id"
                      options={companies}
                      value={formData.company_id}
                      onChange={handleChange}
                      placeholder="Pilih perusahaan..."
                      disabled={!isSuperAdmin}
                    />
                    {errors.perusahaan && <p className="text-[#F1416C] text-xs mt-1">{errors.perusahaan}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <label className="w-56 text-sm text-[#3F4254]">
                    Departemen <span className="text-[#F1416C]">*</span>
                  </label>
                  <div className="flex-1">
                    <SearchableSelect
                      name="departemen"
                      options={departments}
                      value={formData.departemen}
                      valueField="name"
                      onChange={handleChange}
                      placeholder="Pilih departemen..."
                    />
                    {errors.departemen && <p className="text-[#F1416C] text-xs mt-1">{errors.departemen}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-8">
                  <div className="w-56 pt-3">
                    <label className="text-sm text-[#3F4254] block mb-1">
                      Nama tugas <span className="text-[#F1416C]">*</span>
                    </label>
                    <span className="text-xs text-[#B5B5C3]">Masukkan nama tugas yang akan dikerjakan oleh agen</span>
                  </div>
                  <div className="flex-1">
                    <input type="text" name="nama_tugas" value={formData.nama_tugas} onChange={handleChange} placeholder="Masukkan nama tugas" className={`w-full px-4 py-3 border rounded-lg text-sm outline-none ${errors.nama_tugas ? 'border-[#F1416C]' : 'border-[#E4E6EF] focus:border-[#0095E8]'}`} />
                    {errors.nama_tugas && <p className="text-[#F1416C] text-xs mt-1">{errors.nama_tugas}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <label className="w-56 text-sm text-[#3F4254]">
                    Urgensi <span className="text-[#F1416C]">*</span>
                  </label>
                  <div className="flex-1">
                    <SearchableSelect
                      name="urgensi"
                      options={[
                        { id: 'Rendah', name: 'Rendah' },
                        { id: 'Normal', name: 'Normal' },
                        { id: 'Kritis', name: 'Kritis' }
                      ]}
                      value={formData.urgensi}
                      valueField="name"
                      onChange={handleChange}
                      placeholder="Masukkan urgensi"
                    />
                    {errors.urgensi && <p className="text-[#F1416C] text-xs mt-1">{errors.urgensi}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-8">
                  <div className="w-56 pt-3">
                    <label className="text-sm text-[#3F4254] block mb-1">Nomor perintah kerja</label>
                    <span className="text-xs text-[#B5B5C3]">Nomor yang akan digunakan oleh agen di lapangan</span>
                  </div>
                  <input type="text" name="nomor_perintah_kerja" value={formData.nomor_perintah_kerja || 'Otomatis saat disimpan'} readOnly className="flex-1 px-4 py-3 border border-[#E4E6EF] rounded-lg text-sm bg-[#F5F8FA] text-[#A1A5B7] cursor-not-allowed" />
                </div>

                <div className="flex items-start gap-8">
                  <label className="w-56 text-sm text-[#3F4254] pt-3">Deskripsi tugas</label>
                  <div className="flex-1">
                    <textarea name="deskripsi" value={formData.deskripsi} onChange={handleChange} placeholder="Masukkan deskripsi tugas" rows="5" className="w-full px-4 py-3 border border-[#E4E6EF] rounded-lg text-sm focus:border-[#0095E8] outline-none resize-y min-h-[100px]"></textarea>
                    <div className="text-right text-xs text-[#B5B5C3] mt-1">{formData.deskripsi.length}/1000</div>
                  </div>
                </div>

                <div className="flex items-start gap-8">
                  <div className="w-56 pt-3">
                    <label className="text-sm text-[#3F4254] block mb-1">Titik Lokasi</label>
                    <span className="text-xs text-[#B5B5C3]">Pilih titik lokasi yang akan digunakan agen untuk menyelesaikan tugas</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
                      <input type="text" name="lokasi" value={formData.lokasi} onChange={handleChange} placeholder="Nama jalan / lokasi / gedung" className="w-full pl-10 pr-4 py-3 border border-[#E4E6EF] rounded-lg text-sm focus:border-[#0095E8] outline-none" />
                    </div>
                    <button type="button" className="px-4 py-2 border border-[#E4E6EF] rounded-lg text-sm font-semibold mb-2 flex items-center gap-2 hover:bg-gray-50">
                      <MapPin size={16} className="text-[#3F4254]" /> Pilih Lewat Peta
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-8">
                  <label className="w-56 text-sm text-[#3F4254] pt-3">Detail alamat</label>
                  <div className="flex-1">
                    <textarea name="detail_alamat" value={formData.detail_alamat} onChange={handleChange} placeholder="Masukkan detail alamat ..." rows="4" className="w-full px-4 py-3 border border-[#E4E6EF] rounded-lg text-sm focus:border-[#0095E8] outline-none resize-y min-h-[100px]"></textarea>
                    <div className="text-right text-xs text-[#B5B5C3] mt-1">{formData.detail_alamat.length}/1000</div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-[#F1F1F4]" />

            {/* INFORMASI JADWAL */}
            <div>
              <h3 className="text-base font-semibold text-[#181C32] mb-6">Informasi Jadwal</h3>
              <div className="space-y-6">

                <div className="flex items-center gap-8">
                  <label className="w-56 text-sm text-[#3F4254]">
                    Aturan waktu <span className="text-[#F1416C]">*</span>
                  </label>
                  <div className="flex-1 flex items-center gap-8">
                    <label className="flex items-center gap-1 text-sm text-[#3F4254] cursor-pointer">
                      <input type="radio" name="aturan_waktu" value="Sesuai Waktu" checked={formData.aturan_waktu === 'Sesuai Waktu'} onChange={handleChange} className="w-4 h-4 text-[#0095E8] accent-[#0095E8] border-gray-300 focus:ring-[#0095E8]" />
                      Sesuai Waktu <InfoTooltip text="Mulai & submit tugas dalam rentang tanggal & waktu" />
                    </label>
                    <label className="flex items-center gap-1 text-sm text-[#3F4254] cursor-pointer">
                      <input type="radio" name="aturan_waktu" value="Waktu Fleksibel" checked={formData.aturan_waktu === 'Waktu Fleksibel'} onChange={handleChange} className="w-4 h-4 text-[#0095E8] accent-[#0095E8] border-gray-300 focus:ring-[#0095E8]" />
                      Waktu Fleksibel <InfoTooltip text="Mulai & submit tugas kapan saja sebelum tanggal berakhir" />
                    </label>
                    <label className="flex items-center gap-1 text-sm text-[#3F4254] cursor-pointer">
                      <input type="radio" name="aturan_waktu" value="Tanpa Tanggal Berakhir" checked={formData.aturan_waktu === 'Tanpa Tanggal Berakhir'} onChange={handleChange} className="w-4 h-4 text-[#0095E8] accent-[#0095E8] border-gray-300 focus:ring-[#0095E8]" />
                      Tanpa Tanggal Berakhir <InfoTooltip text="Mulai & submit kapan saja tanpa adanya batas waktu" />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <label className="w-56 text-sm text-[#3F4254]">
                    Tanggal tugas <span className="text-[#F1416C]">*</span>
                  </label>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-4">
                      {formData.aturan_waktu === 'Sesuai Waktu' && (
                        <>
                          <div className="flex-1">
                            <CustomDatePicker
                              value={formData.tanggal_mulai}
                              onChange={(val) => { setFormData({ ...formData, tanggal_mulai: val }); if (errors.tanggal_mulai) setErrors({ ...errors, tanggal_mulai: null }); }}
                              placeholder="Pilih tanggal mulai"
                              hasError={!!errors.tanggal_mulai}
                              minDate={new Date().toISOString().split('T')[0]}
                            />
                            {errors.tanggal_mulai && <p className="text-[#F1416C] text-[10px] mt-1 leading-tight">{errors.tanggal_mulai}</p>}
                          </div>
                          <div className="flex-1">
                            <CustomTimePicker
                              value={formData.waktu_mulai}
                              onChange={(val) => { setFormData({ ...formData, waktu_mulai: val }); if (errors.waktu_mulai) setErrors({ ...errors, waktu_mulai: null }); }}
                              placeholder="Pilih waktu mulai"
                              hasError={!!errors.waktu_mulai}
                            />
                            {errors.waktu_mulai && <p className="text-[#F1416C] text-[10px] mt-1 leading-tight">{errors.waktu_mulai}</p>}
                          </div>
                          <span className="text-[#A1A5B7] self-start mt-3">-</span>
                          <div className="flex-1">
                            <CustomDatePicker
                              value={formData.tanggal_selesai}
                              onChange={(val) => { setFormData({ ...formData, tanggal_selesai: val }); if (errors.tanggal_selesai) setErrors({ ...errors, tanggal_selesai: null }); }}
                              placeholder="Pilih tanggal selesai"
                              hasError={!!errors.tanggal_selesai}
                              minDate={formData.tanggal_mulai || new Date().toISOString().split('T')[0]}
                            />
                            {errors.tanggal_selesai && <p className="text-[#F1416C] text-[10px] mt-1 leading-tight">{errors.tanggal_selesai}</p>}
                          </div>
                          <div className="flex-1">
                            <CustomTimePicker
                              value={formData.waktu_selesai}
                              onChange={(val) => { setFormData({ ...formData, waktu_selesai: val }); if (errors.waktu_selesai) setErrors({ ...errors, waktu_selesai: null }); }}
                              placeholder="Pilih waktu selesai"
                              hasError={!!errors.waktu_selesai}
                            />
                            {errors.waktu_selesai && <p className="text-[#F1416C] text-[10px] mt-1 leading-tight">{errors.waktu_selesai}</p>}
                          </div>
                        </>
                      )}

                      {formData.aturan_waktu === 'Waktu Fleksibel' && (
                        <>
                          <div className="flex-1">
                            <CustomDatePicker
                              value={formData.tanggal_mulai}
                              onChange={(val) => { setFormData({ ...formData, tanggal_mulai: val }); if (errors.tanggal_mulai) setErrors({ ...errors, tanggal_mulai: null }); }}
                              placeholder="Pilih tanggal mulai"
                              hasError={!!errors.tanggal_mulai}
                              minDate={new Date().toISOString().split('T')[0]}
                            />
                            {errors.tanggal_mulai && <p className="text-[#F1416C] text-[10px] mt-1 leading-tight">{errors.tanggal_mulai}</p>}
                          </div>
                          <span className="text-[#A1A5B7] self-start mt-3">-</span>
                          <div className="flex-1">
                            <CustomDatePicker
                              value={formData.tanggal_selesai}
                              onChange={(val) => { setFormData({ ...formData, tanggal_selesai: val }); if (errors.tanggal_selesai) setErrors({ ...errors, tanggal_selesai: null }); }}
                              placeholder="Pilih tanggal selesai"
                              hasError={!!errors.tanggal_selesai}
                              minDate={formData.tanggal_mulai || new Date().toISOString().split('T')[0]}
                            />
                            {errors.tanggal_selesai && <p className="text-[#F1416C] text-[10px] mt-1 leading-tight">{errors.tanggal_selesai}</p>}
                          </div>
                        </>
                      )}

                      {formData.aturan_waktu === 'Tanpa Tanggal Berakhir' && (
                        <>
                          <div className="flex-1">
                            <CustomDatePicker
                              value={formData.tanggal_mulai}
                              onChange={(val) => { setFormData({ ...formData, tanggal_mulai: val }); if (errors.tanggal_mulai) setErrors({ ...errors, tanggal_mulai: null }); }}
                              placeholder="Pilih tanggal mulai"
                              hasError={!!errors.tanggal_mulai}
                              minDate={new Date().toISOString().split('T')[0]}
                            />
                            {errors.tanggal_mulai && <p className="text-[#F1416C] text-[10px] mt-1 leading-tight">{errors.tanggal_mulai}</p>}
                          </div>
                          <div className="flex-1">
                            <CustomTimePicker
                              value={formData.waktu_mulai}
                              onChange={(val) => { setFormData({ ...formData, waktu_mulai: val }); if (errors.waktu_mulai) setErrors({ ...errors, waktu_mulai: null }); }}
                              placeholder="Pilih waktu mulai"
                              hasError={!!errors.waktu_mulai}
                            />
                            {errors.waktu_mulai && <p className="text-[#F1416C] text-[10px] mt-1 leading-tight">{errors.waktu_mulai}</p>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {taskType !== 'wo' && (
                  <div className="flex items-start gap-8">
                    <label className="w-56 text-sm text-[#7E8299] pt-1 mt-2">Pengulangan</label>
                    <div className="flex-1 w-full max-w-full">
                      <div className="flex items-center gap-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer w-[240px] flex-shrink-0">
                          <div className={`flex items-center justify-center w-5 h-5 rounded border ${formData.pengulangan ? 'bg-[#0095E8] border-[#0095E8]' : 'bg-white border-[#E4E6EF]'}`}>
                            <input type="checkbox" name="pengulangan" checked={formData.pengulangan} onChange={handleChange} className="opacity-0 absolute w-0 h-0" />
                            {formData.pengulangan && <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4.5L4 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <span className="text-sm font-bold text-[#3F4254]">Aktifkan pengulangan tugas</span>
                        </label>

                        {formData.pengulangan && (
                          <div className="flex-1 relative">
                            <button
                              type="button"
                              onClick={() => setDropdownPengulanganOpen(!dropdownPengulanganOpen)}
                              onBlur={() => setTimeout(() => setDropdownPengulanganOpen(false), 200)}
                              className={`w-[calc(100%-8px)] flex items-center justify-between px-4 py-[10px] border rounded-lg text-sm bg-white focus:border-[#0095E8] outline-none ${errors.jenis_pengulangan ? 'border-[#F1416C]' : 'border-[#E4E6EF]'} ${formData.jenis_pengulangan ? 'text-[#3F4254]' : 'text-[#A1A5B7]'}`}
                            >
                              <span>{formData.jenis_pengulangan || 'Pilih pengulangan'}</span>
                              {dropdownPengulanganOpen ? <ChevronUp size={16} className="text-[#A1A5B7]" /> : <ChevronDown size={16} className="text-[#A1A5B7]" />}
                            </button>
                            {errors.jenis_pengulangan && <p className="text-[#F1416C] text-xs mt-1">Pengulangan wajib dipilih</p>}

                            {dropdownPengulanganOpen && (
                              <div className="absolute top-12 left-0 w-[calc(100%-8px)] bg-white border border-[#E4E6EF] rounded-lg shadow-lg py-2 z-50">
                                {['Setiap Hari', 'Setiap Minggu', 'Setiap Bulan', 'Kustom/Atur Sendiri'].map((option) => (
                                  <div
                                    key={option}
                                    onClick={() => {
                                      setFormData({ ...formData, jenis_pengulangan: option });
                                      setDropdownPengulanganOpen(false);
                                    }}
                                    className={`px-4 py-[10px] text-sm cursor-pointer mx-2 rounded mb-1 last:mb-0 ${formData.jenis_pengulangan === option ? 'bg-[#F4F9FF] text-[#0095E8]' : 'text-[#3F4254] hover:bg-[#F4F9FF] hover:text-[#0095E8]'}`}
                                  >
                                    {option}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#B5B5C3]">Konfigurasi pengulangan akan terhapus jika tugas disimpan sebagai draf.</p>
                    </div>
                  </div>
                )}

                {formData.pengulangan && taskType !== 'wo' && (
                  <div className="flex items-start gap-8 mt-4">
                    <label className="w-56 text-sm font-semibold text-[#7E8299] pt-3">
                      Waktu berakhir <span className="text-[#F1416C]">*</span>
                    </label>
                    <div className="flex-1 space-y-6">

                      {/* Pada Tanggal */}
                      <div>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 text-sm text-[#3F4254] cursor-pointer w-32 flex-shrink-0">
                            <input
                              type="radio"
                              name="waktu_berakhir"
                              value="Pada tanggal"
                              checked={formData.waktu_berakhir === 'Pada tanggal'}
                              onChange={handleChange}
                              className="w-4 h-4 text-[#0095E8] accent-[#0095E8] border-gray-300 focus:ring-[#0095E8]"
                            />
                            Pada tanggal
                          </label>
                          <div className="flex-1">
                            <CustomDatePicker
                              value={formData.tanggal_pengulangan_berakhir}
                              onChange={(val) => { setFormData({ ...formData, tanggal_pengulangan_berakhir: val }); if (errors.pengulangan) setErrors({ ...errors, pengulangan: null }); }}
                              placeholder="Pilih tanggal selesai"
                              hasError={errors.pengulangan && formData.waktu_berakhir === 'Pada tanggal'}
                              minDate={formData.tanggal_mulai || new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>
                        {errors.pengulangan && formData.waktu_berakhir === 'Pada tanggal' && <p className="text-[#F1416C] text-xs mt-1 ml-[152px]">Waktu berakhir wajib diisi</p>}
                        <p className="text-xs text-[#B5B5C3] mt-2 ml-[152px]">Tugas pengulangan dapat diatur maksimal 90 hari sejak tanggal dimulai</p>
                      </div>

                      {/* Setelah */}
                      <div>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 text-sm text-[#3F4254] cursor-pointer w-32 flex-shrink-0">
                            <input
                              type="radio"
                              name="waktu_berakhir"
                              value="Setelah"
                              checked={formData.waktu_berakhir === 'Setelah'}
                              onChange={handleChange}
                              className="w-4 h-4 text-[#0095E8] accent-[#0095E8] border-gray-300 focus:ring-[#0095E8]"
                            />
                            Setelah
                          </label>
                          <div className={`flex items-center flex-1 border rounded-lg overflow-hidden h-11 bg-white ${errors.pengulangan && formData.waktu_berakhir === 'Setelah' ? 'border-[#F1416C]' : 'border-[#E4E6EF]'}`}>
                            <div className="flex flex-col border-r border-[#E4E6EF] bg-[#F5F8FA] px-2 py-[2px] h-full justify-center">
                              <ChevronUp size={14} className="cursor-pointer text-[#7E8299] hover:text-[#0095E8]" onClick={() => setFormData({ ...formData, kali_pengulangan: Number(formData.kali_pengulangan) + 1 })} />
                              <ChevronDown size={14} className="cursor-pointer text-[#7E8299] hover:text-[#0095E8]" onClick={() => setFormData({ ...formData, kali_pengulangan: Math.max(0, Number(formData.kali_pengulangan) - 1) })} />
                            </div>
                            <input
                              type="number"
                              name="kali_pengulangan"
                              value={formData.kali_pengulangan}
                              onChange={handleChange}
                              className="w-12 h-full bg-transparent outline-none text-sm text-center ml-2 mr-2"
                            />
                            <span className="text-sm text-[#5E6278] flex-1">kali pengulangan</span>
                          </div>
                        </div>
                        {errors.pengulangan && formData.waktu_berakhir === 'Setelah' && <p className="text-[#F1416C] text-xs mt-1 ml-[152px]">{errors.pengulangan}</p>}
                        {formData.waktu_berakhir === 'Setelah' && (
                          <p className="text-xs text-[#B5B5C3] mt-2 ml-[152px]">Tugas pengulangan dapat diatur maksimal 90 kali pengulangan</p>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {summary && (
                  <div className="flex items-start gap-8 mt-4">
                    <div className="w-56"></div>
                    <div className="flex-1 bg-[#F4F9FF] border border-[#0095E8] border-opacity-20 rounded-xl p-5 flex items-start gap-3 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#0095E8] shadow-sm flex-shrink-0">
                        <Info size={16} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#181C32] mb-1">Ringkasan Penjadwalan</p>
                        <p className="text-[12px] text-[#3F4254] leading-relaxed">
                          {summary.text}
                        </p>
                        <div className="flex gap-4 mt-3 pt-3 border-t border-[#0095E8] border-opacity-10">
                          <div>
                            <p className="text-[10px] text-[#A1A5B7] uppercase font-bold mb-0.5 tracking-wider">Total Tugas</p>
                            <p className="text-[12px] font-bold text-[#0095E8]">{summary.total} Kali</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#A1A5B7] uppercase font-bold mb-0.5 tracking-wider">Berakhir Pada</p>
                            <p className="text-[12px] font-bold text-[#3F4254]">{summary.formattedEnd}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-[#F1F1F4]" />

            {/* INFORMASI AGEN */}
            <div>
              <h3 className="text-base font-bold text-[#181C32] mb-6">Informasi Agen</h3>
              <div className="space-y-6">

                <div className="flex items-start gap-8">
                  <div className="w-56 pt-1">
                    <label className="text-sm font-semibold text-[#7E8299] block mb-1">Tugas departemen</label>
                    <span className="text-xs text-[#B5B5C3]">Tugas tersedia bagi seluruh agen departemen. Agen pertama yang memulai akan otomatis ditugaskan.</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-10 h-6 flex items-center rounded-full p-1 cursor-not-allowed opacity-70 bg-[#50CD89]">
                      <div className="bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out translate-x-4"></div>
                    </div>
                    <span className="text-sm font-bold text-[#3F4254]">Aktifkan</span>
                  </div>
                </div>

                {!formData.tugas_departemen && (
                  <div className="flex items-start gap-8">
                    <div className="w-56 pt-3">
                      <label className="text-sm font-semibold text-[#7E8299] block mb-1">
                        Agen <span className="text-[#F1416C]">*</span>
                      </label>
                      <span className="text-xs text-[#B5B5C3]">Maksimal 15 Agen</span>
                    </div>
                    <div className="flex-1">
                      <SearchableSelect
                        name="agen_id"
                        options={agens.map(a => ({
                          ...a,
                          displayName: `${a.firstName || ''} ${a.lastName || ''} ${a.email ? `(${a.email})` : ''}`.trim()
                        }))}
                        labelField="displayName"
                        value={formData.agen_id}
                        onChange={handleChange}
                        disabled={formData.tugas_departemen}
                        placeholder="Pilih agen"
                      />
                      {errors.agen_id && <p className="text-[#F1416C] text-xs mt-1">Agen wajib dipilih</p>}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-8">
                  <label className="w-56 text-sm font-semibold text-[#7E8299]">Verifikasi kehadiran</label>
                  <div className="flex-1 flex items-center gap-2">
                    <div className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formData.verifikasi_kehadiran ? 'bg-[#0095E8]' : 'bg-[#E4E6EF]'}`}
                      onClick={() => setFormData({ ...formData, verifikasi_kehadiran: !formData.verifikasi_kehadiran })}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${formData.verifikasi_kehadiran ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-bold text-[#3F4254]">Butuh Verifikasi</span>
                  </div>
                </div>

                {formData.verifikasi_kehadiran && (
                  <>
                    <div className="flex items-center gap-8">
                      <label className="w-56 text-sm font-semibold text-[#7E8299] pl-4">Maksimum radius</label>
                      <div className="flex-1 relative flex items-center">
                        <input type="number" name="maksimum_radius" value={formData.maksimum_radius} onChange={handleChange} placeholder="Masukkan maksimum radius" className="w-full pl-4 pr-20 py-3 bg-[#F4F9FA] border border-[#E4E6EF] rounded-lg text-sm focus:border-[#0095E8] outline-none" />
                        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-[#F1F1F4] border-l border-[#E4E6EF] rounded-r-lg px-4 text-xs font-semibold text-[#3F4254]">Meter</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <label className="w-56 text-sm font-semibold text-[#7E8299] pl-4">
                        Selfie <span className="text-[#F1416C]">*</span>
                      </label>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-8">
                          <label className="flex items-center gap-2 text-sm text-[#3F4254] cursor-pointer">
                            <input type="radio" name="selfie" value="Ya" checked={formData.selfie === 'Ya'} onChange={handleChange} className="w-4 h-4 text-[#0095E8] accent-[#0095E8] border-gray-300 focus:ring-[#0095E8]" /> Ya
                          </label>
                          <label className="flex items-center gap-2 text-sm text-[#3F4254] cursor-pointer">
                            <input type="radio" name="selfie" value="Tidak" checked={formData.selfie === 'Tidak'} onChange={handleChange} className="w-4 h-4 text-[#0095E8] accent-[#0095E8] border-gray-300 focus:ring-[#0095E8]" /> Tidak
                          </label>
                        </div>
                        {errors.selfie && <p className="text-[#F1416C] text-xs mt-1">{errors.selfie}</p>}
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>

            <hr className="border-[#F1F1F4]" />

            {/* VERIFIKASI TUGAS */}
            <div>
              <h3 className="text-base font-bold text-[#181C32] mb-6">Verifikasi Tugas</h3>
              <div className="space-y-6">

                <div className="flex items-center gap-8">
                  <label className="w-56 text-sm font-semibold text-[#7E8299]">
                    Persetujuan
                  </label>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-10 h-6 flex items-center rounded-full p-1 cursor-not-allowed opacity-70 bg-[#50CD89]">
                      <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-4"></div>
                    </div>
                    <span className="text-sm font-bold text-[#3F4254]">Wajib</span>
                    <span className="text-xs text-[#A1A5B7] italic ml-1">Approval dilakukan oleh agen di mobile</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 space-y-6 bg-[#F9F9F9]">
            {/* Nama Tugas Info */}
            <div className="bg-white p-6 rounded-xl border border-[#F1F1F4] flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-[#F5F8FA] rounded-lg flex items-center justify-center">
                <GripVertical size={20} className="text-[#A1A5B7]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#B5B5C3] uppercase tracking-wider">Nama Tugas</span>
                <span className="text-sm font-bold text-[#181C32]">{formData.nama_tugas || 'PENUGASAN'}</span>
              </div>
            </div>

            {/* Template Selector */}
            <div className="flex items-center gap-8">
              <div className="w-56">
                <label className="text-sm font-semibold text-[#7E8299] block mb-1">Template</label>
                <span className="text-[11px] text-[#B5B5C3] leading-tight block">Pilih template tugas untuk detail tugas yang sudah pernah dikerjakan Agen</span>
              </div>
              <div className="flex-1">
                {formData.isAuditTemplate ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#FFF8F0] border border-[#FFA800]/30 rounded-lg">
                    <span className="text-lg">🔒</span>
                    <div>
                      <p className="text-[13px] font-bold text-[#FFA800]">Template Auto-Generated</p>
                      <p className="text-[11px] text-[#A1A5B7] mt-0.5">Template dikunci otomatis oleh sistem dari temuan audit</p>
                    </div>
                  </div>
                ) : (
                  <SearchableSelect
                    options={templates}
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    placeholder="Pilih template"
                  />
                )}
              </div>
            </div>

            {/* List Detail Tugas */}
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
                      {!detail.isAuditLocked && (
                        <div className="cursor-grab active:cursor-grabbing p-1">
                          <GripVertical size={18} className="text-[#A1A5B7]" />
                        </div>
                      )}
                      {detail.isAuditLocked && (
                        <span className="text-base" title="Field terkunci oleh sistem">🔒</span>
                      )}
                      <span className="text-sm font-bold text-[#3F4254]">
                        {detail.isAuditLocked ? detail.nama_detail : `Detail Tugas ke ${index + 1}`}
                      </span>
                      {detail.isAuditLocked && (
                        <span className="px-2 py-0.5 bg-[#FFF8F0] border border-[#FFA800]/30 text-[#FFA800] text-[10px] font-bold rounded uppercase tracking-wide">Auto</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {!detail.isAuditLocked && (
                        <>
                          <button type="button" onClick={() => handleDuplicate(detail.id)} title="Duplicate" className="text-[#A1A5B7] hover:text-[#0095E8] transition-colors">
                            <Copy size={18} />
                          </button>
                          <button type="button" onClick={() => removeDetail(detail.id)} className="text-[#A1A5B7] hover:text-[#F1416C] transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                      <button type="button" onClick={() => toggleExpand(detail.id)} className="text-[#A1A5B7] hover:text-[#3F4254] transition-colors">
                        {detail.isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  {detail.isExpanded && (
                    <div className="p-6 space-y-6">
                      <div className="flex items-center gap-8">
                        <label className="w-56 text-sm font-semibold text-[#7E8299]">Nama detail tugas <span className="text-[#F1416C]">*</span></label>
                        <input
                          type="text"
                          value={detail.nama_detail}
                          onChange={(e) => updateDetail(detail.id, 'nama_detail', e.target.value)}
                          placeholder="Masukkan nama detail tugas"
                          className="flex-1 px-4 py-3 border border-[#E4E6EF] rounded-lg text-sm focus:border-[#0095E8] outline-none"
                        />
                      </div>

                      <div className="flex items-start gap-8">
                        <div className="w-56 pt-3">
                          <label className="text-sm font-semibold text-[#7E8299] block mb-1">Bentuk laporan <span className="text-[#F1416C]">*</span></label>
                          <span className="text-[11px] text-[#B5B5C3] leading-tight block">Bentuk jawaban yang akan diisi oleh agen</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-4">
                          <div className="relative">
                            <select
                              value={detail.bentuk_laporan}
                              onChange={(e) => updateDetail(detail.id, 'bentuk_laporan', e.target.value)}
                              className="w-full appearance-none px-4 py-3 bg-white border border-[#E4E6EF] rounded-lg text-sm text-[#3F4254] outline-none focus:border-[#0095E8]"
                            >
                              <option value="Text Field">Text Field</option>
                              <option value="Multiple Choice">Multiple Choice</option>
                              <option value="Dropdown">Dropdown</option>
                              <option value="Image">Image</option>
                              <option value="Multiple Images">Multiple Images</option>
                              <option value="Date">Date</option>
                              <option value="Time">Time</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
                          </div>

                          {/* Options Manager for Multiple Choice / Dropdown */}
                          {(detail.bentuk_laporan === 'Multiple Choice' || detail.bentuk_laporan === 'Dropdown') && (
                            <div className="space-y-3 pl-4">
                              {detail.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${draggedOptionIndex === optIndex && activeDragId === detail.id ? 'border-[#0095E8] bg-blue-50 opacity-50' : 'border-transparent'}`}
                                  draggable="true"
                                  onDragStart={(e) => handleDragStart(e, optIndex, 'option', detail.id)}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, optIndex, 'option', detail.id)}
                                >
                                  <div className="cursor-grab active:cursor-grabbing p-1">
                                    <GripVertical size={16} className="text-[#A1A5B7]" />
                                  </div>
                                  {detail.bentuk_laporan === 'Multiple Choice' && <div className="w-4 h-4 rounded-md border-2 border-[#E4E6EF] bg-white flex-shrink-0" />}
                                  <span className="text-xs font-bold text-[#7E8299] w-4">{optIndex + 1}.</span>
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateOption(detail.id, optIndex, e.target.value)}
                                    className="flex-1 px-4 py-2 border border-[#E4E6EF] rounded-lg text-sm focus:border-[#0095E8] outline-none bg-white"
                                  />
                                  <button type="button" onClick={() => removeOption(detail.id, optIndex)} className="text-[#A1A5B7] hover:text-[#F1416C] transition-colors p-1">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addOption(detail.id)}
                                className="flex items-center gap-2 text-[#0095E8] text-xs font-bold hover:underline mt-2 ml-7"
                              >
                                <Plus size={14} /> Tambah Pilihan
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-8">
                        <label className="w-56 text-sm font-semibold text-[#7E8299] pt-3">Deskripsi <span className="text-[#F1416C]">*</span></label>
                        <div className="flex-1">
                          <textarea
                            value={detail.deskripsi}
                            onChange={(e) => updateDetail(detail.id, 'deskripsi', e.target.value)}
                            placeholder="Masukkan deskripsi detail tugas"
                            rows="4"
                            className="w-full px-4 py-3 border border-[#E4E6EF] rounded-lg text-sm focus:border-[#0095E8] outline-none resize-y min-h-[100px]"
                          ></textarea>
                          <div className="text-right text-[10px] text-[#B5B5C3] mt-1">{detail.deskripsi.length}/500</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-64">
                        <div
                          className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${detail.wajib_diisi ? 'bg-[#0095E8]' : 'bg-[#E4E6EF]'}`}
                          onClick={() => updateDetail(detail.id, 'wajib_diisi', !detail.wajib_diisi)}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${detail.wajib_diisi ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="text-sm font-bold text-[#3F4254]">Wajib diisi</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Add Detail Button — hidden when using audit auto-template */}
            {!formData.isAuditTemplate && (
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={addDetail}
                  className="flex items-center gap-2 text-[#0095E8] text-sm font-bold hover:underline"
                >
                  <Plus size={18} /> Tambah Detail Tugas
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer inside Card */}
        <hr className="border-[#F1F1F4]" />
        <div className="px-8 py-6 bg-white flex justify-between items-center">
          <div className="flex gap-3">
            <button type="button" onClick={() => step === 1 ? navigate('/tugas-agen') : setStep(1)} className="px-6 py-2.5 text-sm font-bold text-[#0095E8] hover:bg-blue-50 rounded-lg transition-colors">
              {step === 1 ? 'Batal' : 'Kembali'}
            </button>
            {hasPermission(user, 'tugas_agen_draf', 'Buat') && (
              <button type="button" onClick={() => handleSubmit('Draft')} disabled={loading} className="px-6 py-2.5 bg-white border border-[#0095E8] rounded-lg text-sm font-bold text-[#0095E8] hover:bg-blue-50 transition-colors disabled:opacity-50">
                Simpan Draf
              </button>
            )}
          </div>

          <div>
            {step === 1 ? (
              <button type="button" onClick={() => { if (validateForm()) setShowModal(true); }} className="px-8 py-2.5 bg-[#0095E8] rounded-lg text-sm font-bold text-white hover:bg-[#0084CC] transition-colors">
                Lanjut
              </button>
            ) : (
              <button type="button" onClick={() => handleSubmit('Pending')} disabled={loading} className="px-8 py-2.5 bg-[#0095E8] rounded-lg text-sm font-bold text-white hover:bg-[#0084CC] transition-colors disabled:opacity-50">
                {loading ? 'Membuat...' : 'Buat Tugas'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-10 h-10 bg-[#F1FAFF] text-[#0095E8] hover:bg-[#0095E8] hover:text-white rounded-md flex items-center justify-center transition-all duration-300 shadow-sm z-50">
        <ChevronUp size={20} strokeWidth={2.5} />
      </button>

      {/* Konfirmasi Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center transition-opacity" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white rounded-2xl p-8 max-w-[420px] w-full shadow-lg">
            <div className="w-14 h-14 rounded-full bg-[#FFF9E6] flex items-center justify-center mb-6">
              <div className="w-10 h-10 rounded-full border-[3px] border-[#FFF2CC] flex items-center justify-center">
                <AlertTriangle className="text-[#FFC700]" size={20} strokeWidth={2.5} />
              </div>
            </div>

            <h3 className="text-xl font-medium text-[#181C32] mb-3">
              Konfirmasi Tugas
            </h3>
            <p className="text-[14px] leading-relaxed text-[#7E8299] mb-8">
              Pastikan Perusahaan & Departemen sudah benar. Perusahaan & Departemen tidak bisa diubah setelah Tugas berhasil dibuat.
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setStep(2);
                }}
                className="flex-1 py-3 bg-[#0095E8] rounded-xl text-sm font-bold text-white hover:bg-[#0084CC] transition-colors"
              >
                Lanjut
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-white border border-[#E4E6EF] rounded-xl text-sm font-bold text-[#005499] hover:bg-gray-50 transition-colors"
              >
                Cek Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img src={getImageUrl(zoomedImage)} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="Zoomed" />
            <button 
              className="absolute -top-4 -right-4 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-gray-200"
              onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
            >
              ×
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BuatTugas;
