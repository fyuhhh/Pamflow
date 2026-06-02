/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Ensure 'is_master' column exists
  const hasIsMaster = await knex.schema.hasColumn('pa_assets', 'is_master');
  if (!hasIsMaster) {
    await knex.schema.alterTable('pa_assets', table => {
      table.boolean('is_master').defaultTo(false);
    });
  }

  // 2. Drop unique constraint 'pa_assets_asset_id_unique'
  await knex.schema.alterTable('pa_assets', table => {
    table.dropUnique('asset_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('pa_assets', table => {
    table.unique('asset_id');
  });
};
