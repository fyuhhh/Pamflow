import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Trash2, Folder, MapPin, Users, Loader2, X, Info, 
  ChevronRight, ChevronDown, ChevronLeft, Building2, Activity, Box, Download, Upload, Image, HelpCircle 
} from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { hasPermission } from '../utils/permissions';


// BEAUTIFUL CUSTOM SEARCHABLE SELECT COMPONENT WITH HIGH VISIBILITY Z-INDEX AND CLEAN TRANSITION
const SearchableSelect = ({ label, options, value, onChange, placeholder, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const filteredOptions = options.filter(opt =>
    String(opt.label).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex flex-col space-y-2 w-full">
      {label && <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">{label}</label>}
      <div 
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        className={`w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-extrabold text-[#3F4254] flex items-center justify-between cursor-pointer select-none hover:bg-[#F5F8FA] hover:border-[#B5B5C3] transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={selectedOption ? "text-[#181C32]" : "text-[#B5B5C3] font-semibold"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={15} className="text-[#A1A5B7] ml-2" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[270]" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 bg-white border border-[#E1E3EA] rounded-2xl shadow-2xl z-[280] overflow-hidden max-h-[260px] flex flex-col animate-dropdown">
            {/* Search Input Box */}
            <div className="p-3 border-b border-[#F1F1F4] bg-[#F9F9F9] flex items-center">
              <Search size={14} className="text-[#A1A5B7] mr-2" />
              <input
                type="text"
                placeholder="Cari data..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold outline-none focus:border-[#0095E8] focus:ring-1 focus:ring-[#0095E8]/25 text-[#181C32]"
              />
            </div>
            {/* Options list */}
            <div className="overflow-y-auto max-h-[200px] custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-xs text-[#7E8299] text-center italic font-semibold">
                  Data tidak ditemukan
                </div>
              ) : (
                filteredOptions.map(opt => (
                  <div
                    key={opt.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`px-5 py-3 text-xs font-extrabold cursor-pointer transition-colors duration-150 border-b border-[#FAFBFC] last:border-b-0 ${
                      String(opt.value) === String(value)
                        ? 'bg-[#E1F0FF] text-[#0095E8]'
                        : 'text-[#3F4254] hover:bg-[#F5F8FA]'
                    }`}
                  >
                    {opt.label}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// SEARCHABLE FILTER SELECT - Compact version for filter panel, dropdown opens downward
// Uses fixed overlay for safe z-index without conflicting with main modals
const FilterSelect = ({ label, icon, options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = React.useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const filteredOptions = options.filter(opt =>
    String(opt.label).toLowerCase().includes(search.toLowerCase())
  );

  const handleOpen = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const isActive = value !== '' && value !== null && value !== undefined;

  return (
    <div className="flex flex-col space-y-1.5">
      {label && (
        <label className="text-[10px] font-extrabold text-[#7E8299] uppercase tracking-wider flex items-center gap-1.5">
          {icon}
          {label}
        </label>
      )}

      {/* Trigger button */}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className={`w-full px-4 py-2.5 border rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer select-none transition-all ${
          isActive
            ? 'bg-[#E1F0FF] border-[#0095E8]/30 text-[#0095E8]'
            : 'bg-[#F9F9F9] border-[#F1F1F4] text-[#7E8299] hover:bg-white hover:border-[#B5B5C3]'
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {isActive && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); setSearch(''); }}
              className="text-[#A1A5B7] hover:text-[#F1416C] transition-colors"
            >
              <X size={11} />
            </button>
          )}
          <ChevronDown size={12} className={`text-[#A1A5B7] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Fixed-position dropdown overlay - opens downward, above everything */}
      {isOpen && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => { setIsOpen(false); setSearch(''); }} />
          <div
            style={dropdownStyle}
            className="bg-white border border-[#E1E3EA] rounded-2xl shadow-2xl overflow-hidden max-h-[260px] flex flex-col animate-dropdown"
          >
            {/* Search input */}
            <div className="p-2.5 border-b border-[#F1F1F4] bg-[#F9F9F9] flex items-center gap-2">
              <Search size={13} className="text-[#A1A5B7] shrink-0" />
              <input
                type="text"
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="w-full text-xs font-semibold bg-transparent outline-none text-[#181C32] placeholder-[#B5B5C3]"
              />
              {search && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setSearch(''); }} className="text-[#A1A5B7] hover:text-[#F1416C]">
                  <X size={11} />
                </button>
              )}
            </div>
            {/* Options */}
            <div className="overflow-y-auto max-h-[200px]">
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-xs text-[#B5B5C3] text-center italic font-semibold">
                  Tidak ditemukan
                </div>
              ) : (
                filteredOptions.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors border-b border-[#FAFBFC] last:border-b-0 ${
                      String(opt.value) === String(value)
                        ? 'bg-[#E1F0FF] text-[#0095E8]'
                        : 'text-[#3F4254] hover:bg-[#F5F8FA]'
                    }`}
                  >
                    {opt.label}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AssetList = () => {
  const { confirm, success, error: showError } = useModal();
  const navigate = useNavigate();

  // Get current user permissions
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const canCreate = hasPermission(currentUser, 'pure_asset_register', 'Buat');
  const canEdit = hasPermission(currentUser, 'pure_asset_register', 'Edit');
  const canDelete = hasPermission(currentUser, 'pure_asset_register', 'Hapus');

  // Database lists
  const [assets, setAssets] = useState([]);
  const [masterAssets, setMasterAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [conditions, setConditions] = useState([]);

  // Filter and pagination states
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Date Filter Range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detailed Filtering States (Tanggal Perolehan, Lokasi, Kondisi, Departemen, Pengguna Aset, Vendor)
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  // Modal UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // Nested Modal (Tambah Data Aset) States
  const [isNestedModalOpen, setIsNestedModalOpen] = useState(false);
  const [nestedAssetForm, setNestedAssetForm] = useState({
    asset_id: '',
    asset_name: '',
    category_id: '',
    specification: ''
  });
  
  // Custom images state & Image Lightbox zoom state
  const [uploadedImages, setUploadedImages] = useState([]);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Form core states matching form mockup
  const [assetForm, setAssetForm] = useState({
    asset_id: '',
    asset_name: '',
    register_no: '',
    brand: '',
    model_tipe: '',
    serial_number: '',
    category_id: '',
    location_id: '',
    vendor_id: '',
    department_id: '',
    condition_id: '',
    asset_user: '',
    acquisition_date: '',
    acquisition_cost: '',
    specification: '',
    is_depreciable: false,
    depreciation_formula: '',
    depreciation_percent: '',
    rfid_tag: '',
    status: 'Active'
  });

  const [isMultiple, setIsMultiple] = useState(false);
  const [multipleQty, setMultipleQty] = useState(1);

  // Import State
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [showImportReport, setShowImportReport] = useState(false);
  const [importReport, setImportReport] = useState({ success: 0, failed: 0, details: [] });

  // Pre-import checker & sheet selector state
  const [importWorkbook, setImportWorkbook] = useState(null);
  const [importSheets, setImportSheets] = useState([]);
  const [selectedImportSheet, setSelectedImportSheet] = useState('');
  const [showPreImportModal, setShowPreImportModal] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState('suffix'); // 'suffix' or 'skip'
  const [preImportStats, setPreImportStats] = useState({
    totalRows: 0,
    internalDuplicates: 0,
    dbDuplicates: 0,
    readyToImport: 0,
    details: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Auto-toggle depreciable status when category is selected
  useEffect(() => {
    if (!assetForm.category_id) return;
    const selectedCat = categories.find(c => String(c.id) === String(assetForm.category_id));
    if (!selectedCat) return;

    const catMethod = String(selectedCat.depreciation_method || '').toLowerCase();
    const kelompok = String(selectedCat.group_of_assets || '').toLowerCase();

    const hasDepreciation = catMethod.includes('straight') || 
                            catMethod.includes('declining') || 
                            catMethod.includes('garis lurus') || 
                            catMethod.includes('saldo') || 
                            kelompok.includes('kelompok') || 
                            kelompok.includes('bangunan');

    setAssetForm(prev => ({
      ...prev,
      is_depreciable: hasDepreciation
    }));
  }, [assetForm.category_id, categories]);

  // 2. Auto-calculate Depreciation Percentage based on Indonesian PMK 72/2023 tax rules
  useEffect(() => {
    if (!assetForm.category_id) return;
    const selectedCat = categories.find(c => String(c.id) === String(assetForm.category_id));
    if (!selectedCat) return;

    const kelompok = String(selectedCat.group_of_assets || '').toLowerCase().trim();
    
    // Only auto-calculate if is_depreciable is checked
    if (!assetForm.is_depreciable) {
      setAssetForm(prev => ({
        ...prev,
        depreciation_formula: 'None',
        depreciation_percent: '0'
      }));
      return;
    }

    // Default formula preset from category if not set
    let activeFormula = assetForm.depreciation_formula;
    if (!activeFormula || activeFormula === 'None') {
      const catMethod = String(selectedCat.depreciation_method || '').toLowerCase();
      if (catMethod.includes('garis lurus') || catMethod.includes('straight')) {
        activeFormula = 'Straight-Line';
      } else if (catMethod.includes('saldo menurun') || catMethod.includes('declining')) {
        activeFormula = 'Declining Balance';
      } else {
        activeFormula = 'Straight-Line'; // fallback default
      }
    }

    let percent = '';
    const cleanFormula = activeFormula.toLowerCase();

    if (kelompok.includes('kelompok 1') || kelompok.includes('kelompok i') || kelompok.includes('group 1')) {
      if (cleanFormula.includes('straight')) {
        percent = '12.5';
      } else if (cleanFormula.includes('declining')) {
        percent = '25';
      }
    } else if (kelompok.includes('kelompok 2') || kelompok.includes('kelompok ii') || kelompok.includes('group 2')) {
      if (cleanFormula.includes('straight')) {
        percent = '6.25';
      } else if (cleanFormula.includes('declining')) {
        percent = '12.5';
      }
    } else if (kelompok.includes('kelompok 3') || kelompok.includes('kelompok iii') || kelompok.includes('group 3')) {
      if (cleanFormula.includes('straight')) {
        percent = '5';
      } else if (cleanFormula.includes('declining')) {
        percent = '10';
      }
    } else if (kelompok.includes('kelompok 4') || kelompok.includes('kelompok iv') || kelompok.includes('group 4')) {
      if (cleanFormula.includes('straight')) {
        percent = '2.5';
      } else if (cleanFormula.includes('declining')) {
        percent = '5';
      }
    } else if (kelompok.includes('bangunan permanen') || kelompok.includes('permanen')) {
      if (cleanFormula.includes('straight')) {
        percent = '5';
      }
    } else if (kelompok.includes('bangunan tidak permanen') || kelompok.includes('tidak permanen')) {
      if (cleanFormula.includes('straight')) {
        percent = '10';
      }
    }

    setAssetForm(prev => ({
      ...prev,
      depreciation_formula: activeFormula,
      depreciation_percent: percent
    }));

  }, [assetForm.category_id, assetForm.depreciation_formula, assetForm.is_depreciable, categories]);

  // Helper to format raw number to Indonesian Rupiah currency string
  const formatRupiah = (value) => {
    if (value === null || value === undefined || value === '') return '';
    
    // Remove all non-digit characters
    const cleanValue = String(value).replace(/\D/g, '');
    if (!cleanValue) return '';
    
    // Parse to base 10 to automatically strip any annoying leading zeros
    const num = parseInt(cleanValue, 10);
    if (isNaN(num)) return '';
    
    // Return with Indonesian dot separators
    return 'Rp. ' + num.toLocaleString('id-ID');
  };

  // Helper to parse currency string back to raw numeric string/value
  const parseRupiah = (value) => {
    if (!value) return '';
    const cleanValue = String(value).replace(/\D/g, '');
    return cleanValue ? parseInt(cleanValue, 10) : '';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAssets, resMasters, resCats, resLocs, resVendors, resDepts, resConds] = await Promise.all([
        authFetch('/api/pure-assets?is_master=0'),
        authFetch('/api/pure-assets?is_master=1'),
        authFetch('/api/pure-assets/categories'),
        authFetch('/api/pure-assets/locations'),
        authFetch('/api/pure-assets/vendors'),
        authFetch('/api/pure-assets/departments'),
        authFetch('/api/pure-assets/conditions?type=asset')
      ]);

      const [dataAssets, dataMasters, dataCats, dataLocs, dataVendors, dataDepts, dataConds] = await Promise.all([
        resAssets.ok ? resAssets.json() : [],
        resMasters.ok ? resMasters.json() : [],
        resCats.ok ? resCats.json() : [],
        resLocs.ok ? resLocs.json() : [],
        resVendors.ok ? resVendors.json() : [],
        resDepts.ok ? resDepts.json() : [],
        resConds.ok ? resConds.json() : []
      ]);

      setAssets(dataAssets);
      setMasterAssets(dataMasters);
      setCategories(dataCats);
      setLocations(dataLocs);
      setVendors(dataVendors);
      setDepartments(dataDepts);
      setConditions(dataConds);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Gagal memuat data', 'Terjadi kesalahan saat memproses data aset.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedAsset(null);
    setUploadedImages([]);
    setIsMultiple(false);
    setMultipleQty(1);
    
    const today = new Date().toISOString().substring(0, 10);

    setAssetForm({
      asset_id: '',
      asset_name: '',
      register_no: '',
      brand: '',
      model_tipe: '',
      serial_number: '',
      category_id: '',
      location_id: '',
      vendor_id: '',
      department_id: '',
      condition_id: conditions[0]?.id || '',
      asset_user: '',
      acquisition_date: today,
      acquisition_cost: '', // Leave empty by default so 0 doesn't annoy the user!
      specification: '',
      is_depreciable: false,
      depreciation_formula: '',
      depreciation_percent: '',
      rfid_tag: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asset) => {
    setModalMode('edit');
    setSelectedAsset(asset);
    setIsMultiple(false);
    setMultipleQty(1);
    
    // Load existing asset images — serverPath = stored path, preview = display URL
    const existing = [];
    if (asset.image_1) existing.push({ preview: asset.image_1, serverPath: asset.image_1, isExisting: true });
    if (asset.image_2) existing.push({ preview: asset.image_2, serverPath: asset.image_2, isExisting: true });
    if (asset.image_3) existing.push({ preview: asset.image_3, serverPath: asset.image_3, isExisting: true });
    setUploadedImages(existing);
    
    let formattedDate = '';
    if (asset.acquisition_date) {
      formattedDate = new Date(asset.acquisition_date).toISOString().substring(0, 10);
    }

    setAssetForm({
      asset_id: asset.asset_id || '',
      asset_name: asset.asset_name || '',
      register_no: asset.register_no || '',
      brand: asset.brand || '',
      model_tipe: asset.model_tipe || '',
      serial_number: asset.serial_number || '',
      category_id: asset.category_id || '',
      location_id: asset.location_id || '',
      vendor_id: asset.vendor_id || '',
      department_id: asset.department_id || '',
      condition_id: asset.condition_id || '',
      asset_user: asset.asset_user || '',
      acquisition_date: formattedDate,
      acquisition_cost: asset.acquisition_cost !== null && asset.acquisition_cost !== undefined ? asset.acquisition_cost : '',
      specification: asset.specification || '',
      is_depreciable: !!asset.is_depreciable,
      depreciation_formula: asset.depreciation_formula || '',
      depreciation_percent: asset.depreciation_percent || '',
      rfid_tag: asset.rfid_tag || '',
      status: asset.status || 'Active'
    });
    setIsModalOpen(true);
  };

  // Image upload
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImages.length + files.length > 3) {
      showError('Limit Gambar', 'Anda hanya dapat mengunggah maksimal 3 gambar.');
      return;
    }

    const uploaded = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          uploaded.push({ preview: URL.createObjectURL(file), serverPath: data.url, isExisting: false });
        } else {
          showError('Upload Gagal', `Gagal mengupload ${file.name}`);
        }
      } catch (err) {
        showError('Upload Error', `Error mengupload ${file.name}`);
      }
    }
    setUploadedImages(prev => [...prev, ...uploaded]);
  };

  const removeUploadedImage = (index) => {
    const updated = [...uploadedImages];
    if (!updated[index].isExisting) {
      URL.revokeObjectURL(updated[index].preview);
    }
    updated.splice(index, 1);
    setUploadedImages(updated);
  };

  // Auto generator ID
  const handleGenerateAssetId = async () => {
    try {
      const countRes = await authFetch('/api/pure-assets');
      const allAssets = countRes.ok ? await countRes.json() : [];
      const code = `AST-${String(allAssets.length + 1).padStart(5, '0')}`;
      setAssetForm(prev => ({ ...prev, asset_id: code }));
      success('ID Tergenerasi', `Kode unik aset "${code}" berhasil dibuat.`);
    } catch {
      showError('Gagal', 'Gagal membuat kode ID aset otomatis.');
    }
  };

  // Open nested modal for adding new Asset Type (Master Asset)
  const handleOpenNestedModal = () => {
    setNestedAssetForm({
      asset_id: '',
      asset_name: '',
      category_id: '',
      specification: ''
    });
    setIsNestedModalOpen(true);
  };

  // Submit handler for adding new Asset Type (Master Asset)
  const handleNestedSubmit = async (e) => {
    e.preventDefault();
    if (!nestedAssetForm.asset_name) {
      showError('Gagal', 'Nama Aset harus diisi.');
      return;
    }

    try {
      let finalAssetId = nestedAssetForm.asset_id;
      if (!finalAssetId) {
        // Auto-generate beautiful unique Asset ID prefix if left blank
        const prefix = 'AST';
        const count = assets.length + 1;
        finalAssetId = `${prefix}-${String(count).padStart(5, '0')}`;
      }

      const payload = {
        asset_id: finalAssetId,
        asset_name: nestedAssetForm.asset_name,
        category_id: nestedAssetForm.category_id || null,
        specification: nestedAssetForm.specification || '',
        status: 'Active',
        is_master: 1
      };

      const res = await authFetch('/api/pure-assets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newAsset = await res.json();
        success('Berhasil', `Data Aset "${newAsset.asset_name}" berhasil didaftarkan di Master Data.`);
        setIsNestedModalOpen(false);
        
        // Refresh backend data list
        await fetchData();

        // Automatically set in main form
        setAssetForm(prev => ({
          ...prev,
          asset_id: newAsset.asset_id,
          asset_name: newAsset.asset_name,
          category_id: newAsset.category_id || prev.category_id,
          specification: newAsset.specification || prev.specification
        }));
      } else {
        const errJson = await res.json().catch(() => ({}));
        showError('Gagal', errJson.message || errJson.error || 'Gagal menyimpan ke database.');
      }
    } catch (err) {
      console.error(err);
      showError('Kesalahan', 'Terjadi kesalahan sistem saat mendaftarkan aset.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = modalMode === 'add' ? '/api/pure-assets' : `/api/pure-assets/${selectedAsset.id}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const payload = { ...assetForm };
      payload.is_master = 0;
      
      // Clean up fields to match database constraints and ignore dynamic/unsupported fields
      delete payload.depreciation_percent; // FIX: Prevent unknown column error in pa_assets

      if (payload.category_id === '') payload.category_id = null;
      if (payload.location_id === '') payload.location_id = null;
      if (payload.vendor_id === '') payload.vendor_id = null;
      if (payload.department_id === '') payload.department_id = null;
      if (payload.condition_id === '') payload.condition_id = null;
      if (payload.acquisition_cost === '') payload.acquisition_cost = null;
      if (payload.acquisition_date === '') payload.acquisition_date = null;

      payload.is_depreciable = payload.is_depreciable === 'Ya' || payload.is_depreciable === true || payload.is_depreciable === 1 ? 1 : 0;

      // Handle images mapping — use serverPath if uploaded, else existing preview (for existing saved paths)
      const currentImages = uploadedImages.map(img => img.serverPath || img.preview);
      payload.image_1 = currentImages[0] || null;
      payload.image_2 = currentImages[1] || null;
      payload.image_3 = currentImages[2] || null;

      if (modalMode === 'add' && isMultiple && multipleQty > 1) {
        let successCount = 0;
        for (let i = 0; i < multipleQty; i++) {
          const iteratedPayload = { ...payload };
          if (iteratedPayload.asset_id) {
            iteratedPayload.asset_id = `${payload.asset_id}-${i + 1}`;
          }
          if (iteratedPayload.register_no) {
            iteratedPayload.register_no = `${payload.register_no}-${String(i + 1).padStart(3, '0')}`;
          }
          
          const res = await authFetch(url, {
            method,
            body: JSON.stringify(iteratedPayload)
          });
          if (res.ok) successCount++;
        }
        success('Berhasil', `${successCount} data aset berganda berhasil ditambahkan.`);
        setIsModalOpen(false);
        fetchData();
        return;
      }

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        success('Berhasil', `Data aset berhasil ${modalMode === 'add' ? 'ditambahkan' : 'diperbarui'}.`);
        setIsModalOpen(false);
        fetchData();
      } else {
        const errorData = await res.json();
        showError('Pendaftaran Gagal', errorData.message || 'Harap periksa kembali isian Anda.');
      }
    } catch (err) {
      console.error(err);
      showError('Kesalahan Jaringan', 'Gagal terhubung dengan server.');
    }
  };

  const handleDelete = (asset) => {
    confirm(
      'Hapus Aset',
      `Apakah Anda yakin ingin menghapus data aset "${asset.asset_name}"? Tindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          const res = await authFetch(`/api/pure-assets/${asset.id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            success('Berhasil Dihapus', 'Data aset telah terhapus permanen dari sistem.');
            fetchData();
          } else {
            showError('Gagal Dihapus', 'Gagal memproses penghapusan data aset.');
          }
        } catch (err) {
          console.error(err);
          showError('Kesalahan Jaringan', 'Terjadi masalah koneksi ke server.');
        }
      }
    );
  };

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return '-';
    }
  };

  // Filtered Assets list
  const filteredAssets = assets
    .filter(asset => {
      const matchesSearch = 
        (asset.asset_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.asset_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.model_tipe || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.serial_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.register_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.category_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.location_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.department_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.asset_user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.vendor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.specification || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (startDate || endDate) {
        if (!asset.acquisition_date) return false;
        const acqDate = new Date(asset.acquisition_date);
        acqDate.setHours(0,0,0,0);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0,0,0,0);
          if (acqDate < start) return false;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23,59,59,999);
          if (acqDate > end) return false;
        }
      }

      // Detailed filters matching database records
      if (filterLocation && String(asset.location_id) !== String(filterLocation)) return false;
      if (filterCondition && String(asset.condition_id) !== String(filterCondition)) return false;
      if (filterDepartment && String(asset.department_id) !== String(filterDepartment)) return false;
      if (filterVendor && String(asset.vendor_id) !== String(filterVendor)) return false;
      if (filterUser && asset.asset_user !== filterUser) return false;

      return true;
    })
    .sort((a, b) => (a.asset_name || '').localeCompare(b.asset_name || ''));

  const totalPages = Math.ceil(filteredAssets.length / rowsPerPage);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, rowsPerPage, filterLocation, filterCondition, filterDepartment, filterUser, filterVendor]);

  // Download template using server route
  const handleDownloadTemplate = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (searchTerm) queryParams.append('searchTerm', searchTerm);
      if (filterLocation) queryParams.append('location_id', filterLocation);
      if (filterCondition) queryParams.append('condition_id', filterCondition);
      if (filterDepartment) queryParams.append('department_id', filterDepartment);
      if (filterUser) queryParams.append('asset_user', filterUser);
      if (filterVendor) queryParams.append('vendor_id', filterVendor);

      const hasFilteredData = filteredAssets.length > 0 && (startDate || endDate || searchTerm);
      let filename = 'Template Import Data Asset- 2025.xlsx';
      if (hasFilteredData) {
        const startLabel = startDate ? startDate.replace(/-/g, '') : 'ALL';
        const endLabel = endDate ? endDate.replace(/-/g, '') : 'NOW';
        filename = `Data_Aset_Export_${startLabel}_to_${endLabel}.xlsx`;
      }

      const res = await authFetch(`/api/pure-assets/download-excel?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to download excel from server');
      }

      const blob = await res.blob();
      saveAs(blob, filename);
      success('Berhasil Diunduh', `File "${filename}" berhasil diunduh dengan format orisinal.`);
    } catch (err) {
      console.error(err);
      showError('Gagal Mengunduh', 'Terjadi kesalahan saat memproses pengunduhan berkas Excel dari server.');
    }
  };

  // Robust ExcelJS cell helper functions
  const getCellValue = (cell) => {
    if (!cell) return '';
    const val = cell.value;
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      if (val.richText) {
        return val.richText.map(t => t.text).join('').trim();
      }
      if (val.text) {
        return String(val.text).trim();
      }
      if (val.result !== undefined) {
        return String(val.result).trim();
      }
      return '';
    }
    return String(val).trim();
  };

  const getCellNumberValue = (cell) => {
    if (!cell) return null;
    const val = cell.value;
    if (val === null || val === undefined) return null;
    if (typeof val === 'object') {
      if (val.result !== undefined && val.result !== null) {
        return Number(val.result);
      }
      if (val.richText) {
        const txt = val.richText.map(t => t.text).join('').trim();
        return isNaN(Number(txt)) ? null : Number(txt);
      }
      return null;
    }
    return isNaN(Number(val)) ? null : Number(val);
  };

  const getCellDateValue = (cell) => {
    if (!cell) return null;
    const val = cell.value;
    if (val === null || val === undefined) return null;
    
    let dateVal = val;
    if (typeof val === 'object') {
      if (val.result) {
        dateVal = val.result;
      } else if (val.richText) {
        dateVal = val.richText.map(t => t.text).join('').trim();
      } else if (val instanceof Date) {
        dateVal = val;
      } else {
        return null;
      }
    }

    if (dateVal instanceof Date) {
      return dateVal.toISOString().substring(0, 10);
    }
    
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().substring(0, 10);
    }
    return null;
  };

  // Pre-import Excel analyzer (runs duplicate checker)
  const analyzeSheet = (wb, sheetName) => {
    if (!wb) return;
    const ws = wb.getWorksheet(sheetName);
    if (!ws) return;

    const headerRow = ws.getRow(1);
    let colMapping = {
      assetName: -1,
      assetCode: -1,
      registerNo: -1
    };

    const normalizeHeader = (val) => String(val || '').toLowerCase().trim();
    headerRow.eachCell((cell, colNumber) => {
      const h = normalizeHeader(cell.value);
      if (h === 'no') return;
      if (h.includes('nama aset') || h.includes('nama barang') || h === 'nama') {
        colMapping.assetName = colNumber;
      } else if (h.includes('kode aset') || h.includes('kode barang') || h.includes('kode')) {
        colMapping.assetCode = colNumber;
      } else if (h.includes('no register') || h.includes('no inv') || h.includes('register') || h.includes('invoice') || h.includes('no label')) {
        colMapping.registerNo = colNumber;
      }
    });

    if (colMapping.assetName === -1) {
      colMapping = {
        assetName: 6,
        assetCode: 7,
        registerNo: 8
      };
    }

    const dbAssetIds = new Set(assets.map(a => String(a.asset_id || '').toLowerCase()));
    
    let totalRows = 0;
    let internalDuplicates = 0;
    let dbDuplicates = 0;
    let readyToImport = 0;
    const details = [];

    const sheetAssetIds = [];
    const idOccurrencesInSheet = {};

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const name = getCellValue(row.getCell(colMapping.assetName));
      if (name) {
        totalRows++;
        const code = getCellValue(row.getCell(colMapping.assetCode));
        if (code) {
          sheetAssetIds.push({ row: r, code, name });
          idOccurrencesInSheet[code.toLowerCase()] = (idOccurrencesInSheet[code.toLowerCase()] || 0) + 1;
        } else {
          readyToImport++;
        }
      }
    }

    const seenInSheet = new Set();
    sheetAssetIds.forEach(item => {
      const codeLower = item.code.toLowerCase();
      let isDup = false;

      // 1. Check database duplicate
      const inDb = dbAssetIds.has(codeLower);

      // 2. Check duplicate within Excel
      const internalDupCount = idOccurrencesInSheet[codeLower] || 0;
      const isInternalDup = internalDupCount > 1;

      if (inDb) {
        dbDuplicates++;
        details.push({
          row: item.row,
          name: item.name,
          code: item.code,
          type: 'Sudah Ada di Database'
        });
        isDup = true;
      }

      if (isInternalDup) {
        if (seenInSheet.has(codeLower)) {
          internalDuplicates++;
          details.push({
            row: item.row,
            name: item.name,
            code: item.code,
            type: 'Duplikat di File Excel (Baris Berulang)'
          });
          isDup = true;
        }
      }

      seenInSheet.add(codeLower);

      if (!isDup) {
        readyToImport++;
      }
    });

    setPreImportStats({
      totalRows,
      internalDuplicates,
      dbDuplicates,
      readyToImport,
      details
    });
  };

  // Excel Importer
  const handleImportTemplate = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const buffer = evt.target.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);

          const sheetNames = workbook.worksheets.map(ws => ws.name);
          if (sheetNames.length === 0) {
            showError('Format Tidak Sesuai', 'Gagal menemukan sheet di dalam berkas Excel.');
            return;
          }

          setImportWorkbook(workbook);
          setImportSheets(sheetNames);
          const firstSheet = sheetNames[0];
          setSelectedImportSheet(firstSheet);

          // Clear file value to allow re-upload if desired
          e.target.value = '';

          setShowPreImportModal(true);
          
          // Analyze first sheet
          setTimeout(() => {
            analyzeSheet(workbook, firstSheet);
          }, 100);

        } catch (err) {
          console.error(err);
          showError('Gagal Membaca File', 'Format file tidak sesuai atau file rusak.');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      showError('Gagal Membaca File', 'Gagal membaca berkas Excel.');
    }
  };

  const executeImport = async () => {
    setShowPreImportModal(false);
    setImporting(true);
    setImportProgress(0);
    
    try {
      const worksheet = importWorkbook.getWorksheet(selectedImportSheet);
      if (!worksheet) {
        showError('Gagal Impor', 'Sheet terpilih tidak ditemukan.');
        setImporting(false);
        return;
      }

      // Let's analyze Row 1 headers to determine column mapping dynamically!
      const headerRow = worksheet.getRow(1);
      let colMapping = {
        categoryCode: -1,
        categoryName: -1,
        kelompokHarta: -1,
        metodeDepresiasi: -1,
        assetName: -1,
        assetCode: -1,
        registerNo: -1,
        dateVal: -1,
        costVal: -1,
        vendorName: -1,
        specs: -1,
        locName: -1,
        deptName: -1,
        conditionName: -1,
        assetUser: -1
      };

      const normalizeHeader = (val) => String(val || '').toLowerCase().trim();

      headerRow.eachCell((cell, colNumber) => {
        const h = normalizeHeader(cell.value);
        if (h === 'no') return;
        
        if (h.includes('nama aset') || h.includes('nama barang') || h === 'nama') {
          colMapping.assetName = colNumber;
        } else if (h.includes('kode aset') || h.includes('kode barang') || h.includes('kode')) {
          colMapping.assetCode = colNumber;
        } else if (h.includes('no register') || h.includes('no inv') || h.includes('register') || h.includes('invoice') || h.includes('no label')) {
          colMapping.registerNo = colNumber;
        } else if (h.includes('tanggal perolehan') || h.includes('tahun perolehan') || h.includes('tanggal')) {
          colMapping.dateVal = colNumber;
        } else if (h.includes('harga perolehan') || h.includes('harga') || h.includes('cost')) {
          colMapping.costVal = colNumber;
        } else if (h.includes('vendor') || h.includes('supplier')) {
          colMapping.vendorName = colNumber;
        } else if (h.includes('spesifikasi') || h.includes('specs') || h.includes('keterangan')) {
          colMapping.specs = colNumber;
        } else if (h.includes('lokasi')) {
          colMapping.locName = colNumber;
        } else if (h.includes('department') || h.includes('dept') || h.includes('departemen')) {
          colMapping.deptName = colNumber;
        } else if (h.includes('kondisi') || h.includes('condition') || h.includes('status kondisi')) {
          colMapping.conditionName = colNumber;
        } else if (h.includes('asset user') || h.includes('pengguna') || h.includes('pic')) {
          colMapping.assetUser = colNumber;
        } else if (h.includes('kode kategori') || h.includes('category code')) {
          colMapping.categoryCode = colNumber;
        } else if (h.includes('nama kategori') || h.includes('category name') || h.includes('kategori')) {
          colMapping.categoryName = colNumber;
        } else if (h.includes('kelompok harta') || h.includes('kelompok')) {
          colMapping.kelompokHarta = colNumber;
        } else if (h.includes('metode depresiasi') || h.includes('metode')) {
          colMapping.metodeDepresiasi = colNumber;
        }
      });

      if (colMapping.assetName === -1) {
        colMapping = {
          categoryCode: 2,
          categoryName: 3,
          kelompokHarta: 4,
          metodeDepresiasi: 5,
          assetName: 6,
          assetCode: 7,
          registerNo: 8,
          dateVal: 9,
          costVal: 10,
          vendorName: 11,
          specs: 12,
          locName: 13,
          deptName: 14,
          conditionName: -1,
          assetUser: 15
        };
      }

      const records = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const assetName = getCellValue(row.getCell(colMapping.assetName));
          
          if (assetName) {
            const categoryCode = colMapping.categoryCode !== -1 ? getCellValue(row.getCell(colMapping.categoryCode)) : '';
            const categoryName = colMapping.categoryName !== -1 ? getCellValue(row.getCell(colMapping.categoryName)) : '';
            const kelompokHarta = colMapping.kelompokHarta !== -1 ? getCellValue(row.getCell(colMapping.kelompokHarta)) : '';
            const metodeDepresiasi = colMapping.metodeDepresiasi !== -1 ? getCellValue(row.getCell(colMapping.metodeDepresiasi)) : '';
            
            const assetCode = colMapping.assetCode !== -1 ? getCellValue(row.getCell(colMapping.assetCode)) : '';
            const registerNo = colMapping.registerNo !== -1 ? getCellValue(row.getCell(colMapping.registerNo)) : '';
            
            const dateVal = colMapping.dateVal !== -1 ? getCellDateValue(row.getCell(colMapping.dateVal)) : null;
            const costVal = colMapping.costVal !== -1 ? getCellNumberValue(row.getCell(colMapping.costVal)) : null;
            
            const vendorName = colMapping.vendorName !== -1 ? getCellValue(row.getCell(colMapping.vendorName)) : '';
            const specs = colMapping.specs !== -1 ? getCellValue(row.getCell(colMapping.specs)) : '';
            const locName = colMapping.locName !== -1 ? getCellValue(row.getCell(colMapping.locName)) : '';
            const deptName = colMapping.deptName !== -1 ? getCellValue(row.getCell(colMapping.deptName)) : '';
            const conditionName = colMapping.conditionName !== -1 ? getCellValue(row.getCell(colMapping.conditionName)) : '';
            const assetUser = colMapping.assetUser !== -1 ? getCellValue(row.getCell(colMapping.assetUser)) : '';

            records.push({
              categoryCode,
              categoryName,
              kelompokHarta,
              metodeDepresiasi,
              assetName,
              assetCode,
              registerNo,
              acquisition_date: dateVal,
              acquisition_cost: costVal,
              vendorName,
              specification: specs,
              locationName: locName,
              departmentName: deptName,
              conditionName: conditionName,
              asset_user: assetUser
            });
          }
        }
      });

      if (records.length === 0) {
        showError('Data Kosong', 'Tidak ditemukan baris data aset yang valid.');
        setImporting(false);
        return;
      }

      setImportTotal(records.length);
      
      const catMap = {};
      categories.forEach(c => {
        catMap[c.category_name.toLowerCase()] = c.id;
        if (c.category_code) catMap[c.category_code.toLowerCase()] = c.id;
      });

      const locMap = {};
      locations.forEach(l => { locMap[l.location_name.toLowerCase()] = l.id; });

      const vendorMap = {};
      vendors.forEach(v => { vendorMap[v.vendor_name.toLowerCase()] = v.id; });

      const deptMap = {};
      departments.forEach(d => { deptMap[d.name.toLowerCase()] = d.id; });

      const conditionMap = {};
      conditions.forEach(c => { conditionMap[c.condition_name.toLowerCase()] = c.id; });

      const defaultConditionObj = conditions.find(c => {
        const name = (c.condition_name || '').toLowerCase();
        return name === 'baik' || name === 'bagus' || name === 'good' || name === 'active';
      }) || conditions[0];

      const defaultConditionId = defaultConditionObj?.id || null;

      let successCount = 0;
      let failCount = 0;
      const failedRows = [];

      const dbAssetIds = new Set(assets.map(a => String(a.asset_id || '').toLowerCase()));

      let localCategories = [...categories];
      let localLocations = [...locations];
      let localVendors = [...vendors];
      let localDepartments = [...departments];
      let localConditions = [...conditions];

      for (let i = 0; i < records.length; i++) {
        const rec = records[i];

        // 1. AUTO-CREATE MASTER DATA ON-THE-FLY
        let mappedCatId = null;
        if (rec.categoryName) {
          const cNameLower = rec.categoryName.toLowerCase();
          if (catMap[cNameLower]) {
            mappedCatId = catMap[cNameLower];
          } else {
            try {
              const newCatRes = await authFetch('/api/pure-assets/categories', {
                method: 'POST',
                body: JSON.stringify({
                  category_code: rec.categoryCode || `CAT-${String(localCategories.length + 1).padStart(3, '0')}`,
                  category_name: rec.categoryName,
                  kelompok_harta: rec.kelompokHarta || '',
                  depreciation_method: rec.metodeDepresiasi || 'Garis Lurus'
                })
              });
              if (newCatRes.ok) {
                const newCat = await newCatRes.json();
                mappedCatId = newCat.id;
                catMap[cNameLower] = newCat.id;
                localCategories.push(newCat);
              }
            } catch (err) {
              console.error('Error auto-creating category:', err);
            }
          }
        }

        let mappedLocId = null;
        if (rec.locationName) {
          const lNameLower = rec.locationName.toLowerCase();
          if (locMap[lNameLower]) {
            mappedLocId = locMap[lNameLower];
          } else {
            try {
              const newLocRes = await authFetch('/api/pure-assets/locations', {
                method: 'POST',
                body: JSON.stringify({ location_name: rec.locationName })
              });
              if (newLocRes.ok) {
                const newLoc = await newLocRes.json();
                mappedLocId = newLoc.id;
                locMap[lNameLower] = newLoc.id;
                localLocations.push(newLoc);
              }
            } catch (err) {
              console.error('Error auto-creating location:', err);
            }
          }
        }

        let mappedVendorId = null;
        if (rec.vendorName) {
          const vNameLower = rec.vendorName.toLowerCase();
          if (vendorMap[vNameLower]) {
            mappedVendorId = vendorMap[vNameLower];
          } else {
            try {
              const newVendorRes = await authFetch('/api/pure-assets/vendors', {
                method: 'POST',
                body: JSON.stringify({ vendor_name: rec.vendorName })
              });
              if (newVendorRes.ok) {
                const newVendor = await newVendorRes.json();
                mappedVendorId = newVendor.id;
                vendorMap[vNameLower] = newVendor.id;
                localVendors.push(newVendor);
              }
            } catch (err) {
              console.error('Error auto-creating vendor:', err);
            }
          }
        }

        let mappedDeptId = null;
        if (rec.departmentName) {
          const dNameLower = rec.departmentName.toLowerCase();
          if (deptMap[dNameLower]) {
            mappedDeptId = deptMap[dNameLower];
          } else {
            try {
              const newDeptRes = await authFetch('/api/pure-assets/departments', {
                method: 'POST',
                body: JSON.stringify({ name: rec.departmentName })
              });
              if (newDeptRes.ok) {
                const newDept = await newDeptRes.json();
                mappedDeptId = newDept.id;
                deptMap[dNameLower] = newDept.id;
                localDepartments.push(newDept);
              }
            } catch (err) {
              console.error('Error auto-creating department:', err);
            }
          }
        }

        let mappedCondId = null;
        if (rec.conditionName) {
          const condNameLower = rec.conditionName.toLowerCase();
          if (conditionMap[condNameLower]) {
            mappedCondId = conditionMap[condNameLower];
          } else {
            try {
              const newCondRes = await authFetch('/api/pure-assets/conditions', {
                method: 'POST',
                body: JSON.stringify({ condition_name: rec.conditionName, condition_type: 'Active' })
              });
              if (newCondRes.ok) {
                const newCond = await newCondRes.json();
                mappedCondId = newCond.id;
                conditionMap[condNameLower] = newCond.id;
                localConditions.push(newCond);
              }
            } catch (err) {
              console.error('Error auto-creating condition:', err);
            }
          }
        } else {
          mappedCondId = defaultConditionId;
        }

        let finalAssetId = rec.assetCode || null;
        
        if (finalAssetId) {
          const isExist = dbAssetIds.has(finalAssetId.toLowerCase());
          
          if (isExist && duplicateStrategy === 'skip') {
            failCount++;
            failedRows.push({
              row: i + 2,
              name: rec.assetName || 'Tanpa Nama',
              reason: `Dilewati (Kode Aset '${finalAssetId}' sudah ada di database)`
            });
            continue;
          }

          let tempId = finalAssetId;
          let suffix = 2;
          while (dbAssetIds.has(tempId.toLowerCase())) {
            tempId = `${finalAssetId}-${suffix}`;
            suffix++;
          }
          finalAssetId = tempId;
          dbAssetIds.add(finalAssetId.toLowerCase());
        }

        const payload = {
          asset_id: finalAssetId,
          asset_name: rec.assetName,
          register_no: rec.registerNo || null,
          category_id: mappedCatId,
          location_id: mappedLocId,
          vendor_id: mappedVendorId,
          department_id: mappedDeptId,
          condition_id: mappedCondId,
          asset_pic: '',
          asset_user: rec.asset_user || null,
          acquisition_date: rec.acquisition_date,
          acquisition_cost: rec.acquisition_cost,
          specification: rec.specification || '',
          status: 'Active',
          is_master: 0
        };

        try {
          const res = await authFetch('/api/pure-assets', {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            successCount++;
          } else {
            const errJson = await res.json().catch(() => ({}));
            failCount++;
            failedRows.push({
              row: i + 2,
              name: rec.assetName || 'Tanpa Nama',
              reason: errJson.error || errJson.message || 'Gagal menyimpan ke database'
            });
          }
        } catch (err) {
          console.error(err);
          failCount++;
          failedRows.push({
            row: i + 2,
            name: rec.assetName || 'Tanpa Nama',
            reason: err.message || 'Koneksi terputus saat menyimpan'
          });
        }

        setImportProgress(Math.round(((i + 1) / records.length) * 100));
      }

      setCategories(localCategories);
      setLocations(localLocations);
      setVendors(localVendors);
      setDepartments(localDepartments);
      setConditions(localConditions);

      setImporting(false);
      setImportReport({
        success: successCount,
        failed: failCount,
        details: failedRows
      });
      setShowImportReport(true);
      fetchData(); // Refresh list

    } catch (error) {
      console.error(error);
      showError('Gagal Impor', 'Terjadi kesalahan sistem saat memproses impor data.');
      setImporting(false);
    }
  };

  const sortedCategoriesForDropdown = [...categories].sort((a, b) => 
    (a.category_name || '').localeCompare(b.category_name || '')
  );

  const categoryOptions = sortedCategoriesForDropdown.map(c => ({
    value: c.id,
    label: `${c.category_code || ''} - ${c.category_name}`
  }));

  const assetIdOptions = masterAssets.map(a => ({
    value: a.asset_id,
    label: `${a.asset_id} - ${a.asset_name}`
  }));

  const formulaOptions = [
    { value: 'Straight-Line', label: 'Straight-Line' },
    { value: 'Declining Balance', label: 'Declining Balance' },
    { value: 'Double Declining Balance', label: 'Double Declining Balance' },
    { value: 'None', label: 'None/Tanpa Depresiasi' }
  ];

  const vendorOptions = vendors.map(v => ({ value: v.id, label: v.vendor_name }));
  const locationOptions = locations.map(l => ({ value: l.id, label: l.location_name }));
  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));
  const conditionOptions = conditions.map(c => ({ value: c.id, label: c.condition_name }));

  const uniqueUsers = [...new Set(assets.map(a => a.asset_user).filter(Boolean))].sort();

  const hasActiveFilters = !!(startDate || endDate || searchTerm || filterLocation || filterCondition || filterDepartment || filterUser || filterVendor);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setFilterLocation('');
    setFilterCondition('');
    setFilterDepartment('');
    setFilterUser('');
    setFilterVendor('');
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-fade-in text-left">
      
      {/* Header Breadcrumbs and Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-[#F1F1F4] shadow-sm">
        <div>
          <div className="text-xs text-[#A1A5B7] font-semibold flex items-center gap-1.5 mb-1.5">
            <span>Aset</span>
            <ChevronRight size={12} />
            <span className="text-[#0095E8]">Daftar Aset</span>
          </div>
          <h1 className="text-xl font-bold text-[#181C32]">Daftar Aset</h1>
        </div>

        <div className="flex items-center gap-3">
          {canCreate && (
            <>
              <button 
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md bg-[#0095E8] text-white hover:bg-[#0084CC] shadow-[#0095E8]/10"
              >
                <Plus size={14} />
                Tambah Data
              </button>

              <div className="relative">
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  id="import-excel-input"
                  className="hidden"
                  onChange={handleImportTemplate}
                  disabled={importing}
                />
                <label 
                  htmlFor="import-excel-input"
                  className={`flex items-center gap-2 px-5 py-3 border border-[#E1E3EA] bg-white text-[#5E6278] hover:bg-[#F5F8FA] hover:text-[#0095E8] rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload size={14} />}
                  {importing ? `Mengimpor (${importProgress}/${importTotal})` : 'Impor Data Aset'}
                </label>
              </div>
            </>
          )}


          <button 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-5 py-3 border border-[#E1E3EA] bg-white text-[#5E6278] hover:bg-[#F5F8FA] hover:text-[#0095E8] rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download size={14} />
            Unduh Template
          </button>
        </div>
      </div>

      {/* Premium collapsible advanced filters grid matching Pamflow design system */}
      <div className="bg-white rounded-3xl border border-[#F1F1F4] p-6 shadow-sm mb-6 space-y-5">
        
        {/* PRIMARY ROW: search bar + controls - always visible at TOP */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Main search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={16} />
            <input 
              type="text" 
              placeholder="Cari aset, register, kategori, pengguna, vendor..."
              className="w-full pl-11 pr-4 py-3.5 bg-[#F9F9F9] border border-[#F1F1F4] rounded-2xl text-xs font-extrabold outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all text-[#181C32]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A5B7] hover:text-[#F1416C] transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Controls group */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Rows Per Page */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-[#7E8299] uppercase tracking-wider whitespace-nowrap">Tampilkan:</span>
              <div className="relative">
                <select 
                  value={rowsPerPage} 
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="appearance-none pl-4 pr-8 py-2.5 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-xs font-extrabold text-[#3F4254] outline-none cursor-pointer hover:bg-[#F5F8FA] transition-all w-[75px] text-center shadow-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
              </div>
            </div>

            {/* Toggle advanced filter panel */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl text-xs font-bold transition-all ${
                showAdvancedFilters 
                  ? 'bg-[#F1FAFF] border-[#0095E8]/25 text-[#0095E8]' 
                  : 'bg-white border-[#E1E3EA] text-[#5E6278] hover:bg-[#F5F8FA]'
              }`}
            >
              <Activity size={13} />
              {showAdvancedFilters ? 'Sembunyikan Filter' : 'Filter Lanjutan'}
              <ChevronDown size={12} className={`transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Reset all filters button */}
            {hasActiveFilters && (
              <button 
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FFF5F8] border border-[#F1416C]/15 hover:bg-[#F1416C] hover:text-white text-[#F1416C] rounded-xl text-xs font-bold transition-all"
              >
                <X size={12} />
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* FILTER PANEL - expands DOWNWARD below the controls row */}
        {showAdvancedFilters && (
          <div className="pt-5 border-t border-[#F1F1F4] space-y-4 animate-fade-in">

            {/* Active filter badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pb-1">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F8FA] text-[#5E6278] border border-[#E1E3EA] rounded-full text-[10px] font-bold">
                    <Search size={9} />
                    <span>&quot;{searchTerm}&quot;</span>
                    <button type="button" onClick={() => setSearchTerm('')} className="hover:text-[#F1416C]"><X size={10}/></button>
                  </span>
                )}
                {startDate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E1F0FF] text-[#0095E8] rounded-full text-[10px] font-bold">
                    <Activity size={9} />
                    <span>Mulai: {startDate}</span>
                    <button type="button" onClick={() => setStartDate('')} className="hover:text-[#F1416C]"><X size={10}/></button>
                  </span>
                )}
                {endDate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E1F0FF] text-[#0095E8] rounded-full text-[10px] font-bold">
                    <Activity size={9} />
                    <span>Sampai: {endDate}</span>
                    <button type="button" onClick={() => setEndDate('')} className="hover:text-[#F1416C]"><X size={10}/></button>
                  </span>
                )}
                {filterLocation && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8FFF3] text-[#50CD89] border border-[#50CD89]/20 rounded-full text-[10px] font-bold">
                    <MapPin size={9} />
                    <span>{locations.find(l => String(l.id) === String(filterLocation))?.location_name || filterLocation}</span>
                    <button type="button" onClick={() => setFilterLocation('')} className="hover:text-[#F1416C]"><X size={10}/></button>
                  </span>
                )}
                {filterCondition && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF8DD] text-[#FFA800] border border-[#FFA800]/20 rounded-full text-[10px] font-bold">
                    <span>{conditions.find(c => String(c.id) === String(filterCondition))?.condition_name || filterCondition}</span>
                    <button type="button" onClick={() => setFilterCondition('')} className="hover:text-[#F1416C]"><X size={10}/></button>
                  </span>
                )}
                {filterDepartment && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F5FF] text-[#8950FC] border border-[#8950FC]/20 rounded-full text-[10px] font-bold">
                    <Building2 size={9} />
                    <span>{departments.find(d => String(d.id) === String(filterDepartment))?.name || filterDepartment}</span>
                    <button type="button" onClick={() => setFilterDepartment('')} className="hover:text-[#F1416C]"><X size={10}/></button>
                  </span>
                )}
                {filterUser && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F8FA] text-[#3F4254] border border-[#E1E3EA] rounded-full text-[10px] font-bold">
                    <Users size={9} />
                    <span>{filterUser}</span>
                    <button type="button" onClick={() => setFilterUser('')} className="hover:text-[#F1416C]"><X size={10}/></button>
                  </span>
                )}
                {filterVendor && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF5F8] text-[#F1416C] border border-[#F1416C]/20 rounded-full text-[10px] font-bold">
                    <Box size={9} />
                    <span>{vendors.find(v => String(v.id) === String(filterVendor))?.vendor_name || filterVendor}</span>
                    <button type="button" onClick={() => setFilterVendor('')} className="hover:text-[#F1416C]"><X size={10}/></button>
                  </span>
                )}
              </div>
            )}

            {/* Filter grid - 3 columns, all filter dropdowns are searchable via FilterSelect */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Tanggal Perolehan - date range combined in one cell */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#7E8299] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={11} />
                  Tanggal Perolehan
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date"
                    title="Dari tanggal perolehan"
                    className="flex-1 min-w-0 px-3 py-2.5 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-xs font-bold text-[#3F4254] outline-none hover:bg-white focus:bg-white focus:border-[#0095E8]/30 transition-all"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span className="text-[#A1A5B7] text-xs font-bold shrink-0">–</span>
                  <input 
                    type="date"
                    title="Sampai tanggal perolehan"
                    className="flex-1 min-w-0 px-3 py-2.5 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-xs font-bold text-[#3F4254] outline-none hover:bg-white focus:bg-white focus:border-[#0095E8]/30 transition-all"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Lokasi - searchable FilterSelect */}
              <FilterSelect
                label="Lokasi"
                icon={<MapPin size={11} />}
                options={[{ value: '', label: 'Semua Lokasi' }, ...locations.map(l => ({ value: String(l.id), label: l.location_name }))]}
                value={filterLocation}
                onChange={setFilterLocation}
                placeholder="Semua Lokasi"
              />

              {/* Kondisi - searchable FilterSelect */}
              <FilterSelect
                label="Kondisi Aset"
                icon={<HelpCircle size={11} />}
                options={[{ value: '', label: 'Semua Kondisi' }, ...conditions.map(c => ({ value: String(c.id), label: c.condition_name }))]}
                value={filterCondition}
                onChange={setFilterCondition}
                placeholder="Semua Kondisi"
              />

              {/* Departemen - searchable FilterSelect */}
              <FilterSelect
                label="Departemen"
                icon={<Building2 size={11} />}
                options={[{ value: '', label: 'Semua Departemen' }, ...departments.map(d => ({ value: String(d.id), label: d.name }))]}
                value={filterDepartment}
                onChange={setFilterDepartment}
                placeholder="Semua Departemen"
              />

              {/* Pengguna Aset - searchable FilterSelect */}
              <FilterSelect
                label="Pengguna Aset"
                icon={<Users size={11} />}
                options={[{ value: '', label: 'Semua Pengguna' }, ...uniqueUsers.map(u => ({ value: u, label: u }))]}
                value={filterUser}
                onChange={setFilterUser}
                placeholder="Semua Pengguna"
              />

              {/* Vendor - searchable FilterSelect */}
              <FilterSelect
                label="Vendor Penyedia"
                icon={<Box size={11} />}
                options={[{ value: '', label: 'Semua Vendor' }, ...vendors.map(v => ({ value: String(v.id), label: v.vendor_name }))]}
                value={filterVendor}
                onChange={setFilterVendor}
                placeholder="Semua Vendor"
              />

            </div>
          </div>
        )}

      </div>

      {/* Main Assets Table */}
      <div className="bg-white rounded-2xl border border-[#F1F1F4] shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F1F4] bg-[#F9F9F9]/50">
                <th className="px-6 py-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider w-[60px] text-center">No</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider min-w-[200px]">Aset</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider min-w-[200px]">Register</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider min-w-[120px]">Tanggal Perolehan</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider min-w-[150px]">Lokasi</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider min-w-[100px]">Kondisi</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider min-w-[150px]">Departemen</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider min-w-[150px]">Pengguna Aset</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider min-w-[150px]">Vendor</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center w-[80px]">Quantity</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center w-[100px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-20 text-center text-[#7E8299] text-sm italic font-medium">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0095E8] mx-auto mb-2" />
                    Memproses data dari server...
                  </td>
                </tr>
              ) : paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-20 text-center text-[#7E8299] text-sm font-medium">
                    Data tidak ditemukan. Silakan tambahkan data baru atau impor berkas Excel.
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset, index) => (
                  <tr key={asset.id} className="border-b border-[#F1F1F4] hover:bg-[#FAFBFC] transition-colors duration-150">
                    <td className="px-6 py-4.5 text-[13px] text-[#7E8299] text-center">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>

                    <td className="px-6 py-4.5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[#7E8299] tracking-wider">{asset.asset_id}</span>
                        <span className="text-[13px] font-extrabold text-[#181C32] mt-0.5 line-clamp-2 leading-relaxed">
                          {asset.asset_name}
                        </span>
                        {(asset.brand || asset.model_tipe) && (
                          <span className="text-[11px] text-[#0095E8] font-bold mt-1">
                            {asset.brand || 'No Brand'} {asset.model_tipe ? `• ${asset.model_tipe}` : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4.5">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#181C32]">
                          No. Reg: {asset.register_no || '-'}
                        </span>
                        {asset.serial_number && (
                          <span className="text-[11px] text-[#47BE7D] font-bold mt-0.5">
                            SN: {asset.serial_number}
                          </span>
                        )}
                        <span className="text-[11px] text-[#A1A5B7] font-semibold mt-0.5">
                          Tgl: {asset.acquisition_date ? formatDate(asset.acquisition_date) : '-'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4.5 text-[13px] text-[#5E6278] font-bold">
                      {asset.acquisition_date ? formatDate(asset.acquisition_date) : '-'}
                    </td>

                    <td className="px-6 py-4.5 text-[13px] text-[#5E6278] font-bold" title={asset.location_name || '-'}>
                      {asset.location_name && asset.location_name.length > 15 
                        ? `${asset.location_name.substring(0, 15)}...` 
                        : (asset.location_name || '-')}
                    </td>

                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        (asset.condition_name || 'BAIK').toLowerCase() === 'baik' 
                          ? 'bg-[#E8FFF3] text-[#50CD89]' 
                          : 'bg-[#FFF5F8] text-[#F1416C]'
                      }`}>
                        {asset.condition_name || 'BAIK'}
                      </span>
                    </td>

                    <td className="px-6 py-4.5 text-[13px] text-[#5E6278] font-bold">
                      {asset.department_name || '-'}
                    </td>

                    <td className="px-6 py-4.5 text-[13px] text-[#5E6278] font-bold">
                      {asset.asset_user || '-'}
                    </td>

                    <td className="px-6 py-4.5 text-[13px] text-[#5E6278] font-bold">
                      {asset.vendor_name || '-'}
                    </td>

                    <td className="px-6 py-4.5 text-center">
                      {(() => {
                        const match = (asset.asset_name || '').match(/(\d+)\s*(unit|units|pcs|pc)/i);
                        if (match) {
                          return (
                            <span className="inline-flex items-center justify-center px-3 py-1 bg-[#E1F0FF] text-[#0095E8] rounded-lg text-xs font-extrabold border border-[#0095E8]/20 min-w-[40px]">
                              {match[1]}
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center justify-center px-3 py-1 bg-[#E1F0FF] text-[#0095E8] rounded-lg text-xs font-extrabold border border-[#0095E8]/20 min-w-[40px]">
                            1
                          </span>
                        );
                      })()}
                    </td>

                    <td className="px-6 py-4.5">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button 
                            onClick={() => handleOpenEditModal(asset)}
                            className="p-2 bg-[#F5F8FA] hover:bg-[#E1F0FF] text-[#0095E8] rounded-xl transition-all duration-150"
                            title="Ubah Data"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={() => handleDelete(asset)}
                            className="p-2 bg-[#FFF5F8] hover:bg-[#FFF0F2] text-[#F1416C] rounded-xl transition-all duration-150"
                            title="Hapus Data"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination panel */}
        {filteredAssets.length > 0 && (
          <div className="px-6 py-4 border-t border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]/20">
            <span className="text-xs text-[#7E8299] font-semibold">
              Menampilkan {Math.min(filteredAssets.length, (currentPage - 1) * rowsPerPage + 1)} - {Math.min(filteredAssets.length, currentPage * rowsPerPage)} dari {filteredAssets.length} data
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E1E3EA] bg-white text-[#7E8299] hover:bg-[#F5F8FA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              {(() => {
                const range = [];
                const maxButtons = 5;
                
                if (totalPages <= maxButtons) {
                  for (let i = 1; i <= totalPages; i++) range.push(i);
                } else {
                  // Always include page 1
                  range.push(1);
                  
                  let start = Math.max(2, currentPage - 1);
                  let end = Math.min(totalPages - 1, currentPage + 1);
                  
                  if (currentPage <= 2) {
                    end = 4;
                  } else if (currentPage >= totalPages - 1) {
                    start = totalPages - 3;
                  }
                  
                  if (start > 2) {
                    range.push('...');
                  }
                  
                  for (let i = start; i <= end; i++) {
                    range.push(i);
                  }
                  
                  if (end < totalPages - 1) {
                    range.push('...');
                  }
                  
                  // Always include last page
                  range.push(totalPages);
                }
                
                return range.map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[#A1A5B7]">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${
                        currentPage === page 
                          ? 'bg-[#0095E8] border-[#0095E8] text-white shadow-sm' 
                          : 'border-[#E1E3EA] bg-white text-[#5E6278] hover:bg-[#F5F8FA]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                });
              })()}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E1E3EA] bg-white text-[#7E8299] hover:bg-[#F5F8FA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 
        PREMIUM TAMBAH / EDIT MODAL DIALOG
        MATCHES BRAND THEME EXACTLY (SLATE/WHITE HEADER, GRAND SPACIOUS w-[1120px] SIZE)
      */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-[1120px] max-w-full rounded-3xl shadow-2xl flex flex-col my-6 border border-[#EFF2F5] overflow-hidden animate-scale-up animate-dropdown">
            
            {/* Slate/Grey Brand Theme Header matching Pamflow modals perfectly */}
            <div className="px-8 py-6 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]/50">
              <div>
                <h3 className="text-base font-extrabold text-[#181C32] flex items-center gap-2">
                  <Box size={18} className="text-[#0095E8]" />
                  {modalMode === 'add' ? 'Tambah Data Aset Baru' : 'Ubah Data Aset'}
                </h3>
                <p className="text-xs text-[#A1A5B7] font-semibold mt-1">
                  Kelola rincian standardisasi unit aset, dokumentasi gambar, dan depresiasi secara terpusat.
                </p>
              </div>
              
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="p-2.5 text-[#A1A5B7] hover:bg-gray-100 hover:text-[#3F4254] rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="flex flex-col">
              {/* Added large padding-bottom pb-48 to ensure no dropdown clipping */}
              <div className="p-8 pb-48 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar overflow-x-visible">
                
                {/* Horizontal Top Section: Upload Image (Left) & Core Inputs (Right) */}
                <div className="grid grid-cols-12 gap-6.5">
                  
                  {/* Left Column: Spacious Unggah Gambar dashed container */}
                  <div className="col-span-4 flex flex-col space-y-2.5">
                    <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Unggah Gambar</label>
                    
                    <div className="flex-1 min-h-[190px] border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] hover:bg-[#F3F4F6] rounded-2xl flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all relative group">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploadedImages.length >= 3}
                      />
                      
                      <Image size={28} className="text-[#A1A5B7] mb-2.5 group-hover:text-[#0095E8] transition-colors" />
                      <span className="text-[11px] font-extrabold text-[#7E8299] mb-1">Maksimal 3 Gambar</span>
                      <span className="text-[10px] text-[#A1A5B7] font-semibold mb-3">(JPG, JPEG, PNG, WEBP)</span>
                      <span className="text-[11px] font-extrabold text-[#0095E8] hover:underline">Unggah Gambar</span>
                      <span className="text-[10px] text-[#A1A5B7] mt-0.5">atau seret dan lepas</span>
                    </div>

                    {/* Previews display row with cursor-zoom-in and click zoom */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2.5 mt-2.5">
                        {uploadedImages.map((img, idx) => (
                          <div 
                            key={idx} 
                            className="relative w-full aspect-square rounded-xl overflow-hidden border border-[#E1E3EA] shadow-sm cursor-zoom-in group"
                            onClick={() => setZoomedImage(img.preview)}
                          >
                            <img 
                              src={img.preview} 
                              alt="upload preview" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-200" 
                            />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeUploadedImage(idx); }}
                              className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/85 rounded-lg text-white transition-all"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Spacious Core fields mapped to mockup */}
                  <div className="col-span-8 grid grid-cols-12 gap-x-5 gap-y-4">
                    
                    {/* Kategori dropdown */}
                    <div className="col-span-6">
                      <SearchableSelect 
                        label="Kategori"
                        options={categoryOptions}
                        value={assetForm.category_id}
                        onChange={(val) => setAssetForm({ ...assetForm, category_id: val })}
                        placeholder="Pilih Kategori"
                      />
                    </div>

                    {/* ID Aset dropdown */}
                    <div className="col-span-6 flex flex-col space-y-2">
                      <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">ID Aset</label>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1">
                          <SearchableSelect 
                            options={assetIdOptions}
                            value={assetForm.asset_id}
                            onChange={(val) => {
                              // Find matching asset template to auto-populate other form fields
                              const matched = masterAssets.find(a => a.asset_id === val);
                              if (matched) {
                                setAssetForm(prev => ({
                                  ...prev,
                                  asset_id: val,
                                  asset_name: matched.asset_name || prev.asset_name,
                                  category_id: matched.category_id || prev.category_id,
                                  specification: matched.specification || prev.specification,
                                  brand: matched.brand || prev.brand,
                                  model_tipe: matched.model_tipe || prev.model_tipe
                                }));
                              } else {
                                setAssetForm(prev => ({ ...prev, asset_id: val }));
                              }
                            }}
                            placeholder="Pilih ID Aset"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenNestedModal}
                          className="px-4 py-3.5 bg-[#1B3E84] hover:bg-[#153066] text-white rounded-2xl text-xs font-extrabold transition-all shadow-md shadow-[#1B3E84]/15 whitespace-nowrap self-end h-[46px]"
                        >
                          Tambah Aset
                        </button>
                      </div>
                    </div>

                    {/* Nama Aset text input */}
                    <div className="col-span-5">
                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Nama Aset</label>
                        <input 
                          type="text"
                          placeholder="Nama Aset"
                          required
                          className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-extrabold outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all text-[#181C32]"
                          value={assetForm.asset_name}
                          onChange={(e) => setAssetForm({ ...assetForm, asset_name: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Depresiasi checkmark */}
                    <div className="col-span-2 flex flex-col items-center justify-center space-y-2 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl py-1.5 shadow-sm">
                      <span className="text-[10px] font-extrabold text-[#3F4254] uppercase tracking-wide">Depresiasi</span>
                      <label className="relative flex items-center justify-center cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={assetForm.is_depreciable}
                          onChange={(e) => setAssetForm({ ...assetForm, is_depreciable: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-8.5 h-8.5 bg-white border-2 border-[#E1E3EA] peer-checked:border-[#50CD89] peer-checked:bg-[#E8FFF3] rounded-xl flex items-center justify-center transition-all duration-200 shadow-xs">
                          {assetForm.is_depreciable && (
                            <svg className="w-5 h-5 text-[#50CD89]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Rumus Depresiasi (Searchable Select) */}
                    <div className="col-span-3">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-1">
                          <label className="text-[11px] font-extrabold text-[#3F4254] tracking-wide uppercase">Rumus Depresiasi</label>
                          <HelpCircle size={11} className="text-[#A1A5B7] cursor-pointer" title="Info rumus depresiasi" />
                        </div>
                        <SearchableSelect 
                          options={formulaOptions}
                          value={assetForm.depreciation_formula}
                          onChange={(val) => setAssetForm({ ...assetForm, depreciation_formula: val })}
                          placeholder="Pilih Rumus"
                          disabled={!assetForm.is_depreciable}
                        />
                      </div>
                    </div>

                    {/* Dep (%) Input - AUTO CALCULATED PRESET IN DYNAMIC EFFECT */}
                    <div className="col-span-2">
                      <div className="flex flex-col space-y-2">
                        <label className="text-[11px] font-extrabold text-[#3F4254] tracking-wide uppercase whitespace-nowrap">Dep %</label>
                        <input 
                          type="text"
                          placeholder="%"
                          className="w-full px-4 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-extrabold text-center outline-none disabled:opacity-50 disabled:cursor-not-allowed text-[#181C32]"
                          value={assetForm.depreciation_percent}
                          onChange={(e) => setAssetForm({ ...assetForm, depreciation_percent: e.target.value })}
                          disabled={!assetForm.is_depreciable}
                        />
                      </div>
                    </div>

                    {/* Brand */}
                    <div className="col-span-4">
                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Brand</label>
                        <input 
                          type="text"
                          placeholder="Contoh: Asus, Toyota"
                          className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-extrabold outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all text-[#181C32]"
                          value={assetForm.brand}
                          onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Model / Tipe */}
                    <div className="col-span-4">
                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Model / Tipe</label>
                        <input 
                          type="text"
                          placeholder="Contoh: ROG Zephyrus, Fortuner"
                          className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-extrabold outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all text-[#181C32]"
                          value={assetForm.model_tipe}
                          onChange={(e) => setAssetForm({ ...assetForm, model_tipe: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Serial Number */}
                    <div className="col-span-4">
                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Serial Number</label>
                        <input 
                          type="text"
                          placeholder="Nomor Seri Pabrik"
                          className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-extrabold outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all text-[#181C32]"
                          value={assetForm.serial_number}
                          onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Spesifikasi textarea */}
                    <div className="col-span-8">
                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Spesifikasi</label>
                        <textarea 
                          placeholder="Spesifikasi"
                          rows="2.5"
                          className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all resize-none text-[#3F4254]"
                          value={assetForm.specification}
                          onChange={(e) => setAssetForm({ ...assetForm, specification: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Multiple Checkbox */}
                    <div className="col-span-2 flex flex-col items-center justify-center space-y-2 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl py-1.5 shadow-sm">
                      <span className="text-[10px] font-extrabold text-[#3F4254] uppercase tracking-wide">Multiple</span>
                      <label className="relative flex items-center justify-center cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={isMultiple}
                          onChange={(e) => setIsMultiple(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8.5 h-8.5 bg-white border-2 border-[#E1E3EA] peer-checked:border-[#0095E8] peer-checked:bg-[#E1F0FF] rounded-xl flex items-center justify-center transition-all duration-200 shadow-xs">
                          {isMultiple && (
                            <svg className="w-5 h-5 text-[#0095E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Jumlah Input */}
                    <div className="col-span-2">
                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Jumlah</label>
                        <input 
                          type="number"
                          min="1"
                          placeholder="1"
                          className="w-full px-3 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-extrabold text-center outline-none disabled:opacity-50 disabled:cursor-not-allowed text-[#3F4254]"
                          value={multipleQty}
                          onChange={(e) => setMultipleQty(Number(e.target.value))}
                          disabled={!isMultiple}
                        />
                      </div>
                    </div>

                  </div>

                </div>

                {/* Lower Section: Detail Aset Tab */}
                <div className="space-y-4">
                  <div className="border-b border-[#F1F1F4]">
                    <span className="inline-block pb-3 px-1 border-b-2 border-[#0095E8] text-xs font-extrabold text-[#0095E8] tracking-wide select-none cursor-pointer">
                      Detail Aset
                    </span>
                  </div>

                  {/* Spacious structured Card Grid */}
                  <div className="border border-[#EFF2F5] rounded-3xl p-7 bg-[#FAFBFC] grid grid-cols-3 gap-x-5.5 gap-y-5 overflow-visible">
                    
                    {/* Row 1: Core Identifiers & Location */}
                    {/* No. Register input */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">No. Register</label>
                      <input 
                        type="text"
                        placeholder="No. Register"
                        className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-bold outline-none focus:bg-white text-[#3F4254]"
                        value={assetForm.register_no}
                        onChange={(e) => setAssetForm({ ...assetForm, register_no: e.target.value })}
                      />
                    </div>

                    {/* RFID input */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">RFID</label>
                      <input 
                        type="text"
                        placeholder="RFID"
                        className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-bold outline-none focus:bg-white text-[#3F4254]"
                        value={assetForm.rfid_tag}
                        onChange={(e) => setAssetForm({ ...assetForm, rfid_tag: e.target.value })}
                      />
                    </div>

                    {/* Lokasi dropdown */}
                    <div className="flex flex-col space-y-1.5 col-span-1">
                      <SearchableSelect 
                        label="Lokasi"
                        options={locationOptions}
                        value={assetForm.location_id}
                        onChange={(val) => setAssetForm({ ...assetForm, location_id: val })}
                        placeholder="Pilih Lokasi"
                      />
                    </div>

                    {/* Row 2: Acquisition & Department */}
                    {/* Tanggal Perolehan date picker */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Tanggal Perolehan</label>
                      <input 
                        type="date"
                        className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-bold outline-none focus:bg-white text-[#3F4254] select-none"
                        value={assetForm.acquisition_date}
                        onChange={(e) => setAssetForm({ ...assetForm, acquisition_date: e.target.value })}
                      />
                    </div>

                    {/* Harga Perolehan */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Harga Perolehan</label>
                      <input 
                        type="text"
                        placeholder="Rp. 0"
                        className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-extrabold outline-none focus:bg-white text-[#181C32]"
                        value={formatRupiah(assetForm.acquisition_cost)}
                        onChange={(e) => {
                          const raw = parseRupiah(e.target.value);
                          setAssetForm({ ...assetForm, acquisition_cost: raw });
                        }}
                      />
                    </div>

                    {/* Departemen dropdown */}
                    <div className="flex flex-col space-y-1.5 col-span-1">
                      <SearchableSelect 
                        label="Departemen"
                        options={departmentOptions}
                        value={assetForm.department_id}
                        onChange={(val) => setAssetForm({ ...assetForm, department_id: val })}
                        placeholder="Pilih Departemen"
                      />
                    </div>

                    {/* Row 3: Users, Condition & Supplier */}

                    {/* Pengguna Aset input */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Pengguna Aset</label>
                      <input 
                        type="text"
                        placeholder="Pengguna Aset"
                        className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-bold outline-none focus:bg-white text-[#3F4254]"
                        value={assetForm.asset_user}
                        onChange={(e) => setAssetForm({ ...assetForm, asset_user: e.target.value })}
                      />
                    </div>

                    {/* Kondisi dropdown */}
                    <div className="flex flex-col space-y-1.5 col-span-1">
                      <SearchableSelect 
                        label="Kondisi"
                        options={conditionOptions}
                        value={assetForm.condition_id}
                        onChange={(val) => setAssetForm({ ...assetForm, condition_id: val })}
                        placeholder="Pilih Kondisi"
                      />
                    </div>

                    {/* Vendor dropdown */}
                    <div className="flex flex-col space-y-1.5 col-span-1">
                      <SearchableSelect 
                        label="Vendor"
                        options={vendorOptions}
                        value={assetForm.vendor_id}
                        onChange={(val) => setAssetForm({ ...assetForm, vendor_id: val })}
                        placeholder="Pilih Vendor"
                      />
                    </div>

                  </div>
                </div>

              </div>

              {/* Footer buttons row */}
              <div className="px-8 py-5 border-t border-[#F1F1F4] bg-[#F9F9F9]/50 flex items-center justify-end gap-3.5">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-[#B5B5C3] hover:bg-[#A1A5B7] text-white rounded-xl text-xs font-extrabold transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-7 py-3 bg-[#1B3E84] hover:bg-[#153066] text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-[#1B3E84]/15"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREMIUM IMAGE ZOOM LIGHTBOX */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[85vh] animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-lg flex items-center justify-center"
            >
              <X size={20} />
            </button>
            <img 
              src={zoomedImage} 
              alt="Zoomed Asset Preview" 
              className="w-full h-full max-h-[80vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* PRE-IMPORT SHEET SELECTOR & DUPLICATE CHECKER MODAL */}
      {showPreImportModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-[750px] max-w-full rounded-3xl shadow-2xl flex flex-col my-6 border border-[#EFF2F5] overflow-hidden animate-scale-up animate-dropdown">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]/50">
              <div>
                <h3 className="text-base font-extrabold text-[#181C32] flex items-center gap-2">
                  <Info size={18} className="text-[#1B3E84]" />
                  Pra-Impor & Analisis Duplikasi Aset
                </h3>
                <p className="text-xs text-[#A1A5B7] font-semibold mt-1">
                  Pilih sheet aktif dan tinjau hasil analisis duplikasi Kode Aset sebelum memulai importasi.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowPreImportModal(false)} 
                className="p-2.5 text-[#A1A5B7] hover:bg-gray-100 hover:text-[#3F4254] rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Side: Selectors (7 cols) */}
                <div className="md:col-span-7 space-y-5">
                  
                  {/* Sheet Selector dropdown */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Pilih Sheet Excel</label>
                    <select 
                      value={selectedImportSheet}
                      onChange={(e) => {
                        setSelectedImportSheet(e.target.value);
                        analyzeSheet(importWorkbook, e.target.value);
                      }}
                      className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-extrabold text-[#181C32] focus:bg-white focus:border-[#B5B5C3] outline-none transition-all"
                    >
                      {importSheets.map((sheet, index) => (
                        <option key={index} value={sheet}>{sheet}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#A1A5B7] font-semibold">
                      Sistem hanya akan memproses baris data pada sheet yang Anda pilih di atas.
                    </p>
                  </div>

                  {/* Duplicate Strategy Selection */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Strategi Penanganan Duplikasi</label>
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* Suffix Card */}
                      <div 
                        onClick={() => setDuplicateStrategy('suffix')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-[120px] ${duplicateStrategy === 'suffix' ? 'bg-[#EEF6FF] border-[#3E97FF] shadow-sm shadow-[#3E97FF]/10' : 'bg-white border-[#E1E3EA] hover:bg-[#F9F9F9]'}`}
                      >
                        <span className={`text-[11px] font-extrabold ${duplicateStrategy === 'suffix' ? 'text-[#3E97FF]' : 'text-[#3F4254]'}`}>Beri Akhiran Unik</span>
                        <p className="text-[9px] text-[#A1A5B7] font-bold leading-normal mt-1 flex-grow">
                          Otomatis tambah akhiran angka (misal -2, -3) pada Kode Aset yang kembar agar seluruh data sukses terimpor.
                        </p>
                      </div>

                      {/* Skip Card */}
                      <div 
                        onClick={() => setDuplicateStrategy('skip')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-[120px] ${duplicateStrategy === 'skip' ? 'bg-[#FFF5F8] border-[#F1416C] shadow-sm shadow-[#F1416C]/10' : 'bg-white border-[#E1E3EA] hover:bg-[#F9F9F9]'}`}
                      >
                        <span className={`text-[11px] font-extrabold ${duplicateStrategy === 'skip' ? 'text-[#F1416C]' : 'text-[#3F4254]'}`}>Lewati Duplikat</span>
                        <p className="text-[9px] text-[#A1A5B7] font-bold leading-normal mt-1 flex-grow">
                          Lewati dan jangan impor baris dari file Excel jika Kode Aset tersebut sudah ada di database Anda.
                        </p>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Right Side: Quick Stats (5 cols) */}
                <div className="md:col-span-5 space-y-4">
                  <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Statistik Hasil Analisis</label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-[#F9F9F9] border border-[#EFF2F5] flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-[#A1A5B7] uppercase tracking-wider">Total Baris</span>
                      <span className="text-2xl font-extrabold text-[#181C32] mt-1.5">{preImportStats.totalRows}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#E8FFF3] border border-[#50CD89]/20 flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-[#50CD89] uppercase tracking-wider">Siap Impor</span>
                      <span className="text-2xl font-extrabold text-[#50CD89] mt-1.5">{preImportStats.readyToImport}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#FFF5F8] border border-[#F1416C]/20 flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-[#F1416C] uppercase tracking-wider">Duplikat di DB</span>
                      <span className="text-2xl font-extrabold text-[#F1416C] mt-1.5">{preImportStats.dbDuplicates}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#FFF8DD] border border-[#F1BC15]/20 flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-[#F1BC15] uppercase tracking-wider">Duplikat di File</span>
                      <span className="text-2xl font-extrabold text-[#F1BC15] mt-1.5">{preImportStats.internalDuplicates}</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Detailed Duplicates Log list */}
              {preImportStats.details.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Daftar Kode Aset yang Kembar</h4>
                    <span className="px-2 py-0.5 bg-[#FFF8DD] text-[#F1BC15] text-[9px] font-extrabold rounded-md uppercase tracking-wider border border-[#F1BC15]/15">
                      Ditemukan {preImportStats.details.length} Konflik
                    </span>
                  </div>
                  
                  <div className="max-h-[160px] overflow-y-auto border border-[#F1F1F4] rounded-2xl divide-y divide-[#F1F1F4] bg-[#F9F9F9]/20 shadow-inner">
                    {preImportStats.details.map((detail, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs font-semibold text-[#5E6278]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-[#181C32]">{detail.code}</span>
                          <span className="text-[10px] text-[#A1A5B7] font-medium line-clamp-1">{detail.name}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-1 text-[9px] font-extrabold rounded-lg ${detail.type.includes('Database') ? 'bg-[#FFF5F8] text-[#F1416C] border border-[#F1416C]/10' : 'bg-[#FFF8DD] text-[#F1BC15] border border-[#F1BC15]/10'}`}>
                            {detail.type}
                          </span>
                          <span className="px-2 py-1 bg-[#F1F1F4] text-[#7E8299] text-[9px] font-bold rounded-lg border border-[#E1E3EA] min-w-[65px] text-center">
                            Baris {detail.row}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-[#F1F1F4] bg-[#F9F9F9]/50 flex items-center justify-end gap-3.5">
              <button 
                type="button" 
                onClick={() => setShowPreImportModal(false)}
                className="px-6 py-3 bg-[#B5B5C3] hover:bg-[#A1A5B7] text-white rounded-xl text-xs font-extrabold transition-all"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={executeImport}
                className="px-7 py-3 bg-[#1B3E84] hover:bg-[#153066] text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-[#1B3E84]/15 flex items-center gap-2"
              >
                Mulai Impor Data Aset
              </button>
            </div>

          </div>
        </div>
      )}

      {/* BEAUTIFUL IMPORT REPORT MODAL */}
      {showImportReport && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-[600px] max-w-full rounded-3xl shadow-2xl flex flex-col my-6 border border-[#EFF2F5] overflow-hidden animate-scale-up animate-dropdown">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]/50">
              <div>
                <h3 className="text-base font-extrabold text-[#181C32] flex items-center gap-2">
                  <Info size={18} className="text-[#0095E8]" />
                  Laporan Hasil Impor Aset
                </h3>
                <p className="text-xs text-[#A1A5B7] font-semibold mt-1">
                  Ringkasan status unggahan dan rincian kesalahan baris dari dokumen Excel Anda.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowImportReport(false)} 
                className="p-2.5 text-[#A1A5B7] hover:bg-gray-100 hover:text-[#3F4254] rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#E8FFF3] border border-[#50CD89]/20 flex flex-col justify-between">
                  <span className="text-[11px] font-extrabold text-[#50CD89] uppercase tracking-wider">Berhasil Diimpor</span>
                  <span className="text-3xl font-extrabold text-[#50CD89] mt-2">
                    {importReport.success} <span className="text-xs font-semibold text-[#50CD89]/75">Data</span>
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-[#FFF5F8] border border-[#F1416C]/20 flex flex-col justify-between">
                  <span className="text-[11px] font-extrabold text-[#F1416C] uppercase tracking-wider">Gagal Diimpor</span>
                  <span className="text-3xl font-extrabold text-[#F1416C] mt-2">
                    {importReport.failed} <span className="text-xs font-semibold text-[#F1416C]/75">Data</span>
                  </span>
                </div>
              </div>

              {/* Failure Details */}
              {importReport.details.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Rincian Kegagalan Impor</h4>
                  <div className="max-h-[220px] overflow-y-auto border border-[#F1F1F4] rounded-2xl divide-y divide-[#F1F1F4] shadow-inner bg-[#F9F9F9]/30">
                    {importReport.details.map((detail, idx) => (
                      <div key={idx} className="p-4 flex items-start justify-between gap-4 text-xs font-semibold text-[#5E6278]">
                        <div className="flex flex-col gap-1">
                          <span className="font-extrabold text-[#181C32] line-clamp-1">
                            {detail.name}
                          </span>
                          <span className="text-[10px] text-[#A1A5B7]">
                            {detail.reason}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 bg-[#FFF5F8] text-[#F1416C] text-[10px] font-bold rounded-lg border border-[#F1416C]/10 min-w-[70px] text-center">
                          Baris {detail.row}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-[#7E8299] text-xs font-semibold italic bg-[#F9F9F9] rounded-2xl border border-[#F1F1F4]">
                  Selamat! Seluruh baris data aset dari berkas Excel berhasil diimpor tanpa kesalahan.
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-[#F1F1F4] bg-[#F9F9F9]/50 flex items-center justify-end">
              <button 
                type="button" 
                onClick={() => setShowImportReport(false)}
                className="px-6 py-3 bg-[#1B3E84] hover:bg-[#153066] text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-[#1B3E84]/15"
              >
                Tutup Laporan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* NESTED POPUP MODAL: TAMBAH DATA ASET (AS IN IMAGE 2) */}
      {isNestedModalOpen && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-[500px] max-w-full rounded-3xl shadow-2xl flex flex-col border border-[#EFF2F5] overflow-hidden animate-scale-up animate-dropdown">
            
            {/* Slate/Grey Brand Theme Header matching Pamflow modals perfectly */}
            <div className="px-8 py-6 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]/50">
              <h3 className="text-sm font-extrabold text-[#181C32]">
                Tambah Data Aset
              </h3>
              
              <button 
                type="button"
                onClick={() => setIsNestedModalOpen(false)} 
                className="p-1.5 text-[#A1A5B7] hover:bg-gray-100 hover:text-[#3F4254] rounded-xl transition-all flex items-center justify-center"
              >
                <X size={16} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleNestedSubmit} className="flex flex-col">
              <div className="p-8 space-y-5 text-left">
                
                {/* ID Aset Input */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">ID Aset</label>
                  <input 
                    type="text"
                    placeholder="ID Aset"
                    className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-extrabold outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all text-[#181C32]"
                    value={nestedAssetForm.asset_id}
                    onChange={(e) => setNestedAssetForm({ ...nestedAssetForm, asset_id: e.target.value })}
                  />
                  <span className="text-[10px] text-[#A1A5B7] font-semibold">
                    *Kosongkan untuk meng-generate ID aset otomatis secara berurutan.
                  </span>
                </div>

                {/* Nama Aset Input */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Nama Aset</label>
                  <input 
                    type="text"
                    placeholder="Nama Aset"
                    required
                    className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-extrabold outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all text-[#181C32]"
                    value={nestedAssetForm.asset_name}
                    onChange={(e) => setNestedAssetForm({ ...nestedAssetForm, asset_name: e.target.value })}
                  />
                </div>

                {/* Kategori Dropdown */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Kategori</label>
                  <SearchableSelect 
                    options={categoryOptions}
                    value={nestedAssetForm.category_id}
                    onChange={(val) => setNestedAssetForm({ ...nestedAssetForm, category_id: val })}
                    placeholder="Pilih Kategori"
                  />
                </div>

                {/* Spesifikasi Input */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-extrabold text-[#3F4254] tracking-wide uppercase">Spesifikasi</label>
                  <textarea 
                    placeholder="Spesifikasi"
                    rows="3.5"
                    className="w-full px-5 py-3.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all resize-none text-[#3F4254]"
                    value={nestedAssetForm.specification}
                    onChange={(e) => setNestedAssetForm({ ...nestedAssetForm, specification: e.target.value })}
                  />
                </div>

              </div>

              {/* Footer buttons row */}
              <div className="px-8 pb-7 flex items-center justify-end">
                <button 
                  type="submit"
                  className="px-7 py-3 bg-[#1B3E84] hover:bg-[#153066] text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-[#1B3E84]/15"
                >
                  Simpan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AssetList;
