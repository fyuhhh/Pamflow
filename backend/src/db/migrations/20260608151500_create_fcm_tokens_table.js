/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  if (!await knex.schema.hasTable('fcm_tokens')) {
    await knex.schema.createTable('fcm_tokens', table => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('token', 500).notNullable().unique();
      table.string('device_name', 255).nullable();
      table.string('platform', 50).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('fcm_tokens');
};
