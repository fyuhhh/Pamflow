const knex = require('../config/knex');

// Helper: auto-generate disposal number (DISP-YYYYMMDD-XXXX)
async function generateDisposalNo() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `DISP-${dateStr}-`;
  const count = await knex('pa_disposals')
    .where('disposal_no', 'like', `${prefix}%`)
    .count('id as c')
    .first();
  const seq = String((count?.c || 0) + 1).padStart(4, '0');
  return `${prefix}${seq}`;
}

// ─────────────────────────────────────────────
// GET /api/disposals  – Daftar Disposal
// ─────────────────────────────────────────────
exports.getDisposals = async (req, res) => {
  try {
    const disposals = await knex('pa_disposals')
      .leftJoin('users as creator', 'pa_disposals.created_by', 'creator.id')
      .select(
        'pa_disposals.*',
        knex.raw(`COALESCE(NULLIF(CONCAT(COALESCE(creator.firstName,''),' ',COALESCE(creator.lastName,'')),' '), creator.username) as creator_name`)
      )
      .orderBy('pa_disposals.created_at', 'desc');

    // Attach items for each disposal
    const ids = disposals.map(d => d.id);
    const items = ids.length > 0
      ? await knex('pa_disposal_items')
          .join('pa_assets', 'pa_disposal_items.asset_id', 'pa_assets.id')
          .leftJoin('pa_categories as cat', 'pa_assets.category_id', 'cat.id')
          .whereIn('pa_disposal_items.disposal_id', ids)
          .select(
            'pa_disposal_items.disposal_id',
            'pa_assets.id as asset_id',
            'pa_assets.asset_id as asset_code',
            'pa_assets.asset_name',
            'pa_assets.register_no',
            'pa_assets.image_1',
            'pa_assets.status as asset_status',
            'cat.category_name'
          )
      : [];

    const itemMap = {};
    items.forEach(it => {
      if (!itemMap[it.disposal_id]) itemMap[it.disposal_id] = [];
      itemMap[it.disposal_id].push(it);
    });

    const result = disposals.map(d => ({ ...d, items: itemMap[d.id] || [] }));
    res.json(result);
  } catch (error) {
    console.error('[Disposal] getDisposals error:', error);
    res.status(500).json({ message: 'Gagal mengambil data disposal', error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/disposals/:id  – Detail Disposal
// ─────────────────────────────────────────────
exports.getDisposalById = async (req, res) => {
  try {
    const disposal = await knex('pa_disposals')
      .leftJoin('users as creator', 'pa_disposals.created_by', 'creator.id')
      .where('pa_disposals.id', req.params.id)
      .select(
        'pa_disposals.*',
        knex.raw(`COALESCE(NULLIF(CONCAT(COALESCE(creator.firstName,''),' ',COALESCE(creator.lastName,'')),' '), creator.username) as creator_name`)
      )
      .first();

    if (!disposal) return res.status(404).json({ message: 'Data disposal tidak ditemukan' });

    const items = await knex('pa_disposal_items')
      .join('pa_assets', 'pa_disposal_items.asset_id', 'pa_assets.id')
      .leftJoin('pa_categories as cat', 'pa_assets.category_id', 'cat.id')
      .leftJoin('pa_locations as loc', 'pa_assets.location_id', 'loc.id')
      .where('pa_disposal_items.disposal_id', disposal.id)
      .select(
        'pa_disposal_items.*',
        'pa_assets.asset_id as asset_code',
        'pa_assets.asset_name',
        'pa_assets.register_no',
        'pa_assets.image_1',
        'pa_assets.acquisition_cost',
        'pa_assets.acquisition_date',
        'pa_assets.status as asset_status',
        'cat.category_name',
        'loc.location_name'
      );

    res.json({ ...disposal, items });
  } catch (error) {
    console.error('[Disposal] getDisposalById error:', error);
    res.status(500).json({ message: 'Gagal mengambil detail disposal', error: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/disposals  – Buat Disposal (Permanent)
// ─────────────────────────────────────────────
exports.createDisposal = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const { disposal_date, condition_status, description, asset_ids = [] } = req.body;
    const userId = req.user?.id || null;

    if (!disposal_date) { await trx.rollback(); return res.status(400).json({ message: 'Tanggal disposal wajib diisi' }); }
    if (!asset_ids || asset_ids.length === 0) { await trx.rollback(); return res.status(400).json({ message: 'Pilih minimal satu aset untuk disposal' }); }

    // Verify all assets exist and are Active
    const assets = await trx('pa_assets').whereIn('id', asset_ids).select('id', 'asset_id', 'asset_name', 'status');
    if (assets.length !== asset_ids.length) { await trx.rollback(); return res.status(400).json({ message: 'Satu atau lebih aset tidak ditemukan' }); }

    const nonActive = assets.filter(a => a.status === 'Disposed');
    if (nonActive.length > 0) {
      await trx.rollback();
      return res.status(400).json({ message: `Aset "${nonActive[0].asset_name}" sudah pernah di-disposal sebelumnya` });
    }

    const disposal_no = await generateDisposalNo();

    const [disposalId] = await trx('pa_disposals').insert({
      disposal_no,
      disposal_date,
      condition_status: condition_status || null,
      description: description || null,
      created_by: userId,
    });

    for (const assetId of asset_ids) {
      await trx('pa_disposal_items').insert({ disposal_id: disposalId, asset_id: assetId });
      // Mark asset as Disposed
      await trx('pa_assets').where('id', assetId).update({ status: 'Disposed' });
    }

    await trx.commit();
    res.status(201).json({ id: disposalId, disposal_no, message: `${asset_ids.length} aset berhasil di-disposal secara permanen` });
  } catch (error) {
    await trx.rollback();
    console.error('[Disposal] createDisposal error:', error);
    res.status(500).json({ message: 'Gagal membuat disposal', error: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/disposals/:id  – Hapus record disposal (tidak restore aset)
// ─────────────────────────────────────────────
exports.deleteDisposal = async (req, res) => {
  try {
    const disposal = await knex('pa_disposals').where('id', req.params.id).first();
    if (!disposal) return res.status(404).json({ message: 'Data disposal tidak ditemukan' });

    await knex('pa_disposal_items').where('disposal_id', disposal.id).del();
    await knex('pa_disposals').where('id', disposal.id).del();
    res.json({ message: 'Record disposal berhasil dihapus' });
  } catch (error) {
    console.error('[Disposal] deleteDisposal error:', error);
    res.status(500).json({ message: 'Gagal menghapus disposal', error: error.message });
  }
};
