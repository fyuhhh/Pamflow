const db = require('../config/db');

exports.getAllAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const offset = (page - 1) * limit;

    let conditions = [];
    const params = [];

    if (req.query.entity_type) {
      conditions.push('entity_type = ?');
      params.push(req.query.entity_type);
    }

    if (req.query.action) {
      conditions.push('action = ?');
      params.push(req.query.action);
    }

    if (req.query.search) {
      conditions.push('(user_name LIKE ? OR notes LIKE ? OR page_url LIKE ? OR action_label LIKE ? OR device_name LIKE ? OR browser LIKE ?)');
      const s = `%${req.query.search}%`;
      params.push(s, s, s, s, s, s);
    }

    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    const query = `SELECT * FROM audit_logs${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) as total FROM audit_logs${whereClause}`;

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
