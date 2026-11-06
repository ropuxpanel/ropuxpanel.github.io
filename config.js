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
export const ADMIN_EMAILS = ["coyonkhan2738@gmail.com"];

export const SITE_NAME = "Ropu Panel Zone";

// Push notification (Firebase Console → Project settings → Cloud Messaging → Web Push certificates → Generate key pair)
export const VAPID_KEY = "BCil0IOTus9IFmpTm4crylv8jYgnehsEBs1FF8MTrA8JQJyVWwaDI0gE1d8nYEyRo8Yl_N9eotmcyCz5XsfjfhM";
// Cloudflare Worker URL (notify-worker.js deploy করার পর বসাও)
export const NOTIFY_URL = "https://ropu.csm-mohasin.workers.dev/";

// GitHub Release এ বড় ফাইল upload (repo public হতে হবে). Token এখানে দিও না! admin panel এ প্রথমবার চাইবে।
export const GH_OWNER = "তোমার-github-username";
export const GH_REPO = "files-storage";
