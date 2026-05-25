/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('pa_utility_readings', table => {
    table.string('tenant_approver_name').nullable();
    table.text('tenant_approval_photo', 'longtext').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('pa_utility_readings', table => {
    table.dropColumn('tenant_approver_name');
    table.dropColumn('tenant_approval_photo');
  });
};
