const knex = require('../config/knex');

exports.getAssets = async (req, res) => {
  try {
    const assets = await knex('pa_assets')
      .leftJoin('pa_categories', 'pa_assets.category_id', 'pa_categories.id')
      .leftJoin('pa_locations', 'pa_assets.location_id', 'pa_locations.id')
      .leftJoin('pa_vendors', 'pa_assets.vendor_id', 'pa_vendors.id')
      .leftJoin('departments', 'pa_assets.department_id', 'departments.id')
      .leftJoin('pa_conditions', 'pa_assets.condition_id', 'pa_conditions.id')
      .select(
        'pa_assets.*',
        'pa_categories.category_name',
        'pa_locations.location_name',
        'pa_vendors.vendor_name',
        'departments.name as department_name',
        'pa_conditions.condition_name'
      );
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assets', error: error.message });
  }
};

exports.getAssetById = async (req, res) => {
  try {
    const asset = await knex('pa_assets')
      .leftJoin('pa_categories', 'pa_assets.category_id', 'pa_categories.id')
      .leftJoin('pa_locations', 'pa_assets.location_id', 'pa_locations.id')
      .leftJoin('pa_vendors', 'pa_assets.vendor_id', 'pa_vendors.id')
      .leftJoin('departments', 'pa_assets.department_id', 'departments.id')
      .leftJoin('pa_conditions', 'pa_assets.condition_id', 'pa_conditions.id')
      .where('pa_assets.id', req.params.id)
      .select(
        'pa_assets.*',
        'pa_categories.category_name',
        'pa_locations.location_name',
        'pa_vendors.vendor_name',
        'departments.name as department_name',
        'pa_conditions.condition_name'
      ).first();
      
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching asset', error: error.message });
  }
};

exports.createAsset = async (req, res) => {
  try {
    // Basic auto-generate Asset ID logic if not provided
    let { asset_id } = req.body;
    if (!asset_id) {
      const count = await knex('pa_assets').count('id as c').first();
      asset_id = `AST-${String(count.c + 1).padStart(5, '0')}`;
      req.body.asset_id = asset_id;
    }

    const [id] = await knex('pa_assets').insert(req.body);
    const newAsset = await knex('pa_assets').where({ id }).first();
    res.status(201).json(newAsset);
  } catch (error) {
    res.status(500).json({ message: 'Error creating asset', error: error.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    await knex('pa_assets').where({ id: req.params.id }).update(req.body);
    res.json({ message: 'Asset updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating asset', error: error.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    await knex('pa_assets').where({ id: req.params.id }).del();
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting asset', error: error.message });
  }
};
