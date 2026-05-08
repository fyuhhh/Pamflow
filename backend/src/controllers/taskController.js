const taskService = require('../services/taskService');
const { logAudit } = require('../services/auditService');
const { notifyUsers } = require('../services/pushService');
const socketService = require('../services/socketService');
const db = require('../config/db'); // Use direct pool reference

const getTasks = async (req, res) => {
  try {
    const filters = req.query;
    const tasks = await taskService.getAllTasks(filters);
    res.status(200).json(tasks);
  } catch (err) {
    console.error('Fetch tasks error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (task) {
      res.status(200).json(task);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (err) {
    console.error('Fetch task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createNewTask = async (req, res) => {
  console.log('[TaskController] Creating new task:', req.body.nama_tugas);
  try {
    const insertedId = await taskService.createTask(req.body);
    console.log('[TaskController] Task inserted with ID:', insertedId);
    
    // Log Activity
    await logAudit({
      entity_type: 'task',
      entity_id: insertedId,
      user_id: req.body.creator_id,
      user_name: req.body.creator_name,
      action: 'CREATE',
      new_value: { nama_tugas: req.body.nama_tugas, status: req.body.status || 'Draft' },
      notes: req.body.status === 'Pending' ? 'Tugas dipublikasikan' : 'Tugas disimpan sebagai draf',
      req
    });

    // Notify assigned agents if status is Pending
    if (req.body.status === 'Pending' && req.body.agen_id) {
      const agenIds = Array.isArray(req.body.agen_id) ? req.body.agen_id : [req.body.agen_id];
      if (agenIds.length > 0) {
        await notifyUsers(db, agenIds, {
          title: 'Tugas Baru!',
          body: `Anda ditugaskan: ${req.body.nama_tugas}`,
          url: `/demo/mobile/task/${insertedId}`
        });
      }
    }

    // Real-time Sync
    try {
      socketService.emitToCompany(req.body.company_id, 'task-created', { 
        id: insertedId, 
        nama_tugas: req.body.nama_tugas,
        creator_name: req.body.creator_name 
      });
    } catch (socketErr) {
      console.warn('[TaskController] Socket sync failed:', socketErr.message);
    }

    res.status(201).json({ message: 'Task created successfully', id: insertedId });
  } catch (err) {
    console.error('[TaskController] Create task error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

const updateTaskDetails = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await taskService.updateTask(req.params.id, req.body);

    // Log activity if status changed
    if (task.status !== req.body.status) {
      await logAudit({
        entity_type: 'task',
        entity_id: req.params.id,
        user_id: req.body.editor_id,
        user_name: req.body.editor_name,
        action: 'UPDATE_STATUS',
        old_value: task.status,
        new_value: req.body.status,
        notes: `Status berubah dari ${task.status} ke ${req.body.status}`,
        req
      });
    }

    // Real-time Sync
    socketService.emitToCompany(task.company_id, 'task-updated', { id: req.params.id });

    res.status(200).json({ message: 'Task updated successfully' });
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const approveOrRejectTask = async (req, res) => {
  const { approval_status, user_id, user_name, notes } = req.body;
  try {
    const current = await taskService.getTaskById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Task not found' });

    if (approval_status === 'Approved') {
      // Set progres to Selesai
      await db.query('UPDATE tasks SET progres = ?, approval_status = ? WHERE id = ?', ['Selesai', 'Approved', req.params.id]);

      // Sync dept_task to Selesai if linked
      if (current.dept_task_id) {
        await db.query('UPDATE department_tasks SET status = ? WHERE id = ?', ['Selesai', current.dept_task_id]);
      }

      // Insert into task_approvals
      await db.query(
        'INSERT INTO task_approvals (task_id, approved_by_id, approved_by_name, approval_status, notes) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, user_id, user_name, 'Approved', notes || 'Tugas disetujui']
      );

      // Update history
      await db.query(
        'INSERT INTO task_history (task_id, nama_agen, progres, waktu_mulai, waktu_selesai) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [req.params.id, user_name || 'Approver', 'Selesai']
      );
    } else {
      // Rejected — set progres to Ditolak so agent can re-submit
      await db.query('UPDATE tasks SET progres = ?, approval_status = ? WHERE id = ?', ['Ditolak', 'Rejected', req.params.id]);

      // Insert into task_approvals
      await db.query(
        'INSERT INTO task_approvals (task_id, approved_by_id, approved_by_name, approval_status, notes) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, user_id, user_name, 'Rejected', notes || 'Tugas ditolak']
      );

      // Update history
      await db.query(
        'INSERT INTO task_history (task_id, nama_agen, progres, waktu_mulai, waktu_selesai) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [req.params.id, user_name || 'Approver', 'Ditolak']
      );
    }
    
    // Log Activity
    await logAudit({
      entity_type: 'task',
      entity_id: req.params.id,
      user_id: user_id,
      user_name: user_name,
      action: approval_status === 'Approved' ? 'APPROVE' : 'REJECT',
      old_value: current?.approval_status,
      new_value: approval_status,
      notes: notes || (approval_status === 'Approved' ? 'Tugas disetujui' : 'Tugas ditolak'),
      req
    });

    // Notify agents
    if (current && current.agen_id) {
      const agenIds = Array.isArray(current.agen_id) ? current.agen_id : [current.agen_id];
      if (agenIds.length > 0) {
        await notifyUsers(db, agenIds, {
          title: approval_status === 'Approved' ? 'Tugas Disetujui' : 'Tugas Ditolak',
          body: `Tugas "${current.nama_tugas}" telah ${approval_status === 'Approved' ? 'disetujui' : 'ditolak'}`,
          url: `/demo/mobile/task/${req.params.id}`
        });
      }
    }

    // Real-time Sync
    socketService.emitToCompany(current?.company_id, 'task-approval-updated', { 
      id: req.params.id, 
      status: approval_status 
    });

    res.status(200).json({ message: `Task ${approval_status.toLowerCase()} successfully` });
  } catch (err) {
    console.error('Approval error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPendingApproval = async (req, res) => {
  const { company_id, departemen } = req.query;
  try {
    let query = `SELECT * FROM tasks WHERE progres = 'Menunggu Approval'`;
    let params = [];

    if (company_id) {
      query += ' AND company_id = ?';
      params.push(company_id);
    }
    if (departemen) {
      query += ' AND departemen = ?';
      params.push(departemen);
    }

    query += ' ORDER BY waktu_selesai_aktual DESC';
    const [rows] = await db.query(query, params);

    // Enrich each task with agent name from history
    for (const task of rows) {
      const [historyRows] = await db.query(
        'SELECT nama_agen, waktu_mulai, waktu_selesai, submission_data FROM task_history WHERE task_id = ? ORDER BY created_at DESC LIMIT 1',
        [task.id]
      );
      task.agent_name = historyRows[0]?.nama_agen || '-';
      task.history_waktu_mulai = historyRows[0]?.waktu_mulai;
      task.history_waktu_selesai = historyRows[0]?.waktu_selesai;

      // Parse JSON fields for frontend consumption
      if (typeof task.agen_id === 'string') {
        try { task.agen_id = JSON.parse(task.agen_id); } catch(e) {}
      }
      if (typeof task.details === 'string') {
        try { task.details = JSON.parse(task.details); } catch(e) {}
      }
      if (typeof task.submission_data === 'string') {
        try { task.submission_data = JSON.parse(task.submission_data); } catch(e) {}
      }
    }

    res.json(rows);
  } catch (err) {
    console.error('Fetch pending approval error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getApprovalHistory = async (req, res) => {
  const { company_id, departemen } = req.query;
  try {
    let query = `
      SELECT t.*, ta.approval_status AS ta_status, ta.approved_by_name, ta.notes AS approval_notes, ta.approved_at
      FROM tasks t
      INNER JOIN task_approvals ta ON ta.task_id = t.id
      WHERE 1=1
    `;
    let params = [];

    if (company_id) {
      query += ' AND t.company_id = ?';
      params.push(company_id);
    }
    if (departemen) {
      query += ' AND t.departemen = ?';
      params.push(departemen);
    }

    query += ' ORDER BY ta.approved_at DESC';
    const [rows] = await db.query(query, params);

    // Enrich with agent name
    for (const task of rows) {
      const [historyRows] = await db.query(
        'SELECT nama_agen FROM task_history WHERE task_id = ? ORDER BY created_at DESC LIMIT 1',
        [task.id]
      );
      task.agent_name = historyRows[0]?.nama_agen || '-';
    }

    res.json(rows);
  } catch (err) {
    console.error('Fetch approval history error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const startAgentTask = async (req, res) => {
  const { nama_agen, agent_id, latitude, longitude } = req.body;
  try {
    const waktu_dimulai = await taskService.startTask(req.params.id, { nama_agen, agent_id, latitude, longitude });

    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: req.params.id,
      user_id: agent_id,
      user_name: nama_agen,
      action: 'AGENT_START',
      notes: `Agen ${nama_agen || 'Sistem'} mulai mengerjakan tugas`,
      req
    });

    // Real-time Sync
    const task = await taskService.getTaskById(req.params.id);
    socketService.emitToCompany(task?.company_id, 'task-progress-updated', { 
      id: req.params.id, 
      progres: 'Berlangsung',
      agent_id
    });

    res.status(200).json({ message: 'Task started successfully', waktu_dimulai });
  } catch (err) {
    console.error('Start task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const submitAgentTask = async (req, res) => {
  const { submission_data, nama_agen, agent_id } = req.body;
  try {
    const waktu_dikirim = await taskService.submitTask(req.params.id, { submission_data, nama_agen, agent_id });

    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: req.params.id,
      user_id: agent_id,
      user_name: nama_agen,
      action: 'AGENT_SUBMIT',
      notes: `Agen ${nama_agen || 'Sistem'} mengirimkan laporan tugas`,
      req
    });

    // Real-time Sync
    const task = await taskService.getTaskById(req.params.id);
    socketService.emitToCompany(task?.company_id, 'task-progress-updated', { 
      id: req.params.id, 
      progres: 'Submitted'
    });

    res.status(200).json({ message: 'Form submitted successfully', waktu_dikirim });
  } catch (err) {
    console.error('Submit task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const finishAgentTask = async (req, res) => {
  const { nama_agen, agent_id, latitude, longitude } = req.body;
  try {
    const waktu_selesai_aktual = await taskService.finishTask(req.params.id, { nama_agen, agent_id, latitude, longitude });

    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: req.params.id,
      user_id: agent_id,
      user_name: nama_agen,
      action: 'AGENT_FINISH',
      notes: `Agen ${nama_agen || 'Sistem'} menyelesaikan tugas`,
      req
    });

    // Real-time Sync
    const task = await taskService.getTaskById(req.params.id);
    socketService.emitToCompany(task?.company_id, 'task-progress-updated', { 
      id: req.params.id, 
      progres: 'Selesai'
    });

    res.status(200).json({ message: 'Task finished successfully', waktu_selesai_aktual });
  } catch (err) {
    console.error('Finish task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await taskService.getTaskHistory(req.params.id);
    res.status(200).json(history);
  } catch (err) {
    console.error('Fetch history error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const patchStatus = async (req, res) => {
  const { status, user_id, user_name } = req.body;
  try {
    const current = await taskService.getTaskById(req.params.id);
    await taskService.updateTaskStatus(req.params.id, status);
    
    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: req.params.id,
      user_id: user_id,
      user_name: user_name,
      action: 'UPDATE_STATUS',
      old_value: current?.status,
      new_value: status,
      notes: `Status tugas diubah secara manual menjadi ${status}`,
      req
    });

    res.status(200).json({ message: 'Task status updated successfully' });
  } catch (err) {
    console.error('Update task status error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeTask = async (req, res) => {
  const { user_id, user_name } = req.body;
  try {
    const task = await taskService.getTaskById(req.params.id);
    await taskService.deleteTask(req.params.id);

    // Log Audit
    if (task) {
      await logAudit({
        entity_type: 'task',
        entity_id: req.params.id,
        user_id: user_id,
        user_name: user_name,
        action: 'DELETE',
        old_value: task.nama_tugas,
        notes: `Tugas "${task.nama_tugas}" dihapus`,
        req
      });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getTasks,
  getTask,
  createNewTask,
  updateTaskDetails,
  approveOrRejectTask,
  getPendingApproval,
  getApprovalHistory,
  startAgentTask,
  submitAgentTask,
  finishAgentTask,
  getHistory,
  patchStatus,
  removeTask
};
