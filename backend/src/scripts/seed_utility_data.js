const knex = require('../config/knex');
const crypto = require('crypto');

async function seedUtilityData() {
  console.log('🚀 Memulai Proses Injeksi Master Data Utilitas Listrik...');
  try {
    // 1. Get first location or default to null
    const loc = await knex('pa_locations').first();
    const locationId = loc ? loc.id : null;

    // 2. Get first user to act as agent
    const user = await knex('users').first();
    const agentId = user ? user.id : null;

    const meters = [
      { tenant_name: 'HYPERMART PUTR (DOUBLE TARIF) (TOTAL)', utility_type: 'listrik', location_id: locationId, floor: 'LG', area: 'ANCHOR E', power_capacity: '3 FASE 400 A', meter_brand: 'SCHNEIDER', meter_type: null, meter_number: '1015163133', initial_reading: 9539749.7 },
      { tenant_name: 'HYPERMART PUTR TARIF 1 (LWBP)', utility_type: 'listrik', location_id: locationId, floor: 'LG', area: 'ANCHOR E', power_capacity: '3 FASE 400 A', meter_brand: 'SCHNEIDER', meter_type: null, meter_number: '1015163133', initial_reading: 7196164.9 },
      { tenant_name: 'HYPERMART PUTR TARIF 2 (WBP)', utility_type: 'listrik', location_id: locationId, floor: 'LG', area: 'ANCHOR E', power_capacity: '3 FASE 400 A', meter_brand: 'SCHNEIDER', meter_type: null, meter_number: '1015163133', initial_reading: 2342854.0 },
      { tenant_name: 'HYPERMART GENSET PUTR', utility_type: 'listrik', location_id: locationId, floor: 'LG', area: 'ANCHOR E', power_capacity: '3 FASE 400 A', meter_brand: 'SOCOMEC', meter_type: 'E43', meter_number: '17282010063', initial_reading: 4010.0 },
      { tenant_name: 'HYPERMART AHU (AC) (DOUBLE TARIF) (TOTAL)', utility_type: 'listrik', location_id: locationId, floor: 'LG', area: 'ANCHOR E', power_capacity: '3 FASE 600 A', meter_brand: 'SCHNEIDER', meter_type: null, meter_number: '1915184007', initial_reading: 1975834.6 },
      { tenant_name: 'HYPERMART AHU (AC) TARIF 1 (LWBP)', utility_type: 'listrik', location_id: locationId, floor: 'LG', area: 'ANCHOR E', power_capacity: '3 FASE 600 A', meter_brand: 'SCHNEIDER', meter_type: null, meter_number: '1915184007', initial_reading: 1210089.2 },
      { tenant_name: 'HYPERMART AHU (AC) TARIF 2 (WBP)', utility_type: 'listrik', location_id: locationId, floor: 'LG', area: 'ANCHOR E', power_capacity: '3 FASE 600 A', meter_brand: 'SCHNEIDER', meter_type: null, meter_number: '1915184007', initial_reading: 765744.1 },
      { tenant_name: 'HYPERMART GENSET AHU (AC)', utility_type: 'listrik', location_id: locationId, floor: 'LG', area: 'ANCHOR E', power_capacity: '3 FASE 600 A', meter_brand: 'SOCOMEC', meter_type: 'E40', meter_number: '18072010604', initial_reading: 672.0 },
      { tenant_name: 'LOGO WALLSIGN HYPERMART (DOUBLE TARIF) (TOTAL)', utility_type: 'listrik', location_id: locationId, floor: 'LG', area: 'ANCHOR E', power_capacity: '1 FASE 10 A', meter_brand: 'SOCOMEC', meter_type: 'E10', meter_number: '13132010735', initial_reading: 4146.4 }
    ];

    console.log('⏳ Menghapus data lama (jika ada)...');
    await knex('pa_utility_readings').del();
    await knex('pa_utility_meters').del();

    console.log('⏳ Memasukkan data meteran dan pembacaan awal...');
    for (const m of meters) {
      const { initial_reading, ...meterData } = m;
      const [meterId] = await knex('pa_utility_meters').insert(meterData);

      // Input pembacaan awal (28 April 2026) sebagai Approved
      await knex('pa_utility_readings').insert({
        meter_id: meterId,
        reading_date: '2026-04-28',
        previous_reading: initial_reading,
        current_reading: initial_reading,
        usage_amount: 0.00,
        agent_id: agentId,
        status: 'Approved',
        approval_token: crypto.randomBytes(16).toString('hex'),
        approved_at: new Date()
      });
    }

    console.log('✅ Berhasil menginjeksi 9 Master Meteran Listrik beserta pembacaan awal!');
    process.exit(0);
  } catch (err) {
    console.error('❌ GAGAL:', err);
    process.exit(1);
  }
}

seedUtilityData();
