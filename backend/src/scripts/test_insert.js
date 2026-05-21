const knex = require('../config/knex');

async function testInsert() {
  try {
    const count = await knex('pa_assets').count('id as c').first();
    console.log("Count result:", count);
    
    // mimic controller logic
    let asset_id = `AST-${String(count.c + 1).padStart(5, '0')}`;
    
    const payload = {
      asset_name: 'Test2',
      asset_id: asset_id
    };

    console.log("Attempting insert with payload:", payload);
    const [id] = await knex('pa_assets').insert(payload);
    console.log("Success! ID:", id);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
testInsert();
