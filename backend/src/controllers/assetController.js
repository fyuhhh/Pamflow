const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clone_optera'
};

const pool = mysql.createPool(dbConfig);

const assetController = {
  getAllAssets: async (req, res) => {
    try {
      const company_id = req.user.company_id;
      const [rows] = await pool.query(
        'SELECT a.*, u.firstName, u.lastName FROM assets a LEFT JOIN users u ON a.user_pendaftar_id = u.id WHERE (a.company_id = ? OR (? IS NULL AND a.company_id IS NULL)) ORDER BY a.created_at DESC',
        [company_id, company_id]
      );
      res.json(rows);
    } catch (error) {
      console.error('Get assets error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  createAsset: async (req, res) => {
    try {
      const { nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan } = req.body;
      const company_id = req.user.company_id;
      const user_id = req.user.id;

      const [result] = await pool.query(
        'INSERT INTO assets (company_id, nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, user_pendaftar_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [company_id, nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, user_id]
      );

      res.status(201).json({ id: result.insertId, message: 'Asset registered successfully' });
    } catch (error) {
      console.error('Create asset error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getPriorities: async (req, res) => {
    try {
      const company_id = req.user.company_id;
      const [rows] = await pool.query(
        'SELECT * FROM asset_priorities WHERE company_id IS NULL OR company_id = ? ORDER BY id ASC',
        [company_id]
      );
      res.json(rows);
    } catch (error) {
      console.error('Get priorities error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  createPriority: async (req, res) => {
    try {
      const { label } = req.body;
      const company_id = req.user.company_id;

      if (!label) return res.status(400).json({ message: 'Label is required' });

      const [existing] = await pool.query(
        'SELECT * FROM asset_priorities WHERE label = ? AND (company_id IS NULL OR company_id = ?)',
        [label, company_id]
      );

      if (existing.length > 0) {
        return res.json({ id: existing[0].id, message: 'Priority already exists' });
      }

      const [result] = await pool.query(
        'INSERT INTO asset_priorities (company_id, label) VALUES (?, ?)',
        [company_id, label]
      );

      res.status(201).json({ id: result.insertId, label, message: 'Priority created successfully' });
    } catch (error) {
      console.error('Create priority error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getStatuses: async (req, res) => {
    try {
      const company_id = req.user.company_id;
      const [rows] = await pool.query(
        'SELECT * FROM asset_statuses WHERE company_id IS NULL OR company_id = ? ORDER BY id ASC',
        [company_id]
      );
      res.json(rows);
    } catch (error) {
      console.error('Get statuses error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  createStatus: async (req, res) => {
    try {
      const { label } = req.body;
      const company_id = req.user.company_id;

      if (!label) return res.status(400).json({ message: 'Label is required' });

      const [existing] = await pool.query(
        'SELECT * FROM asset_statuses WHERE label = ? AND (company_id IS NULL OR company_id = ?)',
        [label, company_id]
      );

      if (existing.length > 0) {
        return res.json({ id: existing[0].id, message: 'Status already exists' });
      }

      const [result] = await pool.query(
        'INSERT INTO asset_statuses (company_id, label) VALUES (?, ?)',
        [company_id, label]
      );

      res.status(201).json({ id: result.insertId, label, message: 'Status created successfully' });
    } catch (error) {
      console.error('Create status error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteAsset: async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user.company_id;

      await pool.query('DELETE FROM assets WHERE id = ? AND company_id = ?', [id, company_id]);
      res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Delete asset error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = assetController;
