/**
 * Migration: Add status, approval fields to pa_mutations
 * and keterangan (notes) to pa_mutation_items for the Relocation workflow
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
  // Add status & approval columns to pa_mutations if they don't exist
  const hasMutStatus = await knex.schema.hasColumn('pa_mutations', 'status');
  const hasMutApprovedBy = await knex.schema.hasColumn('pa_mutations', 'approved_by');
  const hasMutApprovedAt = await knex.schema.hasColumn('pa_mutations', 'approved_at');
  const hasMutApprovalNotes = await knex.schema.hasColumn('pa_mutations', 'approval_notes');

  if (!hasMutStatus || !hasMutApprovedBy || !hasMutApprovedAt || !hasMutApprovalNotes) {
    await knex.schema.alterTable('pa_mutations', table => {
      if (!hasMutStatus) table.string('status', 50).defaultTo('Pending'); // Pending | Approved | Rejected
      if (!hasMutApprovedBy) table.integer('approved_by').references('id').inTable('users').onDelete('SET NULL');
      if (!hasMutApprovedAt) table.datetime('approved_at');
      if (!hasMutApprovalNotes) table.text('approval_notes');
    });
  }

  // Add keterangan (notes per item) to pa_mutation_items if not exists
  const hasItemNotes = await knex.schema.hasColumn('pa_mutation_items', 'keterangan');
  if (!hasItemNotes) {
    await knex.schema.alterTable('pa_mutation_items', table => {
      table.text('keterangan');
    });
  }
};

exports.down = async function(knex) {
  const hasMutStatus = await knex.schema.hasColumn('pa_mutations', 'status');
  if (hasMutStatus) {
    await knex.schema.alterTable('pa_mutations', table => {
      table.dropColumn('status');
      table.dropColumn('approved_by');
      table.dropColumn('approved_at');
      table.dropColumn('approval_notes');
    });
  }
  const hasItemNotes = await knex.schema.hasColumn('pa_mutation_items', 'keterangan');
  if (hasItemNotes) {
    await knex.schema.alterTable('pa_mutation_items', table => {
      table.dropColumn('keterangan');
    });
  }
};
