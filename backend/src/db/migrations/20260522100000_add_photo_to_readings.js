/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('pa_utility_readings', table => {
    table.text('meter_photo', 'longtext'); // To store base64 captured photo for verification proof
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('pa_utility_readings', table => {
    table.dropColumn('meter_photo');
  });
};
