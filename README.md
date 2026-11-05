# Setup (বাংলায়)

1. **Firebase Console** → Authentication → Google চালু করো। Settings → Authorized domains এ `তোমারনাম.github.io` যোগ করো।
2. Firestore Database বানাও → Rules এ `firestore.rules` পেস্ট করো (admin ইমেইল বদলে) → Publish।
3. `config.js` এ firebase config, cloud name, unsigned preset, admin email বসাও।
4. Cloudinary preset: Settings → Upload → Unsigned preset (Resource type: Auto)।
5. সব ফাইল GitHub repo তে আপলোড → Settings → Pages → main branch।
6. `/admin.html` এ গিয়ে admin ইমেইলে login → Settings ট্যাবে bKash/Nagad নম্বর ও contact দাও → ফাইল আপলোড করো।

প্রথমবার orders দেখতে Firestore index লাগলে browser console এর লিংকে ক্লিক করো।

## ⚠ নিরাপত্তা নোট
Cloudinary unsigned upload এ ফাইলের URL যে জানবে সে ডাউনলোড করতে পারবে। আমরা URL টা `secret` subcollection এ রেখেছি যাতে শুধু approved ক্রেতা পায়, কিন্তু কেউ URL শেয়ার করলে আটকানো যাবে না। বড় সিকিউরিটি লাগলে Cloudinary তে "authenticated/private" delivery ও Cloudflare Worker দিয়ে signed URL লাগবে।
