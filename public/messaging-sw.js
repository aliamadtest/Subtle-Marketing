/* public/firebase-messaging-sw.js */
/* global importScripts, firebase */
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

// ⬇️ YAHAN apni EXACT Firebase config paste karo
// (same as src/firebase/config.js)
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "expence-tracker-web.firebaseapp.com",
  projectId: "expence-tracker-web",
  messagingSenderId: "355120977754",
  appId: "1:355120977754:web:7b0e7fb6274a6630ed8563",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Expense Alert", {
    body: body || "New expense added",
    icon: "/vite.svg",
    data: payload?.data || {},
  });
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = "https://your-domain-or-localhost:5173/"; // apni app ka URL
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.startsWith(url) && "focus" in client)
            return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
