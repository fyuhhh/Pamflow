const db = require('../config/db');

const getDashboardStats = async (req, res) => {
  const { company_id, departemen, start_date, end_date } = req.query;

  try {
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (company_id && company_id !== 'all') {
      whereClause += ' AND company_id = ?';
      params.push(company_id);
    }

    if (departemen && departemen !== 'all') {
      whereClause += ' AND departemen = ?';
      params.push(departemen);
    }

    if (start_date && end_date) {
      whereClause += ' AND created_at BETWEEN ? AND ?';
      params.push(`${start_date} 00:00:00`, `${end_date} 23:59:59`);
    }

    const [taskStatsRows] = await db.query(`
      SELECT 
        status, 
        progres,
        COUNT(*) as total,
        SUM(CASE 
          WHEN (progres = 'Selesai' AND waktu_selesai_aktual > tanggal_selesai) 
               OR (progres != 'Selesai' AND tanggal_selesai < CURRENT_DATE) THEN 1 
          ELSE 0 
        END) as terlambat,
        SUM(CASE 
          WHEN (progres = 'Selesai' AND waktu_selesai_aktual <= tanggal_selesai) 
               OR (progres != 'Selesai' AND tanggal_selesai >= CURRENT_DATE) THEN 1 
          ELSE 0 
        END) as tepat_waktu
      FROM tasks 
      ${whereClause}
      GROUP BY status, progres
    `, params);

    const timelinessSum = {
      terlambat: taskStatsRows.reduce((a, b) => a + Number(b.terlambat || 0), 0),
      tepat_waktu: taskStatsRows.reduce((a, b) => a + Number(b.tepat_waktu || 0), 0)
    };

    // Dept Task Statistics (WO & Checklist)
    const fetchDeptTaskStats = async (type, isReceived) => {
      let where = 'WHERE 1=1';
      let params = [];
      
      if (type) {
        where += ' AND jenis_tugas = ?';
        params.push(type);
      }

      if (company_id && company_id !== 'all') {
        where += ' AND company_id = ?';
        params.push(company_id);
      }

      if (departemen && departemen !== 'all') {
        where += isReceived ? ' AND departemen_tujuan = ?' : ' AND departemen_asal = ?';
        params.push(departemen);
      }

      if (start_date && end_date) {
        where += ' AND created_at BETWEEN ? AND ?';
        params.push(`${start_date} 00:00:00`, `${end_date} 23:59:59`);
      }

      const [rows] = await db.query(`
        SELECT status, COUNT(*) as count 
        FROM department_tasks
        ${where}
        GROUP BY status
      `, params);
      return rows;
    };

    const [woReceivedRows, woSentRows, clReceivedRows, clSentRows] = await Promise.all([
      fetchDeptTaskStats('wo', true),
      fetchDeptTaskStats('wo', false),
      fetchDeptTaskStats('checklist', true),
      fetchDeptTaskStats('checklist', false)
    ]);

    res.json({
      tasks: {
        status: taskStatsRows,
        timeliness: timelinessSum
      },
      workOrders: {
        received: woReceivedRows,
        sent: woSentRows
      },
      checklists: {
        received: clReceivedRows,
        sent: clSentRows
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats
};
