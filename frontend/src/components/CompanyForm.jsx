import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Info, ChevronDown, CheckCircle } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { authFetch } from '../services/api';

const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useModal();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [formData, setFormData] = useState({
    companyId: '',
    name: '',
    type: 'internal',
    timezone: 'UTC+07:00 (Cambodia, Laos, Thailand, Vietnam, and Western Indonesia)',
    address: '',
    phone: '',
    status: 'Aktif'
  });

  useEffect(() => {
    if (isEdit) {
      fetchCompanyData();
    }
  }, [id]);

  const fetchCompanyData = async () => {
    try {
      const response = await authFetch(`/api/companies/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data,
          status: data.status || 'Aktif'
        });
      } else {
        showError('Gagal', 'Gagal mengambil data perusahaan.');
        navigate('/pengaturan/perusahaan');
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? (checked ? 'Aktif' : 'Non-Aktif') : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit 
        ? `/api/companies/${id}`
        : '/api/companies';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        success('Berhasil', isEdit ? 'Perusahaan berhasil diperbarui!' : 'Perusahaan berhasil dibuat!');
        navigate('/pengaturan/perusahaan');
      } else {
        showError('Gagal', data.message || `Gagal ${isEdit ? 'mengupdate' : 'membuat'} perusahaan.`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      showError('Kesalahan Jaringan', 'Terjadi kesalahan jaringan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 px-10">
      <div className="bg-white rounded-xl shadow-sm border border-[#F1F1F4] overflow-hidden">
        {/* Info Banner */}
        <div className="mx-8 mt-8 p-4 bg-[#F9F9F9] border border-[#F1F1F4] rounded-lg flex items-center gap-3">
          <Info size={18} className="text-[#0095E8]" />
          <span className="text-sm text-[#3F4254]">Tanda (<span className="text-[#F1416C]">*</span>) adalah wajib di isi</span>
        </div>

        <form onSubmit={handleSubmit} className="p-8 px-8 space-y-6">
          {/* Nama Perusahaan */}
          <div className="flex items-center gap-8">
            <label className="w-48 text-sm text-[#3F4254]">
              Nama perusahaan <span className="text-[#F1416C]">*</span>
            </label>
            <input 
              type="text"
              name="name"
              placeholder="Masukkan nama perusahaan"
              required
              value={formData.name}
              onChange={handleChange}
              className="flex-1 max-w-2xl px-4 py-3 bg-white border border-[#F1F1F4] rounded-lg text-sm focus:outline-none focus:border-[#0095E8] transition-colors"
            />
          </div>

          {/* ID Perusahaan */}
          <div className="flex items-center gap-8">
            <label className="w-48 text-sm text-[#3F4254]">
              ID perusahaan <span className="text-[#F1416C]">*</span>
            </label>
            <input 
              type="text"
              name="companyId"
              placeholder="Masukkan ID perusahaan (contoh: PAM)"
              required
              disabled={isEdit}
              value={formData.companyId}
              onChange={handleChange}
              className="flex-1 max-w-2xl px-4 py-3 bg-white border border-[#F1F1F4] rounded-lg text-sm focus:outline-none focus:border-[#0095E8] transition-colors disabled:bg-[#F9F9F9] disabled:text-[#A1A5B7]"
            />
          </div>

          {/* Tipe */}
          <div className="flex items-center gap-8">
            <label className="w-48 text-sm text-[#3F4254]">
              Tipe <span className="text-[#F1416C]">*</span>
            </label>
            <div className="flex items-center gap-10 flex-1 max-w-2xl">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="type" 
                  value="internal" 
                  checked={formData.type === 'internal'}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#0095E8] focus:ring-[#0095E8]"
                />
                <span className="text-sm text-[#181C32] group-hover:text-[#0095E8] transition-colors">Internal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="type" 
                  value="external" 
                  checked={formData.type === 'external'}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#0095E8] focus:ring-[#0095E8]"
                />
                <span className="text-sm text-[#181C32] group-hover:text-[#0095E8] transition-colors">External</span>
              </label>
            </div>
          </div>

          {/* Zona Waktu */}
          <div className="flex items-center gap-8">
            <label className="w-48 text-sm text-[#3F4254]">
              Zona waktu <span className="text-[#F1416C]">*</span>
            </label>
            <div className="flex-1 max-w-2xl relative">
              <select
                name="timezone"
                required
                value={formData.timezone}
                onChange={handleChange}
                className="w-full appearance-none px-4 py-3 bg-white border border-[#F1F1F4] rounded-lg text-sm text-[#181C32] focus:outline-none focus:border-[#0095E8] transition-colors"
              >
                <option value="UTC+07:00 (Cambodia, Laos, Thailand, Vietnam, and Western Indonesia)">UTC+07:00 (Cambodia, Laos, Thailand, Vietnam, and Western Indonesia)</option>
                <option value="UTC+08:00 (Central Indonesia, Malaysia, Philippines, Singapore, Taiwan)">UTC+08:00 (Central Indonesia, Malaysia, Philippines, Singapore, Taiwan)</option>
                <option value="UTC+09:00 (Eastern Indonesia, Japan, South Korea)">UTC+09:00 (Eastern Indonesia, Japan, South Korea)</option>
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
            </div>
          </div>

          {/* Alamat Perusahaan */}
          <div className="flex items-start gap-8">
            <label className="w-48 text-sm text-[#3F4254] pt-3">
              Alamat perusahaan <span className="text-[#F1416C]">*</span>
            </label>
            <textarea 
              name="address"
              placeholder="Masukkan alamat lengkap perusahaan"
              required
              rows="3"
              value={formData.address}
              onChange={handleChange}
              className="flex-1 max-w-2xl px-4 py-3 bg-white border border-[#F1F1F4] rounded-lg text-sm focus:outline-none focus:border-[#0095E8] transition-colors resize-none"
            ></textarea>
          </div>

          {/* Nomor Telepon */}
          <div className="flex items-center gap-8">
            <label className="w-48 text-sm text-[#3F4254]">
              Nomor telepon <span className="text-[#F1416C]">*</span>
            </label>
            <div className="flex-1 max-w-2xl flex items-center">
              <div className="px-4 py-3 bg-[#F9F9F9] border border-[#F1F1F4] rounded-l-lg text-sm text-[#3F4254] border-r-0">
                +62
              </div>
              <input 
                type="tel"
                name="phone"
                placeholder="Masukkan nomor telepon"
                required
                value={formData.phone}
                onChange={handleChange}
                className="flex-1 px-4 py-3 bg-white border border-[#F1F1F4] rounded-r-lg text-sm focus:outline-none focus:border-[#0095E8] transition-colors"
              />
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-8">
            <label className="w-48 text-sm text-[#3F4254]">
              Status
            </label>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="status"
                  className="sr-only peer"
                  checked={formData.status === 'Aktif'}
                  onChange={handleChange}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0095E8]"></div>
                <span className="ml-3 text-sm font-medium text-[#181C32]">{formData.status}</span>
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-8 border-t border-[#F1F1F4] flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => navigate('/pengaturan/perusahaan')}
              className="px-8 py-2.5 bg-white border border-[#0095E8] rounded-lg text-sm font-bold text-[#0095E8] hover:bg-blue-50 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={loading || fetching}
              className="px-8 py-2.5 bg-[#0095E8] rounded-lg text-sm font-bold text-white hover:bg-[#0084CC] transition-colors disabled:bg-[#A1A5B7]"
            >
              {loading ? 'Menyimpan...' : (isEdit ? 'Update' : 'Buat')}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default CompanyForm;
