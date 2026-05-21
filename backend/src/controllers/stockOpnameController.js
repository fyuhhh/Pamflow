const knex = require('../config/knex');

// Helper: auto-generate stock opname code (SO-YYYYMMDD-XXXXX)
async function generateOpnameCode() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `SO-${dateStr}-`;
  const count = await knex('pa_stock_opnames')
    .where('stock_opname_code', 'like', `${prefix}%`)
    .count('id as c')
    .first();
  const seq = String((count?.c || 0) + 1).padStart(4, '0');
  return `${prefix}${seq}`;
}

// ─────────────────────────────────────────────
// GET /api/stock-opnames - Daftar Sesi Opname
// ─────────────────────────────────────────────
exports.getStockOpnames = async (req, res) => {
  try {
    const sessions = await knex('pa_stock_opnames')
      .leftJoin('pa_locations as loc', 'pa_stock_opnames.location_id', 'loc.id')
      .leftJoin('users as creator', 'pa_stock_opnames.created_by', 'creator.id')
      .select(
        'pa_stock_opnames.*',
        'loc.location_name',
        knex.raw("COALESCE(NULLIF(CONCAT(COALESCE(creator.firstName, ''), ' ', COALESCE(creator.lastName, '')), ' '), creator.username) as creator_name")
      )
      .orderBy('pa_stock_opnames.created_at', 'desc');

    // Get item counts and statuses
    const result = [];
    for (const session of sessions) {
      const items = await knex('pa_stock_opname_items')
        .where('stock_opname_id', session.id)
        .select('status')
        .count('id as count')
        .groupBy('status');

      const statusCounts = { Draft: 0, Found: 0, Missing: 0, 'Foreign Item': 0, total: 0 };
      items.forEach(item => {
        statusCounts[item.status] = item.count;
        statusCounts.total += item.count;
      });

      result.push({
        ...session,
        counts: statusCounts
      });
    }

    res.json(result);
  } catch (error) {
    console.error('[Opname] getStockOpnames error:', error);
    res.status(500).json({ message: 'Gagal mengambil data stock opname', error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/stock-opnames/:id - Detail Sesi Opname
// ─────────────────────────────────────────────
exports.getStockOpnameById = async (req, res) => {
  try {
    const session = await knex('pa_stock_opnames')
      .leftJoin('pa_locations as loc', 'pa_stock_opnames.location_id', 'loc.id')
      .leftJoin('users as creator', 'pa_stock_opnames.created_by', 'creator.id')
      .where('pa_stock_opnames.id', req.params.id)
      .select(
        'pa_stock_opnames.*',
        'loc.location_name',
        knex.raw("COALESCE(NULLIF(CONCAT(COALESCE(creator.firstName, ''), ' ', COALESCE(creator.lastName, '')), ' '), creator.username) as creator_name")
      )
      .first();

    if (!session) return res.status(404).json({ message: 'Sesi opname tidak ditemukan' });

    // Get items
    const items = await knex('pa_stock_opname_items')
      .join('pa_assets', 'pa_stock_opname_items.asset_id', 'pa_assets.id')
      .leftJoin('pa_locations as prev_loc', 'pa_assets.location_id', 'prev_loc.id')
      .where('pa_stock_opname_items.stock_opname_id', session.id)
      .select(
        'pa_stock_opname_items.*',
        'pa_assets.asset_id as asset_code',
        'pa_assets.asset_name',
        'pa_assets.register_no',
        'pa_assets.image_1',
        'prev_loc.location_name as original_location_name'
      );

    res.json({ ...session, items });
  } catch (error) {
    console.error('[Opname] getStockOpnameById error:', error);
    res.status(500).json({ message: 'Gagal mengambil detail stock opname', error: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/stock-opnames - Buat Sesi Opname Baru
// ─────────────────────────────────────────────
exports.createStockOpname = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const {
      location_id,
      group_name,
      description,
      opname_date
    } = req.body;

    const userId = req.user?.id || null;

    if (!location_id) {
      await trx.rollback();
      return res.status(400).json({ message: 'Lokasi wajib dipilih' });
    }

    if (!group_name) {
      await trx.rollback();
      return res.status(400).json({ message: 'Nama kelompok / sesi wajib diisi' });
    }

    const stock_opname_code = await generateOpnameCode();

    const [sessionId] = await trx('pa_stock_opnames').insert({
      stock_opname_code,
      group_name,
      location_id,
      description: description || null,
      opname_date: opname_date || new Date().toISOString().slice(0, 10),
      created_by: userId
    });

    // Query all active assets under this location
    const assets = await trx('pa_assets')
      .where('location_id', location_id)
      .where('status', 'Active')
      .select('id');

    // Create session items (initially Draft status)
    for (const asset of assets) {
      await trx('pa_stock_opname_items').insert({
        stock_opname_id: sessionId,
        asset_id: asset.id,
        status: 'Draft',
        notes: null
      });
    }

    await trx.commit();
    res.status(201).json({ id: sessionId, stock_opname_code, message: 'Sesi stock opname berhasil dimulai' });
  } catch (error) {
    await trx.rollback();
    console.error('[Opname] createStockOpname error:', error);
    res.status(500).json({ message: 'Gagal membuat sesi stock opname', error: error.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/stock-opnames/items/:id - Update status item opname
// ─────────────────────────────────────────────
exports.updateStockOpnameItem = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;

    if (!['Found', 'Missing', 'Foreign Item', 'Draft'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    if (status === 'Foreign Item' && (!notes || notes.trim() === '')) {
      return res.status(400).json({ message: 'Catatan / usulan lokasi asli wajib diisi untuk Foreign Item' });
    }

    await knex('pa_stock_opname_items')
      .where('id', id)
      .update({ status, notes: notes || null });

    res.json({ message: 'Item berhasil diupdate' });
  } catch (error) {
    console.error('[Opname] updateStockOpnameItem error:', error);
    res.status(500).json({ message: 'Gagal mengupdate item opname', error: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/stock-opnames/:id/foreign - Tambah Barang Nyasar (Foreign Item) ke sesi
// ─────────────────────────────────────────────
exports.addForeignItem = async (req, res) => {
  try {
    const { asset_id, notes } = req.body;
    const sessionId = req.params.id;

    if (!asset_id) return res.status(400).json({ message: 'Aset wajib dipilih' });
    if (!notes || notes.trim() === '') return res.status(400).json({ message: 'Catatan / usulan lokasi asli wajib diisi untuk Foreign Item' });

    // Check if asset already exists in this session
    const existing = await knex('pa_stock_opname_items')
      .where('stock_opname_id', sessionId)
      .where('asset_id', asset_id)
      .first();

    if (existing) {
      // Update its status to Foreign Item
      await knex('pa_stock_opname_items')
        .where('id', existing.id)
        .update({ status: 'Foreign Item', notes });
      return res.json({ id: existing.id, message: 'Status aset berhasil diubah menjadi Foreign Item' });
    }

    // Insert new item as Foreign Item
    const [itemId] = await knex('pa_stock_opname_items').insert({
      stock_opname_id: sessionId,
      asset_id,
      status: 'Foreign Item',
      notes
    });

    res.status(201).json({ id: itemId, message: 'Barang nyasar berhasil ditambahkan' });
  } catch (error) {
    console.error('[Opname] addForeignItem error:', error);
    res.status(500).json({ message: 'Gagal menambahkan barang nyasar', error: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/stock-opnames/:id - Hapus sesi opname
// ─────────────────────────────────────────────
exports.deleteStockOpname = async (req, res) => {
  try {
    const sessionId = req.params.id;
    await knex('pa_stock_opname_items').where('stock_opname_id', sessionId).del();
    await knex('pa_stock_opnames').where('id', sessionId).del();
    res.json({ message: 'Sesi opname berhasil dihapus' });
  } catch (error) {
    console.error('[Opname] deleteStockOpname error:', error);
    res.status(500).json({ message: 'Gagal menghapus sesi opname', error: error.message });
  }
};
