const knex = require('../config/knex');

async function cleanupDummyData() {
  console.log('🧹 Memulai Proses Penghapusan Data Dummy Aset...\n');

  try {
    // Nonaktifkan foreign key checks sementara (khusus MySQL/MariaDB)
    await knex.raw('SET FOREIGN_KEY_CHECKS = 0;');

    // Menghapus data dari tabel-tabel Aset
    console.log('⏳ Menghapus riwayat Mutasi/Relokasi...');
    await knex('pa_mutation_items').truncate();
    await knex('pa_mutations').truncate();

    console.log('⏳ Menghapus semua Aset...');
    await knex('pa_assets').truncate();

    console.log('⏳ Menghapus Master Data Aset (Kategori, Lokasi, Vendor, Kondisi)...');
    await knex('pa_categories').truncate();
    await knex('pa_locations').truncate();
    await knex('pa_vendors').truncate();
    await knex('pa_conditions').truncate();

    // Aktifkan kembali foreign key checks
    await knex.raw('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('\n=========================================================');
    console.log('✨ CLEANUP SELESAI!');
    console.log('Semua data dummy berhasil dihapus. Database Aset kembali kosong.');
    console.log('=========================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ GAGAL MENGHAPUS DATA:', err.message);
    process.exit(1);
  }
}

cleanupDummyData();
