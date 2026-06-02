/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('pa_assets', table => {
    table.string('brand', 150);
    table.string('model_tipe', 150);
    table.string('serial_number', 150);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('pa_assets', table => {
    table.dropColumn('brand');
    table.dropColumn('model_tipe');
    table.dropColumn('serial_number');
  });
};
