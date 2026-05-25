/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.table('pa_utility_readings', table => {
    table.date('period_start');
    table.date('period_end');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('pa_utility_readings', table => {
    table.dropColumn('period_start');
    table.dropColumn('period_end');
  });
};
