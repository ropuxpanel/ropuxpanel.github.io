// Cloudflare Worker — admin approve করলে user কে FCM push পাঠায়
// Secrets/Vars (Settings → Variables):
//   SERVICE_ACCOUNT = Firebase service account JSON (Secret)  [Project settings → Service accounts → Generate key]
//   API_KEY         = firebase apiKey (config.js এর)
//   ADMIN_EMAILS    = csm.mohasin@gmail.com   (comma separated)
//   SITE_URL        = https://তোমারনাম.github.io/
//   ALLOW_ORIGIN    = https://তোমারনাম.github.io
const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64s = s => b64(new TextEncoder().encode(s));

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

export default {
  async fetch(req, env) {
    const cors = { "Access-Control-Allow-Origin": env.ALLOW_ORIGIN, "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("no", { status: 405, headers: cors });
    try {
      // admin যাচাই
      const idToken = (req.headers.get("Authorization") || "").replace("Bearer ", "");
      const v = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + env.API_KEY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
      const u = ((await v.json()).users || [])[0];
      const admins = env.ADMIN_EMAILS.split(",").map(s => s.trim().toLowerCase());
      if (!u || !u.emailVerified || !admins.includes((u.email || "").toLowerCase())) return new Response("forbidden", { status: 403, headers: cors });

      const { tokens, title, body } = await req.json();
      const sa = JSON.parse(env.SERVICE_ACCOUNT), at = await accessToken(sa);
      const res = await Promise.all((tokens || []).slice(0, 10).map(t => fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST", headers: { Authorization: "Bearer " + at, "Content-Type": "application/json" },
        body: JSON.stringify({ message: { token: t, notification: { title, body }, webpush: { fcm_options: { link: env.SITE_URL } } } })
      }).then(r => r.status)));
      return new Response(JSON.stringify(res), { headers: cors });
    } catch (e) { return new Response(String(e), { status: 500, headers: cors }); }
  }
};
