// Cloudflare Worker — push (FCM) + email (Resend)
// Secrets/Vars (Settings → Variables and Secrets):
//   SERVICE_ACCOUNT    = Firebase service account JSON (Secret)
//   RESEND_API_KEY     = Resend API key (Secret)
//   API_KEY            = firebase apiKey
//   ADMIN_EMAILS       = csm.mohasin@gmail.com   (comma separated; admin login)
//   ADMIN_NOTIFY_EMAIL = যে ইমেইলে নতুন order এর মেইল আসবে (সাধারণত admin এর Gmail)
//   MAIL_FROM          = Ropu Panel Zone Admin <noreply@তোমার-verified-domain.com>
//   SITE_URL           = https://তোমারনাম.github.io/
//   ALLOW_ORIGIN       = https://তোমারনাম.github.io
const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64s = s => b64(new TextEncoder().encode(s));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64s(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64s(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(head + "." + claim));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + head + "." + claim + "." + b64(sig) });
  return (await r.json()).access_token;
}

// ইউজারের ID token যাচাই
async function whoami(idToken, env) {
  const v = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + env.API_KEY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
  const u = ((await v.json()).users || [])[0];
  return u ? { uid: u.localId, email: (u.email || "").toLowerCase(), verified: !!u.emailVerified } : null;
}

// order টা Firestore থেকে সরাসরি পড়া (caller এর নিজের token দিয়ে, তাই rules প্রযোজ্য)
async function getOrder(id, idToken, projectId) {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/orders/${encodeURIComponent(id)}`, { headers: { Authorization: "Bearer " + idToken } });
  if (!r.ok) return null;
  const f = (await r.json()).fields || {};
  const o = {}; for (const k in f) { const v = f[k]; o[k] = v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? null; }
  return o;
}

async function sendMail(env, to, subject, html) {
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, html }) });
  return r.status;
}

const row = (k, v) => `<tr><td style="padding:6px 12px;color:#666">${k}</td><td style="padding:6px 12px"><b>${esc(v)}</b></td></tr>`;
const wrap = (title, body) => `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #eee;border-radius:12px;padding:20px"><h2 style="margin-top:0">${title}</h2>${body}<p style="color:#999;font-size:12px;margin-top:24px">Ropu Panel Zone Admin</p></div>`;

export default {
  async fetch(req, env) {
    const cors = { "Access-Control-Allow-Origin": env.ALLOW_ORIGIN, "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS" };
    const out = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: cors });
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("no", { status: 405, headers: cors });
    try {
      const idToken = (req.headers.get("Authorization") || "").replace("Bearer ", "");
      const me = await whoami(idToken, env);
      if (!me) return out({ error: "unauthorized" }, 401);
      const admins = env.ADMIN_EMAILS.split(",").map(s => s.trim().toLowerCase());
      const isAdmin = me.verified && admins.includes(me.email);
      const sa = JSON.parse(env.SERVICE_ACCOUNT);
      const { type, orderId, tokens } = await req.json();
      const o = await getOrder(orderId, idToken, sa.project_id);
      if (!o) return out({ error: "order not found" }, 404);

      // ---- নতুন order → admin কে মেইল ----
      if (type === "new_order") {
        if (o.uid !== me.uid || o.status !== "pending") return out({ error: "forbidden" }, 403);
        const html = wrap("🛒 নতুন Order এসেছে", `<table style="border-collapse:collapse;width:100%">
          ${row("Order ID", orderId)}${row("ফাইল", o.fileName)}${row("দাম", "৳" + o.price)}${row("User", o.userName)}${row("Email", o.email)}
          ${row("Method", o.method)}${row("TrxID", o.trxId)}${row("Sender", o.senderNumber)}</table>
          <p><a href="${esc(env.SITE_URL)}admin.html">Admin Panel খুলুন</a></p>`);
        return out({ mail: await sendMail(env, env.ADMIN_NOTIFY_EMAIL, `নতুন Order: ${o.fileName} (৳${o.price})`, html) });
      }

      // ---- approve → user কে মেইল + push ----
      if (type === "approved") {
        if (!isAdmin) return out({ error: "forbidden" }, 403);
        if (o.status !== "approved") return out({ error: "not approved" }, 400);
        const html = wrap("✅ আপনার Payment Approved হয়েছে", `<p>${esc(o.userName)}, আপনার অর্ডার ভেরিফাই হয়েছে।</p>
          <table style="border-collapse:collapse;width:100%">${row("Order ID", orderId)}${row("ফাইল", o.fileName)}${row("দাম", "৳" + o.price)}${row("TrxID", o.trxId)}</table>
          <p style="color:#b45309">⚠ এটা paid ফাইল — একবারই ডাউনলোড করা যাবে।</p>
          <p><a href="${esc(env.SITE_URL)}" style="background:#16a34a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">সাইটে গিয়ে ডাউনলোড করুন</a></p>`);
        const mail = await sendMail(env, o.email, `Payment Approved: ${o.fileName}`, html);
        let push = [];
        if (tokens && tokens.length) {
          const at = await accessToken(sa);
          push = await Promise.all(tokens.slice(0, 10).map(t => fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
            method: "POST", headers: { Authorization: "Bearer " + at, "Content-Type": "application/json" },
            body: JSON.stringify({ message: { token: t, notification: { title: "✅ Payment Approved", body: `${o.fileName} এখন ডাউনলোড করতে পারবে (একবারই)` }, webpush: { fcm_options: { link: env.SITE_URL } } } })
          }).then(r => r.status)));
        }
        return out({ mail, push });
      }
      return out({ error: "bad type" }, 400);
    } catch (e) { return out({ error: String(e) }, 500); }
  }
};
