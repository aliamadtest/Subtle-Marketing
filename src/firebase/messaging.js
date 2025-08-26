import app from "./config";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

export const messaging = getMessaging(app);

// VAPID public key yahan do (Firebase console → Cloud Messaging → Web Push)
const VAPID_PUBLIC_KEY =
  "BKrAi-dl-I2PawXdewEKEvXuY3hE292f5WcBWEFUVrA5UgFMS40d4nvJljMRBlrpQmIHMzERSSKBSM6rPpmGj2o";

export async function requestBossToken() {
  // boss device par call karna
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification blocked");
  const token = await getToken(messaging, {
    vapidKey: VAPID_PUBLIC_KEY,
    serviceWorkerRegistration: await navigator.serviceWorker.ready,
  });
  return token;
}

export function onForeground(handler) {
  onMessage(messaging, (payload) => handler?.(payload));
}
