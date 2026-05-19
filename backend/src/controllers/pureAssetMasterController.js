const knex = require('../config/knex');

// CATEGORIES
exports.getCategories = async (req, res) => {
  try {
    const categories = await knex('pa_categories').select('*');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const [id] = await knex('pa_categories').insert(req.body);
    const newCat = await knex('pa_categories').where({ id }).first();
    res.status(201).json(newCat);
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    await knex('pa_categories').where({ id: req.params.id }).update(req.body);
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const item = await knex('pa_categories').where({ id: req.params.id }).first();
    if (!item) return res.status(404).json({ message: 'Category not found' });

    // Check if it has children or assets
    const children = await knex('pa_categories').where({ parent_id: req.params.id });
    if (children.length > 0) return res.status(400).json({ message: 'Cannot delete category with sub-categories' });
    
    // Backup to Recycle Bin
    await knex('pa_recycle_bin').insert({
      company_id: req.user ? req.user.company_id : null,
      item_type: 'category',
      item_name: item.category_name,
      deleted_by: req.user ? req.user.id : null,
      payload: JSON.stringify(item)
    });

    await knex('pa_categories').where({ id: req.params.id }).del();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

// LOCATIONS
exports.getLocations = async (req, res) => {
  try {
    const locations = await knex('pa_locations').select('*');
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching locations', error: error.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    let { location_id } = req.body;
    
    if (!location_id) {
      // Get the last location by id desc
      const lastLoc = await knex('pa_locations').orderBy('id', 'desc').first();
      let nextNum = 1;
      
      if (lastLoc && lastLoc.location_id) {
        const match = lastLoc.location_id.match(/LOC-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      location_id = `LOC-${String(nextNum).padStart(3, '0')}`;
      req.body.location_id = location_id;
    }

    const [id] = await knex('pa_locations').insert(req.body);
    const newLoc = await knex('pa_locations').where({ id }).first();
    res.status(201).json(newLoc);
  } catch (error) {
    res.status(500).json({ message: 'Error creating location', error: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    await knex('pa_locations').where({ id: req.params.id }).update(req.body);
    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const item = await knex('pa_locations').where({ id: req.params.id }).first();
    if (!item) return res.status(404).json({ message: 'Location not found' });

    // Backup to Recycle Bin
    await knex('pa_recycle_bin').insert({
      company_id: req.user ? req.user.company_id : null,
      item_type: 'location',
      item_name: item.location_name,
      deleted_by: req.user ? req.user.id : null,
      payload: JSON.stringify(item)
    });

    await knex('pa_locations').where({ id: req.params.id }).del();
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting location', error: error.message });
  }
};

// VENDORS
exports.getVendors = async (req, res) => {
  try {
    const vendors = await knex('pa_vendors').select('*');
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors', error: error.message });
  }
};

exports.createVendor = async (req, res) => {
  try {
    const [id] = await knex('pa_vendors').insert(req.body);
    const newVen = await knex('pa_vendors').where({ id }).first();
    res.status(201).json(newVen);
  } catch (error) {
    res.status(500).json({ message: 'Error creating vendor', error: error.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    await knex('pa_vendors').where({ id: req.params.id }).update(req.body);
    res.json({ message: 'Vendor updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating vendor', error: error.message });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const item = await knex('pa_vendors').where({ id: req.params.id }).first();
    if (!item) return res.status(404).json({ message: 'Vendor not found' });

    // Backup to Recycle Bin
    await knex('pa_recycle_bin').insert({
      company_id: req.user ? req.user.company_id : null,
      item_type: 'vendor',
      item_name: item.vendor_name,
      deleted_by: req.user ? req.user.id : null,
      payload: JSON.stringify(item)
    });

    await knex('pa_vendors').where({ id: req.params.id }).del();
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vendor', error: error.message });
  }
};

// CONDITIONS
exports.getConditions = async (req, res) => {
  try {
    const { type } = req.query;
    let query = knex('pa_conditions').select('*');
    if (type) {
      query = query.where({ condition_type: type });
    }
    const conditions = await query;
    res.json(conditions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conditions', error: error.message });
  }
};

exports.createCondition = async (req, res) => {
  try {
    const { condition_name, condition_type } = req.body;
    const [id] = await knex('pa_conditions').insert({
      condition_name,
      condition_type: condition_type || 'asset'
    });
    const newCond = await knex('pa_conditions').where({ id }).first();
    res.status(201).json(newCond);
  } catch (error) {
    res.status(500).json({ message: 'Error creating condition', error: error.message });
  }
};

exports.updateCondition = async (req, res) => {
  try {
    const { condition_name, condition_type } = req.body;
    await knex('pa_conditions').where({ id: req.params.id }).update({
      condition_name,
      condition_type
    });
    res.json({ message: 'Condition updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating condition', error: error.message });
  }
};

exports.deleteCondition = async (req, res) => {
  try {
    const item = await knex('pa_conditions').where({ id: req.params.id }).first();
    if (!item) return res.status(404).json({ message: 'Condition not found' });

    // Backup to Recycle Bin
    await knex('pa_recycle_bin').insert({
      company_id: req.user ? req.user.company_id : null,
      item_type: 'condition',
      item_name: item.condition_name,
      deleted_by: req.user ? req.user.id : null,
      payload: JSON.stringify(item)
    });

    await knex('pa_conditions').where({ id: req.params.id }).del();
    res.json({ message: 'Condition deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting condition', error: error.message });
  }
};

// DEPARTMENTS
exports.getDepartments = async (req, res) => {
  try {
    const departments = await knex('departments').select('*').orderBy('name', 'asc');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    let { name, dept_id } = req.body;
    const company_id = req.user ? req.user.company_id : 1; // fallback to 1

    if (!dept_id) {
      // Auto-generate DEP-001 etc
      const lastDept = await knex('departments').orderBy('id', 'desc').first();
      let nextNum = 1;
      if (lastDept && lastDept.dept_id) {
        const match = lastDept.dept_id.match(/DEP-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      dept_id = `DEP-${String(nextNum).padStart(3, '0')}`;
    }

    const [id] = await knex('departments').insert({
      name,
      dept_id,
      company_id,
      status: 'Aktif'
    });
    
    const newDept = await knex('departments').where({ id }).first();
    res.status(201).json(newDept);
  } catch (error) {
    res.status(500).json({ message: 'Error creating department', error: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    await knex('departments').where({ id: req.params.id }).update({ name });
    res.json({ message: 'Department updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating department', error: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const item = await knex('departments').where({ id: req.params.id }).first();
    if (!item) return res.status(404).json({ message: 'Department not found' });

    // Backup to Recycle Bin
    await knex('pa_recycle_bin').insert({
      company_id: req.user ? req.user.company_id : null,
      item_type: 'department',
      item_name: item.name,
      deleted_by: req.user ? req.user.id : null,
      payload: JSON.stringify(item)
    });

    await knex('departments').where({ id: req.params.id }).del();
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting department', error: error.message });
  }
};

// RECYCLE BIN
exports.getRecycleBin = async (req, res) => {
  try {
    const company_id = req.user ? req.user.company_id : null;
    
    const items = await knex('pa_recycle_bin')
      .leftJoin('users', 'pa_recycle_bin.deleted_by', 'users.id')
      .where('pa_recycle_bin.company_id', company_id)
      .orWhereNull('pa_recycle_bin.company_id')
      .select(
        'pa_recycle_bin.*',
        'users.firstName',
        'users.lastName'
      )
      .orderBy('pa_recycle_bin.deleted_at', 'desc');
      
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recycle bin', error: error.message });
  }
};

exports.restoreRecycleItem = async (req, res) => {
  try {
    const item = await knex('pa_recycle_bin').where({ id: req.params.id }).first();
    if (!item) return res.status(404).json({ message: 'Recycle bin item not found' });

    const payload = JSON.parse(item.payload);
    
    if (item.item_type === 'category') {
      await knex('pa_categories').insert(payload);
    } else if (item.item_type === 'location') {
      await knex('pa_locations').insert(payload);
    } else if (item.item_type === 'vendor') {
      await knex('pa_vendors').insert(payload);
    } else if (item.item_type === 'asset') {
      await knex('pa_assets').insert(payload);
    } else if (item.item_type === 'department') {
      await knex('departments').insert(payload);
    } else if (item.item_type === 'condition') {
      await knex('pa_conditions').insert(payload);
    }

    await knex('pa_recycle_bin').where({ id: req.params.id }).del();
    res.json({ message: 'Item restored successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error restoring item', error: error.message });
  }
};

exports.deleteRecycleItemPermanent = async (req, res) => {
  try {
    await knex('pa_recycle_bin').where({ id: req.params.id }).del();
    res.json({ message: 'Item permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error permanently deleting item', error: error.message });
  }
};
