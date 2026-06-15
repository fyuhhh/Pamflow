const db = require('../config/db');

/**
 * Parse a User-Agent string into structured device info
 */
const parseUserAgent = (ua) => {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device_brand: 'Unknown', device_name: 'Unknown' };

  let browser = 'Unknown';
  let os = 'Unknown';
  let device_brand = 'Unknown';
  let device_name = 'Unknown';

  // --- Browser Detection ---
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Browser';
  else if (/UCBrowser/i.test(ua)) browser = 'UC Browser';
  else if (/MIUI Browser/i.test(ua)) browser = 'MIUI Browser';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/MSIE|Trident/i.test(ua)) browser = 'Internet Explorer';

  // --- OS Detection ---
  if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android (\d+[\.\d]*)/i.test(ua)) os = `Android ${ua.match(/Android (\d+[\.\d]*)/i)?.[1] || ''}`.trim();
  else if (/iPhone OS (\d+_\d+)/i.test(ua)) os = `iOS ${ua.match(/iPhone OS (\d+_\d+)/i)?.[1]?.replace('_', '.') || ''}`.trim();
  else if (/iPad.*OS (\d+_\d+)/i.test(ua)) os = `iPadOS ${ua.match(/iPad.*OS (\d+_\d+)/i)?.[1]?.replace('_', '.') || ''}`.trim();
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // --- Device Brand & Name Detection ---
  if (/iPhone/i.test(ua)) { device_brand = 'Apple'; device_name = 'iPhone'; }
  else if (/iPad/i.test(ua)) { device_brand = 'Apple'; device_name = 'iPad'; }
  else if (/Macintosh|MacIntel/i.test(ua)) { device_brand = 'Apple'; device_name = 'Mac'; }
  else if (/Samsung/i.test(ua) || /SM-[A-Z0-9]+/i.test(ua)) {
    device_brand = 'Samsung';
    const model = ua.match(/\(Linux.*?;\s*(SM-[A-Z0-9]+)/i)?.[1] || 'Galaxy';
    device_name = `Samsung ${model}`;
  }
  else if (/Xiaomi|MIUI|Redmi|MI\s/i.test(ua)) {
    device_brand = 'Xiaomi';
    const model = ua.match(/\(Linux.*?;\s*([A-Za-z0-9\s\-]+)\sBuild/i)?.[1]?.trim() || 'Xiaomi';
    device_name = model.length < 30 ? model : 'Xiaomi';
  }
  else if (/OPPO/i.test(ua)) { device_brand = 'OPPO'; device_name = ua.match(/OPPO\s?([A-Za-z0-9\s]+)\sBuild/i)?.[1]?.trim() || 'OPPO'; }
  else if (/vivo/i.test(ua)) { device_brand = 'Vivo'; device_name = ua.match(/vivo\s?([A-Za-z0-9\s\-]+)\sBuild/i)?.[1]?.trim() || 'Vivo'; }
  else if (/Realme/i.test(ua)) { device_brand = 'Realme'; device_name = ua.match(/Realme\s?([A-Za-z0-9\s\-]+)\sBuild/i)?.[1]?.trim() || 'Realme'; }
  else if (/Huawei|HUAWEI/i.test(ua)) { device_brand = 'Huawei'; device_name = ua.match(/(?:HUAWEI|Huawei)\s([A-Za-z0-9\s\-]+)\s?Build/i)?.[1]?.trim() || 'Huawei'; }
  else if (/Windows/i.test(ua)) { device_brand = 'PC/Laptop'; device_name = 'Windows PC'; }
  else if (/Linux.*Android/i.test(ua)) { device_brand = 'Android'; device_name = 'Android Device'; }
  else if (/Linux/i.test(ua)) { device_brand = 'PC/Laptop'; device_name = 'Linux PC'; }

  // Trim to max length to prevent DB overflow
  return {
    browser: browser.substring(0, 100),
    os: os.substring(0, 100),
    device_brand: device_brand.substring(0, 100),
    device_name: device_name.substring(0, 100)
  };
};

/**
 * Log an action to the audit_logs table
 */
const logAudit = async ({ entity_type, entity_id, user_id, user_name, action, action_label, old_value, new_value, notes, page_url, session_id, req }) => {
  if (!db) return;
  try {
    const ip_address = req ? (req.headers['x-forwarded-for'] || req.ip) : null;
    const user_agent_raw = req ? req.headers['user-agent'] : null;
    const { browser, os, device_brand, device_name } = parseUserAgent(user_agent_raw);

    // Resolve user details
    let resolvedUserId = user_id;
    let resolvedUserName = user_name;

    if (!resolvedUserId && req?.user?.id) {
      resolvedUserId = req.user.id;
    }

    if (resolvedUserId && !resolvedUserName) {
      try {
        const [rows] = await db.query('SELECT firstName, lastName, username FROM users WHERE id = ?', [resolvedUserId]);
        if (rows && rows.length > 0) {
          resolvedUserName = `${rows[0].firstName || ''} ${rows[0].lastName || ''}`.trim() || rows[0].username;
        }
      } catch (userErr) {
        console.error('Audit Log User Resolution Error:', userErr.message);
      }
    }

    // Fallbacks
    if (!resolvedUserName) resolvedUserName = 'Sistem';

    // Allow page_url from body if not passed as param (for navigation logs)
    const resolvedPageUrl = page_url || (req?.body?.page_url) || null;
    const resolvedSessionId = session_id || (req?.body?.session_id) || null;

    await db.query(`
      INSERT INTO audit_logs 
        (entity_type, entity_id, user_id, user_name, action, action_label, old_value, new_value, notes, ip_address, user_agent, device_brand, device_name, browser, os, page_url, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entity_type,
      entity_id || null,
      resolvedUserId || null,
      resolvedUserName,
      action,
      action_label || null,
      old_value ? (typeof old_value === 'object' ? JSON.stringify(old_value) : String(old_value)) : null,
      new_value ? (typeof new_value === 'object' ? JSON.stringify(new_value) : String(new_value)) : null,
      notes,
      ip_address,
      user_agent_raw,
      device_brand,
      device_name,
      browser,
      os,
      resolvedPageUrl,
      resolvedSessionId
    ]);
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
};

module.exports = {
  logAudit,
  parseUserAgent
};
