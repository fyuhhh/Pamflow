const webpush = require('web-push');
require('dotenv').config();

// Configure web-push
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@pamflow.com';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    vapidEmail,
    publicVapidKey,
    privateVapidKey
  );
  console.log('[PushService] VAPID details set successfully.');
} else {
  console.warn('[PushService] VAPID keys missing in .env. Push notifications will not work.');
}

/**
 * Send a notification to a specific user's subscriptions
 * @param {Object} pool - DB Pool
 * @param {number} userId - User ID to notify
 * @param {Object} payload - Notification payload (title, body, etc)
 */
async function sendNotification(pool, userId, payload) {
  try {
    const [subscriptions] = await pool.query(
      'SELECT * FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    if (subscriptions.length === 0) {
      // console.log(`[PushService] No subscriptions found for user ${userId}`);
      return;
    }

    const payloadString = JSON.stringify(payload);

    const notificationPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payloadString);
        // console.log(`[PushService] Notification sent to ${sub.endpoint}`);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired or invalid, remove it
          console.log(`[PushService] Subscription invalid, removing: ${sub.id}`);
          await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
        } else {
          console.error(`[PushService] Error sending to subscription ${sub.id}:`, err.message);
        }
      }
    });

    await Promise.all(notificationPromises);

    // Send native push notifications via Firebase Cloud Messaging (FCM)
    try {
      const [fcmRows] = await pool.query(
        'SELECT token FROM fcm_tokens WHERE user_id = ?',
        [userId]
      );
      if (fcmRows && fcmRows.length > 0) {
        const tokens = fcmRows.map(row => row.token);
        const { sendFcmNotification } = require('./firebaseService');
        await sendFcmNotification(tokens, {
          title: payload.title,
          body: payload.body,
          data: {
            url: payload.url || '/'
          }
        });
      }
    } catch (err) {
      console.error('[PushService] Error querying/sending FCM:', err.message);
    }
  } catch (err) {
    console.error('[PushService] Error in sendNotification:', err.message);
  }
}

/**
 * Send notification to multiple users
 * @param {Object} pool 
 * @param {Array<number>} userIds 
 * @param {Object} payload 
 */
async function notifyUsers(pool, userIds, payload) {
  if (!Array.isArray(userIds)) return;
  
  for (const userId of userIds) {
    await sendNotification(pool, userId, payload);
  }
}

module.exports = {
  sendNotification,
  notifyUsers
};
