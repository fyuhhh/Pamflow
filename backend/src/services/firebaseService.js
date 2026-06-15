const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let messaging = null;

try {
  // Try loading credentials path from env or defaults to root firebase-service-account.json
  const credPath = process.env.FIREBASE_CREDENTIALS_PATH 
    ? path.resolve(process.env.FIREBASE_CREDENTIALS_PATH)
    : path.resolve(__dirname, '../../firebase-service-account.json');

  if (fs.existsSync(credPath)) {
    const serviceAccount = require(credPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    messaging = admin.messaging();
    console.log('[FirebaseService] Firebase Admin SDK initialized successfully.');
  } else {
    console.warn('[FirebaseService] firebase-service-account.json not found. Native Push Notifications will be mocked.');
  }
} catch (err) {
  console.error('[FirebaseService] Failed to initialize Firebase Admin:', err.message);
}

/**
 * Send notification to a list of FCM tokens
 * @param {Array<string>} tokens - Array of FCM registration tokens
 * @param {Object} payload - Notification payload { title, body, data }
 */
async function sendFcmNotification(tokens, payload) {
  if (!messaging) {
    console.warn('[FirebaseService] Messaging not initialized. Skipping FCM send.');
    return;
  }

  if (!tokens || tokens.length === 0) return;

  // Build the message
  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data || {},
    tokens: tokens,
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    console.log(`[FirebaseService] FCM notification status: ${response.successCount} success, ${response.failureCount} failure`);
    
    // Clean up failed tokens if needed
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log(`[FirebaseService] Failed token: ${tokens[idx]}, error:`, resp.error);
          // In production, we'd delete the invalid token from database
        }
      });
    }
  } catch (err) {
    console.error('[FirebaseService] Error sending FCM notification:', err.message);
  }
}

module.exports = {
  sendFcmNotification,
  isFcmEnabled: () => messaging !== null
};
