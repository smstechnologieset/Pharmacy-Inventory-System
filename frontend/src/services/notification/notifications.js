const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Convert VAPID public key from base64 to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Register service worker
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('✅ Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Notifications are not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Subscribe to push notifications
// Subscribe to push notifications
export const subscribeToPush = async (userId, pharmacyId) => {
  try {
    // Register service worker if not already registered
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Service worker registration failed');
    }

    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      throw new Error('Notification permission denied');
    }

    // Get VAPID public key from backend
    const vapidResponse = await fetch(`${API_URL}/notifications/vapid-public-key`);
    const { publicKey } = await vapidResponse.json();

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Send subscription to backend WITH PHARMACY ID
    const response = await fetch(`${API_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: userId || 'anonymous',
        pharmacyId: pharmacyId || null, // 👈 ADD THIS
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }

    console.log('✅ Subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('❌ Failed to subscribe:', error);
    throw error;
  }
};
// Unsubscribe from push notifications
export const unsubscribeFromPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('No active subscription');
      return;
    }

    // Unsubscribe from push manager
    await subscription.unsubscribe();

    // Notify backend
    await fetch(`${API_URL}/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });

    console.log('✅ Unsubscribed from push notifications');
  } catch (error) {
    console.error('❌ Failed to unsubscribe:', error);
    throw error;
  }
};

// Check if user is subscribed
export const isSubscribed = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    return false;
  }
};

// Trigger stock check notification (call this after updating stock)
export const triggerStockNotification = async (medicineData) => {
  try {
    const response = await fetch(`${API_URL}/notifications/check-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(medicineData),
    });

    if (!response.ok) {
      throw new Error('Failed to trigger notification');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Failed to trigger stock notification:', error);
    throw error;
  }
};
