const knex = require('../config/knex');

// Helper: auto-generate mutation number (RELOK-YYYYMMDD-XXXXX)
async function generateMutationNo() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `RELOK-${dateStr}-`;
  const count = await knex('pa_mutations')
    .where('mutation_no', 'like', `${prefix}%`)
    .count('id as c')
    .first();
  const seq = String((count?.c || 0) + 1).padStart(4, '0');
  return `${prefix}${seq}`;
}

// ─────────────────────────────────────────────
// GET /api/relocations - Daftar Relokasi
// ─────────────────────────────────────────────
exports.getRelocations = async (req, res) => {
  try {
    const { status } = req.query;

    let query = knex('pa_mutations')
      .leftJoin('pa_locations as dest_loc', 'pa_mutations.destination_location_id', 'dest_loc.id')
      .leftJoin('departments as dest_dept', 'pa_mutations.destination_department_id', 'dest_dept.id')
      .leftJoin('users as creator', 'pa_mutations.created_by', 'creator.id')
      .leftJoin('users as approver', 'pa_mutations.approved_by', 'approver.id')
      .select(
        'pa_mutations.*',
        'dest_loc.location_name as destination_location_name',
        'dest_dept.name as destination_department_name',
        knex.raw("COALESCE(NULLIF(CONCAT(COALESCE(creator.firstName, ''), ' ', COALESCE(creator.lastName, '')), ' '), creator.username) as created_by_name"),
        knex.raw("COALESCE(NULLIF(CONCAT(COALESCE(approver.firstName, ''), ' ', COALESCE(approver.lastName, '')), ' '), approver.username) as approved_by_name")
      )
      .orderBy('pa_mutations.created_at', 'desc');

    if (status) {
      query = query.where('pa_mutations.status', status);
    }

    const mutations = await query;

    // Attach item count for each mutation
    const ids = mutations.map(m => m.id);
    const itemCounts = ids.length > 0
      ? await knex('pa_mutation_items').whereIn('mutation_id', ids).select('mutation_id').count('id as cnt').groupBy('mutation_id')
      : [];

    const countMap = {};
    itemCounts.forEach(ic => { countMap[ic.mutation_id] = ic.cnt; });

    const result = mutations.map(m => ({
      ...m,
      item_count: countMap[m.id] || 0,
    }));

    res.json(result);
  } catch (error) {
    console.error('[Relocation] getRelocations error:', error);
    res.status(500).json({ message: 'Gagal mengambil data relokasi', error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/relocations/:id - Detail Relokasi dengan item-itemnya
// ─────────────────────────────────────────────
exports.getRelocationById = async (req, res) => {
  try {
    const mutation = await knex('pa_mutations')
      .leftJoin('pa_locations as dest_loc', 'pa_mutations.destination_location_id', 'dest_loc.id')
      .leftJoin('departments as dest_dept', 'pa_mutations.destination_department_id', 'dest_dept.id')
      .leftJoin('users as creator', 'pa_mutations.created_by', 'creator.id')
      .leftJoin('users as approver', 'pa_mutations.approved_by', 'approver.id')
      .where('pa_mutations.id', req.params.id)
      .select(
        'pa_mutations.*',
        'dest_loc.location_name as destination_location_name',
        'dest_dept.name as destination_department_name',
        knex.raw("COALESCE(NULLIF(CONCAT(COALESCE(creator.firstName, ''), ' ', COALESCE(creator.lastName, '')), ' '), creator.username) as created_by_name"),
        knex.raw("COALESCE(NULLIF(CONCAT(COALESCE(approver.firstName, ''), ' ', COALESCE(approver.lastName, '')), ' '), approver.username) as approved_by_name")
      )
      .first();

    if (!mutation) return res.status(404).json({ message: 'Relokasi tidak ditemukan' });

    // Get items with full asset info
    const items = await knex('pa_mutation_items')
      .join('pa_assets', 'pa_mutation_items.asset_id', 'pa_assets.id')
      .leftJoin('pa_locations as prev_loc', 'pa_mutation_items.previous_location_id', 'prev_loc.id')
      .leftJoin('departments as prev_dept', 'pa_mutation_items.previous_department_id', 'prev_dept.id')
      .where('pa_mutation_items.mutation_id', mutation.id)
      .select(
        'pa_mutation_items.*',
        'pa_assets.asset_id as asset_code',
        'pa_assets.asset_name',
        'pa_assets.register_no',
        'pa_assets.image_1',
        'pa_assets.image_2',
        'pa_assets.image_3',
        'prev_loc.location_name as previous_location_name',
        'prev_dept.name as previous_department_name'
      );

    res.json({ ...mutation, items });
  } catch (error) {
    console.error('[Relocation] getRelocationById error:', error);
    res.status(500).json({ message: 'Gagal mengambil detail relokasi', error: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/relocations - Buat Relokasi Baru
// ─────────────────────────────────────────────
exports.createRelocation = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const {
      mutation_date,
      destination_location_id,
      destination_department_id,
      description,
      items = [],
    } = req.body;

    const userId = req.user?.id || null;

    if (!mutation_date) {
      await trx.rollback();
      return res.status(400).json({ message: 'Tanggal relokasi wajib diisi' });
    }

    if (!items || items.length === 0) {
      await trx.rollback();
      return res.status(400).json({ message: 'Minimal satu aset harus ditambahkan' });
    }

    const mutation_no = await generateMutationNo();

    const [mutationId] = await trx('pa_mutations').insert({
      mutation_no,
      mutation_date,
      destination_location_id: destination_location_id || null,
      destination_department_id: destination_department_id || null,
      description: description || null,
      created_by: userId,
      status: 'Pending',
    });

    // Insert each item, recording previous location/department/user for history
    for (const item of items) {
      const asset = await trx('pa_assets')
        .where('id', item.asset_id)
        .select('location_id', 'department_id', 'asset_user')
        .first();

      await trx('pa_mutation_items').insert({
        mutation_id: mutationId,
        asset_id: item.asset_id,
        new_asset_user: item.new_asset_user || null,
        keterangan: item.keterangan || null,
        previous_location_id: asset?.location_id || null,
        previous_department_id: asset?.department_id || null,
        previous_asset_user: asset?.asset_user || null,
      });
    }

    await trx.commit();
    res.status(201).json({ id: mutationId, mutation_no, message: 'Relokasi berhasil dibuat dan menunggu persetujuan' });
  } catch (error) {
    await trx.rollback();
    console.error('[Relocation] createRelocation error:', error);
    res.status(500).json({ message: 'Gagal membuat relokasi', error: error.message });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/relocations/:id/approve - Setujui Relokasi
// ─────────────────────────────────────────────
exports.approveRelocation = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const { approval_notes } = req.body;
    const userId = req.user?.id || null;

    const mutation = await trx('pa_mutations').where('id', req.params.id).first();
    if (!mutation) {
      await trx.rollback();
      return res.status(404).json({ message: 'Relokasi tidak ditemukan' });
    }
    if (mutation.status !== 'Pending') {
      await trx.rollback();
      return res.status(400).json({ message: 'Relokasi ini sudah diproses sebelumnya' });
    }

    // Update mutation status
    await trx('pa_mutations').where('id', mutation.id).update({
      status: 'Approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      approval_notes: approval_notes || null,
    });

    // Apply changes to each asset
    const items = await trx('pa_mutation_items').where('mutation_id', mutation.id);
    for (const item of items) {
      const updateData = {};
      if (mutation.destination_location_id) updateData.location_id = mutation.destination_location_id;
      if (mutation.destination_department_id) updateData.department_id = mutation.destination_department_id;
      if (item.new_asset_user) updateData.asset_user = item.new_asset_user;
      if (Object.keys(updateData).length > 0) {
        await trx('pa_assets').where('id', item.asset_id).update(updateData);
      }
    }

    await trx.commit();
    res.json({ message: 'Relokasi berhasil disetujui dan data aset telah diperbarui' });
  } catch (error) {
    await trx.rollback();
    console.error('[Relocation] approveRelocation error:', error);
    res.status(500).json({ message: 'Gagal menyetujui relokasi', error: error.message });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/relocations/:id/reject - Tolak Relokasi
// ─────────────────────────────────────────────
exports.rejectRelocation = async (req, res) => {
  try {
    const { approval_notes } = req.body;
    const userId = req.user?.id || null;

    const mutation = await knex('pa_mutations').where('id', req.params.id).first();
    if (!mutation) return res.status(404).json({ message: 'Relokasi tidak ditemukan' });
    if (mutation.status !== 'Pending') {
      return res.status(400).json({ message: 'Relokasi ini sudah diproses sebelumnya' });
    }

    await knex('pa_mutations').where('id', mutation.id).update({
      status: 'Rejected',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      approval_notes: approval_notes || null,
    });

    res.json({ message: 'Relokasi berhasil ditolak' });
  } catch (error) {
    console.error('[Relocation] rejectRelocation error:', error);
    res.status(500).json({ message: 'Gagal menolak relokasi', error: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/relocations/:id - Hapus Relokasi (hanya yang masih Pending)
// ─────────────────────────────────────────────
exports.deleteRelocation = async (req, res) => {
  try {
    const mutation = await knex('pa_mutations').where('id', req.params.id).first();
    if (!mutation) return res.status(404).json({ message: 'Relokasi tidak ditemukan' });
    if (mutation.status !== 'Pending') {
      return res.status(400).json({ message: 'Hanya relokasi berstatus Pending yang dapat dihapus' });
    }

    await knex('pa_mutation_items').where('mutation_id', mutation.id).del();
    await knex('pa_mutations').where('id', mutation.id).del();
    res.json({ message: 'Relokasi berhasil dihapus' });
  } catch (error) {
    console.error('[Relocation] deleteRelocation error:', error);
    res.status(500).json({ message: 'Gagal menghapus relokasi', error: error.message });
  }
};
