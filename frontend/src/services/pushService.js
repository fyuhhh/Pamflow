import { authFetch } from './api';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

let listenersCreated = false;

function setupNativePushListeners(userId) {
  if (listenersCreated) return;

  PushNotifications.addListener('registration', async (token) => {
    console.log('[PushService] Native token registered:', token.value);
    try {
      const response = await authFetch('/api/push/register-fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.value,
          user_id: userId,
          device_name: navigator.userAgent,
          platform: Capacitor.getPlatform()
        })
      });
      if (response.ok) {
        console.log('[PushService] FCM token saved to server');
        localStorage.setItem('fcm_token', token.value);
      }
    } catch (err) {
      console.error('[PushService] Error saving FCM token to server:', err);
    }
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('[PushService] Native push registration error:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[PushService] Native push notification received:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('[PushService] Native push action performed:', notification);
    const url = notification.notification.data?.url;
    if (url) {
      window.location.href = url;
    }
  });

  listenersCreated = true;
}

async function subscribeNativePush(userId) {
  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') {
      console.warn('[PushService] Native push permission not granted.');
      return { success: false, message: 'Izin notifikasi ditolak.' };
    }

    await PushNotifications.register();
    setupNativePushListeners(userId);
    return { success: true, message: 'Mendaftarkan notifikasi push native...' };
  } catch (err) {
    console.error('[PushService] Error in native push subscription:', err);
    return { success: false, message: err.message };
  }
}

async function unsubscribeNativePush() {
  const token = localStorage.getItem('fcm_token');
  if (token) {
    try {
      await authFetch('/api/push/unregister-fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      localStorage.removeItem('fcm_token');
      await PushNotifications.removeAllListeners();
      listenersCreated = false;
      console.log('[PushService] Unsubscribed native push successfully');
      return { success: true, message: 'Notifikasi push native dinonaktifkan.' };
    } catch (err) {
      console.error('[PushService] Error unregistering FCM token:', err);
      return { success: false, message: err.message };
    }
  }
  return { success: true, message: 'Sudah tidak aktif.' };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function checkPushSubscriptionStatus() {
  if (Capacitor.isNativePlatform()) {
    try {
      const permStatus = await PushNotifications.checkPermissions();
      return permStatus.receive === 'granted';
    } catch (err) {
      console.error('[PushService] Error checking native permission:', err);
      return false;
    }
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (err) {
    console.error('[PushService] Error checking status:', err);
    return false;
  }
}

export async function subscribeToPushNotifications(userId, silent = false) {
  if (Capacitor.isNativePlatform()) {
    return subscribeNativePush(userId);
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported by this browser.');
    return { success: false, message: 'Browser tidak mendukung notifikasi push.' };
  }

  // If silent is true, we only proceed if permission is already granted
  if (silent && Notification.permission !== 'granted') {
    return { success: false, message: 'Izin notifikasi belum diberikan.' };
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Push notification permission denied.');
    return { success: false, message: 'Izin notifikasi ditolak oleh pengguna.' };
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
    }
    
    // Wait until active
    if (!registration.active) {
      await navigator.serviceWorker.ready;
    }
    
    // Check if subscription already exists
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      console.log('[PushService] New subscription created');
    }

    // Send subscription to backend
    const response = await authFetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        user_id: userId
      })
    });

    if (response.ok) {
      console.log('[PushService] Subscription saved to server');
      return { success: true, message: 'Notifikasi push berhasil diaktifkan.' };
    } else {
      console.error('[PushService] Failed to save subscription to server');
      return { success: false, message: 'Gagal menyimpan konfigurasi notifikasi di server.' };
    }
  } catch (err) {
    console.error('[PushService] Error during push subscription:', err);
    return { success: false, message: `Terjadi kesalahan: ${err.message}` };
  }
}

export async function unsubscribeFromPushNotifications() {
  if (Capacitor.isNativePlatform()) {
    return unsubscribeNativePush();
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, message: 'Browser tidak mendukung notifikasi push.' };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return { success: true, message: 'Sudah tidak aktif.' };
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // Unsubscribe locally
      await subscription.unsubscribe();
      
      // Notify backend
      await authFetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      
      console.log('[PushService] Unsubscribed successfully');
      return { success: true, message: 'Notifikasi push berhasil dinonaktifkan.' };
    }
    return { success: true, message: 'Sudah tidak aktif.' };
  } catch (err) {
    console.error('[PushService] Error during unsubscribe:', err);
    return { success: false, message: `Terjadi kesalahan: ${err.message}` };
  }
}

export async function testPushNotification(userId) {
  try {
    const response = await authFetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (response.ok) {
      return { success: true, message: 'Notifikasi tes berhasil dikirim.' };
    } else {
      return { success: false, message: 'Gagal mengirim notifikasi tes.' };
    }
  } catch (err) {
    console.error('[PushService] Error testing notification:', err);
    return { success: false, message: `Terjadi kesalahan: ${err.message}` };
  }
}
