// ====== শুধু এই ফাইলটা এডিট করো ======
export const firebaseConfig = {
  apiKey: "AIzaSyDUc0KskHxS9AfOe0fLJaj1InVeJ3kuc4E",
  authDomain: "ropuxpanel.firebaseapp.com",
  projectId: "ropuxpanel",
  storageBucket: "ropuxpanel.firebasestorage.app",
  messagingSenderId: "807747162726",
  appId: "1:807747162726:web:d8455d08e1da6069d453a7"
};

export const CLOUD_NAME = "trd4esoa";
export const UPLOAD_PRESET = "ropubd";

// এই ইমেইলগুলো admin হবে (firestore.rules এও একই ইমেইল দিতে হবে)
export const ADMIN_EMAILS = ["csm.mohasin@gmail.com"];

export const SITE_NAME = "CSM Store";

// Push notification (Firebase Console → Project settings → Cloud Messaging → Web Push certificates → Generate key pair)
export const VAPID_KEY = "";
// Cloudflare Worker URL (notify-worker.js deploy করার পর বসাও)
export const NOTIFY_URL = "";
