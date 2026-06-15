import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, ChevronDown, FileText, ExternalLink, Filter, RefreshCw, X, ClipboardPaste } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';

const TemplateList = () => {
  const navigate = useNavigate();
  const { confirm, success, error: showError } = useModal();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [jenisTemplateFilter, setJenisTemplateFilter] = useState('Semua');
  const [activeFilters, setActiveFilters] = useState({
    departemen: []
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [tempFilters, setTempFilters] = useState({ departemen: [] });
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchTemplates();
    fetchDepartments();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await authFetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await authFetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await authFetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        // Remove duplicates and sort
        const uniqueDepts = [...new Set(data.map(d => d.name))].sort();
        setAvailableDepartments(uniqueDepts);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleDelete = (id) => {
    confirm(
      'Hapus Template',
      'Apakah Anda yakin ingin menghapus template ini? Data yang sudah dihapus tidak dapat dikembalikan.',
      async () => {
        try {
          const response = await authFetch(`/api/templates/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            setTemplates(templates.filter(t => t.id !== id));
            success('Berhasil', 'Template berhasil dihapus');
          } else {
            showError('Gagal', 'Terjadi kesalahan saat menghapus template');
          }
        } catch (err) {
          console.error('Error deleting template:', err);
          showError('Gagal', 'Terjadi kesalahan jaringan');
        }
      }
    );
  };

  const filteredTemplates = templates.filter(t => {
    // Role based visibility check
    const user = JSON.parse(localStorage.getItem('user'));
    const role = user?.role?.toLowerCase();
    const isSuperAdminFull = role === 'super admin' || role?.includes('super admin') || role?.includes('superadmin');
    
    if (!isSuperAdminFull && t.department_name !== user.department) return false;

    // Search term filter
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.company_name && t.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.department_name && t.department_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Jenis Template filter
    if (jenisTemplateFilter !== 'Semua') {
      if ((t.jenis_template || 'checklist').toLowerCase() !== jenisTemplateFilter.toLowerCase()) return false;
    }

    // Departemen filter
    if (activeFilters.departemen.length > 0 && !activeFilters.departemen.includes(t.department_name)) return false;

    return true;
  });

  const totalPages = Math.ceil(filteredTemplates.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredTemplates.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-8">
      <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden shadow-sm">
        {/* Header Section */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
                <input
                  type="text"
                  placeholder="Cari nama template"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10 pr-4 py-2.5 bg-white border border-[#E4E6EF] rounded-lg text-sm focus:border-[#0095E8] outline-none transition-all w-[250px]"
                />
              </div>

              {/* Filter Button */}
              <button 
                onClick={() => { setTempFilters({...activeFilters}); setIsFilterOpen(true); }}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-[13px] font-semibold transition-colors ${
                  activeFilters.departemen.length > 0 
                    ? 'border-[#0095E8] bg-[#F1FAFF] text-[#0095E8]' 
                    : 'border-[#E4E6EF] text-[#7E8299] hover:bg-gray-50'
                }`}
              >
                <Filter size={14} /> Filter
              </button>

              {/* Refresh Button */}
              <button 
                onClick={fetchTemplates}
                className="flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EF] rounded-lg text-[13px] text-[#7E8299] font-semibold hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={14} /> Refresh
              </button>

              {/* Type Filter Toggles */}
              <div className="flex items-center bg-[#F9F9F9] border border-[#E4E6EF] rounded-lg p-1 gap-1">
                {['Semua', 'WO', 'Checklist'].map((type) => (
                  <button
                    key={type}
                    onClick={() => { setJenisTemplateFilter(type); setCurrentPage(1); }}
                    className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                      jenisTemplateFilter === type 
                        ? 'bg-white text-[#3F4254] shadow-sm' 
                        : 'text-[#A1A5B7] hover:text-[#3F4254]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-2 bg-white border border-[#0095E8] text-[#0095E8] hover:bg-blue-50 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm"
              >
                <ClipboardPaste size={18} />
                Import dari Text
              </button>
              <button
                onClick={() => navigate('/pengaturan/template-tugas/create')}
                className="flex items-center gap-2 bg-[#0095E8] hover:bg-[#0084CC] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm"
              >
                <Plus size={18} />
                Buat Template
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F1F1F4] text-[#A1A5B7] text-[11px] font-bold uppercase tracking-wider bg-white">
                <th className="px-6 py-4 w-16">No</th>
                <th className="px-6 py-4">Nama Template</th>
                <th className="px-6 py-4">Nama Perusahaan</th>
                <th className="px-6 py-4">Nama Departemen</th>
                <th className="px-6 py-4">Jenis Template</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[#3F4254]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[#7E8299]">Memuat data...</td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-[#7E8299]">Belum ada template tugas.</td>
                </tr>
              ) : (
                currentItems.map((template, index) => (
                  <tr key={template.id} className="border-b last:border-0 border-[#F1F1F4] hover:bg-[#F9F9F9] transition-colors">
                    <td className="px-6 py-4 text-[#7E8299]">{indexOfFirstItem + index + 1}</td>
                    <td className="px-6 py-4">
                      <span 
                        className="text-[13px] font-normal text-[#0095E8] underline cursor-pointer hover:text-[#0084CC]" 
                        onClick={() => navigate(`/pengaturan/template-tugas/detail/${template.id}`)}
                      >
                        {template.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#7E8299]">{template.company_name || '-'}</td>
                    <td className="px-6 py-4 text-[#7E8299]">{template.department_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${template.jenis_template === 'wo' ? 'bg-[#F8E3FF] text-[#7239EA]' : 'bg-[#F1FAFF] text-[#0095E8]'}`}>
                        {template.jenis_template || 'checklist'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => navigate(`/pengaturan/template-tugas/edit/${template.id}`)}
                          className="text-[#A1A5B7] hover:text-[#0095E8] transition-colors p-1"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => navigate(`/pengaturan/template-tugas/detail/${template.id}`)}
                          className="text-[#A1A5B7] hover:text-[#0095E8] transition-colors p-1"
                          title="Detail"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-[#A1A5B7] hover:text-[#F1416C] transition-colors p-1"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section matching image */}
        <div className="px-6 py-6 flex items-center justify-between border-t border-[#F1F1F4]">
          <div className="flex items-center gap-4">
             <div className="relative">
               <select 
                 value={rowsPerPage}
                 onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                 className="appearance-none pl-4 pr-10 py-1.5 bg-[#F5F8FA] border border-transparent rounded text-[13px] text-[#3F4254] outline-none cursor-pointer"
               >
                 <option value={10}>10</option>
                 <option value={25}>25</option>
                 <option value={50}>50</option>
               </select>
               <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
             </div>
             <span className="text-[13px] text-[#A1A5B7]">Baris per halaman</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="w-8 h-8 flex items-center justify-center rounded text-[#A1A5B7] hover:bg-[#F5F8FA] disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${
                  currentPage === i + 1 ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F5F8FA]'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="w-8 h-8 flex items-center justify-center rounded text-[#A1A5B7] hover:bg-[#F5F8FA] disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>


      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsImportOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-[700px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]">
              <div className="flex items-center gap-2">
                <ClipboardPaste size={18} className="text-[#0095E8]" />
                <h3 className="text-base font-bold text-[#181C32]">Import Template dari Text</h3>
              </div>
              <button onClick={() => setIsImportOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-[#7E8299]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#F1FAFF] p-4 rounded-lg border border-[#D6EEFB] space-y-2">
                <p className="text-[12px] text-[#0095E8] font-bold">Instruksi:</p>
                <p className="text-[11px] text-[#0095E8] leading-relaxed">
                  Tempelkan teks template yang ingin di-import. Pastikan teks mengikuti format:<br/>
                  <span className="font-mono bg-blue-100/50 px-1">Nama template: [Nama]</span><br/>
                  <span className="font-mono bg-blue-100/50 px-1">Detail Tugas [Nomor]: [Nama Detail]</span>, dst.
                </p>
              </div>
              
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Tempelkan teks template di sini..."
                className="w-full h-[350px] px-4 py-3 rounded-lg border border-[#E4E6EF] text-[13px] outline-none focus:border-[#0095E8] resize-none font-mono"
              />
            </div>

            <div className="px-6 py-4 bg-[#F9F9F9] border-t border-[#F1F1F4] flex items-center justify-end gap-3">
              <button
                onClick={() => setIsImportOpen(false)}
                className="px-6 py-2.5 border border-[#E4E6EF] bg-white text-[#7E8299] text-[13px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!importText.trim()) return;
                  
                  // Parsing logic
                  const lines = importText.split('\n').map(l => l.trim()).filter(l => l);
                  let parsedData = {
                    name: '',
                    company_id: '',
                    department_id: '',
                    jenis_template: 'checklist',
                    details: []
                  };

                  let currentDetail = null;
                  let companyName = '';
                  let deptName = '';

                  for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    
                    if (line.toLowerCase() === 'perusahaan') {
                      companyName = lines[++i];
                    } else if (line.toLowerCase() === 'departemen') {
                      deptName = lines[++i];
                    } else if (line.toLowerCase() === 'nama template') {
                      parsedData.name = lines[++i];
                    } else if (line.toLowerCase().startsWith('detail tugas')) {
                      if (currentDetail) parsedData.details.push(currentDetail);
                      currentDetail = {
                        id: Date.now() + parsedData.details.length,
                        nama_detail: '',
                        bentuk_laporan: 'Text Field',
                        deskripsi: '',
                        wajib_diisi: true,
                        options: ['Opsi 1'],
                        isExpanded: true
                      };
                    } else if (line.toLowerCase() === 'nama detail tugas' && currentDetail) {
                      currentDetail.nama_detail = lines[++i];
                    } else if (line.toLowerCase() === 'bentuk laporan' && currentDetail) {
                      const type = lines[++i];
                      currentDetail.bentuk_laporan = type;
                      
                      // If Multiple Choice, look for options until "Deskripsi" or another tag
                      if (type.toLowerCase() === 'multiple choice') {
                        let options = [];
                        let nextIdx = i + 1;
                        while (nextIdx < lines.length) {
                          const nextLine = lines[nextIdx];
                          const nextLineLower = nextLine.toLowerCase();
                          // Stop if we hit a known field tag
                          if (nextLineLower === 'deskripsi' || 
                              nextLineLower === 'ketentuan pengisian' || 
                              nextLineLower.startsWith('detail tugas')) {
                            break;
                          }
                          options.push(nextLine);
                          nextIdx++;
                        }
                        if (options.length > 0) {
                          currentDetail.options = options;
                          i = nextIdx - 1; // Move pointer to last option
                        }
                      }
                    } else if (line.toLowerCase() === 'deskripsi' && currentDetail) {
                      currentDetail.deskripsi = lines[++i];
                    } else if (line.toLowerCase() === 'ketentuan pengisian' && currentDetail) {
                      // Force all to be mandatory regardless of text
                      currentDetail.wajib_diisi = true;
                      i++; // Skip the next line (the value)
                    }
                  }
                  if (currentDetail) parsedData.details.push(currentDetail);

                  // Find company and dept IDs
                  const matchedCompany = companies.find(c => c.name.toLowerCase() === (companyName || '').toLowerCase());
                  if (matchedCompany) {
                    parsedData.company_id = matchedCompany.id;
                    // Logic to find dept would happen in Form component after company is selected
                    // But we can pass the name and let the Form component handle it
                    parsedData.target_dept_name = deptName;
                  }

                  navigate('/pengaturan/template-tugas/create', { state: { prefilled: parsedData } });
                }}
                className="px-6 py-2.5 bg-[#0095E8] text-white text-[13px] font-bold rounded-lg hover:bg-[#0084CC] transition-colors shadow-sm shadow-blue-200"
              >
                Generate & Buat Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-[#181C32]" />
                <h3 className="text-base font-bold text-[#181C32]">Filter Lanjutan</h3>
              </div>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-[#7E8299]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Departemen */}
              <div className="space-y-3">
                <label className="text-[13px] font-bold text-[#3F4254]">Departemen</label>
                <div className="flex flex-wrap gap-2">
                  {availableDepartments.map(dept => (
                    <button
                      key={dept}
                      onClick={() => {
                        const current = tempFilters.departemen;
                        if (current.includes(dept)) {
                          setTempFilters({ ...tempFilters, departemen: current.filter(d => d !== dept) });
                        } else {
                          setTempFilters({ ...tempFilters, departemen: [...current, dept] });
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-[12px] font-semibold border transition-all ${
                        tempFilters.departemen.includes(dept)
                          ? 'bg-[#0095E8] border-[#0095E8] text-white shadow-md shadow-blue-200'
                          : 'bg-white border-[#E4E6EF] text-[#7E8299] hover:border-[#0095E8] hover:text-[#0095E8]'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#F9F9F9] border-t border-[#F1F1F4] flex items-center gap-3">
              <button
                onClick={() => {
                  setTempFilters({ departemen: [] });
                  setActiveFilters({ departemen: [] });
                  setIsFilterOpen(false);
                  setCurrentPage(1);
                }}
                className="flex-1 px-4 py-2.5 border border-[#E4E6EF] bg-white text-[#7E8299] text-[13px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setActiveFilters(tempFilters);
                  setIsFilterOpen(false);
                  setCurrentPage(1);
                }}
                className="flex-1 px-4 py-2.5 bg-[#0095E8] text-white text-[13px] font-bold rounded-lg hover:bg-[#0084CC] transition-colors shadow-sm shadow-blue-200"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateList;
