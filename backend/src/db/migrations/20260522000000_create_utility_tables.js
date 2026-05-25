/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Utility Meters
  await knex.schema.createTable('pa_utility_meters', table => {
    table.increments('id').primary();
    table.string('tenant_name', 150).notNullable();
    table.enum('utility_type', ['listrik', 'air']).notNullable();
    table.integer('location_id').unsigned().references('id').inTable('pa_locations').onDelete('SET NULL');
    table.string('floor', 50);
    table.string('area', 100);
    table.string('power_capacity', 100); // Daya Listrik (e.g. 3 FASE 400 A)
    table.string('meter_brand', 100); // Jenis KWH (e.g. SCHNEIDER)
    table.string('meter_type', 100);  // Type KWH (e.g. E43)
    table.string('meter_number', 100).notNullable(); // No KWH
    table.timestamps(true, true);
  });

  // 2. Utility Readings
  await knex.schema.createTable('pa_utility_readings', table => {
    table.increments('id').primary();
    table.integer('meter_id').unsigned().references('id').inTable('pa_utility_meters').onDelete('CASCADE');
    table.date('reading_date').notNullable();
    table.decimal('previous_reading', 15, 2).notNullable().defaultTo(0.00);
    table.decimal('current_reading', 15, 2).notNullable();
    table.decimal('usage_amount', 15, 2).notNullable();
    table.integer('agent_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('status', 50).notNullable().defaultTo('Pending'); // Pending, Approved, Rejected
    table.string('approval_token', 100).unique().notNullable(); // token for public QR link
    table.datetime('approved_at');
    table.text('notes'); // rejection reason or audit remarks
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('pa_utility_readings');
  await knex.schema.dropTableIfExists('pa_utility_meters');
};
