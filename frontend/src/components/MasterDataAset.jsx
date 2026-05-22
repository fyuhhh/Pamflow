import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Folder, MapPin, Users, Loader2, X, Info, Shield, HelpCircle, BookOpen, ChevronRight, ChevronDown, Building2, Activity, Box } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import { hasPermission } from '../utils/permissions';


const SearchableSelect = ({ label, options, value, onChange, placeholder, disabled = false, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedOption = (Array.isArray(options) ? options : []).find(opt => String(opt.value) === String(value));
  const filteredOptions = (Array.isArray(options) ? options : []).filter(opt =>
    String(opt.label).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex flex-col space-y-1.5 w-full">
      {label && <label className="text-[11px] font-bold text-[#181C32] uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div 
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        className={`w-full px-4 py-3 bg-white border border-[#F1F1F4] rounded-xl text-sm font-medium flex items-center justify-between cursor-pointer select-none focus:border-[#0095E8]/30 transition-all ${disabled ? 'opacity-50 bg-[#F9F9F9] cursor-not-allowed' : ''}`}
      >
        <span className={selectedOption ? "text-[#3F4254]" : "text-[#B5B5C3]"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-[#A1A5B7] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E1E3EA] rounded-xl shadow-lg z-[9999] overflow-hidden max-h-[200px] flex flex-col">
            <div className="p-2 border-b border-[#F1F1F4] bg-[#F9F9F9]">
              <div className="flex items-center px-2 py-1 bg-white border border-[#E1E3EA] rounded-lg">
                <Search size={12} className="text-[#A1A5B7] mr-2" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="w-full text-xs font-semibold outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-xs text-[#7E8299] text-center">Tidak ada data</div>
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

// PMK 72 Tahun 2023 Data
const KELOMPOK_HARTA_RULES = {
  'Kelompok 1': {
    masaManfaat: '4 Tahun',
    straightLine: '25%',
    decliningBalance: '50%',
    examples: [
      'Mebel & peralatan dari kayu/rotan (meja, bangku, kursi, lemari, dll).',
      'Mesin kantor (mesin tik, kalkulator, duplikator, fotokopi, komputer, laptop, printer, scanner, dll).',
      'Perlengkapan audio/video (amplifier, TV, tape recorder, video recorder, dll).',
      'Sepeda motor, sepeda, becak.',
      'Alat dapur untuk memasak makanan & minuman.',
      'Alat komunikasi (telepon, HP, faksimili, dll).'
    ]
  },
  'Kelompok 2': {
    masaManfaat: '8 Tahun',
    straightLine: '12.5%',
    decliningBalance: '25%',
    examples: [
      'Mebel & peralatan dari logam termasuk meja, kursi, lemari logam, AC, kipas angin, dll.',
      'Kendaraan roda 4 ke atas (mobil, bus, truk, speed boat, kontainer).',
      'Mesin pertanian/perkebunan (traktor, mesin bajak, mesin pengolah hasil kebun).',
      'Mesin industri makanan, minuman, tembakau, perkayuan, konstruksi.',
      'Perangkat telekomunikasi kabel & nirkabel.',
      'Auto Frame Loader, Automatic Logic Handler, Dicer, Die Bonder (Semi konduktor).'
    ]
  },
  'Kelompok 3': {
    masaManfaat: '16 Tahun',
    straightLine: '6.25%',
    decliningBalance: '12.5%',
    examples: [
      'Mesin-mesin pertambangan selain minyak dan gas.',
      'Mesin pengolah produk pelikan.',
      'Mesin pengolah tekstil (mesin pintal, tenun, bleaching, dyeing, finishing).',
      'Mesin pengolah kayu & penggergajian kayu.',
      'Mesin industri kimia.'
    ]
  },
  'Kelompok 4': {
    masaManfaat: '20 Tahun',
    straightLine: '5%',
    decliningBalance: '10%',
    examples: [
      'Mesin berat untuk konstruksi (crane, bulldozer, dll).',
      'Lokomotif uap, lokomotif listrik, gerbong kereta api.',
      'Kapal penumpang, kapal barang, kapal khusus, dok terapung.',
      'Pesawat terbang, helikopter.'
    ]
  },
  'Bangunan Permanen': {
    masaManfaat: '20 Tahun',
    straightLine: '5%',
    decliningBalance: '0% (N/A)',
    examples: [
      'Gedung kantor permanen.',
      'Rumah dinas permanen.',
      'Gudang beton/permanen.',
      'Bangunan komersial permanen.'
    ]
  },
  'Bangunan Semi Permanen': {
    masaManfaat: '10 Tahun',
    straightLine: '10%',
    decliningBalance: '0% (N/A)',
    examples: [
      'Gedung/mess semi permanen kayu.',
      'Gudang semi permanen.',
      'Rumah dinas semi permanen.',
      'Bangunan proyek lapangan.'
    ]
  },
  'Bukan Harta (Tanah)': {
    masaManfaat: '0 Tahun',
    straightLine: '0%',
    decliningBalance: '0%',
    examples: [
      'Tanah kosong operasional.',
      'Lahan terbuka/parkir.',
      'Kavling industri.'
    ]
  }
};

const MasterDataAset = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const canCreate = hasPermission(currentUser, 'pure_asset_master', 'Buat');
  const canEdit = hasPermission(currentUser, 'pure_asset_master', 'Edit');
  const canDelete = hasPermission(currentUser, 'pure_asset_master', 'Hapus');


  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['category', 'asset', 'location', 'vendor', 'department', 'condition'].includes(tab)) {
      return tab;
    }
    return 'category';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [categories, setCategories] = useState([]);
  const [pureAssets, setPureAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [activeConditionSubTab, setActiveConditionSubTab] = useState('asset'); // 'asset' or 'maintenance'

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['category', 'asset', 'location', 'vendor', 'department', 'condition'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`/manajemen-aset/master-data?tab=${newTab}`);
    setSearchTerm('');
  };
  
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [useTreeViewCategory, setUseTreeViewCategory] = useState(true);
  const [useTreeViewLocation, setUseTreeViewLocation] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  // Search Filter states
  const [filterGroup, setFilterGroup] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterLocParent, setFilterLocParent] = useState('');
  const [filterLocLevel, setFilterLocLevel] = useState('');
  const [filterVendorCity, setFilterVendorCity] = useState('');
  const [filterVendorContact, setFilterVendorContact] = useState('');

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeConditionSubTab, searchTerm, filterGroup, filterLevel, filterLocParent, filterLocLevel, filterVendorCity, filterVendorContact]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeInfoTab, setActiveInfoTab] = useState('Kelompok 1');
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [collapsedLocations, setCollapsedLocations] = useState({});

  const toggleCategoryCollapse = (id) => {
    setCollapsedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLocationCollapse = (id) => {
    setCollapsedLocations(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({
    category_code: '',
    category_name: '',
    group_of_assets: 'Kelompok 1',
    depreciation_method: 'Straight Line',
    parent_id: ''
  });
  
  const [locationForm, setLocationForm] = useState({
    location_id: '',
    location_name: '',
    parent_id: ''
  });

  const [assetForm, setAssetForm] = useState({
    asset_id: '',
    asset_name: '',
    category_id: '',
    department_id: '',
    rfid_tag: '',
    specification: ''
  });

  const [vendorForm, setVendorForm] = useState({
    vendor_name: '',
    contact_person: '',
    phone: '',
    address: ''
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    dept_id: ''
  });

  const [conditionForm, setConditionForm] = useState({
    condition_name: '',
    condition_type: 'asset'
  });

  const { success, error: showError, confirm } = useModal();

  useEffect(() => {
    fetchData();
  }, [activeTab, activeConditionSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'category') {
        const res = await authFetch('/api/pure-assets/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } else if (activeTab === 'asset') {
        const res = await authFetch('/api/pure-assets');
        if (res.ok) {
          const data = await res.json();
          setPureAssets(data);
        }
        const catRes = await authFetch('/api/pure-assets/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }
      } else if (activeTab === 'location') {
        const res = await authFetch('/api/pure-assets/locations');
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
        }
      } else if (activeTab === 'vendor') {
        const res = await authFetch('/api/pure-assets/vendors');
        if (res.ok) {
          const data = await res.json();
          setVendors(data);
        }
      } else if (activeTab === 'department') {
        const res = await authFetch('/api/pure-assets/departments');
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } else if (activeTab === 'condition') {
        const res = await authFetch(`/api/pure-assets/conditions?type=${activeConditionSubTab}`);
        if (res.ok) {
          const data = await res.json();
          setConditions(data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Error', 'Gagal memuat data master.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedItem(null);
    setCategoryForm({
      category_code: '',
      category_name: '',
      group_of_assets: 'Kelompok 1',
      depreciation_method: 'Straight Line',
      parent_id: ''
    });
    setAssetForm({
      asset_id: '',
      asset_name: '',
      category_id: '',
      specification: ''
    });
    setLocationForm({
      location_id: '',
      location_name: '',
      parent_id: ''
    });
    setVendorForm({
      vendor_name: '',
      contact_person: '',
      phone: '',
      address: ''
    });
    setDepartmentForm({
      name: '',
      dept_id: ''
    });
    setConditionForm({
      condition_name: '',
      condition_type: activeConditionSubTab
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    if (activeTab === 'category') {
      setCategoryForm({
        category_code: item.category_code || '',
        category_name: item.category_name || '',
        group_of_assets: item.group_of_assets || 'Kelompok 1',
        depreciation_method: item.depreciation_method || 'Straight Line',
        parent_id: item.parent_id || ''
      });
    } else if (activeTab === 'asset') {
      setAssetForm({
        asset_id: item.asset_id || '',
        asset_name: item.asset_name || '',
        category_id: item.category_id || '',
        department_id: item.department_id || '',
        rfid_tag: item.rfid_tag || '',
        specification: item.specification || ''
      });
    } else if (activeTab === 'location') {
      setLocationForm({
        location_id: item.location_id || '',
        location_name: item.location_name || '',
        parent_id: item.parent_id || ''
      });
    } else if (activeTab === 'vendor') {
      setVendorForm({
        vendor_name: item.vendor_name || '',
        contact_person: item.contact_person || '',
        phone: item.phone || '',
        address: item.address || ''
      });
    } else if (activeTab === 'department') {
      setDepartmentForm({
        name: item.name || '',
        dept_id: item.dept_id || ''
      });
    } else if (activeTab === 'condition') {
      setConditionForm({
        condition_name: item.condition_name || '',
        condition_type: item.condition_type || activeConditionSubTab
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = activeTab === 'category' 
      ? '/api/pure-assets/categories' 
      : activeTab === 'asset'
      ? '/api/pure-assets'
      : activeTab === 'location' 
      ? '/api/pure-assets/locations' 
      : activeTab === 'vendor'
      ? '/api/pure-assets/vendors'
      : activeTab === 'department'
      ? '/api/pure-assets/departments'
      : '/api/pure-assets/conditions';

    const body = activeTab === 'category' ? {
      category_code: categoryForm.category_code,
      category_name: categoryForm.category_name,
      group_of_assets: categoryForm.group_of_assets,
      depreciation_method: categoryForm.depreciation_method,
      parent_id: categoryForm.parent_id === '' ? null : parseInt(categoryForm.parent_id)
    } : activeTab === 'asset' ? {
      asset_id: assetForm.asset_id || null,
      asset_name: assetForm.asset_name,
      category_id: assetForm.category_id === '' ? null : parseInt(assetForm.category_id),
      department_id: assetForm.department_id === '' ? null : parseInt(assetForm.department_id),
      rfid_tag: assetForm.rfid_tag || null,
      specification: assetForm.specification
    } : activeTab === 'location' ? {
      location_id: locationForm.location_id,
      location_name: locationForm.location_name,
      parent_id: locationForm.parent_id === '' ? null : parseInt(locationForm.parent_id)
    } : activeTab === 'vendor' ? {
      vendor_name: vendorForm.vendor_name,
      contact_person: vendorForm.contact_person,
      phone: vendorForm.phone,
      address: vendorForm.address
    } : activeTab === 'department' ? {
      name: departmentForm.name,
      dept_id: departmentForm.dept_id
    } : {
      condition_name: conditionForm.condition_name,
      condition_type: conditionForm.condition_type
    };
    
    const method = modalMode === 'add' ? 'POST' : 'PUT';
    const url = modalMode === 'add' ? endpoint : `${endpoint}/${selectedItem.id}`;

    const label = activeTab === 'category' ? 'Kategori' : activeTab === 'asset' ? 'Aset' : activeTab === 'location' ? 'Lokasi' : activeTab === 'vendor' ? 'Vendor' : activeTab === 'department' ? 'Departemen' : 'Kondisi';

    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        success('Berhasil', `${label} berhasil ${modalMode === 'add' ? 'ditambahkan' : 'diperbarui'}.`);
        setIsModalOpen(false);
        fetchData();
      } else {
        const errorData = await res.json();
        showError('Gagal', errorData.message || 'Gagal menyimpan data.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      showError('Kesalahan', 'Terjadi kesalahan sistem saat menyimpan.');
    }
  };

  const handleDelete = (item) => {
    const itemName = activeTab === 'category' 
      ? item.category_name 
      : activeTab === 'asset'
      ? item.asset_name
      : activeTab === 'location' 
      ? item.location_name 
      : activeTab === 'vendor'
      ? item.vendor_name
      : activeTab === 'department'
      ? item.name
      : item.condition_name;

    const endpoint = activeTab === 'category' 
      ? '/api/pure-assets/categories' 
      : activeTab === 'asset'
      ? '/api/pure-assets'
      : activeTab === 'location' 
      ? '/api/pure-assets/locations' 
      : activeTab === 'vendor'
      ? '/api/pure-assets/vendors'
      : activeTab === 'department'
      ? '/api/pure-assets/departments'
      : '/api/pure-assets/conditions';
    
    const label = activeTab === 'category' ? 'kategori' : activeTab === 'asset' ? 'aset' : activeTab === 'location' ? 'lokasi' : activeTab === 'vendor' ? 'vendor' : activeTab === 'department' ? 'departemen' : 'kondisi';
    
    confirm(
      'Hapus Data',
      `Apakah Anda yakin ingin menghapus ${label} "${itemName}"? Tindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          const res = await authFetch(`${endpoint}/${item.id}`, { method: 'DELETE' });
          if (res.ok) {
            success('Berhasil', `${label.charAt(0).toUpperCase() + label.slice(1)} berhasil dihapus.`);
            fetchData();
          } else {
            const errorData = await res.json();
            showError('Gagal', errorData.message || 'Gagal menghapus data.');
          }
        } catch (error) {
          console.error('Error deleting:', error);
          showError('Kesalahan', 'Terjadi kesalahan sistem saat menghapus.');
        }
      },
      {
        confirmText: 'Hapus',
        cancelText: 'Batal'
      }
    );
  };

  // Derived values for Category UI
  const getRuleDetails = (groupName) => {
    return KELOMPOK_HARTA_RULES[groupName] || { masaManfaat: '0 Tahun', straightLine: '0%', decliningBalance: '0%' };
  };

  // Resolve dynamic Category hierarchy (levels and parent names) in frontend
  const resolveCategoryHierarchy = (cats) => {
    const catMap = {};
    cats.forEach(cat => {
      catMap[cat.id] = { ...cat, resolvedLevel: null, parentName: '' };
    });

    const getLevelAndParent = (id) => {
      if (!id || !catMap[id]) return { level: 0, parentName: 'Asset Category' };
      const cat = catMap[id];
      if (cat.resolvedLevel !== null) {
        return { level: cat.resolvedLevel, parentName: cat.parentName };
      }
      
      if (!cat.parent_id) {
        cat.resolvedLevel = 0;
        cat.parentName = 'Asset Category';
      } else {
        const parentInfo = getLevelAndParent(cat.parent_id);
        cat.resolvedLevel = parentInfo.level + 1;
        const parentCat = catMap[cat.parent_id];
        cat.parentName = parentCat ? parentCat.category_name : 'Asset Category';
      }
      return { level: cat.resolvedLevel, parentName: cat.parentName };
    };

    return cats.map(cat => {
      const info = getLevelAndParent(cat.id);
      return {
        ...cat,
        level: info.level,
        parent_name: info.parentName
      };
    });
  };

  // Tree building and flattening helpers for collapsible Hierarchical View
  const buildTree = (items, parentId = null) => {
    let filtered = items.filter(item => {
      if (parentId === null) return !item.parent_id;
      return item.parent_id === parentId;
    });

    if (parentId === null) {
      filtered.sort((a, b) => {
        // Categories
        if (a.category_code !== undefined && b.category_code !== undefined) {
          return (a.category_code || '').localeCompare(b.category_code || '') ||
                 (a.category_name || '').localeCompare(b.category_name || '');
        }
        // Locations
        if (a.location_id !== undefined && b.location_id !== undefined) {
          return (a.location_id || '').localeCompare(b.location_id || '') ||
                 (a.location_name || '').localeCompare(b.location_name || '');
        }
        return 0;
      });
    }

    return filtered.map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }));
  };

  const flattenTree = (nodes, collapsedMap, depth = 0, parentVisible = true) => {
    let result = [];
    nodes.forEach(node => {
      result.push({
        ...node,
        depth,
        hasChildren: node.children && node.children.length > 0,
        isVisible: parentVisible
      });
      
      if (node.children && node.children.length > 0) {
        const isCollapsed = collapsedMap[node.id];
        const childrenVisible = parentVisible && !isCollapsed;
        result.push(...flattenTree(node.children, collapsedMap, depth + 1, childrenVisible));
      }
    });
    return result;
  };

  const resolvedCategories = resolveCategoryHierarchy(categories);

  let filteredCats = resolvedCategories.filter(cat => 
    cat.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.category_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.group_of_assets || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.parent_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (filterGroup) {
    filteredCats = filteredCats.filter(cat => cat.group_of_assets === filterGroup);
  }
  if (filterLevel !== '') {
    filteredCats = filteredCats.filter(cat => cat.level === parseInt(filterLevel));
  }

  const categoryTreeNodes = buildTree(resolvedCategories);
  const flattenedCategories = flattenTree(categoryTreeNodes, collapsedCategories);
  
  const finalCategories = (searchTerm || filterGroup || filterLevel !== '') 
    ? filteredCats 
    : flattenedCategories.filter(node => node.isVisible);

  // Resolve dynamic Location hierarchy (levels and parent names) in frontend
  const resolveLocationHierarchy = (locs) => {
    const locMap = {};
    locs.forEach(loc => {
      locMap[loc.id] = { ...loc, resolvedLevel: null, parentName: '' };
    });

    const getLevelAndParent = (id) => {
      if (!id || !locMap[id]) return { level: 0, parentName: 'Location Category' };
      const loc = locMap[id];
      if (loc.resolvedLevel !== null) {
        return { level: loc.resolvedLevel, parentName: loc.parentName };
      }
      
      if (!loc.parent_id) {
        loc.resolvedLevel = 0;
        loc.parentName = 'Location Category';
      } else {
        const parentInfo = getLevelAndParent(loc.parent_id);
        loc.resolvedLevel = parentInfo.level + 1;
        const parentLoc = locMap[loc.parent_id];
        loc.parentName = parentLoc ? parentLoc.location_name : 'Location Category';
      }
      return { level: loc.resolvedLevel, parentName: loc.parentName };
    };

    return locs.map(loc => {
      const info = getLevelAndParent(loc.id);
      return {
        ...loc,
        level: info.level,
        parent_name: info.parentName
      };
    });
  };

  const resolvedLocations = resolveLocationHierarchy(locations);

  let filteredLocs = resolvedLocations.filter(loc => 
    loc.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.location_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (loc.parent_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (filterLocLevel !== '') {
    filteredLocs = filteredLocs.filter(loc => loc.level === parseInt(filterLocLevel));
  }
  if (filterLocParent) {
    filteredLocs = filteredLocs.filter(loc => loc.parent_name === filterLocParent);
  }

  const locationTreeNodes = buildTree(resolvedLocations);
  const flattenedLocations = flattenTree(locationTreeNodes, collapsedLocations);

  const finalLocations = (searchTerm || filterLocLevel !== '' || filterLocParent) 
    ? filteredLocs 
    : flattenedLocations.filter(node => node.isVisible);

  // Vendor Filter and search
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = 
      v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.address || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = !filterVendorCity || (v.address || '').toLowerCase().includes(filterVendorCity.toLowerCase());
    
    let matchesContact = true;
    if (filterVendorContact === 'lengkap') {
      matchesContact = !!v.contact_person && !!v.phone;
    } else if (filterVendorContact === 'no_cp') {
      matchesContact = !v.contact_person;
    } else if (filterVendorContact === 'no_phone') {
      matchesContact = !v.phone;
    }

    return matchesSearch && matchesCity && matchesContact;
  });

  // Pure Assets search/filter
  const filteredPureAssets = pureAssets.filter(asset => 
    (asset.asset_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.asset_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.category_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.specification || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Department search
  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.dept_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Condition search and sub-tab filter
  const filteredConditions = conditions.filter(c => 
    (c.condition_type === activeConditionSubTab) &&
    c.condition_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting alphabetically A-Z or using TreeView hierarchy
  const sortedCategories = useTreeViewCategory 
    ? finalCategories 
    : [...finalCategories].sort((a, b) => 
        (a.category_code || '').localeCompare(b.category_code || '') ||
        (a.category_name || '').localeCompare(b.category_name || '')
      );

  const sortedLocations = useTreeViewLocation 
    ? finalLocations 
    : [...finalLocations].sort((a, b) => 
        (a.location_id || '').localeCompare(b.location_id || '') ||
        (a.location_name || '').localeCompare(b.location_name || '')
      );

  const sortedPureAssets = [...filteredPureAssets].sort((a, b) => 
    (a.asset_id || '').localeCompare(b.asset_id || '') ||
    (a.asset_name || '').localeCompare(b.asset_name || '')
  );

  const sortedVendors = [...filteredVendors].sort((a, b) => 
    (a.vendor_name || '').localeCompare(b.vendor_name || '')
  );

  const sortedDepartments = [...filteredDepartments].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  );

  const sortedConditions = [...filteredConditions].sort((a, b) => 
    (a.condition_name || '').localeCompare(b.condition_name || '')
  );

  // Pagination Config
  const ITEMS_PER_PAGE = 10;
  const getPaginatedData = (dataList) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return dataList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (dataList) => {
    return Math.ceil(dataList.length / ITEMS_PER_PAGE) || 1;
  };

  const renderPagination = (dataList) => {
    const totalPages = getTotalPages(dataList);
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-6 py-4 bg-[#F9F9F9]/50 border-t border-[#F1F1F4] rounded-b-2xl">
        <div className="text-xs text-[#7E8299] font-semibold">
          Menampilkan {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, dataList.length)} - {Math.min(currentPage * ITEMS_PER_PAGE, dataList.length)} dari {dataList.length} data
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="px-3 py-1.5 rounded-lg border border-[#E1E3EA] bg-white text-xs font-semibold text-[#5E6278] hover:bg-[#F5F8FA] hover:text-[#0095E8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Sebelumnya
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-[#0095E8] text-white shadow-md shadow-[#0095E8]/10' : 'border border-[#E1E3EA] bg-white text-[#5E6278] hover:bg-[#F5F8FA] hover:text-[#0095E8]'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="px-3 py-1.5 rounded-lg border border-[#E1E3EA] bg-white text-xs font-semibold text-[#5E6278] hover:bg-[#F5F8FA] hover:text-[#0095E8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Berikutnya
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-[#181C32] mb-1 flex items-center gap-2">
            Master Data Aset
          </h1>
          <p className="text-[#A1A5B7] text-sm font-light">Kelola referensi Kategori, Lokasi, Vendor, Departemen, dan Kondisi untuk standardisasi data modul Aset.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'category' && (
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-[#F1FAFF] text-[#0095E8] border border-[#0095E8]/10 rounded-xl text-sm font-semibold hover:bg-[#E1F0FF] transition-all"
            >
              <BookOpen size={16} />
              Buku PMK 72/2023
            </button>
          )}
          {canCreate && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg bg-[#0095E8] text-white hover:bg-[#0084CC] shadow-[#0095E8]/10"
            >
              <Plus size={16} />
              {activeTab === 'category' ? 'Tambah Kategori' : activeTab === 'asset' ? 'Tambah Aset' : activeTab === 'location' ? 'Tambah Lokasi' : activeTab === 'vendor' ? 'Tambah Vendor' : activeTab === 'department' ? 'Tambah Departemen' : 'Tambah Kondisi'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#F1F1F4] shadow-sm w-full lg:w-auto">
          <button 
            onClick={() => handleTabChange('category')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'category' ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F9F9F9]'}`}
          >
            <Folder size={14} />
            Kategori Aset
          </button>
          <button 
            onClick={() => handleTabChange('asset')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'asset' ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F9F9F9]'}`}
          >
            <Box size={14} />
            Aset
          </button>
          <button 
            onClick={() => handleTabChange('location')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'location' ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F9F9F9]'}`}
          >
            <MapPin size={14} />
            Lokasi
          </button>
          <button 
            onClick={() => handleTabChange('vendor')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'vendor' ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F9F9F9]'}`}
          >
            <Users size={14} />
            Vendor Aset
          </button>
          <button 
            onClick={() => handleTabChange('department')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'department' ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F9F9F9]'}`}
          >
            <Building2 size={14} />
            Departemen
          </button>
          <button 
            onClick={() => handleTabChange('condition')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'condition' ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F9F9F9]'}`}
          >
            <Activity size={14} />
            Kondisi
          </button>
        </div>

        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={16} />
          <input 
            type="text" 
            placeholder={`Cari data ${activeTab === 'category' ? 'Kategori' : activeTab === 'asset' ? 'Aset' : activeTab === 'location' ? 'Lokasi' : activeTab === 'vendor' ? 'Vendor' : activeTab === 'department' ? 'Departemen' : 'Kondisi'}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:border-[#0095E8]/30 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Dynamic Filters Panel */}
      {(activeTab === 'category' || activeTab === 'location' || activeTab === 'vendor') && (
        <div className="bg-[#F9F9F9]/60 backdrop-blur-sm p-4 rounded-2xl border border-[#F1F1F4] mb-6 flex flex-wrap items-center gap-4 animate-fade-in shadow-sm">
          <div className="text-xs font-bold text-[#A1A5B7] uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#0095E8] rounded-full"></span>
          Filter Cepat:
        </div>

        {activeTab === 'category' && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#7E8299] font-semibold">Kelompok Harta:</label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-medium text-[#464E5F] outline-none focus:border-[#0095E8]/30 transition-all cursor-pointer"
              >
                <option value="">Semua Kelompok</option>
                <option value="Kelompok 1">Kelompok 1</option>
                <option value="Kelompok 2">Kelompok 2</option>
                <option value="Kelompok 3">Kelompok 3</option>
                <option value="Kelompok 4">Kelompok 4</option>
                <option value="Bangunan Permanen">Bangunan Permanen</option>
                <option value="Bangunan Semi Permanen">Bangunan Semi Permanen</option>
                <option value="Bukan Harta (Tanah)">Bukan Harta (Tanah)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-[#7E8299] font-semibold">Level Hirarki:</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-medium text-[#464E5F] outline-none focus:border-[#0095E8]/30 transition-all cursor-pointer"
              >
                <option value="">Semua Level</option>
                <option value="0">Lvl 0 (Utama)</option>
                <option value="1">Lvl 1</option>
                <option value="2">Lvl 2</option>
                <option value="3">Lvl 3</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-l border-[#F1F1F4] pl-4 ml-2">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useTreeViewCategory}
                  onChange={(e) => setUseTreeViewCategory(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#E1E3EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0095E8]"></div>
                <span className="ml-2 text-xs font-bold text-[#5E6278]">Hierarki TreeView</span>
              </label>
            </div>
          </>
        )}

        {activeTab === 'location' && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#7E8299] font-semibold">Parent Lokasi:</label>
              <select
                value={filterLocParent}
                onChange={(e) => setFilterLocParent(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-medium text-[#464E5F] outline-none focus:border-[#0095E8]/30 transition-all cursor-pointer"
              >
                <option value="">Semua Parent</option>
                {[...new Set(resolvedLocations.map(l => l.parent_name).filter(Boolean))].map(p => (
                  <option key={p} value={p}>{p === 'Location Category' ? 'Utama (Root)' : p}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-[#7E8299] font-semibold">Level Hirarki:</label>
              <select
                value={filterLocLevel}
                onChange={(e) => setFilterLocLevel(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-medium text-[#464E5F] outline-none focus:border-[#0095E8]/30 transition-all cursor-pointer"
              >
                <option value="">Semua Level</option>
                <option value="0">Lvl 0 (Utama)</option>
                <option value="1">Lvl 1</option>
                <option value="2">Lvl 2</option>
                <option value="3">Lvl 3</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-l border-[#F1F1F4] pl-4 ml-2">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useTreeViewLocation}
                  onChange={(e) => setUseTreeViewLocation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#E1E3EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0095E8]"></div>
                <span className="ml-2 text-xs font-bold text-[#5E6278]">Hierarki TreeView</span>
              </label>
            </div>
          </>
        )}

        {activeTab === 'vendor' && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#7E8299] font-semibold">Kota/Wilayah:</label>
              <select
                value={filterVendorCity}
                onChange={(e) => setFilterVendorCity(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-medium text-[#464E5F] outline-none focus:border-[#0095E8]/30 transition-all cursor-pointer"
              >
                <option value="">Semua Kota</option>
                <option value="Jakarta">Jakarta</option>
                <option value="Surabaya">Surabaya</option>
                <option value="Bandung">Bandung</option>
                <option value="Tangerang">Tangerang</option>
                <option value="Bekasi">Bekasi</option>
                <option value="Depok">Depok</option>
                <option value="Bogor">Bogor</option>
                <option value="Semarang">Semarang</option>
                <option value="Medan">Medan</option>
                <option value="Yogyakarta">Yogyakarta</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-[#7E8299] font-semibold">Kelengkapan Kontak:</label>
              <select
                value={filterVendorContact}
                onChange={(e) => setFilterVendorContact(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-medium text-[#464E5F] outline-none focus:border-[#0095E8]/30 transition-all cursor-pointer"
              >
                <option value="">Semua Kontak</option>
                <option value="lengkap">Kontak Lengkap (CP & HP)</option>
                <option value="no_cp">Tanpa Contact Person</option>
                <option value="no_phone">Tanpa No. Telepon</option>
              </select>
            </div>
          </>
        )}

        {/* Clear Filters Button */}
        {(filterGroup || filterLevel !== '' || filterLocParent || filterLocLevel !== '' || filterVendorCity || filterVendorContact) && (
          <button
            type="button"
            onClick={() => {
              setFilterGroup('');
              setFilterLevel('');
              setFilterLocParent('');
              setFilterLocLevel('');
              setFilterVendorCity('');
              setFilterVendorContact('');
            }}
            className="ml-auto text-xs text-[#F1416C] hover:text-[#D9214E] font-bold transition-all flex items-center gap-1 py-1 px-2.5 hover:bg-[#FFF5F8] rounded-lg"
          >
            Clear Filters
          </button>
        )}
      </div>
      )}

      {/* Main Content View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-[#F1F1F4] border-dashed animate-pulse">
          <Loader2 className="w-8 h-8 text-[#0095E8] animate-spin mb-4" />
          <p className="text-sm text-[#A1A5B7] font-light">Memuat referensi data master...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#F1F1F4] shadow-sm overflow-hidden">
          {activeTab === 'category' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F1F4] bg-[#F9F9F9]/50">
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center w-[60px]">No</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Kode Kategori</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nama Kategori</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Parent Kategori</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center">Level</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Kelompok Harta</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Masa Manfaat</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center">Garis Lurus</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center">Saldo Menurun</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1F4]">
                  {sortedCategories.length > 0 ? (
                    getPaginatedData(sortedCategories).map((cat, index) => {
                      const rules = getRuleDetails(cat.group_of_assets);
                      return (
                        <tr key={cat.id} className="hover:bg-[#F9F9F9]/30 transition-all group">
                          <td className="p-5 text-sm font-semibold text-[#7E8299] text-center">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                          <td className="p-5 text-sm font-semibold text-[#181C32]">{cat.category_code}</td>
                           <td className="p-5 text-sm text-[#3F4254] font-medium">
                            <div className="flex items-center" style={{ paddingLeft: `${useTreeViewCategory ? (cat.depth || 0) * 20 : 0}px` }}>
                              {useTreeViewCategory && cat.hasChildren ? (
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleCategoryCollapse(cat.id); }}
                                  className="p-1 hover:bg-[#F5F8FA] rounded-lg mr-1 text-[#7E8299] transition-all flex items-center justify-center cursor-pointer"
                                >
                                  {collapsedCategories[cat.id] ? (
                                    <ChevronRight size={14} className="stroke-[2.5]" />
                                  ) : (
                                    <ChevronDown size={14} className="stroke-[2.5]" />
                                  )}
                                </button>
                              ) : useTreeViewCategory ? (
                                <span className="w-6 flex items-center justify-center text-[#A1A5B7] mr-1 font-light text-xs">
                                  {(cat.depth || 0) > 0 ? '└─' : '•'}
                                </span>
                              ) : null}
                              <span>{cat.category_name}</span>
                            </div>
                          </td>
                          <td className="p-5 text-sm text-[#7E8299]">
                            {cat.parent_name === 'Asset Category' ? (
                              <span className="text-[#A1A5B7] italic text-xs font-light">Utama (Root)</span>
                            ) : (
                              <span className="font-semibold text-[#5E6278]">{cat.parent_name}</span>
                            )}
                          </td>
                          <td className="p-5 text-sm text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              cat.level === 0 
                                ? 'bg-[#F1FAFF] text-[#0095E8]' 
                                : cat.level === 1 
                                ? 'bg-[#FFF8DD] text-[#F1BC06]' 
                                : cat.level === 2 
                                ? 'bg-[#E8FFF3] text-[#50CD89]' 
                                : 'bg-[#FFF5F8] text-[#F1416C]'
                            }`}>
                              Lvl {cat.level}
                            </span>
                          </td>
                          <td className="p-5 text-sm">
                            <span className="px-3 py-1 bg-[#F1FAFF] text-[#0095E8] rounded-lg text-xs font-semibold">
                              {cat.group_of_assets || 'Kelompok 1'}
                            </span>
                          </td>
                          <td className="p-5 text-sm text-[#7E8299] font-light">{rules.masaManfaat}</td>
                          <td className="p-5 text-sm text-[#3F4254] text-center font-bold">{rules.straightLine}</td>
                          <td className="p-5 text-sm text-[#7E8299] text-center font-light">{rules.decliningBalance}</td>
                          <td className="p-5 text-right flex items-center justify-end gap-2">
                            {canEdit && (
                              <button 
                                onClick={() => handleOpenEditModal(cat)}
                                className="p-2 text-[#7E8299] hover:bg-[#F5F8FA] hover:text-[#0095E8] rounded-lg transition-all animate-hover"
                              >
                                <Edit2 size={15} />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                onClick={() => handleDelete(cat)}
                                className="p-2 text-[#7E8299] hover:bg-[#FFF5F8] hover:text-[#F1416C] rounded-lg transition-all animate-hover"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="p-10 text-center text-[#A1A5B7] font-light">Tidak ada data kategori ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {renderPagination(sortedCategories)}
            </div>
          )}

          {activeTab === 'asset' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F1F4] bg-[#F9F9F9]/50">
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center w-[60px]">No</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">ID Aset</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nama Aset</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Kategori</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Spesifikasi</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1F4]">
                  {sortedPureAssets.length > 0 ? (
                    getPaginatedData(sortedPureAssets).map((asset, index) => {
                      return (
                        <tr key={asset.id} className="hover:bg-[#F9F9F9]/30 transition-all group">
                          <td className="p-5 text-sm font-semibold text-[#7E8299] text-center">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                          <td className="p-5 text-sm font-semibold text-[#181C32]">{asset.asset_id}</td>
                          <td className="p-5 text-sm text-[#3F4254] font-medium">{asset.asset_name}</td>
                          <td className="p-5 text-sm text-[#7E8299]">{asset.category_name || <span className="text-[#A1A5B7] italic text-xs font-light">-</span>}</td>
                          <td className="p-5 text-sm text-[#7E8299] max-w-[300px] truncate">{asset.specification || <span className="text-[#A1A5B7] italic text-xs font-light">-</span>}</td>
                          <td className="p-5 text-sm text-right space-x-1 whitespace-nowrap">
                            {canEdit && (
                              <button 
                                onClick={() => handleOpenEditModal(asset)}
                                className="p-2 text-[#7E8299] hover:bg-[#F5F8FA] hover:text-[#0095E8] rounded-lg transition-all animate-hover"
                              >
                                <Edit2 size={15} />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                onClick={() => handleDelete(asset)}
                                className="p-2 text-[#7E8299] hover:bg-[#FFF5F8] hover:text-[#F1416C] rounded-lg transition-all animate-hover"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-[#A1A5B7] font-light">Tidak ada data aset ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {renderPagination(sortedPureAssets)}
            </div>
          )}

          {activeTab === 'location' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F1F4] bg-[#F9F9F9]/50">
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center w-[60px]">No</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">ID Lokasi</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nama Lokasi</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Parent Lokasi</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center">Level</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1F4]">
                  {sortedLocations.length > 0 ? (
                    getPaginatedData(sortedLocations).map((loc, index) => {
                      const levelColors = loc.level === 0 
                        ? 'bg-[#F1FAFF] text-[#0095E8]' 
                        : loc.level === 1 
                        ? 'bg-[#FFF8DD] text-[#F1BC06]' 
                        : loc.level === 2 
                        ? 'bg-[#E8FFF3] text-[#50CD89]' 
                        : 'bg-[#FFF5F8] text-[#F1416C]';

                      return (
                        <tr key={loc.id} className="hover:bg-[#F9F9F9]/30 transition-all group">
                          <td className="p-5 text-sm font-semibold text-[#7E8299] text-center">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                          <td className="p-5 text-sm font-semibold text-[#181C32]">{loc.location_id}</td>
                          <td className="p-5 text-sm text-[#3F4254] font-medium">
                            <div className="flex items-center" style={{ paddingLeft: `${useTreeViewLocation ? (loc.depth || 0) * 20 : 0}px` }}>
                              {useTreeViewLocation && loc.hasChildren ? (
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleLocationCollapse(loc.id); }}
                                  className="p-1 hover:bg-[#F5F8FA] rounded-lg mr-1 text-[#7E8299] transition-all flex items-center justify-center cursor-pointer"
                                >
                                  {collapsedLocations[loc.id] ? (
                                    <ChevronRight size={14} className="stroke-[2.5]" />
                                  ) : (
                                    <ChevronDown size={14} className="stroke-[2.5]" />
                                  )}
                                </button>
                              ) : useTreeViewLocation ? (
                                <span className="w-6 flex items-center justify-center text-[#A1A5B7] mr-1 font-light text-xs">
                                  {(loc.depth || 0) > 0 ? '└─' : '•'}
                                </span>
                              ) : null}
                              <span>{loc.location_name}</span>
                            </div>
                          </td>
                          <td className="p-5 text-sm text-[#7E8299]">
                            {loc.parent_name === 'Location Category' ? (
                              <span className="text-[#A1A5B7] italic text-xs font-light">Utama (Root)</span>
                            ) : (
                              <span className="font-semibold text-[#5E6278]">{loc.parent_name}</span>
                            )}
                          </td>
                          <td className="p-5 text-sm text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${levelColors}`}>
                              Lvl {loc.level}
                            </span>
                          </td>
                          <td className="p-5 text-right flex items-center justify-end gap-2">
                            {canEdit && (
                              <button 
                                onClick={() => handleOpenEditModal(loc)}
                                className="p-2 text-[#7E8299] hover:bg-[#F5F8FA] hover:text-[#0095E8] rounded-lg transition-all animate-hover"
                              >
                                <Edit2 size={15} />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                onClick={() => handleDelete(loc)}
                                className="p-2 text-[#7E8299] hover:bg-[#FFF5F8] hover:text-[#F1416C] rounded-lg transition-all animate-hover"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-[#A1A5B7] font-light">Tidak ada data lokasi ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {renderPagination(sortedLocations)}
            </div>
          )}

          {activeTab === 'vendor' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F1F4] bg-[#F9F9F9]/50">
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center w-[60px]">No</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nama Vendor</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Contact Person</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">No. Telepon</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Alamat Lengkap</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1F4]">
                  {sortedVendors.length > 0 ? (
                    getPaginatedData(sortedVendors).map((v, index) => (
                      <tr key={v.id} className="hover:bg-[#F9F9F9]/30 transition-all group">
                        <td className="p-5 text-sm font-semibold text-[#7E8299] text-center">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td className="p-5 text-sm font-semibold text-[#181C32]">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#E8FFF3] text-[#50CD89] flex items-center justify-center font-bold text-xs animate-hover-scale">
                              {v.vendor_name ? v.vendor_name.charAt(0).toUpperCase() : 'V'}
                            </div>
                            <span>{v.vendor_name}</span>
                          </div>
                        </td>
                        <td className="p-5 text-sm text-[#3F4254] font-medium">
                          {v.contact_person ? (
                            <span className="text-[#3F4254]">{v.contact_person}</span>
                          ) : (
                            <span className="text-[#A1A5B7] italic text-xs font-light">Belum diatur</span>
                          )}
                        </td>
                        <td className="p-5 text-sm text-[#7E8299]">
                          {v.phone ? (
                            <a 
                              href={`https://wa.me/${v.phone.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8FFF3] text-[#50CD89] rounded-lg text-xs font-semibold hover:bg-[#D7FBE6] transition-all"
                            >
                              <span className="w-1.5 h-1.5 bg-[#50CD89] rounded-full animate-ping"></span>
                              {v.phone}
                            </a>
                          ) : (
                            <span className="text-[#A1A5B7] italic text-xs font-light">Belum diatur</span>
                          )}
                        </td>
                        <td className="p-5 text-sm text-[#5E6278] font-light max-w-xs truncate">
                          {v.address ? (
                            <span title={v.address}>{v.address}</span>
                          ) : (
                            <span className="text-[#A1A5B7] italic text-xs font-light">Belum diatur</span>
                          )}
                        </td>
                        <td className="p-5 text-right flex items-center justify-end gap-2">
                          {canEdit && (
                            <button 
                              type="button"
                              onClick={() => handleOpenEditModal(v)}
                              className="p-2 text-[#7E8299] hover:bg-[#F5F8FA] hover:text-[#0095E8] rounded-lg transition-all animate-hover"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
                          {canDelete && (
                            <button 
                              type="button"
                              onClick={() => handleDelete(v)}
                              className="p-2 text-[#7E8299] hover:bg-[#FFF5F8] hover:text-[#F1416C] rounded-lg transition-all animate-hover"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-[#A1A5B7] font-light">Tidak ada data vendor ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {renderPagination(sortedVendors)}
            </div>
          )}

          {activeTab === 'department' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F1F4] bg-[#F9F9F9]/50">
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center w-[60px]">No</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">ID Departemen</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nama Departemen</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Status</th>
                    <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right w-[150px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1F4]">
                  {sortedDepartments.length > 0 ? (
                    getPaginatedData(sortedDepartments).map((dept, index) => (
                      <tr key={dept.id} className="hover:bg-[#F9F9F9]/30 transition-all group">
                        <td className="p-5 text-sm font-semibold text-[#7E8299] text-center">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td className="p-5 text-sm font-semibold text-[#0095E8]">{dept.dept_id || `DEP-${String(dept.id).padStart(3, '0')}`}</td>
                        <td className="p-5 text-sm font-semibold text-[#181C32]">{dept.name}</td>
                        <td className="p-5 text-sm">
                          <span className="px-2.5 py-1 bg-[#E8FFF3] text-[#50CD89] rounded-lg text-[10px] font-bold">
                            {dept.status || 'Aktif'}
                          </span>
                        </td>
                        <td className="p-5 text-right flex items-center justify-end gap-2">
                          {canEdit && (
                            <button 
                              type="button"
                              onClick={() => handleOpenEditModal(dept)}
                              className="p-2 text-[#7E8299] hover:bg-[#F5F8FA] hover:text-[#0095E8] rounded-lg transition-all animate-hover"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
                          {canDelete && (
                            <button 
                              type="button"
                              onClick={() => handleDelete(dept)}
                              className="p-2 text-[#7E8299] hover:bg-[#FFF5F8] hover:text-[#F1416C] rounded-lg transition-all animate-hover"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-10 text-center text-[#A1A5B7] font-light">Tidak ada data departemen ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {renderPagination(sortedDepartments)}
            </div>
          )}

          {activeTab === 'condition' && (
            <div>
              {/* Inner Sub-tab Bar */}
              <div className="flex border-b border-[#F1F1F4] bg-[#F9F9F9]/30">
                <button
                  type="button"
                  onClick={() => setActiveConditionSubTab('asset')}
                  className={`px-6 py-4 text-xs font-bold transition-all border-b-2 ${activeConditionSubTab === 'asset' ? 'border-[#0095E8] text-[#0095E8]' : 'border-transparent text-[#7E8299] hover:text-[#5E6278]'}`}
                >
                  Kondisi Aset
                </button>
                <button
                  type="button"
                  onClick={() => setActiveConditionSubTab('maintenance')}
                  className={`px-6 py-4 text-xs font-bold transition-all border-b-2 ${activeConditionSubTab === 'maintenance' ? 'border-[#0095E8] text-[#0095E8]' : 'border-transparent text-[#7E8299] hover:text-[#5E6278]'}`}
                >
                  Kondisi Pemeliharaan
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#F1F1F4] bg-[#F9F9F9]/50">
                      <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center w-[60px]">No</th>
                      <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">ID Kondisi</th>
                      <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nama Kondisi</th>
                      <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Tipe Kondisi</th>
                      <th className="p-5 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right w-[150px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F1F4]">
                    {sortedConditions.length > 0 ? (
                      getPaginatedData(sortedConditions).map((cond, index) => (
                        <tr key={cond.id} className="hover:bg-[#F9F9F9]/30 transition-all group">
                          <td className="p-5 text-sm font-semibold text-[#7E8299] text-center">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                          <td className="p-5 text-sm font-semibold text-[#0095E8]">{`KND-${String(cond.id).padStart(3, '0')}`}</td>
                          <td className="p-5 text-sm font-semibold text-[#181C32]">{cond.condition_name}</td>
                          <td className="p-5 text-sm">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${cond.condition_type === 'asset' ? 'bg-[#F1FAFF] text-[#0095E8]' : 'bg-[#E8FFF3] text-[#50CD89]'}`}>
                              {cond.condition_type === 'asset' ? 'Aset' : 'Pemeliharaan'}
                            </span>
                          </td>
                          <td className="p-5 text-right flex items-center justify-end gap-2">
                            {canEdit && (
                              <button 
                                type="button"
                                onClick={() => handleOpenEditModal(cond)}
                                className="p-2 text-[#7E8299] hover:bg-[#F5F8FA] hover:text-[#0095E8] rounded-lg transition-all animate-hover"
                              >
                                <Edit2 size={15} />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                type="button"
                                onClick={() => handleDelete(cond)}
                                className="p-2 text-[#7E8299] hover:bg-[#FFF5F8] hover:text-[#F1416C] rounded-lg transition-all animate-hover"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-10 text-center text-[#A1A5B7] font-light">Tidak ada data kondisi ditemukan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {renderPagination(sortedConditions)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal CRUD Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-[600px] max-w-full overflow-hidden border border-[#F1F1F4] animate-scale-up">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]/50">
              <div>
                <h3 className="text-base font-bold text-[#181C32]">
                  {activeTab === 'category' 
                    ? (modalMode === 'add' ? 'Tambah Kategori Aset Baru' : 'Edit Kategori Aset')
                    : activeTab === 'location'
                    ? (modalMode === 'add' ? 'Tambah Lokasi Baru' : 'Edit Lokasi')
                    : activeTab === 'vendor'
                    ? (modalMode === 'add' ? 'Tambah Vendor Baru' : 'Edit Vendor')
                    : activeTab === 'department'
                    ? (modalMode === 'add' ? 'Tambah Data Departemen' : 'Edit Departemen')
                    : activeTab === 'asset'
                    ? (modalMode === 'add' ? 'Tambah Data Aset' : 'Edit Data Aset')
                    : (modalMode === 'add' ? 'Tambah Kondisi Baru' : 'Edit Kondisi')
                  }
                </h3>
                <p className="text-xs text-[#A1A5B7] font-light">
                  {activeTab === 'category'
                    ? 'Kelola standardisasi kelompok aktiva tetap perpajakan.'
                    : activeTab === 'location'
                    ? 'Kelola standardisasi wilayah penempatan unit aset.'
                    : activeTab === 'vendor'
                    ? 'Kelola standardisasi penyedia barang/jasa dan pemeliharaan aset.'
                    : activeTab === 'department'
                    ? 'Kelola standardisasi divisi dan departemen operasional internal.'
                    : activeTab === 'asset'
                    ? 'Kelola informasi jenis/tipe unit aset ke dalam master data.'
                    : 'Kelola standardisasi status kondisi unit aset dan pemeliharaan.'
                  }
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-[#A1A5B7] hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-8 space-y-5">
                {activeTab === 'category' ? (
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                    
                    {/* ID KATEGORI - Readonly */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">ID Kategori</label>
                      <input 
                        type="text"
                        disabled
                        placeholder="Dihasilkan oleh sistem"
                        className="w-full px-4 py-3 bg-[#E1E3EA]/30 border border-[#F1F1F4] rounded-xl text-sm text-[#7E8299] outline-none cursor-not-allowed"
                      />
                    </div>

                    {/* KODE/NAMA KATEGORI */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Kode Kategori</label>
                      <input 
                        type="text"
                        required
                        placeholder="Contoh: ELEKTRONIK, FURNITURE"
                        className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all"
                        value={categoryForm.category_code}
                        onChange={(e) => setCategoryForm({ ...categoryForm, category_code: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-semibold text-[#181C32]">Kategori (Nama Kategori)</label>
                      <input 
                        type="text"
                        required
                        placeholder="Contoh: Laptop dan Monitor"
                        className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all"
                        value={categoryForm.category_name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
                      />
                    </div>

                    {/* KELOMPOK HARTA - DYNAMIC DROPDOWN WITH PMK 72/2023 INTEGRATION */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32] flex items-center gap-1.5">
                        Kelompok Harta
                        <button 
                          type="button" 
                          onClick={() => {
                            setActiveInfoTab(categoryForm.group_of_assets);
                            setIsInfoModalOpen(true);
                          }}
                          className="p-0.5 bg-gray-100 hover:bg-[#E1F0FF] hover:text-[#0095E8] rounded-full transition-all"
                        >
                          <Info size={12} />
                        </button>
                      </label>
                      <select 
                        className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all cursor-pointer"
                        value={categoryForm.group_of_assets}
                        onChange={(e) => setCategoryForm({ ...categoryForm, group_of_assets: e.target.value })}
                      >
                        {Object.keys(KELOMPOK_HARTA_RULES).map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>

                    {/* MASA MANFAAT - Readonly (Auto Filled) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Masa Manfaat</label>
                      <input 
                        type="text"
                        disabled
                        value={getRuleDetails(categoryForm.group_of_assets).masaManfaat}
                        className="w-full px-4 py-3 bg-[#E1E3EA]/30 border border-[#F1F1F4] rounded-xl text-sm text-[#7E8299] font-semibold outline-none cursor-not-allowed"
                      />
                    </div>

                    {/* STRAIGHT-LINE RATE (%) - Readonly (Auto Filled) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Straight-Line (%)</label>
                      <div className="relative">
                        <input 
                          type="text"
                          disabled
                          value={getRuleDetails(categoryForm.group_of_assets).straightLine.replace('%', '')}
                          className="w-full pl-4 pr-8 py-3 bg-[#E1E3EA]/30 border border-[#F1F1F4] rounded-xl text-sm text-[#7E8299] font-bold outline-none cursor-not-allowed text-right"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A1A5B7]">%</span>
                      </div>
                    </div>

                    {/* DECLINING BALANCE RATE (%) - Readonly (Auto Filled) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Declining Balance (%)</label>
                      <div className="relative">
                        <input 
                          type="text"
                          disabled
                          value={getRuleDetails(categoryForm.group_of_assets).decliningBalance.replace('%', '')}
                          className="w-full pl-4 pr-8 py-3 bg-[#E1E3EA]/30 border border-[#F1F1F4] rounded-xl text-sm text-[#7E8299] font-bold outline-none cursor-not-allowed text-right"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A1A5B7]">%</span>
                      </div>
                    </div>

                    {/* PARENT - Dynamic Select Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Parent</label>
                      <select 
                        className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all cursor-pointer"
                        value={categoryForm.parent_id}
                        onChange={(e) => setCategoryForm({ ...categoryForm, parent_id: e.target.value })}
                      >
                        <option value="">Asset Category (Utama / Root)</option>
                        {resolvedCategories
                          .filter(c => !selectedItem || c.id !== selectedItem.id)
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.category_name} ({c.category_code} - Lvl {c.level})
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    {/* LEVEL - Dynamic Calculated Badge */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Level</label>
                      <input 
                        type="text"
                        disabled
                        value={(() => {
                          if (!categoryForm.parent_id) return '0';
                          const p = resolvedCategories.find(c => c.id === parseInt(categoryForm.parent_id));
                          return p ? String(p.level + 1) : '0';
                        })()}
                        className="w-full px-4 py-3 bg-[#E1E3EA]/30 border border-[#F1F1F4] rounded-xl text-sm text-[#7E8299] font-bold outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                ) : activeTab === 'asset' ? (
                  <div className="space-y-5">
                    {/* ID ASET */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#181C32] uppercase tracking-wider">ID Aset</label>
                      <input 
                        type="text"
                        placeholder="ID Aset"
                        className="w-full px-4 py-3 bg-white border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:border-[#0095E8]/30 transition-all font-semibold"
                        value={assetForm.asset_id}
                        onChange={(e) => setAssetForm({ ...assetForm, asset_id: e.target.value })}
                      />
                      <p className="text-[10px] text-[#A1A5B7] font-semibold">*Kosongkan untuk meng-generate ID aset otomatis secara berurutan.</p>
                    </div>

                    {/* NAMA ASET */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#181C32] uppercase tracking-wider">Nama Aset</label>
                      <input 
                        type="text"
                        required
                        placeholder="Nama Aset"
                        className="w-full px-4 py-3 bg-white border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:border-[#0095E8]/30 transition-all font-medium"
                        value={assetForm.asset_name}
                        onChange={(e) => setAssetForm({ ...assetForm, asset_name: e.target.value })}
                      />
                    </div>

                    {/* KATEGORI */}
                    <div className="z-20">
                      <SearchableSelect 
                        label="Kategori"
                        required
                        placeholder="Pilih Kategori"
                        value={assetForm.category_id}
                        onChange={(val) => setAssetForm({ ...assetForm, category_id: val })}
                        options={resolvedCategories.map(c => ({ value: c.id, label: c.category_name }))}
                      />
                    </div>

                    {/* DEPARTEMEN */}
                    <div className="z-10">
                      <SearchableSelect 
                        label="Departemen"
                        placeholder="Pilih Departemen (Opsional)"
                        value={assetForm.department_id}
                        onChange={(val) => setAssetForm({ ...assetForm, department_id: val })}
                        options={sortedDepartments.map(d => ({ value: d.id, label: d.name }))}
                      />
                    </div>

                    {/* RFID */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#181C32] uppercase tracking-wider">RFID</label>
                      <input 
                        type="text"
                        placeholder="Tag RFID"
                        className="w-full px-4 py-3 bg-white border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:border-[#0095E8]/30 transition-all font-medium"
                        value={assetForm.rfid_tag}
                        onChange={(e) => setAssetForm({ ...assetForm, rfid_tag: e.target.value })}
                      />
                    </div>

                    {/* SPESIFIKASI */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#181C32] uppercase tracking-wider">Spesifikasi</label>
                      <textarea 
                        placeholder="Spesifikasi"
                        rows="4"
                        className="w-full px-4 py-3 bg-white border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:border-[#0095E8]/30 transition-all resize-none font-medium"
                        value={assetForm.specification}
                        onChange={(e) => setAssetForm({ ...assetForm, specification: e.target.value })}
                      />
                    </div>
                  </div>
                ) : activeTab === 'location' ? (
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                    {/* ID LOKASI - Readonly / Auto-generated */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">ID Lokasi</label>
                      <input 
                        type="text"
                        disabled
                        placeholder="Dihasilkan oleh sistem"
                        className="w-full px-4 py-3 bg-[#E1E3EA]/30 border border-[#F1F1F4] rounded-xl text-sm text-[#7E8299] outline-none cursor-not-allowed font-semibold"
                        value={modalMode === 'add' ? '' : locationForm.location_id}
                      />
                    </div>

                    {/* LOKASI */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Lokasi</label>
                      <input 
                        type="text"
                        required
                        placeholder="Lokasi"
                        className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all"
                        value={locationForm.location_name}
                        onChange={(e) => setLocationForm({ ...locationForm, location_name: e.target.value })}
                      />
                    </div>

                    {/* PARENT - Dynamic Select Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Parent</label>
                      <select 
                        className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all cursor-pointer"
                        value={locationForm.parent_id}
                        onChange={(e) => setLocationForm({ ...locationForm, parent_id: e.target.value })}
                      >
                        <option value="">Location Category (Utama / Root)</option>
                        {resolvedLocations
                          .filter(l => !selectedItem || l.id !== selectedItem.id)
                          .map(l => (
                            <option key={l.id} value={l.id}>
                              {l.location_name} ({l.location_id} - Lvl {l.level})
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    {/* LEVEL - Dynamic Calculated Badge */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Level</label>
                      <input 
                        type="text"
                        disabled
                        value={(() => {
                          if (!locationForm.parent_id) return '0';
                          const p = resolvedLocations.find(l => l.id === parseInt(locationForm.parent_id));
                          return p ? String(p.level + 1) : '0';
                        })()}
                        className="w-full px-4 py-3 bg-[#E1E3EA]/30 border border-[#F1F1F4] rounded-xl text-sm text-[#7E8299] font-bold outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                ) : activeTab === 'vendor' ? (
                  <div className="space-y-4">
                    {/* NAMA VENDOR */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Nama Vendor</label>
                      <input 
                        type="text"
                        required
                        placeholder="Contoh: PT. Royal Abadi Sejahtera"
                        className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all"
                        value={vendorForm.vendor_name}
                        onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      {/* CONTACT PERSON */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#181C32]">Contact Person (CP)</label>
                        <input 
                          type="text"
                          placeholder="Contoh: Budi Sudarsono"
                          className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all"
                          value={vendorForm.contact_person}
                          onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                        />
                      </div>

                      {/* NO TELEPON */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#181C32]">No. Telepon / WhatsApp</label>
                        <input 
                          type="text"
                          placeholder="Contoh: 081234567890"
                          className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all"
                          value={vendorForm.phone}
                          onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* ALAMAT LENGKAP */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Alamat Lengkap</label>
                      <textarea 
                        rows="3"
                        placeholder="Masukkan alamat lengkap kantor vendor..."
                        className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all resize-none"
                        value={vendorForm.address}
                        onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                      />
                    </div>
                  </div>
                ) : activeTab === 'department' ? (
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                    {/* ID DEPARTEMEN - Readonly */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">ID Departemen</label>
                      <input 
                        type="text"
                        disabled
                        placeholder="Dihasilkan oleh sistem"
                        className="w-full px-4 py-3 bg-[#E1E3EA]/30 border border-[#F1F1F4] rounded-xl text-sm text-[#7E8299] font-bold outline-none cursor-not-allowed"
                        value={modalMode === 'add' ? '' : departmentForm.dept_id}
                      />
                    </div>

                    {/* DEPARTEMEN */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Departemen</label>
                      <input 
                        type="text"
                        required
                        placeholder="Nama Departemen"
                        className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all"
                        value={departmentForm.name}
                        onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                    {/* ID KONDISI - Readonly */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">ID Kondisi</label>
                      <input 
                        type="text"
                        disabled
                        placeholder="Dihasilkan oleh sistem"
                        className="w-full px-4 py-3 bg-[#E1E3EA]/30 border border-[#F1F1F4] rounded-xl text-sm text-[#7E8299] font-bold outline-none cursor-not-allowed"
                        value={modalMode === 'add' ? '' : `KND-${String(selectedItem?.id).padStart(3, '0')}`}
                      />
                    </div>

                    {/* KONDISI */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#181C32]">Kondisi</label>
                      <input 
                        type="text"
                        required
                        placeholder="Kondisi"
                        className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all"
                        value={conditionForm.condition_name}
                        onChange={(e) => setConditionForm({ ...conditionForm, condition_name: e.target.value })}
                      />
                    </div>

                    {/* TIPE KONDISI */}
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-semibold text-[#181C32]">Tipe Kondisi</label>
                      <select 
                        disabled={modalMode === 'edit'}
                        className="w-full px-4 py-3 bg-[#E1E3EA]/30 border border-[#F1F1F4] rounded-xl text-sm font-semibold text-[#7E8299] outline-none cursor-not-allowed"
                        value={conditionForm.condition_type}
                        onChange={(e) => setConditionForm({ ...conditionForm, condition_type: e.target.value })}
                      >
                        <option value="asset">Kondisi Aset</option>
                        <option value="maintenance">Kondisi Pemeliharaan</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-5 bg-[#F9F9F9]/50 border-t border-[#F1F1F4] flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#7E8299] hover:bg-gray-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#181C32] hover:bg-[#181C32]/80 rounded-xl transition-all shadow-md"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal PMK 72/2023 - Kelompok Aktiva Tetap (Buku Referensi) */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-[800px] max-w-full h-[650px] flex flex-col overflow-hidden border border-[#F1F1F4] animate-scale-up">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-[#F1F1F4] flex items-center justify-between bg-gradient-to-r from-[#F1FAFF] to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl border border-[#0095E8]/10 flex items-center justify-center text-[#0095E8] shadow-sm">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#181C32]">Referensi Kelompok Harta Fiskal</h3>
                  <p className="text-xs text-[#A1A5B7] font-light">Peraturan Menteri Keuangan (PMK) RI Nomor 72 Tahun 2023</p>
                </div>
              </div>
              <button 
                onClick={() => setIsInfoModalOpen(false)}
                className="p-2 text-[#A1A5B7] hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sidebar + Content layout */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Sidebar Menu Groups */}
              <div className="w-52 border-r border-[#F1F1F4] bg-[#F9F9F9] overflow-y-auto p-4 space-y-1">
                {Object.keys(KELOMPOK_HARTA_RULES).map(group => (
                  <button
                    key={group}
                    onClick={() => setActiveInfoTab(group)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeInfoTab === group ? 'bg-[#E1F0FF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-white hover:text-[#0095E8]'}`}
                  >
                    {group}
                  </button>
                ))}
              </div>

              {/* Main Content Pane */}
              <div className="flex-1 p-8 overflow-y-auto space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-[#181C32]">{activeInfoTab}</span>
                    <span className="px-2 py-0.5 bg-[#E1F0FF] text-[#0095E8] rounded text-[10px] font-bold">
                      {KELOMPOK_HARTA_RULES[activeInfoTab].masaManfaat}
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A5B7] font-light">Ketentuan tarif penyusutan fiskal yang berlaku di Indonesia:</p>
                </div>

                {/* Matrix Rate */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F9F9F9] p-4 rounded-2xl border border-[#F1F1F4] flex flex-col justify-center">
                    <span className="text-[10px] text-[#A1A5B7] font-bold uppercase tracking-wider mb-1">Straight-Line (Garis Lurus)</span>
                    <span className="text-2xl font-black text-[#181C32]">{KELOMPOK_HARTA_RULES[activeInfoTab].straightLine}</span>
                  </div>
                  <div className="bg-[#F9F9F9] p-4 rounded-2xl border border-[#F1F1F4] flex flex-col justify-center">
                    <span className="text-[10px] text-[#A1A5B7] font-bold uppercase tracking-wider mb-1">Declining Balance (Saldo Menurun)</span>
                    <span className="text-2xl font-black text-[#181C32]">{KELOMPOK_HARTA_RULES[activeInfoTab].decliningBalance}</span>
                  </div>
                </div>

                {/* List of Goods */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider">Daftar Jenis Harta Berwujud:</h4>
                  <ul className="space-y-2.5">
                    {KELOMPOK_HARTA_RULES[activeInfoTab].examples.map((ex, idx) => (
                      <li key={idx} className="text-xs text-[#3F4254] leading-relaxed flex items-start gap-2.5 bg-white p-3 rounded-xl border border-[#F1F1F4] hover:shadow-sm transition-all">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0095E8] mt-1.5 shrink-0" />
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-[#F9F9F9] border-t border-[#F1F1F4] flex justify-end">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0095E8] hover:bg-[#0084CC] rounded-xl transition-all"
              >
                Tutup Referensi
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MasterDataAset;
