const knex = require('../config/knex');

async function testInsert() {
  try {
    let req = {
      body: {
        asset_id: null,
        asset_name: 'Testing MasterData',
        category_id: null,
        specification: 'Spec Test'
      }
    };
    
    // Exact controller logic
    let { asset_id } = req.body;
    if (!asset_id) {
      const count = await knex('pa_assets').count('id as c').first();
      asset_id = `AST-${String(count.c + 1).padStart(5, '0')}`;
      req.body.asset_id = asset_id;
    }

    console.log("Attempting insert with payload:", req.body);
    const [id] = await knex('pa_assets').insert(req.body);
    console.log("Success! ID:", id);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
testInsert();
