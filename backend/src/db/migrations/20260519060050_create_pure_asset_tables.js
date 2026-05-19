/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Pure Asset (pa_) Tables to isolate from existing Maintenance Assets
  
  // 1. Categories
  await knex.schema.createTable('pa_categories', table => {
    table.increments('id').primary();
    table.integer('parent_id').unsigned().references('id').inTable('pa_categories').onDelete('CASCADE');
    table.string('category_code', 50).notNullable();
    table.string('category_name', 100).notNullable();
    table.string('group_of_assets', 100);
    table.string('depreciation_method', 50);
    table.timestamps(true, true);
  });

  // 2. Locations
  await knex.schema.createTable('pa_locations', table => {
    table.increments('id').primary();
    table.integer('parent_id').unsigned().references('id').inTable('pa_locations').onDelete('CASCADE');
    table.string('location_id', 20).notNullable();
    table.string('location_name', 100).notNullable();
    table.timestamps(true, true);
  });

  // 3. Vendors
  await knex.schema.createTable('pa_vendors', table => {
    table.increments('id').primary();
    table.string('vendor_name', 150).notNullable();
    table.string('contact_person', 100);
    table.string('phone', 50);
    table.text('address');
    table.timestamps(true, true);
  });

  // 4. Conditions
  await knex.schema.createTable('pa_conditions', table => {
    table.increments('id').primary();
    table.string('condition_name', 50).notNullable();
    table.timestamps(true, true);
  });

  // 5. Assets (Main)
  await knex.schema.createTable('pa_assets', table => {
    table.increments('id').primary();
    table.string('asset_id', 16).notNullable().unique(); // From manual max 16 chars
    table.string('register_no', 50); // e.g., REG-001
    table.string('asset_name', 150).notNullable();
    table.text('specification');
    
    // Foreign Keys
    table.integer('category_id').unsigned().references('id').inTable('pa_categories').onDelete('SET NULL');
    table.integer('vendor_id').unsigned().references('id').inTable('pa_vendors').onDelete('SET NULL');
    table.integer('location_id').unsigned().references('id').inTable('pa_locations').onDelete('SET NULL');
    table.integer('department_id').references('id').inTable('departments').onDelete('SET NULL'); // Pamflow's existing departments
    table.integer('condition_id').unsigned().references('id').inTable('pa_conditions').onDelete('SET NULL');
    
    // Ownership
    table.string('asset_pic', 100);
    table.string('asset_user', 100);

    // Acquisition & Depreciation
    table.date('acquisition_date');
    table.decimal('acquisition_cost', 15, 2);
    table.boolean('is_depreciable').defaultTo(false);
    table.string('depreciation_formula', 50);

    // Images
    table.string('image_1');
    table.string('image_2');
    table.string('image_3');

    // Status (Active, Disposed, Mutating, etc)
    table.string('status', 50).defaultTo('Active');

    table.timestamps(true, true);
  });

  // 6. Mutations
  await knex.schema.createTable('pa_mutations', table => {
    table.increments('id').primary();
    table.string('mutation_no', 50).notNullable().unique();
    table.date('mutation_date').notNullable();
    table.integer('destination_location_id').unsigned().references('id').inTable('pa_locations').onDelete('RESTRICT');
    table.integer('destination_department_id').references('id').inTable('departments').onDelete('RESTRICT');
    table.text('description');
    table.integer('created_by').references('id').inTable('users').onDelete('SET NULL'); // Pamflow's users
    table.timestamps(true, true);
  });

  // 7. Mutation Items
  await knex.schema.createTable('pa_mutation_items', table => {
    table.increments('id').primary();
    table.integer('mutation_id').unsigned().references('id').inTable('pa_mutations').onDelete('CASCADE');
    table.integer('asset_id').unsigned().references('id').inTable('pa_assets').onDelete('CASCADE');
    table.string('new_asset_user', 100);
    
    // For history reference
    table.integer('previous_location_id').unsigned().references('id').inTable('pa_locations').onDelete('SET NULL');
    table.integer('previous_department_id').references('id').inTable('departments').onDelete('SET NULL');
    table.string('previous_asset_user', 100);
  });

  // 8. Maintenances
  await knex.schema.createTable('pa_maintenances', table => {
    table.increments('id').primary();
    table.integer('asset_id').unsigned().references('id').inTable('pa_assets').onDelete('CASCADE');
    table.string('maintenance_name', 150).notNullable();
    table.enum('type', ['Technical', 'Administrative']).notNullable();
    table.date('reminder_date');
    table.date('due_date');
    table.enum('status', ['Pending', 'OK', 'Dismissed', 'Overdue']).defaultTo('Pending');
    
    // Execution
    table.decimal('cost', 15, 2);
    table.text('note');
    table.integer('condition_id').unsigned().references('id').inTable('pa_conditions').onDelete('SET NULL');
    table.integer('executed_by').references('id').inTable('users').onDelete('SET NULL');
    table.datetime('executed_at');
    
    table.timestamps(true, true);
  });

  // 9. Disposals
  await knex.schema.createTable('pa_disposals', table => {
    table.increments('id').primary();
    table.string('disposal_no', 50).notNullable().unique();
    table.date('disposal_date').notNullable();
    table.string('condition_status', 100);
    table.text('description');
    table.integer('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  // 10. Disposal Items
  await knex.schema.createTable('pa_disposal_items', table => {
    table.increments('id').primary();
    table.integer('disposal_id').unsigned().references('id').inTable('pa_disposals').onDelete('CASCADE');
    table.integer('asset_id').unsigned().references('id').inTable('pa_assets').onDelete('CASCADE');
  });

  // 11. Stock Opnames
  await knex.schema.createTable('pa_stock_opnames', table => {
    table.increments('id').primary();
    table.string('stock_opname_code', 50).notNullable().unique();
    table.string('group_name', 100).notNullable();
    table.integer('location_id').unsigned().references('id').inTable('pa_locations').onDelete('RESTRICT');
    table.text('description');
    table.date('opname_date').notNullable();
    table.integer('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  // 12. Stock Opname Items
  await knex.schema.createTable('pa_stock_opname_items', table => {
    table.increments('id').primary();
    table.integer('stock_opname_id').unsigned().references('id').inTable('pa_stock_opnames').onDelete('CASCADE');
    table.integer('asset_id').unsigned().references('id').inTable('pa_assets').onDelete('CASCADE');
    table.enum('status', ['Found', 'Missing', 'Foreign Item', 'Draft']).notNullable();
    table.text('notes');
  });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('pa_stock_opname_items');
  await knex.schema.dropTableIfExists('pa_stock_opnames');
  await knex.schema.dropTableIfExists('pa_disposal_items');
  await knex.schema.dropTableIfExists('pa_disposals');
  await knex.schema.dropTableIfExists('pa_maintenances');
  await knex.schema.dropTableIfExists('pa_mutation_items');
  await knex.schema.dropTableIfExists('pa_mutations');
  await knex.schema.dropTableIfExists('pa_assets');
  await knex.schema.dropTableIfExists('pa_conditions');
  await knex.schema.dropTableIfExists('pa_vendors');
  await knex.schema.dropTableIfExists('pa_locations');
  await knex.schema.dropTableIfExists('pa_categories');
};
