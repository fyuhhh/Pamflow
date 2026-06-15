const pool = require('../config/db');
const { saveBase64Image } = require('../utils/fileHelper');


const assetController = {
  getAllAssets: async (req, res) => {
    try {
      const company_id = req.user.company_id;
      const limit = req.query.limit ? parseInt(req.query.limit) : 1000;
      
      const [rows] = await pool.query(
        `SELECT a.*, 
                u.firstName, u.lastName,
                op.firstName as operatorFirstName, op.lastName as operatorLastName,
                p.nama_mesin as parent_name
         FROM assets a 
         LEFT JOIN users u ON a.user_pendaftar_id = u.id 
         LEFT JOIN users op ON a.last_operated_by = op.id
         LEFT JOIN assets p ON a.parent_id = p.id
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
      const { nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, lampiran, maintenance_hours, parent_id } = req.body;
      const company_id = req.user.company_id;
      const user_id = req.user.id;

      const maintHours = parseInt(maintenance_hours) || 0;
      const remainingSecs = maintHours * 3600;
      const parentId = parent_id ? parseInt(parent_id) : null;

      if (parentId) {
        const [parentRows] = await pool.query('SELECT parent_id FROM assets WHERE id = ? AND company_id = ?', [parentId, company_id]);
        if (parentRows.length > 0 && parentRows[0].parent_id !== null) {
          return res.status(400).json({ message: 'Aset induk tidak boleh berupa aset anak dari unit lain' });
        }
      }

      // Process base64 images to files
      let processedLampiran = null;
      if (Array.isArray(lampiran)) {
        processedLampiran = await Promise.all(lampiran.map(img => saveBase64Image(img, 'assets')));
      }

      const [result] = await pool.query(
        'INSERT INTO assets (company_id, nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, lampiran, maintenance_hours, remaining_seconds, user_pendaftar_id, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [company_id, nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, processedLampiran ? JSON.stringify(processedLampiran) : null, maintHours, remainingSecs, user_id, parentId]
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
      const { nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, lampiran, maintenance_hours, parent_id } = req.body;
      const company_id = req.user.company_id;
      const user_id = req.user.id;

      // Get old data for detailed audit trail
      const [oldRows] = await pool.query('SELECT * FROM assets WHERE id = ? AND company_id = ?', [id, company_id]);
      if (oldRows.length === 0) return res.status(404).json({ message: 'Asset not found' });
      const old = oldRows[0];

      const parentId = parent_id ? parseInt(parent_id) : null;

      if (parentId) {
        if (parseInt(id) === parentId) {
          return res.status(400).json({ message: 'Aset tidak dapat menjadi induk bagi dirinya sendiri' });
        }

        const [childRows] = await pool.query('SELECT id FROM assets WHERE parent_id = ?', [id]);
        if (childRows.length > 0) {
          return res.status(400).json({ message: 'Aset yang sudah menjadi induk tidak dapat memiliki induk lain' });
        }

        const [parentRows] = await pool.query('SELECT parent_id FROM assets WHERE id = ? AND company_id = ?', [parentId, company_id]);
        if (parentRows.length > 0 && parentRows[0].parent_id !== null) {
          return res.status(400).json({ message: 'Aset induk tidak boleh berupa aset anak dari unit lain' });
        }
      }

      // Process base64 images to files
      let processedLampiran = null;
      if (Array.isArray(lampiran)) {
        processedLampiran = await Promise.all(lampiran.map(img => saveBase64Image(img, 'assets')));
      }

      await pool.query(
        'UPDATE assets SET nama_mesin = ?, brand = ?, model_tipe = ?, serial_number = ?, lokasi = ?, prioritas = ?, status = ?, catatan = ?, lampiran = ?, maintenance_hours = ?, remaining_seconds = ?, parent_id = ? WHERE id = ? AND company_id = ?',
        [nama_mesin, brand, model_tipe, serial_number, lokasi, prioritas, status, catatan, processedLampiran ? JSON.stringify(processedLampiran) : null, maintenance_hours || 0, (maintenance_hours || 0) * 3600, parentId, id, company_id]
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
      if (old.parent_id !== parentId) changes.push(`Parent ID: ${old.parent_id || '-'} -> ${parentId || '-'}`);

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
            remaining_seconds: (maintenance_hours || 0) * 3600,
            parent_id: parentId
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
      const { selected_ids } = req.body;
      const company_id = req.user.company_id;
      const user_id = req.user.id;

      const [rows] = await pool.query('SELECT * FROM assets WHERE id = ? AND company_id = ?', [id, company_id]);
      if (rows.length === 0) return res.status(404).json({ message: 'Asset not found' });
      const asset = rows[0];

      // Get user name for response/socket
      const [userRows] = await pool.query('SELECT firstName, lastName FROM users WHERE id = ?', [user_id]);
      const opName = userRows.length > 0 ? `${userRows[0].firstName} ${userRows[0].lastName}` : 'System';

      const { getIO } = require('../services/socketService');
      const io = getIO();

      // Selective Bulk Toggle Mode
      if (Array.isArray(selected_ids)) {
        const now = new Date();
        const targetRunning = asset.is_running ? 0 : 1;

        for (const targetId of selected_ids) {
          const [astRows] = await pool.query('SELECT * FROM assets WHERE id = ? AND company_id = ?', [targetId, company_id]);
          if (astRows.length === 0) continue;
          const ast = astRows[0];

          if (ast.is_running !== targetRunning) {
            let newRemaining = ast.remaining_seconds;
            let lastStarted = null;
            let actionDetails = '';

            if (ast.is_running) {
              const start = new Date(ast.last_started_at);
              const elapsed = Math.floor((now - start) / 1000);
              newRemaining = Math.max(0, ast.remaining_seconds - elapsed);
              actionDetails = `Status: ON -> OFF (Selektif) | Sisa waktu: ${Math.floor(newRemaining / 3600)}j ${Math.floor((newRemaining % 3600) / 60)}m ${newRemaining % 60}d`;
              
              await pool.query(
                'UPDATE assets SET is_running = 0, last_started_at = NULL, remaining_seconds = ?, last_operated_by = ? WHERE id = ?',
                [newRemaining, user_id, targetId]
              );
            } else {
              lastStarted = now;
              actionDetails = `Status: OFF -> ON (Selektif) | Memulai dari: ${Math.floor(newRemaining / 3600)}j ${Math.floor((newRemaining % 3600) / 60)}m ${newRemaining % 60}d`;
              
              await pool.query(
                'UPDATE assets SET is_running = 1, last_started_at = ?, remaining_seconds = ?, last_operated_by = ? WHERE id = ?',
                [lastStarted, newRemaining, user_id, targetId]
              );
            }

            await pool.query(
              'INSERT INTO asset_audit_logs (asset_id, action, user_id, details) VALUES (?, ?, ?, ?)',
              [targetId, 'STATUS_CHANGE', user_id, actionDetails]
            );

            try {
              if (io) {
                io.emit('asset-status-updated', { 
                  id: parseInt(targetId), 
                  is_running: targetRunning, 
                  last_started_at: lastStarted, 
                  remaining_seconds: newRemaining,
                  operatorName: opName
                });
              }
            } catch (e) {
              console.error('Socket emit error:', e);
            }
          }
        }

        return res.json({ message: 'Selected assets status updated successfully' });
      }

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

      // Log status change
      await pool.query(
        'INSERT INTO asset_audit_logs (asset_id, action, user_id, details) VALUES (?, ?, ?, ?)',
        [id, 'STATUS_CHANGE', user_id, actionDetails]
      );

      // Emit socket event for real-time update
      try {
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

      // Cascading logic: propagate the status to all children assets
      const [children] = await pool.query('SELECT * FROM assets WHERE parent_id = ?', [id]);
      if (children.length > 0) {
        const now = new Date();
        for (const child of children) {
          let childNewRemaining = child.remaining_seconds;
          let childLastStarted = null;
          let childActionDetails = '';

          if (newStatus === 1) {
            // If parent is turned ON, turn children ON if they aren't already running
            if (!child.is_running) {
              childLastStarted = now;
              childActionDetails = `Status otomatis ON (Parent ${asset.nama_mesin} dinyalakan) | Memulai dari: ${Math.floor(childNewRemaining / 3600)}j ${Math.floor((childNewRemaining % 3600) / 60)}m ${childNewRemaining % 60}d`;
              
              await pool.query(
                'UPDATE assets SET is_running = ?, last_started_at = ?, remaining_seconds = ?, last_operated_by = ? WHERE id = ?',
                [1, childLastStarted, childNewRemaining, user_id, child.id]
              );
              
              await pool.query(
                'INSERT INTO asset_audit_logs (asset_id, action, user_id, details) VALUES (?, ?, ?, ?)',
                [child.id, 'STATUS_CHANGE', user_id, childActionDetails]
              );

              try {
                if (io) {
                  io.emit('asset-status-updated', { 
                    id: parseInt(child.id), 
                    is_running: 1, 
                    last_started_at: childLastStarted, 
                    remaining_seconds: childNewRemaining,
                    operatorName: opName
                  });
                }
              } catch (e) {
                console.error('Child socket emit error:', e);
              }
            }
          } else {
            // If parent is turned OFF, turn children OFF if they are running
            if (child.is_running) {
              const childStart = new Date(child.last_started_at);
              const elapsed = Math.floor((now - childStart) / 1000);
              childNewRemaining = Math.max(0, child.remaining_seconds - elapsed);
              childActionDetails = `Status otomatis OFF (Parent ${asset.nama_mesin} dimatikan) | Sisa waktu: ${Math.floor(childNewRemaining / 3600)}j ${Math.floor((childNewRemaining % 3600) / 60)}m ${childNewRemaining % 60}d`;
              
              await pool.query(
                'UPDATE assets SET is_running = ?, last_started_at = NULL, remaining_seconds = ?, last_operated_by = ? WHERE id = ?',
                [0, childNewRemaining, user_id, child.id]
              );
              
              await pool.query(
                'INSERT INTO asset_audit_logs (asset_id, action, user_id, details) VALUES (?, ?, ?, ?)',
                [child.id, 'STATUS_CHANGE', user_id, childActionDetails]
              );

              try {
                if (io) {
                  io.emit('asset-status-updated', { 
                    id: parseInt(child.id), 
                    is_running: 0, 
                    last_started_at: null, 
                    remaining_seconds: childNewRemaining,
                    operatorName: opName
                  });
                }
              } catch (e) {
                console.error('Child socket emit error:', e);
              }
            }
          }
        }
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

      // Process base64 images to files
      let processedPhotos = null;
      if (Array.isArray(photos)) {
        processedPhotos = await Promise.all(photos.map(img => saveBase64Image(img, 'logs')));
      }

      await pool.query(
        'INSERT INTO asset_audit_logs (asset_id, action, user_id, details, photos) VALUES (?, ?, ?, ?, ?)',
        [id, 'NOTE', user_id, note || '', processedPhotos ? JSON.stringify(processedPhotos) : null]
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

      // Process base64 images to files
      let processedPhotos = null;
      if (Array.isArray(photos)) {
        processedPhotos = await Promise.all(photos.map(img => saveBase64Image(img, 'logs')));
      }

      await pool.query(
        'INSERT INTO asset_maintenance_logs (asset_id, user_id, reason, responsible_person, actions_taken, photos, old_remaining_seconds, new_remaining_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, user_id, reason, responsible_person, actions_taken, processedPhotos ? JSON.stringify(processedPhotos) : null, oldRemaining, newRemaining]
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
  },

  getAssetAnalytics: async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Get Maintenance Trend (monthly) for the last 12 months
      const [trendRows] = await pool.query(
        `SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as count
         FROM asset_maintenance_logs
         WHERE asset_id = ?
         GROUP BY month
         ORDER BY month ASC
         LIMIT 12`,
        [id]
      );

      // 2. Get Asset Life Cycle Info
      const [assetRows] = await pool.query(
        'SELECT id, nama_mesin, maintenance_hours, remaining_seconds, created_at, status FROM assets WHERE id = ?',
        [id]
      );

      if (assetRows.length === 0) return res.status(404).json({ message: 'Asset not found' });

      res.json({
        trend: trendRows,
        asset: assetRows[0]
      });
    } catch (error) {
      console.error('Get asset analytics error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = assetController;
