const knex = require('../config/knex');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

exports.getAssets = async (req, res) => {
  try {
    const { is_master } = req.query;
    let query = knex('pa_assets')
      .leftJoin('pa_categories', 'pa_assets.category_id', 'pa_categories.id')
      .leftJoin('pa_locations', 'pa_assets.location_id', 'pa_locations.id')
      .leftJoin('pa_vendors', 'pa_assets.vendor_id', 'pa_vendors.id')
      .leftJoin('pa_departments', 'pa_assets.department_id', 'pa_departments.id')
      .leftJoin('pa_conditions', 'pa_assets.condition_id', 'pa_conditions.id');

    if (is_master !== undefined) {
      query = query.where('pa_assets.is_master', is_master === 'true' || is_master === '1' ? 1 : 0);
    }

    const assets = await query.select(
      'pa_assets.*',
      'pa_categories.category_name',
      'pa_locations.location_name',
      'pa_vendors.vendor_name',
      'pa_departments.name as department_name',
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
      .leftJoin('pa_departments', 'pa_assets.department_id', 'pa_departments.id')
      .leftJoin('pa_conditions', 'pa_assets.condition_id', 'pa_conditions.id')
      .where('pa_assets.id', req.params.id)
      .select(
        'pa_assets.*',
        'pa_categories.category_name',
        'pa_locations.location_name',
        'pa_vendors.vendor_name',
        'pa_departments.name as department_name',
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
      const lastAsset = await knex('pa_assets').orderBy('id', 'desc').first();
      const nextId = lastAsset ? lastAsset.id + 1 : 1;
      asset_id = `AST-${String(nextId).padStart(5, '0')}`;
      req.body.asset_id = asset_id;
    }

    const [id] = await knex('pa_assets').insert(req.body);
    const newAsset = await knex('pa_assets').where({ id }).first();
    res.status(201).json(newAsset);
  } catch (error) {
    console.error("CREATE ASSET ERROR:", error);
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

exports.downloadExcel = async (req, res) => {
  try {
    const { startDate, endDate, searchTerm } = req.query;
    const templatePath = path.resolve('d:\\Cloning OPTERA\\Template Import Data Asset- 2025.xlsx');
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ message: 'Template file not found' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    // If no filters are provided, we serve the original template file directly so it is 100% bit-for-bit identical!
    if (!startDate && !endDate && !searchTerm) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Template Import Data Asset- 2025.xlsx"');
      return res.sendFile(templatePath);
    }

    // Otherwise, query database for assets with active filters
    let query = knex('pa_assets')
      .leftJoin('pa_categories', 'pa_assets.category_id', 'pa_categories.id')
      .leftJoin('pa_locations', 'pa_assets.location_id', 'pa_locations.id')
      .leftJoin('pa_vendors', 'pa_assets.vendor_id', 'pa_vendors.id')
      .leftJoin('pa_departments', 'pa_assets.department_id', 'pa_departments.id')
      .leftJoin('pa_conditions', 'pa_assets.condition_id', 'pa_conditions.id')
      .where('pa_assets.is_master', 0)
      .select(
        'pa_assets.*',
        'pa_categories.category_code',
        'pa_categories.category_name',
        'pa_locations.location_name',
        'pa_vendors.vendor_name',
        'pa_departments.name as department_name',
        'pa_conditions.condition_name'
      );

    if (startDate) {
      query = query.where('pa_assets.acquisition_date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('pa_assets.acquisition_date', '<=', endDate);
    }
    if (searchTerm) {
      const term = `%${searchTerm}%`;
      query = query.where(builder => {
        builder.where('pa_assets.asset_id', 'like', term)
          .orWhere('pa_assets.asset_name', 'like', term)
          .orWhere('pa_assets.brand', 'like', term)
          .orWhere('pa_assets.model_tipe', 'like', term)
          .orWhere('pa_assets.serial_number', 'like', term)
          .orWhere('pa_assets.register_no', 'like', term)
          .orWhere('pa_categories.category_name', 'like', term)
          .orWhere('pa_locations.location_name', 'like', term)
          .orWhere('pa_departments.name', 'like', term);
      });
    }

    const assets = await query.orderBy('pa_assets.asset_name', 'asc');

    const worksheet = workbook.getWorksheet('Import Data Asset List');
    
    // Capture template Row 2 styling exactly
    const templateRow = worksheet.getRow(2);
    const cellStyles = [];
    for (let c = 1; c <= 15; c++) {
      const cell = templateRow.getCell(c);
      cellStyles.push({
        font: cell.font,
        fill: cell.fill,
        alignment: cell.alignment,
        border: cell.border,
        numFmt: cell.numFmt
      });
    }

    // Clear original sample rows
    const originalRowCount = worksheet.rowCount;
    if (originalRowCount >= 2) {
      worksheet.spliceRows(2, originalRowCount - 1);
    }

    // Populate with filtered database entries
    assets.forEach((asset, idx) => {
      let dateStr = '';
      if (asset.acquisition_date) {
        const d = new Date(asset.acquisition_date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }

      const newRow = worksheet.addRow([
        idx + 1,
        asset.category_code || '',
        asset.category_name || '',
        asset.group_of_assets || 'Kelompok 1',
        asset.depreciation_formula || 'Straight-Line',
        asset.asset_name,
        asset.asset_id,
        asset.register_no || '',
        dateStr,
        asset.acquisition_cost ? Number(asset.acquisition_cost) : '',
        asset.vendor_name || '',
        asset.specification || '',
        asset.location_name || '',
        asset.department_name || '',
        asset.asset_user || ''
      ]);

      // Apply original styles from the template cell-by-cell!
      for (let c = 1; c <= 15; c++) {
        const cell = newRow.getCell(c);
        const style = cellStyles[c - 1];
        if (style) {
          if (style.font) cell.font = style.font;
          if (style.fill) cell.fill = style.fill;
          if (style.alignment) cell.alignment = style.alignment;
          if (style.border) cell.border = style.border;
          if (style.numFmt) cell.numFmt = style.numFmt;
        }
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Export_Data_Asset.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'Error generating excel', error: error.message });
  }
};
