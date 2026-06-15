/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Create pa_departments table
  await knex.schema.createTable('pa_departments', table => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('dept_id', 100).notNullable();
    table.integer('company_id').notNullable();
    table.string('phone', 50);
    table.string('whatsapp', 50);
    table.string('status', 50).defaultTo('Aktif');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 2. Copy data from departments to pa_departments
  const rows = await knex('departments').select('*');
  if (rows.length > 0) {
    await knex('pa_departments').insert(rows);
  }

  // 3. Drop existing foreign keys pointing to departments
  try {
    await knex.schema.alterTable('pa_assets', table => {
      table.dropForeign('department_id');
    });
  } catch (err) {
    console.warn('Could not drop foreign key department_id on pa_assets:', err.message);
  }
  try {
    await knex.schema.alterTable('pa_mutations', table => {
      table.dropForeign('destination_department_id');
    });
  } catch (err) {
    console.warn('Could not drop foreign key destination_department_id on pa_mutations:', err.message);
  }
  try {
    await knex.schema.alterTable('pa_mutation_items', table => {
      table.dropForeign('previous_department_id');
    });
  } catch (err) {
    console.warn('Could not drop foreign key previous_department_id on pa_mutation_items:', err.message);
  }

  // 4. Alter columns to be unsigned so they match pa_departments.id (unsigned int)
  try {
    await knex.schema.alterTable('pa_assets', table => {
      table.integer('department_id').unsigned().alter();
    });
  } catch (err) {
    console.warn('Could not alter department_id to unsigned on pa_assets:', err.message);
  }
  try {
    await knex.schema.alterTable('pa_mutations', table => {
      table.integer('destination_department_id').unsigned().alter();
    });
  } catch (err) {
    console.warn('Could not alter destination_department_id to unsigned on pa_mutations:', err.message);
  }
  try {
    await knex.schema.alterTable('pa_mutation_items', table => {
      table.integer('previous_department_id').unsigned().alter();
    });
  } catch (err) {
    console.warn('Could not alter previous_department_id to unsigned on pa_mutation_items:', err.message);
  }

  // 5. Add new foreign keys pointing to pa_departments
  try {
    await knex.schema.alterTable('pa_assets', table => {
      table.foreign('department_id').references('id').inTable('pa_departments').onDelete('SET NULL');
    });
  } catch (err) {
    console.warn('Could not create foreign key pointing to pa_departments on pa_assets:', err.message);
  }
  try {
    await knex.schema.alterTable('pa_mutations', table => {
      table.foreign('destination_department_id').references('id').inTable('pa_departments').onDelete('RESTRICT');
    });
  } catch (err) {
    console.warn('Could not create foreign key pointing to pa_departments on pa_mutations:', err.message);
  }
  try {
    await knex.schema.alterTable('pa_mutation_items', table => {
      table.foreign('previous_department_id').references('id').inTable('pa_departments').onDelete('SET NULL');
    });
  } catch (err) {
    console.warn('Could not create foreign key pointing to pa_departments on pa_mutation_items:', err.message);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Revert foreign keys pointing to pa_departments back to departments
  try {
    await knex.schema.alterTable('pa_assets', table => {
      table.dropForeign('department_id');
    });
  } catch (e) {}
  try {
    await knex.schema.alterTable('pa_assets', table => {
      table.integer('department_id').alter(); // back to signed
    });
  } catch (e) {}
  try {
    await knex.schema.alterTable('pa_assets', table => {
      table.foreign('department_id').references('id').inTable('departments').onDelete('SET NULL');
    });
  } catch (e) {}

  try {
    await knex.schema.alterTable('pa_mutations', table => {
      table.dropForeign('destination_department_id');
    });
  } catch (e) {}
  try {
    await knex.schema.alterTable('pa_mutations', table => {
      table.integer('destination_department_id').alter(); // back to signed
    });
  } catch (e) {}
  try {
    await knex.schema.alterTable('pa_mutations', table => {
      table.foreign('destination_department_id').references('id').inTable('departments').onDelete('RESTRICT');
    });
  } catch (e) {}

  try {
    await knex.schema.alterTable('pa_mutation_items', table => {
      table.dropForeign('previous_department_id');
    });
  } catch (e) {}
  try {
    await knex.schema.alterTable('pa_mutation_items', table => {
      table.integer('previous_department_id').alter(); // back to signed
    });
  } catch (e) {}
  try {
    await knex.schema.alterTable('pa_mutation_items', table => {
      table.foreign('previous_department_id').references('id').inTable('departments').onDelete('SET NULL');
    });
  } catch (e) {}

  await knex.schema.dropTableIfExists('pa_departments');
};
