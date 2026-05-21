const knex = require('../config/knex');

async function seedDummyData() {
  console.log('🚀 Memulai Proses Injeksi Data Dummy Aset ke Database...\n');

  try {
    // Cari user admin (untuk relasi created_by)
    const user = await knex('users').first();
    const userId = user ? user.id : null;

    // ---------------------------------------------------------
    // 1. MASTER DATA: Kategori
    // ---------------------------------------------------------
    console.log('⏳ 1. Membuat Data Kategori...');
    const categories = [
      { category_code: 'IT-EQ', category_name: 'Peralatan IT', group_of_assets: 'Kelompok 1', depreciation_method: 'Garis Lurus' },
      { category_code: 'FURN', category_name: 'Furnitur Kantor', group_of_assets: 'Kelompok 2', depreciation_method: 'Saldo Menurun' },
      { category_code: 'VEH', category_name: 'Kendaraan Operasional', group_of_assets: 'Kelompok 2', depreciation_method: 'Garis Lurus' },
      { category_code: 'MACH', category_name: 'Mesin Produksi', group_of_assets: 'Kelompok 3', depreciation_method: 'Garis Lurus' },
    ];
    const catIds = [];
    for (const c of categories) {
      const [id] = await knex('pa_categories').insert(c);
      catIds.push(id);
    }
    console.log(`✅ Berhasil membuat ${catIds.length} Kategori.`);

    // ---------------------------------------------------------
    // 2. MASTER DATA: Lokasi
    // ---------------------------------------------------------
    console.log('⏳ 2. Membuat Data Lokasi...');
    const locations = [
      { location_id: 'JKT-HQ', location_name: 'Kantor Pusat Jakarta' },
      { location_id: 'BDG-BR', location_name: 'Cabang Bandung' },
      { location_id: 'SBY-WH', location_name: 'Gudang Surabaya' },
      { location_id: 'BALI-OFF', location_name: 'Kantor Bali' },
    ];
    const locIds = [];
    for (const l of locations) {
      const [id] = await knex('pa_locations').insert(l);
      locIds.push(id);
    }
    console.log(`✅ Berhasil membuat ${locIds.length} Lokasi.`);

    // ---------------------------------------------------------
    // 3. MASTER DATA: Departemen (Tabel Pamflow departments)
    // ---------------------------------------------------------
    console.log('⏳ 3. Menyiapkan Departemen...');
    let deptIds = await knex('departments').pluck('id');
    if (deptIds.length < 2) {
      const [d1] = await knex('departments').insert({ name: 'Human Resources' });
      const [d2] = await knex('departments').insert({ name: 'Information Technology' });
      const [d3] = await knex('departments').insert({ name: 'Finance & Accounting' });
      deptIds.push(d1, d2, d3);
    }
    console.log('✅ Departemen siap.');

    // ---------------------------------------------------------
    // 4. MASTER DATA: Vendor
    // ---------------------------------------------------------
    console.log('⏳ 4. Membuat Data Vendor...');
    const vendors = [
      { vendor_name: 'PT Mitra Teknologi Sejahtera', contact_person: 'Andi', phone: '081234567890', address: 'Jl. Sudirman No. 1, Jakarta' },
      { vendor_name: 'CV Mebel Indah Jaya', contact_person: 'Budi', phone: '081987654321', address: 'Jl. Ahmad Yani No. 10, Bandung' },
      { vendor_name: 'Auto Mandiri Motors', contact_person: 'Citra', phone: '085612341234', address: 'Jl. Gatsu No. 5, Surabaya' },
    ];
    const venIds = [];
    for (const v of vendors) {
      const [id] = await knex('pa_vendors').insert(v);
      venIds.push(id);
    }
    console.log(`✅ Berhasil membuat ${venIds.length} Vendor.`);

    // ---------------------------------------------------------
    // 5. MASTER DATA: Kondisi
    // ---------------------------------------------------------
    console.log('⏳ 5. Membuat Data Kondisi Aset...');
    const conditions = [
      { condition_name: 'Sangat Baik' },
      { condition_name: 'Baik' },
      { condition_name: 'Rusak Ringan' },
      { condition_name: 'Rusak Berat' },
    ];
    const condIds = [];
    for (const c of conditions) {
      const [id] = await knex('pa_conditions').insert(c);
      condIds.push(id);
    }
    console.log(`✅ Berhasil membuat ${condIds.length} Kondisi.`);

    // ---------------------------------------------------------
    // 6. ASET DATA: Buat 15 Aset secara Acak
    // ---------------------------------------------------------
    console.log('⏳ 6. Membuat 15 Data Aset Dummy...');
    const assetNames = [
      'Laptop MacBook Pro M2', 'Laptop Lenovo ThinkPad', 'PC Desktop Dell Optiplex', 
      'Monitor LG 27 Inch', 'Meja Kerja Ergonomis', 'Kursi Direktur', 
      'Lemari Arsip Besi', 'Mobil Toyota Avanza', 'Motor Honda Vario', 
      'Mesin Fotokopi Canon', 'Proyektor Epson', 'Router Cisco', 
      'Server HP ProLiant', 'AC Daikin 2 PK', 'Kamera Sony A7'
    ];
    
    const assetIds = [];
    for (let i = 0; i < 15; i++) {
      const [id] = await knex('pa_assets').insert({
        asset_id: `AST-DMY-${String(i+1).padStart(4, '0')}`,
        register_no: `REG/2026/${String(i+1).padStart(3, '0')}`,
        asset_name: assetNames[i],
        specification: `Spesifikasi standar untuk ${assetNames[i]}`,
        category_id: catIds[i % catIds.length],
        vendor_id: venIds[i % venIds.length],
        location_id: locIds[i % locIds.length],
        department_id: deptIds[i % deptIds.length],
        condition_id: condIds[i % condIds.length],
        asset_pic: 'Admin Aset',
        asset_user: `Karyawan ${i+1}`,
        acquisition_date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().slice(0, 10),
        acquisition_cost: Math.floor(Math.random() * 20000000) + 1000000,
        status: 'Active'
      });
      assetIds.push(id);
    }
    console.log(`✅ Berhasil membuat 15 Data Aset.`);

    // ---------------------------------------------------------
    // 7. MUTASI/RELOKASI DATA
    // ---------------------------------------------------------
    console.log('⏳ 7. Membuat 2 Data Relokasi (1 Pending, 1 Approved)...');
    
    // Relokasi 1: Pending (Menunggu Persetujuan)
    const [mut1] = await knex('pa_mutations').insert({
      mutation_no: `RELOK-DMY-001`,
      mutation_date: new Date().toISOString().slice(0, 10),
      destination_location_id: locIds[0],
      destination_department_id: deptIds[0],
      description: 'Pemindahan inventaris kantor cabang ke pusat',
      created_by: userId,
      status: 'Pending'
    });
    // Masukkan 2 aset ke relokasi ini
    await knex('pa_mutation_items').insert([
      { mutation_id: mut1, asset_id: assetIds[0], new_asset_user: 'Manager HR', keterangan: 'Mutasi staff' },
      { mutation_id: mut1, asset_id: assetIds[1], new_asset_user: 'Staff IT', keterangan: 'Mutasi alat' }
    ]);

    // Relokasi 2: Approved (Sudah Disetujui)
    const [mut2] = await knex('pa_mutations').insert({
      mutation_no: `RELOK-DMY-002`,
      mutation_date: new Date().toISOString().slice(0, 10),
      destination_location_id: locIds[1],
      destination_department_id: deptIds[1],
      description: 'Pengadaan area kerja baru',
      created_by: userId,
      status: 'Approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      approval_notes: 'Setuju, silakan dipindah.'
    });
    // Masukkan 1 aset ke relokasi ini
    await knex('pa_mutation_items').insert({
      mutation_id: mut2, asset_id: assetIds[2], new_asset_user: 'Direktur Ops', keterangan: 'Kebutuhan mendesak'
    });

    console.log(`✅ Berhasil membuat 2 Skenario Relokasi.`);

    console.log('\n=========================================================');
    console.log('🎉 INJEKSI DATA DUMMY SELESAI!');
    console.log('Silakan buka frontend (Browser) dan lihat:');
    console.log('- Halaman Master Data Aset (Kategori, Lokasi, dsb terisi)');
    console.log('- Halaman Daftar Aset (15 Aset terisi)');
    console.log('- Halaman Relokasi (2 Relokasi sudah ada di Daftar & Persetujuan)');
    console.log('=========================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ GAGAL:', err.message);
    process.exit(1);
  }
}

seedDummyData();
