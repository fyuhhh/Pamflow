import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Trash2, Calendar, User, Archive, Folder, MapPin, Users, HelpCircle, Loader2 } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';

export default function RecycleBinAset() {
  const [deletedItems, setDeletedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { confirm, success, showError } = useModal();

  useEffect(() => {
    fetchRecycleItems();
  }, []);

  const fetchRecycleItems = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/pure-assets/recycle-bin');
      if (res.ok) {
        const data = await res.json();
        setDeletedItems(data);
      } else {
        showError('Gagal', 'Gagal memuat history penghapusan.');
      }
    } catch (error) {
      console.error('Error fetching recycle bin:', error);
      showError('Kesalahan', 'Terjadi kesalahan sistem saat memuat data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (item) => {
    confirm(
      'Kembalikan Data',
      `Apakah Anda yakin ingin memulihkan ${getReadableType(item.item_type)} "${item.item_name}" ke modul aktif?`,
      async () => {
        try {
          const res = await authFetch(`/api/pure-assets/recycle-bin/${item.id}/restore`, {
            method: 'POST',
          });
          if (res.ok) {
            success('Berhasil', `${getReadableType(item.item_type)} berhasil dikembalikan!`);
            fetchRecycleItems();
          } else {
            const err = await res.json();
            showError('Gagal', err.message || 'Gagal mengembalikan data.');
          }
        } catch (error) {
          console.error('Error restoring:', error);
          showError('Kesalahan', 'Terjadi kesalahan sistem saat mengembalikan data.');
        }
      },
      {
        confirmText: 'Kembalikan',
        cancelText: 'Batal'
      }
    );
  };

  const handlePermanentDelete = (item) => {
    confirm(
      'Hapus Permanen',
      `Tindakan ini akan menghapus ${getReadableType(item.item_type)} "${item.item_name}" secara absolut dan tidak dapat dipulihkan kembali. Lanjutkan?`,
      async () => {
        try {
          const res = await authFetch(`/api/pure-assets/recycle-bin/${item.id}/permanent`, {
            method: 'DELETE',
          });
          if (res.ok) {
            success('Hapus Sukses', 'Data berhasil dihapus secara permanen.');
            fetchRecycleItems();
          } else {
            showError('Gagal', 'Gagal menghapus data secara permanen.');
          }
        } catch (error) {
          console.error('Error deleting permanently:', error);
          showError('Kesalahan', 'Terjadi kesalahan sistem saat menghapus data.');
        }
      },
      {
        confirmText: 'Hapus Permanen',
        cancelText: 'Batal'
      }
    );
  };

  const getReadableType = (type) => {
    switch (type) {
      case 'category': return 'Kategori Aset';
      case 'location': return 'Lokasi Aset';
      case 'vendor': return 'Vendor';
      case 'asset': return 'Unit Aset';
      default: return type;
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'category':
        return {
          bg: 'bg-[#FFF8DD] text-[#F1BC06] border-[#FFF8DD]',
          icon: <Folder size={14} className="mr-1" />
        };
      case 'location':
        return {
          bg: 'bg-[#E8FFF3] text-[#50CD89] border-[#E8FFF3]',
          icon: <MapPin size={14} className="mr-1" />
        };
      case 'vendor':
        return {
          bg: 'bg-[#E1F0FF] text-[#0095E8] border-[#E1F0FF]',
          icon: <Users size={14} className="mr-1" />
        };
      default:
        return {
          bg: 'bg-[#F5F8FA] text-[#7E8299] border-[#F5F8FA]',
          icon: <Archive size={14} className="mr-1" />
        };
    }
  };

  const filteredItems = deletedItems.filter(item => {
    const term = searchQuery.toLowerCase();
    const nameMatch = item.item_name.toLowerCase().includes(term);
    const typeMatch = getReadableType(item.item_type).toLowerCase().includes(term);
    const deleterName = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase();
    return nameMatch || typeMatch || deleterName.includes(term);
  });

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-[#F5F8FA]">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#181C32] flex items-center">
            <Archive className="mr-3 text-[#0095E8]" size={28} />
            History Penghapusan Aset
          </h1>
          <p className="text-sm font-light text-[#7E8299] mt-1">
            Daftar seluruh item modul aset yang dihapus. Anda dapat memulihkan (Restore) atau menghapusnya secara permanen.
          </p>
        </div>
      </div>

      {/* Main glass card */}
      <div className="bg-white rounded-[24px] border border-[#EFF2F5] shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="p-6 border-b border-[#EFF2F5] flex flex-col md:flex-row md:items-center gap-4 bg-[#F9F9F9]/50">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-[#A1A5B7]" size={18} />
            <input 
              type="text"
              placeholder="Cari berdasarkan nama data, tipe modul, atau penghapus..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#E1E3EA] rounded-xl text-sm font-light outline-none focus:border-[#0095E8]/30 focus:ring-4 focus:ring-[#0095E8]/5 transition-all placeholder-[#A1A5B7]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchRecycleItems}
            className="px-5 py-3 bg-white border border-[#E1E3EA] hover:border-[#0095E8]/20 hover:bg-[#F9F9F9] rounded-xl text-sm font-medium text-[#5E6278] flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            Segarkan
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-[#0095E8] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-light text-[#7E8299]">Sinkronisasi data history penghapusan...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
            <div className="w-20 h-20 bg-[#F5F8FA] rounded-3xl flex items-center justify-center text-[#A1A5B7]">
              <Archive size={40} className="stroke-[1.25]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#181C32]">Tidak ada history penghapusan</h3>
              <p className="text-sm font-light text-[#A1A5B7] max-w-sm mt-1">
                {searchQuery ? 'Tidak ada kecocokan data untuk kata kunci pencarian Anda.' : 'Keranjang sampah bersih! Tidak ada data modul aset yang dihapus baru-baru ini.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EFF2F5] text-xs font-semibold text-[#B5B5C3] uppercase bg-[#F9F9F9]/30">
                  <th className="py-5 px-6">Tipe Data</th>
                  <th className="py-5 px-6">Nama / Identitas Item</th>
                  <th className="py-5 px-6">Dihapus Oleh</th>
                  <th className="py-5 px-6">Waktu Penghapusan</th>
                  <th className="py-5 px-6 text-right">Aksi Pemulihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFF2F5]">
                {filteredItems.map((item) => {
                  const style = getTypeStyle(item.item_type);
                  const deleterName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Sistem / Anonim';
                  
                  return (
                    <tr key={item.id} className="hover:bg-[#F9F9F9]/60 transition-colors group">
                      {/* Tipe Data Badge */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${style.bg}`}>
                          {style.icon}
                          {getReadableType(item.item_type)}
                        </span>
                      </td>

                      {/* Item Name */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#181C32]">{item.item_name}</div>
                        <div className="text-xs text-[#A1A5B7] mt-0.5">ID Log: #{item.id}</div>
                      </td>

                      {/* Deleted By User */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#F5F8FA] border border-[#EFF2F5] text-[#0095E8] flex items-center justify-center font-bold text-xs uppercase">
                            {deleterName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#3F4254]">{deleterName}</div>
                            <div className="text-xs text-[#A1A5B7] flex items-center gap-1 mt-0.5">
                              <User size={10} /> Akun Pengguna
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-[#3F4254] flex items-center gap-1.5">
                          <Calendar size={13} className="text-[#A1A5B7]" />
                          {new Date(item.deleted_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                          {/* Restore Button */}
                          <button
                            onClick={() => handleRestore(item)}
                            title="Kembalikan Data"
                            className="p-2.5 bg-[#E8FFF3] hover:bg-[#50CD89] text-[#50CD89] hover:text-white rounded-xl transition-all shadow-sm hover:shadow-[#50CD89]/20"
                          >
                            <RotateCcw size={16} />
                          </button>

                          {/* Delete Permanent Button */}
                          <button
                            onClick={() => handlePermanentDelete(item)}
                            title="Hapus Permanen"
                            className="p-2.5 bg-[#FFF5F8] hover:bg-[#F1416C] text-[#F1416C] hover:text-white rounded-xl transition-all shadow-sm hover:shadow-[#F1416C]/20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
