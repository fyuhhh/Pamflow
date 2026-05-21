exports.up = async function(knex) {
  await knex.schema.alterTable('pa_assets', table => {
    table.string('asset_id', 100).notNullable().alter();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('pa_assets', table => {
    table.string('asset_id', 16).notNullable().alter();
  });
};
