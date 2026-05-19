exports.up = async function(knex) {
  await knex.schema.createTable('pa_recycle_bin', table => {
    table.increments('id').primary();
    table.integer('company_id').nullable();
    table.string('item_type', 50).notNullable(); // 'category', 'location', 'vendor', 'asset'
    table.string('item_name', 200).notNullable();
    table.integer('deleted_by').nullable(); // Managed at app level
    table.text('payload').notNullable(); // Stores JSON representation of the deleted row
    table.timestamp('deleted_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('pa_recycle_bin');
};
