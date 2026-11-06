importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey: "AIzaSyDUc0KskHxS9AfOe0fLJaj1InVeJ3kuc4E",
  authDomain: "ropuxpanel.firebaseapp.com",
  projectId: "ropuxpanel",
  storageBucket: "ropuxpanel.firebasestorage.app",
  messagingSenderId: "807747162726",
  appId: "1:807747162726:web:d8455d08e1da6069d453a7"
});
// notification payload থাকলে FCM নিজেই দেখায়; click করলে site খুলবে
const messaging = firebase.messaging();
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(l => {
    for (const c of l) if ("focus" in c) return c.focus();
    return clients.openWindow("/");
  }));
});
