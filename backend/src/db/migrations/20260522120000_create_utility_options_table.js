/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('pa_utility_options', table => {
    table.increments('id').primary();
    table.string('option_type', 50).notNullable(); // 'daya_listrik', 'lantai_unit', 'area_unit', 'jenis_kwh', 'tipe_meteran'
    table.string('option_value', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('pa_utility_options');
};
