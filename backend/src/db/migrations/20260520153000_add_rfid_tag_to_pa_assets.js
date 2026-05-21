exports.up = function(knex) {
  return knex.schema.table('pa_assets', function(table) {
    table.string('rfid_tag', 100).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('pa_assets', function(table) {
    table.dropColumn('rfid_tag');
  });
};
