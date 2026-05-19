const knex = require('./src/config/knex');

async function drop() {
  try {
    console.log("Dropping pa_recycle_bin if exists...");
    await knex.schema.dropTableIfExists('pa_recycle_bin');
    console.log("Dropped table successfully!");
  } catch (error) {
    console.error("Drop failed:", error);
  } finally {
    await knex.destroy();
  }
}

drop();
