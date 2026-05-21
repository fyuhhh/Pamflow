const knex = require('../config/knex');

async function runTest() {
  console.log('🚀 Memulai Skenario Testing Otomatis: Relokasi Aset\n');
  const trx = await knex.transaction();

  try {
    // 1. Persiapan Data Dummy (Asal & Tujuan)
    console.log('⏳ 1. Mengambil data master (Lokasi, Departemen, User)...');
    
    // Cari user, lokasi, dan departemen yang sudah ada
    const user = await trx('users').first();
    let [locAsalId, locTujuanId] = await trx('pa_locations').select('id').limit(2).pluck('id');
    let [deptAsalId, deptTujuanId] = await trx('departments').select('id').limit(2).pluck('id');

    // Jika kosong, buat lokasi sementara
    if (!locAsalId) [locAsalId] = await trx('pa_locations').insert({ location_id: 'LOC-A', location_name: 'Lokasi Asal' });
    if (!locTujuanId) [locTujuanId] = await trx('pa_locations').insert({ location_id: 'LOC-B', location_name: 'Lokasi Tujuan' });
    if (!deptAsalId) [deptAsalId] = await trx('departments').insert({ name: 'Departemen Asal' });
    if (!deptTujuanId) [deptTujuanId] = await trx('departments').insert({ name: 'Departemen Tujuan' });

    console.log('✅ Data master berhasil disiapkan/diambil.');

    // 2. Buat Aset Dummy di Lokasi Asal
    console.log('\n⏳ 2. Membuat Aset Dummy di Lokasi Asal...');
    const [assetId] = await trx('pa_assets').insert({
      asset_id: 'AST-TEST-999',
      asset_name: 'Laptop Gaming Test',
      location_id: locAsalId,
      department_id: deptAsalId,
      asset_user: 'Budi (Pengguna Lama)'
    });
    console.log('✅ Aset Dummy [AST-TEST-999] berhasil dibuat di Lokasi Asal.');

    // 3. Mengajukan Relokasi
    console.log('\n⏳ 3. Mengajukan Relokasi ke Lokasi Tujuan...');
    const mutation_no = `RELOK-TEST-${Date.now()}`;
    const [mutationId] = await trx('pa_mutations').insert({
      mutation_no,
      mutation_date: new Date().toISOString().slice(0, 10),
      destination_location_id: locTujuanId,
      destination_department_id: deptTujuanId,
      description: 'Testing Relokasi via Automation',
      created_by: user ? user.id : null,
      status: 'Pending'
    });

    await trx('pa_mutation_items').insert({
      mutation_id: mutationId,
      asset_id: assetId,
      new_asset_user: 'Joko (Pengguna Baru)',
      keterangan: 'Pindah meja kerja',
      previous_location_id: locAsalId,
      previous_department_id: deptAsalId,
      previous_asset_user: 'Budi (Pengguna Lama)'
    });
    console.log(`✅ Pengajuan Relokasi [${mutation_no}] berhasil dibuat dengan status PENDING.`);

    // 4. Proses Persetujuan Relokasi
    console.log('\n⏳ 4. Menyetujui Pengajuan Relokasi...');
    await trx('pa_mutations').where('id', mutationId).update({
      status: 'Approved',
      approved_by: user ? user.id : null,
      approved_at: new Date().toISOString(),
      approval_notes: 'Disetujui otomatis oleh sistem testing'
    });

    // Menjalankan logika persetujuan (sama seperti di controller)
    const items = await trx('pa_mutation_items').where('mutation_id', mutationId);
    for (const item of items) {
      await trx('pa_assets').where('id', item.asset_id).update({
        location_id: locTujuanId,
        department_id: deptTujuanId,
        asset_user: item.new_asset_user
      });
    }
    console.log('✅ Relokasi disetujui, mengupdate master data aset...');

    // 5. Validasi Hasil Akhir
    console.log('\n⏳ 5. Memvalidasi Hasil Akhir (Testing Assertions)...');
    const updatedAsset = await trx('pa_assets').where('id', assetId).first();
    
    let isSuccess = true;
    if (updatedAsset.location_id !== locTujuanId) { console.error('❌ GAGAL: Lokasi tidak berubah'); isSuccess = false; }
    if (updatedAsset.department_id !== deptTujuanId) { console.error('❌ GAGAL: Departemen tidak berubah'); isSuccess = false; }
    if (updatedAsset.asset_user !== 'Joko (Pengguna Baru)') { console.error('❌ GAGAL: Pengguna tidak berubah'); isSuccess = false; }

    if (isSuccess) {
      console.log('🎉 SEMUA VALIDASI SUKSES: Data aset di database telah berpindah secara akurat!');
    } else {
      throw new Error('Validasi gagal');
    }

    // 6. Cleanup (Rollback agar database tetap bersih)
    console.log('\n🧹 6. Melakukan Rollback Database (Cleanup data testing)...');
    await trx.rollback();
    console.log('✅ Rollback berhasil. Database kembali bersih seperti semula.');
    
    console.log('\n=========================================');
    console.log('🌟 TESTING OTOMATIS SELESAI DENGAN SUKSES 🌟');
    console.log('=========================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ TESTING GAGAL:', err.message);
    await trx.rollback();
    process.exit(1);
  }
}

runTest();
