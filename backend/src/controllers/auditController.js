const db = require('../config/db');

exports.getAllAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const offset = (page - 1) * limit;

    let conditions = [];
    const params = [];

    // Filter by Module (if provided)
    if (req.query.module) {
      const mod = req.query.module;
      if (mod === 'akses_pengguna') {
        conditions.push("entity_type IN ('auth', 'user', 'role')");
      } else if (mod === 'checklist_harian') {
        conditions.push("entity_type IN ('checklist', 'template')");
      } else if (mod === 'tugas_wo') {
        conditions.push("entity_type IN ('task', 'department_task')");
      } else if (mod === 'manajemen_aset') {
        conditions.push("entity_type IN ('asset', 'asset_relocation', 'asset_disposal', 'asset_opname', 'asset_maintenance')");
      }
    }

    if (req.query.entity_type) {
      conditions.push('entity_type = ?');
      params.push(req.query.entity_type);
    }

    if (req.query.action) {
      conditions.push('action = ?');
      params.push(req.query.action);
    }

    if (req.query.search) {
      conditions.push('(user_name LIKE ? OR notes LIKE ? OR page_url LIKE ? OR action LIKE ? OR device_name LIKE ? OR browser LIKE ? OR os LIKE ?)');
      const s = `%${req.query.search}%`;
      params.push(s, s, s, s, s, s, s);
    }

    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    const subquery = `
      SELECT 
        id, 
        entity_type, 
        entity_id, 
        user_id, 
        user_name, 
        action, 
        action_label, 
        old_value, 
        new_value, 
        notes, 
        ip_address, 
        user_agent, 
        device_brand, 
        device_name, 
        browser, 
        os, 
        page_url, 
        session_id, 
        created_at
      FROM audit_logs

      UNION ALL

      SELECT 
        l.id, 
        'asset' AS entity_type, 
        l.asset_id AS entity_id, 
        l.user_id, 
        CONCAT(u.firstName, ' ', COALESCE(u.lastName, '')) AS user_name, 
        l.action, 
        NULL AS action_label, 
        NULL AS old_value, 
        l.photos AS new_value, 
        l.details AS notes, 
        NULL AS ip_address, 
        NULL AS user_agent, 
        NULL AS device_brand, 
        NULL AS device_name, 
        NULL AS browser, 
        NULL AS os, 
        NULL AS page_url, 
        NULL AS session_id, 
        l.created_at
      FROM asset_audit_logs l
      LEFT JOIN users u ON l.user_id = u.id

      UNION ALL

      SELECT 
        m.id, 
        'asset_relocation' AS entity_type, 
        m.id AS entity_id, 
        m.created_by AS user_id, 
        CONCAT(u.firstName, ' ', COALESCE(u.lastName, '')) AS user_name, 
        m.status AS action, 
        NULL AS action_label, 
        NULL AS old_value, 
        NULL AS new_value, 
        CONCAT('Relokasi Aset ', m.mutation_no, ': ', COALESCE(m.description, '')) AS notes, 
        NULL AS ip_address, 
        NULL AS user_agent, 
        NULL AS device_brand, 
        NULL AS device_name, 
        NULL AS browser, 
        NULL AS os, 
        NULL AS page_url, 
        NULL AS session_id, 
        m.created_at
      FROM pa_mutations m
      LEFT JOIN users u ON m.created_by = u.id

      UNION ALL

      SELECT 
        d.id, 
        'asset_disposal' AS entity_type, 
        d.id AS entity_id, 
        d.created_by AS user_id, 
        CONCAT(u.firstName, ' ', COALESCE(u.lastName, '')) AS user_name, 
        'DISPOSAL' AS action, 
        NULL AS action_label, 
        NULL AS old_value, 
        NULL AS new_value, 
        CONCAT('Disposal/Penghapusan Aset ', d.disposal_no, ': ', COALESCE(d.description, '')) AS notes, 
        NULL AS ip_address, 
        NULL AS user_agent, 
        NULL AS device_brand, 
        NULL AS device_name, 
        NULL AS browser, 
        NULL AS os, 
        NULL AS page_url, 
        NULL AS session_id, 
        d.created_at
      FROM pa_disposals d
      LEFT JOIN users u ON d.created_by = u.id

      UNION ALL

      SELECT 
        o.id, 
        'asset_opname' AS entity_type, 
        o.id AS entity_id, 
        o.created_by AS user_id, 
        CONCAT(u.firstName, ' ', COALESCE(u.lastName, '')) AS user_name, 
        'OPNAME' AS action, 
        NULL AS action_label, 
        NULL AS old_value, 
        NULL AS new_value, 
        CONCAT('Stock Opname Aset ', o.stock_opname_code, ' - ', o.group_name, ': ', COALESCE(o.description, '')) AS notes, 
        NULL AS ip_address, 
        NULL AS user_agent, 
        NULL AS device_brand, 
        NULL AS device_name, 
        NULL AS browser, 
        NULL AS os, 
        NULL AS page_url, 
        NULL AS session_id, 
        o.created_at
      FROM pa_stock_opnames o
      LEFT JOIN users u ON o.created_by = u.id

      UNION ALL

      SELECT 
        mt.id, 
        'asset_maintenance' AS entity_type, 
        mt.id AS entity_id, 
        mt.executed_by AS user_id, 
        CONCAT(u.firstName, ' ', COALESCE(u.lastName, '')) AS user_name, 
        mt.status AS action, 
        NULL AS action_label, 
        NULL AS old_value, 
        NULL AS new_value, 
        CONCAT('Teknis/Admin Maintenance Aset (ID: ', mt.asset_id, ') ', mt.maintenance_name, ': ', COALESCE(mt.note, '')) AS notes, 
        NULL AS ip_address, 
        NULL AS user_agent, 
        NULL AS device_brand, 
        NULL AS device_name, 
        NULL AS browser, 
        NULL AS os, 
        NULL AS page_url, 
        NULL AS session_id, 
        mt.created_at
      FROM pa_maintenances mt
      LEFT JOIN users u ON mt.executed_by = u.id
    `;

    const query = `SELECT * FROM (${subquery}) AS unified_logs${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) as total FROM (${subquery}) AS unified_logs${whereClause}`;

    const [logs] = await db.query(query, [...params, limit, offset]);
    const [[{ total }]] = await db.query(countQuery, params);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch Audit Logs Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching audit logs' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const [logs] = await db.query(
      'SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
      [entity_type, entity_id]
    );
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Fetch Entity Audit Logs Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
