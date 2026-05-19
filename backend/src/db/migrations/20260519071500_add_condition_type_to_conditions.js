/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Clear any existing pa_conditions to start fresh and clean
  await knex('pa_conditions').del();

  const hasType = await knex.schema.hasColumn('pa_conditions', 'condition_type');
  if (!hasType) {
    await knex.schema.alterTable('pa_conditions', table => {
      table.string('condition_type', 50).defaultTo('asset'); // 'asset' or 'maintenance'
    });
  }

  // Seed initial conditions as shown in images 3-5
  const assetConditions = [
    { condition_name: 'RUSAK', condition_type: 'asset' },
    { condition_name: 'HILANG', condition_type: 'asset' },
    { condition_name: 'DI SUMBANGKAN', condition_type: 'asset' },
    { condition_name: 'DIJUAL', condition_type: 'asset' },
    { condition_name: 'BAIK', condition_type: 'asset' },
    { condition_name: 'DI MUSNAHKAN', condition_type: 'asset' }
  ];

  const maintenanceConditions = [
    { condition_name: 'BAIK', condition_type: 'maintenance' },
    { condition_name: 'SEDANG', condition_type: 'maintenance' },
    { condition_name: 'RUSAK', condition_type: 'maintenance' },
    { condition_name: 'RUSAK RINGAN', condition_type: 'maintenance' },
    { condition_name: 'DIPERBAIKI', condition_type: 'maintenance' }
  ];

  await knex('pa_conditions').insert([...assetConditions, ...maintenanceConditions]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('pa_conditions', table => {
    table.dropColumn('condition_type');
  });
};
