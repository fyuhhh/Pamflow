const db = require('../config/db');
const crypto = require('crypto');

// 1. GET ALL METERS
exports.getMeters = async (req, res) => {
  try {
    const { utility_type } = req.query;
    let query = 'SELECT m.*, l.location_name FROM pa_utility_meters m LEFT JOIN pa_locations l ON m.location_id = l.id';
    const params = [];

    if (utility_type) {
      query += ' WHERE m.utility_type = ?';
      params.push(utility_type);
    }

    query += ' ORDER BY m.id DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('getMeters error:', err);
    res.status(500).json({ message: 'Gagal mengambil data meteran.' });
  }
};

// 2. CREATE NEW METER
exports.createMeter = async (req, res) => {
  try {
    const { tenant_name, utility_type, location_id, floor, area, power_capacity, meter_brand, meter_type, meter_number, initial_reading, billing_start_month } = req.body;
    
    if (!tenant_name || !utility_type || !meter_number) {
      return res.status(400).json({ message: 'Nama tenant, tipe utilitas, dan nomor meter wajib diisi.' });
    }

    // Insert meter
    const [result] = await db.query(
      `INSERT INTO pa_utility_meters 
      (tenant_name, utility_type, location_id, floor, area, power_capacity, meter_brand, meter_type, meter_number, billing_start_month, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [tenant_name, utility_type, location_id || null, floor || null, area || null, power_capacity || null, meter_brand || null, meter_type || null, meter_number, billing_start_month || null]
    );
    const meterId = result.insertId;

    // Optional: If an initial reading is provided, insert a base Approved reading
    const startReading = parseFloat(initial_reading) || 0.00;
    const token = crypto.randomBytes(16).toString('hex');
    await db.query(
      `INSERT INTO pa_utility_readings 
      (meter_id, reading_date, previous_reading, current_reading, usage_amount, status, approval_token, approved_at, created_at, updated_at) 
      VALUES (?, CURDATE(), ?, ?, 0.00, 'Approved', ?, NOW(), NOW(), NOW())`,
      [meterId, startReading, startReading, token]
    );

    res.status(201).json({ message: 'Meteran berhasil didaftarkan.', id: meterId });
  } catch (err) {
    console.error('createMeter error:', err);
    res.status(500).json({ message: 'Gagal membuat meteran baru.' });
  }
};

// 3. UPDATE METER
exports.updateMeter = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_name, location_id, floor, area, power_capacity, meter_brand, meter_type, meter_number, billing_start_month } = req.body;

    await db.query(
      `UPDATE pa_utility_meters 
      SET tenant_name = ?, location_id = ?, floor = ?, area = ?, power_capacity = ?, meter_brand = ?, meter_type = ?, meter_number = ?, billing_start_month = ?, updated_at = NOW() 
      WHERE id = ?`,
      [tenant_name, location_id || null, floor || null, area || null, power_capacity || null, meter_brand || null, meter_type || null, meter_number, billing_start_month || null, id]
    );

    res.json({ message: 'Data meteran berhasil diperbarui.' });
  } catch (err) {
    console.error('updateMeter error:', err);
    res.status(500).json({ message: 'Gagal memperbarui data meteran.' });
  }
};

// 4. DELETE METER
exports.deleteMeter = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM pa_utility_meters WHERE id = ?', [id]);
    res.json({ message: 'Meteran berhasil dihapus.' });
  } catch (err) {
    console.error('deleteMeter error:', err);
    res.status(500).json({ message: 'Gagal menghapus meteran.' });
  }
};

// 5. GET LATEST APPROVED READING OF A METER (For Stand Awal)
exports.getLatestApprovedReading = async (req, res) => {
  try {
    const { meter_id } = req.params;
    const [rows] = await db.query(
      `SELECT current_reading, reading_date, period_end FROM pa_utility_readings 
       WHERE meter_id = ? AND status = 'Approved' 
       ORDER BY reading_date DESC, id DESC LIMIT 1`,
      [meter_id]
    );

    const latest = rows[0] ? parseFloat(rows[0].current_reading) : 0.00;
    const lastDate = rows[0] ? (rows[0].period_end || rows[0].reading_date) : null;
    
    let formattedDate = null;
    if (lastDate) {
      const d = new Date(lastDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().slice(0, 10);
      }
    }

    res.json({ 
      latest_approved_reading: latest,
      latest_reading_date: formattedDate
    });
  } catch (err) {
    console.error('getLatestApprovedReading error:', err);
    res.status(500).json({ message: 'Gagal mengambil data pembacaan terakhir.' });
  }
};

// 6. CREATE PENDING READING (Engineering Input via Mobile)
exports.createReading = async (req, res) => {
  try {
    const { meter_id, current_reading, reading_date, notes, meter_photo, period_start, period_end } = req.body;
    const agentId = req.user ? req.user.id : null;

    if (!meter_id || current_reading === undefined) {
      return res.status(400).json({ message: 'Meter ID dan angka Stand Akhir wajib diisi.' });
    }

    // A. Query latest Approved reading for Stand Awal
    const [rows] = await db.query(
      `SELECT current_reading FROM pa_utility_readings 
       WHERE meter_id = ? AND status = 'Approved' 
       ORDER BY reading_date DESC, id DESC LIMIT 1`,
      [meter_id]
    );
    const previousReading = rows[0] ? parseFloat(rows[0].current_reading) : 0.00;
    const currentVal = parseFloat(current_reading);
    const usage = Math.max(0.00, currentVal - previousReading);

    // B. Generate secure approval token
    const token = crypto.randomBytes(16).toString('hex');

    // C. Insert reading as Pending
    const [result] = await db.query(
      `INSERT INTO pa_utility_readings 
      (meter_id, reading_date, previous_reading, current_reading, usage_amount, agent_id, status, approval_token, notes, meter_photo, period_start, period_end, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        meter_id, 
        reading_date || new Date().toISOString().slice(0, 10), 
        previousReading, 
        currentVal, 
        usage, 
        agentId, 
        token, 
        notes || null, 
        meter_photo || null,
        period_start || null,
        period_end || null
      ]
    );

    res.status(201).json({
      message: 'Pembacaan berhasil direkam. Berstatus Gantung/Pending.',
      id: result.insertId,
      approval_token: token
    });
  } catch (err) {
    console.error('createReading error:', err);
    res.status(500).json({ message: 'Gagal merekam data pembacaan.' });
  }
};

// 7. GET ALL READINGS
exports.getReadings = async (req, res) => {
  try {
    const { utility_type, status, meter_id } = req.query;
    let query = `
      SELECT r.*, m.tenant_name, m.meter_number, m.utility_type, m.floor, m.area, m.power_capacity,
             CONCAT(u.firstName, ' ', u.lastName) as agent_name 
      FROM pa_utility_readings r
      JOIN pa_utility_meters m ON r.meter_id = m.id
      LEFT JOIN users u ON r.agent_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (utility_type) {
      query += ' AND m.utility_type = ?';
      params.push(utility_type);
    }
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    if (meter_id) {
      query += ' AND r.meter_id = ?';
      params.push(meter_id);
    }

    query += ' ORDER BY r.reading_date DESC, r.id DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('getReadings error:', err);
    res.status(500).json({ message: 'Gagal mengambil riwayat pembacaan.' });
  }
};

// 8. GET READING DETAILS BY TOKEN (Public Endpoint - No Login Required)
exports.getReadingByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const tokens = token.split(',');

    const [rows] = await db.query(
      `SELECT r.*, m.tenant_name, m.meter_number, m.utility_type, m.floor, m.area, m.power_capacity, m.meter_brand, m.meter_type
       FROM pa_utility_readings r
       JOIN pa_utility_meters m ON r.meter_id = m.id
       WHERE r.approval_token IN (?)`,
      [tokens]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Data pembacaan tidak ditemukan atau token tidak valid.' });
    }

    // Group info under parent tenant
    const firstReading = rows[0];
    const parentTenantName = firstReading.tenant_name.split(' - ')[0];

    // Check overall status: if all approved -> Approved, if any rejected -> Rejected, else Pending
    let overallStatus = 'Pending';
    if (rows.every(r => r.status === 'Approved')) {
      overallStatus = 'Approved';
    } else if (rows.some(r => r.status === 'Rejected')) {
      overallStatus = 'Rejected';
    }

    res.json({
      is_group: true,
      tenant_name: parentTenantName,
      status: overallStatus,
      tenant_approver_name: firstReading.tenant_approver_name,
      tenant_approval_photo: firstReading.tenant_approval_photo,
      approved_at: firstReading.approved_at,
      readings: rows.map(r => ({
        id: r.id,
        meter_id: r.meter_id,
        meter_number: r.meter_number,
        floor: r.floor,
        area: r.area,
        power_capacity: r.power_capacity,
        meter_brand: r.meter_brand,
        meter_type: r.meter_type,
        previous_reading: parseFloat(r.previous_reading),
        current_reading: parseFloat(r.current_reading),
        usage_amount: parseFloat(r.usage_amount),
        reading_date: r.reading_date,
        notes: r.notes,
        meter_photo: r.meter_photo,
        created_at: r.created_at,
        section: r.tenant_name.split(' - ')[1] || 'Umum'
      }))
    });
  } catch (err) {
    console.error('getReadingByToken error:', err);
    res.status(500).json({ message: 'Gagal mengambil rincian pembacaan.' });
  }
};

// 9. PUBLIC APPROVAL/REJECTION (No Login Required)
exports.submitApprovalDecision = async (req, res) => {
  try {
    const { token } = req.params;
    const tokens = token.split(',');
    const { action, notes, tenant_approver_name, tenant_approval_photo } = req.body; // action: 'Approve' or 'Reject'

    if (!action || !['Approve', 'Reject'].includes(action)) {
      return res.status(400).json({ message: 'Aksi persetujuan wajib diisi (Approve/Reject).' });
    }

    if (action === 'Approve') {
      if (!tenant_approver_name || !tenant_approval_photo) {
         return res.status(400).json({ message: 'Nama dan foto penyetuju wajib diisi untuk persetujuan.' });
      }
    }

    const newStatus = action === 'Approve' ? 'Approved' : 'Rejected';

    const [rows] = await db.query('SELECT id, status FROM pa_utility_readings WHERE approval_token IN (?)', [tokens]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Data pembacaan tidak ditemukan.' });
    }

    const pendingIds = rows.filter(r => r.status === 'Pending').map(r => r.id);
    if (pendingIds.length === 0) {
      return res.status(400).json({ message: 'Semua pencatatan dalam grup ini sudah diproses sebelumnya.' });
    }

    await db.query(
      `UPDATE pa_utility_readings 
       SET status = ?, approved_at = NOW(), notes = ?, updated_at = NOW(), tenant_approver_name = ?, tenant_approval_photo = ?
       WHERE id IN (?)`,
      [newStatus, notes || null, tenant_approver_name || null, tenant_approval_photo || null, pendingIds]
    );

    res.json({ message: `Pencatatan sebanyak ${pendingIds.length} meteran berhasil di-${action === 'Approve' ? 'setujui' : 'tolak'}.` });
  } catch (err) {
    console.error('submitApprovalDecision error:', err);
    res.status(500).json({ message: 'Gagal memproses persetujuan.' });
  }
};

// 10. CRUD Dropdown Option Master Data
exports.getOptions = async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM pa_utility_options';
    let params = [];
    
    if (type) {
      query += ' WHERE option_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY option_value ASC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('getOptions error:', err);
    res.status(500).json({ message: 'Gagal mengambil data pilihan.' });
  }
};

exports.createOption = async (req, res) => {
  try {
    const { option_type, option_value } = req.body;
    if (!option_type || !option_value || !option_value.trim()) {
      return res.status(400).json({ message: 'Tipe pilihan dan nilai pilihan wajib diisi.' });
    }
    
    // Check if duplicate exists
    const [existing] = await db.query(
      'SELECT id FROM pa_utility_options WHERE option_type = ? AND option_value = ?',
      [option_type, option_value.trim()]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Pilihan tersebut sudah ada.' });
    }
    
    await db.query(
      'INSERT INTO pa_utility_options (option_type, option_value, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [option_type, option_value.trim()]
    );
    
    res.status(201).json({ message: 'Pilihan berhasil ditambahkan.' });
  } catch (err) {
    console.error('createOption error:', err);
    res.status(500).json({ message: 'Gagal menyimpan pilihan baru.' });
  }
};

exports.updateOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { option_value } = req.body;
    if (!option_value || !option_value.trim()) {
      return res.status(400).json({ message: 'Nilai pilihan wajib diisi.' });
    }
    
    await db.query(
      'UPDATE pa_utility_options SET option_value = ?, updated_at = NOW() WHERE id = ?',
      [option_value.trim(), id]
    );
    
    res.json({ message: 'Pilihan berhasil diperbarui.' });
  } catch (err) {
    console.error('updateOption error:', err);
    res.status(500).json({ message: 'Gagal memperbarui pilihan.' });
  }
};

exports.deleteOption = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM pa_utility_options WHERE id = ?', [id]);
    res.json({ message: 'Pilihan berhasil dihapus.' });
  } catch (err) {
    console.error('deleteOption error:', err);
    res.status(500).json({ message: 'Gagal menghapus pilihan.' });
  }
};

exports.deleteReading = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT status FROM pa_utility_readings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Data pencatatan tidak ditemukan.' });
    }
    if (rows[0].status !== 'Pending') {
      return res.status(400).json({ message: 'Hanya pencatatan berstatus Gantung (Pending) yang dapat dibatalkan.' });
    }

    await db.query('DELETE FROM pa_utility_readings WHERE id = ?', [id]);
    res.json({ message: 'Pencatatan berhasil dibatalkan.' });
  } catch (err) {
    console.error('deleteReading error:', err);
    res.status(500).json({ message: 'Gagal membatalkan pencatatan.' });
  }
};
