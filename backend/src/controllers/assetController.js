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
      const limit = req.query.limit ? parseInt(req.query.limit) : 1000;
      
      const [rows] = await pool.query(
        `SELECT a.*, 
                u.firstName, u.lastName,
                op.firstName as operatorFirstName, op.lastName as operatorLastName
         FROM assets a 
         LEFT JOIN users u ON a.user_pendaftar_id = u.id 
         LEFT JOIN users op ON a.last_operated_by = op.id
         WHERE (a.company_id = ? OR (? IS NULL AND a.company_id IS NULL)) 
         ORDER BY a.nama_mesin ASC LIMIT ?`,
        [company_id, company_id, limit]
      );
      res.json(rows);
    } catch (error) {
      console.error('Get assets error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  createAsset: async (req, res) => {
    try {
      const { nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, lampiran, maintenance_hours } = req.body;
      const company_id = req.user.company_id;
      const user_id = req.user.id;

      const maintHours = parseInt(maintenance_hours) || 0;
      const remainingSecs = maintHours * 3600;

      const [result] = await pool.query(
        'INSERT INTO assets (company_id, nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, lampiran, maintenance_hours, remaining_seconds, user_pendaftar_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [company_id, nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, lampiran ? JSON.stringify(lampiran) : null, maintHours, remainingSecs, user_id]
      );

      // Log the creation
      await pool.query(
        'INSERT INTO asset_audit_logs (asset_id, action, user_id, details) VALUES (?, ?, ?, ?)',
        [result.insertId, 'CREATE', user_id, `Asset registered: ${nama_mesin} (${brand})`]
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

  getLocations: async (req, res) => {
    try {
      const company_id = req.user.company_id;
      const [rows] = await pool.query(
        'SELECT * FROM asset_locations WHERE company_id IS NULL OR company_id = ? ORDER BY label ASC',
        [company_id]
      );
      res.json(rows);
    } catch (error) {
      console.error('Get locations error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  createLocation: async (req, res) => {
    try {
      const { label } = req.body;
      const company_id = req.user.company_id;

      if (!label) return res.status(400).json({ message: 'Label is required' });

      const [existing] = await pool.query(
        'SELECT * FROM asset_locations WHERE label = ? AND (company_id IS NULL OR company_id = ?)',
        [label, company_id]
      );

      if (existing.length > 0) {
        return res.json({ id: existing[0].id, message: 'Location already exists' });
      }

      const [result] = await pool.query(
        'INSERT INTO asset_locations (company_id, label) VALUES (?, ?)',
        [company_id, label]
      );

      res.status(201).json({ id: result.insertId, label, message: 'Location created successfully' });
    } catch (error) {
      console.error('Create location error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateAsset: async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, lampiran, maintenance_hours } = req.body;
      const company_id = req.user.company_id;
      const user_id = req.user.id;

      // Get old data for detailed audit trail
      const [oldRows] = await pool.query('SELECT * FROM assets WHERE id = ? AND company_id = ?', [id, company_id]);
      if (oldRows.length === 0) return res.status(404).json({ message: 'Asset not found' });
      const old = oldRows[0];

      await pool.query(
        'UPDATE assets SET nama_mesin = ?, brand = ?, model_tipe = ?, serial_number = ?, lokasi = ?, prioritas = ?, status = ?, catatan = ?, lampiran = ?, maintenance_hours = ?, remaining_seconds = ? WHERE id = ? AND company_id = ?',
        [nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, lampiran ? JSON.stringify(lampiran) : null, maintenance_hours || 0, (maintenance_hours || 0) * 3600, id, company_id]
      );

      // Track what changed
      let changes = [];
      if (old.nama_mesin !== nama_mesin) changes.push(`Nama: ${old.nama_mesin} -> ${nama_mesin}`);
      if (old.brand !== brand) changes.push(`Brand: ${old.brand || '-'} -> ${brand || '-'}`);
      if (old.model_tipe !== model_tipe) changes.push(`Tipe: ${old.model_tipe || '-'} -> ${model_tipe || '-'}`);
      if (old.serial_number !== serial_number) changes.push(`SN: ${old.serial_number || '-'} -> ${serial_number || '-'}`);
      if (old.lokasi !== lokasi) changes.push(`Lokasi: ${old.lokasi || '-'} -> ${lokasi || '-'}`);
      if (old.prioritas !== prioritas) changes.push(`Prio: ${old.prioritas} -> ${prioritas}`);
      if (old.status !== status) changes.push(`Status: ${old.status} -> ${status}`);
      if (old.maintenance_hours !== (maintenance_hours || 0)) changes.push(`Maint: ${old.maintenance_hours} -> ${maintenance_hours} jam`);
      if (old.catatan !== catatan) changes.push(`Catatan diperbarui`);

      const details = changes.length > 0 ? `Update: ${changes.join(' | ')}` : `Update: Data teknis diperbarui`;

      await pool.query(
        'INSERT INTO asset_audit_logs (asset_id, action, user_id, details) VALUES (?, ?, ?, ?)',
        [id, 'UPDATE', user_id, details]
      );

      // Emit socket event for real-time update
      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        if (io) {
          io.emit('asset-status-updated', { 
            id: parseInt(id), 
            nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, 
            maintenance_hours: maintenance_hours || 0,
            remaining_seconds: (maintenance_hours || 0) * 3600
          });
        }
      } catch (e) {
        console.error('Socket emit error:', e);
      }

      res.json({ message: 'Asset updated successfully' });
    } catch (error) {
      console.error('Update asset error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAssetAuditLogs: async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(
        'SELECT l.*, u.firstName, u.lastName FROM asset_audit_logs l LEFT JOIN users u ON l.user_id = u.id WHERE l.asset_id = ? ORDER BY l.created_at DESC',
        [id]
      );
      res.json(rows);
    } catch (error) {
      console.error('Get asset audit logs error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteAsset: async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user.company_id;
      const user_id = req.user.id;

      await pool.query('DELETE FROM assets WHERE id = ? AND company_id = ?', [id, company_id]);
      
      // Log deletion
      await pool.query(
        'INSERT INTO asset_audit_logs (asset_id, action, user_id, details) VALUES (?, ?, ?, ?)',
        [id, 'DELETE', user_id, `Asset deleted (ID: ${id})`]
      );

      res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Delete asset error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  toggleAssetStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user.company_id;
      const user_id = req.user.id;

      const [rows] = await pool.query('SELECT * FROM assets WHERE id = ? AND company_id = ?', [id, company_id]);
      if (rows.length === 0) return res.status(404).json({ message: 'Asset not found' });
      const asset = rows[0];

      let newStatus = asset.is_running ? 0 : 1;
      let newRemaining = asset.remaining_seconds;
      let lastStarted = null;
      let actionDetails = '';

      if (asset.is_running) {
        // Turning OFF: Calculate elapsed time
        const start = new Date(asset.last_started_at);
        const now = new Date();
        const elapsed = Math.floor((now - start) / 1000);
        newRemaining = Math.max(0, asset.remaining_seconds - elapsed);
        actionDetails = `Status: ON -> OFF | Sisa waktu: ${Math.floor(newRemaining / 3600)}j ${Math.floor((newRemaining % 3600) / 60)}m ${newRemaining % 60}d`;
      } else {
        // Turning ON
        lastStarted = new Date();
        actionDetails = `Status: OFF -> ON | Memulai dari: ${Math.floor(newRemaining / 3600)}j ${Math.floor((newRemaining % 3600) / 60)}m ${newRemaining % 60}d`;
      }

      await pool.query(
        'UPDATE assets SET is_running = ?, last_started_at = ?, remaining_seconds = ?, last_operated_by = ? WHERE id = ?',
        [newStatus, lastStarted, newRemaining, user_id, id]
      );

      // Get user name for response/socket
      const [userRows] = await pool.query('SELECT firstName, lastName FROM users WHERE id = ?', [user_id]);
      const opName = userRows.length > 0 ? `${userRows[0].firstName} ${userRows[0].lastName}` : 'System';

      // Log status change
      await pool.query(
        'INSERT INTO asset_audit_logs (asset_id, action, user_id, details) VALUES (?, ?, ?, ?)',
        [id, 'STATUS_CHANGE', user_id, actionDetails]
      );

      // Emit socket event for real-time update
      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        if (io) {
          io.emit('asset-status-updated', { 
            id: parseInt(id), 
            is_running: newStatus, 
            last_started_at: lastStarted, 
            remaining_seconds: newRemaining,
            operatorName: opName
          });
        }
      } catch (e) {
        console.error('Socket emit error:', e);
      }

      res.json({ 
        id: parseInt(id), 
        is_running: newStatus, 
        last_started_at: lastStarted, 
        remaining_seconds: newRemaining,
        operatorName: opName
      });
    } catch (error) {
      console.error('Toggle asset status error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  addAssetNote: async (req, res) => {
    try {
      const { id } = req.params;
      const { note, photos } = req.body;
      const user_id = req.user.id;

      if (!note && (!photos || photos.length === 0)) {
        return res.status(400).json({ message: 'Note or photos are required' });
      }

      await pool.query(
        'INSERT INTO asset_audit_logs (asset_id, action, user_id, details, photos) VALUES (?, ?, ?, ?, ?)',
        [id, 'NOTE', user_id, note || '', photos ? JSON.stringify(photos) : null]
      );

      // Update the main asset's catatan as well (latest note)
      await pool.query('UPDATE assets SET catatan = ? WHERE id = ?', [note, id]);

      res.status(201).json({ message: 'Note added successfully' });
    } catch (error) {
      console.error('Add asset note error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  submitMaintenance: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, responsible_person, actions_taken, photos, new_maintenance_hours } = req.body;
      const user_id = req.user.id;

      const [assets] = await pool.query('SELECT * FROM assets WHERE id = ?', [id]);
      if (assets.length === 0) return res.status(404).json({ message: 'Asset not found' });
      const asset = assets[0];

      const oldRemaining = asset.remaining_seconds;
      const newRemaining = parseInt(new_maintenance_hours) * 3600;

      await pool.query(
        'INSERT INTO asset_maintenance_logs (asset_id, user_id, reason, responsible_person, actions_taken, photos, old_remaining_seconds, new_remaining_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, user_id, reason, responsible_person, actions_taken, photos ? JSON.stringify(photos) : null, oldRemaining, newRemaining]
      );

      await pool.query(
        'UPDATE assets SET remaining_seconds = ?, maintenance_hours = ?, is_running = 0, last_started_at = NULL WHERE id = ?',
        [newRemaining, new_maintenance_hours, id]
      );

      await pool.query(
        'INSERT INTO asset_audit_logs (asset_id, action, user_id, details) VALUES (?, ?, ?, ?)',
        [id, 'MAINTENANCE', user_id, `Maintenance completed by ${responsible_person}. New interval: ${new_maintenance_hours}h`]
      );

      res.json({ 
        message: 'Maintenance submitted successfully',
        remaining_seconds: newRemaining,
        maintenance_hours: new_maintenance_hours,
        is_running: 0
      });
    } catch (error) {
      console.error('Submit maintenance error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getMaintenanceLogs: async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(
        `SELECT ml.*, u.firstName, u.lastName 
         FROM asset_maintenance_logs ml
         JOIN users u ON ml.user_id = u.id
         WHERE ml.asset_id = ?
         ORDER BY ml.created_at DESC`,
        [id]
      );
      res.json(rows);
    } catch (error) {
      console.error('Get maintenance logs error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = assetController;
