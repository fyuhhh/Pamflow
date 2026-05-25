/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('pa_utility_meters', table => {
    table.string('billing_start_month', 50); // E.g., "Mei 2026" or "April 2026"
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('pa_utility_meters', table => {
    table.dropColumn('billing_start_month');
  });
};
