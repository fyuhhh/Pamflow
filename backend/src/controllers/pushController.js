/**
 * Push Notification Controller
 */
const pushService = require('../services/pushService');

const subscribe = async (req, res) => {
  const { subscription, user_id } = req.body;
  const pool = req.app.get('pool');

  if (!subscription || !user_id) {
    return res.status(400).json({ message: 'Subscription and user_id are required' });
  }

  try {
    // Extract keys
    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    // Save to DB (Update if endpoint exists)
    await pool.query(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      p256dh = VALUES(p256dh),
      auth = VALUES(auth)
    `, [user_id, endpoint, p256dh, auth]);

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) {
    console.error('[PushController] Subscribe error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const unsubscribe = async (req, res) => {
  const { endpoint } = req.body;
  const pool = req.app.get('pool');

  if (!endpoint) {
    return res.status(400).json({ message: 'Endpoint is required' });
  }

  try {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (err) {
    console.error('[PushController] Unsubscribe error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const testPush = async (req, res) => {
  const { user_id } = req.body;
  const pool = req.app.get('pool');

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  try {
    await pushService.notifyUsers(pool, [user_id], {
      title: 'Tes Notifikasi PamFlow',
      body: 'Notifikasi Push Anda berhasil terhubung dengan sistem!',
      url: '/profile/user'
    });
    res.status(200).json({ message: 'Test notification sent' });
  } catch (err) {
    console.error('[PushController] Test push error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const registerFCM = async (req, res) => {
  const { token, user_id, device_name, platform } = req.body;
  const pool = req.app.get('pool');

  if (!token || !user_id) {
    return res.status(400).json({ message: 'Token and user_id are required' });
  }

  try {
    await pool.query(`
      INSERT INTO fcm_tokens (user_id, token, device_name, platform)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      device_name = VALUES(device_name),
      platform = VALUES(platform)
    `, [user_id, token, device_name || null, platform || 'android']);

    res.status(201).json({ message: 'FCM token registered successfully' });
  } catch (err) {
    console.error('[PushController] Register FCM error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const unregisterFCM = async (req, res) => {
  const { token } = req.body;
  const pool = req.app.get('pool');

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    await pool.query('DELETE FROM fcm_tokens WHERE token = ?', [token]);
    res.status(200).json({ message: 'FCM token unregistered successfully' });
  } catch (err) {
    console.error('[PushController] Unregister FCM error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  testPush,
  registerFCM,
  unregisterFCM
};
