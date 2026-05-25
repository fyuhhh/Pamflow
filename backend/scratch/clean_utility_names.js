const db = require('../src/config/db');

async function run() {
  try {
    console.log('=== MEMULAI ANALISIS DATA UTILITY METERS ===');
    const [meters] = await db.query('SELECT * FROM pa_utility_meters WHERE utility_type = "listrik"');
    console.log(`Ditemukan ${meters.length} meteran listrik.`);

    for (const m of meters) {
      console.log(`ID: ${m.id} | Nama Saat Ini: "${m.tenant_name}" | No KWH: ${m.meter_number}`);
      
      // Jika nama belum memiliki pemisah ' - ', mari kita rapikan
      if (!m.tenant_name.includes(' - ')) {
        let parent = '';
        let section = '';
        
        if (m.tenant_name.startsWith('HYPERMART')) {
          parent = 'HYPERMART';
          section = m.tenant_name.replace('HYPERMART', '').trim();
        } else {
          // Default fallbacks jika tenant lain
          const firstSpaceIdx = m.tenant_name.indexOf(' ');
          if (firstSpaceIdx !== -1) {
            parent = m.tenant_name.substring(0, firstSpaceIdx);
            section = m.tenant_name.substring(firstSpaceIdx + 1);
          } else {
            parent = m.tenant_name;
            section = 'Umum';
          }
        }
        
        const newName = `${parent} - ${section}`;
        console.log(`  -> Mengubah ke format baru: "${newName}"`);
        
        // Update di database
        await db.query('UPDATE pa_utility_meters SET tenant_name = ? WHERE id = ?', [newName, m.id]);
        
        // Pastikan opsi 'tenant' juga terdaftar di pa_utility_options agar otomatis muncul di dropdown
        const [optExists] = await db.query(
          'SELECT id FROM pa_utility_options WHERE option_type = "tenant" AND option_value = ?',
          [parent]
        );
        if (optExists.length === 0) {
          await db.query(
            'INSERT INTO pa_utility_options (option_type, option_value, created_at, updated_at) VALUES ("tenant", ?, NOW(), NOW())',
            [parent]
          );
          console.log(`  -> Menambahkan master tenant "${parent}" ke pa_utility_options.`);
        }
      } else {
        // Jika sudah ada pemisah, daftarkan saja parent-nya ke pa_utility_options
        const parent = m.tenant_name.split(' - ')[0];
        const [optExists] = await db.query(
          'SELECT id FROM pa_utility_options WHERE option_type = "tenant" AND option_value = ?',
          [parent]
        );
        if (optExists.length === 0) {
          await db.query(
            'INSERT INTO pa_utility_options (option_type, option_value, created_at, updated_at) VALUES ("tenant", ?, NOW(), NOW())',
            [parent]
          );
          console.log(`  -> Menambahkan master tenant "${parent}" ke pa_utility_options.`);
        }
      }
    }
    
    console.log('=== SELESAI RAPIKAN DATA METERAN ===');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
