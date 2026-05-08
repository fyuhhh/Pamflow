import { authFetch } from './api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

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
