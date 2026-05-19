const knex = require('./src/config/knex');

async function test() {
  try {
    console.log("Testing category insert using Knex...");
    const result = await knex('pa_categories').insert({
      category_code: 'TEST_CODE',
      category_name: 'Test Name',
      group_of_assets: 'Kelompok 1',
      depreciation_method: 'Straight Line',
      parent_id: null
    });
    console.log("Insert success!", result);
  } catch (error) {
    console.error("Insert failed with error:", error);
  } finally {
    await knex.destroy();
  }
}

test();
