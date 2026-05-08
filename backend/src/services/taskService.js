const db = require('../config/db');
const { calculateNextDate } = require('../../recurrenceService');

const getAllTasks = async (filters) => {
  const { company_id, agent_id, departemen } = filters;
  let query = 'SELECT * FROM tasks';
  let params = [];
  let conditions = [];
  
  if (company_id) {
    conditions.push('company_id = ?');
    params.push(company_id);
  }

  if (agent_id && departemen) {
    const agentIdStr = JSON.stringify(agent_id);
    const agentIdNum = !isNaN(agent_id) ? JSON.stringify(Number(agent_id)) : agentIdStr;
    conditions.push('(JSON_CONTAINS(agen_id, ?) OR JSON_CONTAINS(agen_id, ?) OR departemen = ?)');
    params.push(agentIdStr, agentIdNum, departemen);
  } else {
    if (departemen) {
      conditions.push('departemen = ?');
      params.push(departemen);
    }
    if (agent_id) {
      const agentIdStr = JSON.stringify(agent_id);
      const agentIdNum = !isNaN(agent_id) ? JSON.stringify(Number(agent_id)) : agentIdStr;
      conditions.push('(JSON_CONTAINS(agen_id, ?) OR JSON_CONTAINS(agen_id, ?))');
      params.push(agentIdStr, agentIdNum);
    }
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY created_at DESC';
  const [rows] = await db.query(query, params);
  return rows;
};

const getTaskById = async (id) => {
  const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
  if (rows.length > 0) {
    const task = rows[0];
    if (typeof task.agen_id === 'string') task.agen_id = JSON.parse(task.agen_id);
    if (typeof task.details === 'string') task.details = JSON.parse(task.details);
    return task;
  }
  return null;
};

/**
 * Auto-generate nomor_perintah_kerja based on department code and task type.
 * Format: {WO|CHK}-{dept_id}{5-digit sequence}
 * Example: WO-DGM00001, CHK-IT00002
 */
const generateTaskCode = async (departemen, companyId, jenisTask) => {
  // Determine prefix based on task type
  const prefix = (jenisTask === 'wo') ? 'WO' : 'CHK';

  // Look up dept_id from departments table
  let deptCode = null;
  if (departemen && companyId) {
    const [deptRows] = await db.query(
      'SELECT dept_id FROM departments WHERE name = ? AND company_id = ? LIMIT 1',
      [departemen, companyId]
    );
    if (deptRows.length > 0 && deptRows[0].dept_id) {
      deptCode = deptRows[0].dept_id;
    }
  }

  // Fallback: if dept_id not found, try without company filter
  if (!deptCode && departemen) {
    const [deptRows] = await db.query(
      'SELECT dept_id FROM departments WHERE name = ? LIMIT 1',
      [departemen]
    );
    if (deptRows.length > 0 && deptRows[0].dept_id) {
      deptCode = deptRows[0].dept_id;
    }
  }

  // Ultimate fallback: use first 3 chars of department name
  if (!deptCode) {
    deptCode = (departemen || 'GEN').substring(0, 3).toUpperCase();
  }

  // Find the highest existing sequence number for this prefix+deptCode
  const pattern = `${prefix}-${deptCode}%`;
  const prefixLen = `${prefix}-${deptCode}`.length;

  const [maxRows] = await db.query(
    `SELECT MAX(CAST(SUBSTRING(nomor_perintah_kerja, ? + 1) AS UNSIGNED)) as max_seq
     FROM tasks
     WHERE nomor_perintah_kerja LIKE ?`,
    [prefixLen, pattern]
  );

  const nextSeq = (maxRows[0]?.max_seq || 0) + 1;
  const paddedSeq = String(nextSeq).padStart(5, '0');

  return `${prefix}-${deptCode}${paddedSeq}`;
};

const createTask = async (taskData) => {
  const {
    perusahaan, company_id, departemen, nama_tugas, urgensi,
    deskripsi, lokasi, detail_alamat, aturan_waktu, tanggal_mulai, waktu_mulai,
    tanggal_selesai, waktu_selesai, pengulangan, jenis_pengulangan, waktu_berakhir,
    tanggal_pengulangan_berakhir, kali_pengulangan, tugas_departemen, dept_task_id,
    agen_id, verifikasi_kehadiran, maksimum_radius, selfie, persetujuan, admin_pemeriksa_id, 
    details, status, jenis_tugas
  } = taskData;

  // Auto-generate the task code
  const nomor_perintah_kerja = await generateTaskCode(departemen, company_id, jenis_tugas || 'checklist');

  const [result] = await db.query(
    `INSERT INTO tasks (
      perusahaan, company_id, departemen, nama_tugas, jenis_tugas, urgensi, nomor_perintah_kerja,
      deskripsi, lokasi, detail_alamat, aturan_waktu, tanggal_mulai, waktu_mulai,
      tanggal_selesai, waktu_selesai, pengulangan, jenis_pengulangan, waktu_berakhir,
      tanggal_pengulangan_berakhir, kali_pengulangan, tugas_departemen, dept_task_id,
      agen_id, verifikasi_kehadiran, maksimum_radius, selfie, butuh_persetujuan, admin_pemeriksa_id, approval_status,
      details, progres, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      perusahaan, company_id, departemen, nama_tugas, jenis_tugas || 'checklist', urgensi, nomor_perintah_kerja,
      deskripsi, lokasi, detail_alamat, aturan_waktu, 
      tanggal_mulai || null, waktu_mulai || null, 
      tanggal_selesai || null, waktu_selesai || null, 
      pengulangan || false, jenis_pengulangan || null, waktu_berakhir || null,
      tanggal_pengulangan_berakhir || null, kali_pengulangan || null,
      tugas_departemen || false,
      dept_task_id || null,
      JSON.stringify(agen_id || []), verifikasi_kehadiran || false, 
      maksimum_radius || null, selfie || null,
      persetujuan === 'Ya', admin_pemeriksa_id || null, 
      persetujuan === 'Ya' ? 'Pending' : 'Approved',
      JSON.stringify(details || []),
      (status || 'Draft') === 'Draft' ? null : 'Terbuka',
      status || 'Draft'
    ]
  );

  const insertedId = result.insertId;

  // Recurrence Initialization
  if (pengulangan && status === 'Pending') {
    const firstNextDate = calculateNextDate(tanggal_mulai, jenis_pengulangan);
    if (firstNextDate) {
      let validNextDate = firstNextDate;
      if (waktu_berakhir === 'Pada tanggal' && tanggal_pengulangan_berakhir) {
        try {
          const endStr = new Date(tanggal_pengulangan_berakhir).toISOString().split('T')[0];
          if (firstNextDate > endStr) validNextDate = null;
        } catch (e) {
          validNextDate = null;
        }
      } else if (waktu_berakhir === 'Setelah' && kali_pengulangan > 0) {
        if (1 >= kali_pengulangan) validNextDate = null;
      }

      if (validNextDate) {
        await db.query(
          "UPDATE tasks SET next_recurrence_date = ?, recurrence_count = 1 WHERE id = ?",
          [validNextDate, insertedId]
        );
      }
    }
  }

  // If this task is from a department request, update its status ONLY if published
  if (dept_task_id && status === 'Pending') {
    await db.query(
      "UPDATE department_tasks SET status = 'Menunggu Pengerjaan' WHERE id = ?",
      [dept_task_id]
    );
  }

  return insertedId;
};

const updateTask = async (id, taskData) => {
  const {
    perusahaan, company_id, departemen, nama_tugas, urgensi,
    deskripsi, lokasi, detail_alamat, aturan_waktu, tanggal_mulai, waktu_mulai,
    tanggal_selesai, waktu_selesai, pengulangan, jenis_pengulangan, waktu_berakhir,
    tanggal_pengulangan_berakhir, kali_pengulangan, tugas_departemen,
    agen_id, verifikasi_kehadiran, maksimum_radius, selfie, persetujuan, admin_pemeriksa_id, 
    details, status
  } = taskData;

  // Re-generate task code if departemen or jenis_tugas changed
  const currentTask = await getTaskById(id);
  let nomor_perintah_kerja = currentTask?.nomor_perintah_kerja;

  const jenisNow = taskData.jenis_tugas || 'checklist';
  if (
    !nomor_perintah_kerja ||
    currentTask?.departemen !== departemen ||
    currentTask?.jenis_tugas !== jenisNow
  ) {
    nomor_perintah_kerja = await generateTaskCode(departemen, company_id, jenisNow);
  }

  await db.query(
    `UPDATE tasks SET 
      perusahaan=?, company_id=?, departemen=?, nama_tugas=?, jenis_tugas=?, urgensi=?, nomor_perintah_kerja=?,
      deskripsi=?, lokasi=?, detail_alamat=?, aturan_waktu=?, tanggal_mulai=?, waktu_mulai=?,
      tanggal_selesai=?, waktu_selesai=?, pengulangan=?, jenis_pengulangan=?, waktu_berakhir=?,
      tanggal_pengulangan_berakhir=?, kali_pengulangan=?, tugas_departemen=?,
      agen_id=?, verifikasi_kehadiran=?, maksimum_radius=?, selfie=?, butuh_persetujuan=?, admin_pemeriksa_id=?, 
      approval_status=?, details=?, status=?
    WHERE id=?`,
    [
      perusahaan, company_id, departemen, nama_tugas, jenisNow, urgensi, nomor_perintah_kerja,
      deskripsi, lokasi, detail_alamat, aturan_waktu, 
      tanggal_mulai || null, waktu_mulai || null, 
      tanggal_selesai || null, waktu_selesai || null, 
      pengulangan || false, jenis_pengulangan || null, waktu_berakhir || null,
      tanggal_pengulangan_berakhir || null, kali_pengulangan || null,
      tugas_departemen || false, 
      JSON.stringify(agen_id || []), verifikasi_kehadiran || false, 
      maksimum_radius || null, selfie || null, 
      persetujuan === 'Ya', admin_pemeriksa_id || null,
      persetujuan === 'Ya' ? 'Pending' : 'Approved',
      JSON.stringify(details || []), status, id
    ]
  );

  // Recurrence Initialization/Reset on Update
  if (pengulangan && status === 'Pending') {
    const firstNextDate = calculateNextDate(tanggal_mulai, jenis_pengulangan);
    await db.query(
      "UPDATE tasks SET next_recurrence_date = ?, recurrence_count = 1 WHERE id = ?",
      [firstNextDate, id]
    );
  } else if (!pengulangan) {
    await db.query("UPDATE tasks SET next_recurrence_date = NULL, recurrence_count = 0 WHERE id = ?", [id]);
  }

  // If this task is linked to a department task, update its status if published
  if (taskData.dept_task_id && status === 'Pending') {
    await db.query(
      "UPDATE department_tasks SET status = 'Menunggu Pengerjaan' WHERE id = ?",
      [taskData.dept_task_id]
    );
  }
};

const updateTaskApproval = async (id, approval_status) => {
  await db.query('UPDATE tasks SET approval_status = ? WHERE id = ?', [approval_status, id]);
};

const startTask = async (id, { nama_agen, agent_id, latitude, longitude }) => {
  let query = 'UPDATE tasks SET progres = ?, waktu_dimulai = CURRENT_TIMESTAMP';
  let params = ['Berlangsung'];

  if (agent_id) {
    query += ', agen_id = ?';
    params.push(JSON.stringify([agent_id]));
  }
  
  if (latitude && longitude) {
    query += ', start_latitude = ?, start_longitude = ?';
    params.push(latitude, longitude);
  }

  query += ' WHERE id = ?';
  params.push(id);

  await db.query(query, params);

  // Synchronize with originating department task if linked
  const [taskRows] = await db.query('SELECT dept_task_id FROM tasks WHERE id = ?', [id]);
  if (taskRows[0]?.dept_task_id) {
    await db.query('UPDATE department_tasks SET status = ? WHERE id = ?', ['Berlangsung', taskRows[0].dept_task_id]);
  }

  // Record in history
  await db.query(
    'INSERT INTO task_history (task_id, nama_agen, progres, waktu_mulai) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    [id, nama_agen || 'Sistem', 'Berlangsung']
  );
  
  const [rows] = await db.query('SELECT waktu_dimulai FROM tasks WHERE id = ?', [id]);
  return rows[0]?.waktu_dimulai;
};

const submitTask = async (id, { submission_data, nama_agen, agent_id }) => {
  await db.query(
    'UPDATE tasks SET submission_data = ?, waktu_dikirim = CURRENT_TIMESTAMP WHERE id = ?',
    [JSON.stringify(submission_data), id]
  );
  
  if (nama_agen) {
    const [historyRows] = await db.query(
      'UPDATE task_history SET waktu_selesai = CURRENT_TIMESTAMP, submission_data = ? WHERE task_id = ? AND nama_agen = ? AND progres = ? AND waktu_selesai IS NULL',
      [JSON.stringify(submission_data), id, nama_agen, 'Berlangsung']
    );

    if (historyRows.affectedRows === 0) {
      const [taskData] = await db.query('SELECT waktu_dimulai FROM tasks WHERE id = ?', [id]);
      await db.query(
        'INSERT INTO task_history (task_id, nama_agen, progres, waktu_mulai, waktu_selesai, submission_data) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)',
        [id, nama_agen, 'Berlangsung', taskData[0]?.waktu_dimulai || null, JSON.stringify(submission_data)]
      );
    }
  }

  const [rows] = await db.query('SELECT waktu_dikirim FROM tasks WHERE id = ?', [id]);
  return rows[0]?.waktu_dikirim;
};

const finishTask = async (id, { nama_agen, agent_id, latitude, longitude }) => {
  let query = 'UPDATE tasks SET progres = ?, waktu_selesai_aktual = CURRENT_TIMESTAMP';
  let params = ['Menunggu Approval'];

  if (agent_id) {
    query += ', agen_id = ?';
    params.push(JSON.stringify([agent_id]));
  }

  if (latitude && longitude) {
    query += ', finish_latitude = ?, finish_longitude = ?';
    params.push(latitude, longitude);
  }

  query += ' WHERE id = ?';
  params.push(id);

  await db.query(query, params);

  // Do NOT sync dept_task to "Selesai" here — wait for approval

  // Update history
  const [currentTask] = await db.query('SELECT waktu_dimulai, submission_data FROM tasks WHERE id = ?', [id]);
  const subData = currentTask[0]?.submission_data ? (typeof currentTask[0].submission_data === 'string' ? currentTask[0].submission_data : JSON.stringify(currentTask[0].submission_data)) : null;

  if (nama_agen) {
    const [historyRows] = await db.query(
      'UPDATE task_history SET progres = ?, waktu_selesai = COALESCE(waktu_selesai, CURRENT_TIMESTAMP), submission_data = COALESCE(submission_data, ?) WHERE task_id = ? AND nama_agen = ? AND progres = ?',
      ['Menunggu Approval', subData, id, nama_agen, 'Berlangsung']
    );

    if (historyRows.affectedRows === 0) {
      await db.query(
        'INSERT INTO task_history (task_id, nama_agen, progres, waktu_mulai, waktu_selesai, submission_data) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)',
        [id, nama_agen, 'Menunggu Approval', currentTask[0]?.waktu_dimulai || null, subData]
      );
    }
  } else {
    const [historyRows] = await db.query(
      'UPDATE task_history SET progres = ?, waktu_selesai = COALESCE(waktu_selesai, CURRENT_TIMESTAMP), submission_data = COALESCE(submission_data, ?) WHERE task_id = ? AND progres = ? ORDER BY created_at DESC LIMIT 1',
      ['Menunggu Approval', subData, id, 'Berlangsung']
    );

    if (historyRows.affectedRows === 0) {
      await db.query(
        'INSERT INTO task_history (task_id, nama_agen, progres, waktu_mulai, waktu_selesai, submission_data) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)',
        [id, 'Sistem', 'Menunggu Approval', currentTask[0]?.waktu_dimulai || null, subData]
      );
    }
  }

  const [rows] = await db.query('SELECT waktu_selesai_aktual FROM tasks WHERE id = ?', [id]);
  return rows[0]?.waktu_selesai_aktual;
};

const getTaskHistory = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM task_history WHERE task_id = ? ORDER BY created_at DESC',
    [id]
  );
  return rows;
};

const updateTaskStatus = async (id, status) => {
  await db.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
};

const deleteTask = async (id) => {
  await db.query('DELETE FROM tasks WHERE id = ?', [id]);
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskApproval,
  startTask,
  submitTask,
  finishTask,
  getTaskHistory,
  updateTaskStatus,
  deleteTask
};
