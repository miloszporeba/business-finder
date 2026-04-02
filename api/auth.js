// Vercel Serverless Function — /api/auth
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  const { password } = req.body || {};
  const APP_PASSWORD = process.env.APP_PASSWORD;

  if (!APP_PASSWORD) {
    return res.status(500).json({ error: 'Hasło nie jest skonfigurowane na serwerze' });
  }

  if (password === APP_PASSWORD) {
    // Prosty token — hash hasła + secret
    const token = Buffer.from(`${APP_PASSWORD}:${Date.now()}`).toString('base64');
    return res.json({ ok: true, token });
  }

  return res.status(401).json({ error: 'Nieprawidłowe hasło' });
}
