// Vercel Serverless Function — /api/search
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API = 'https://places.googleapis.com/v1/places:searchText';

async function placesTextSearch(body, fieldMask) {
  const response = await fetch(PLACES_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function geocodeLocation(location) {
  const data = await placesTextSearch(
    { textQuery: `${location}, Polska`, languageCode: 'pl', regionCode: 'PL', pageSize: 1 },
    'places.displayName,places.location,places.formattedAddress'
  );

  if (data.error) throw new Error(data.error.message);
  if (!data.places?.length) throw new Error(`Nie znaleziono lokalizacji: "${location}"`);

  const place = data.places[0];
  return {
    lat: place.location.latitude,
    lng: place.location.longitude,
    name: place.displayName?.text || location,
    address: place.formattedAddress || '',
  };
}

async function searchNearby(lat, lng, radiusMeters, query, pageToken) {
  const dlat = radiusMeters / 111320;
  const dlng = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));

  const body = {
    textQuery: query,
    languageCode: 'pl',
    regionCode: 'PL',
    pageSize: 20,
    locationRestriction: {
      rectangle: {
        low: { latitude: lat - dlat, longitude: lng - dlng },
        high: { latitude: lat + dlat, longitude: lng + dlng },
      },
    },
  };

  if (pageToken) {
    body.pageToken = pageToken;
  }

  const fieldMask = [
    'places.displayName',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.rating',
    'places.userRatingCount',
    'places.googleMapsUri',
    'places.primaryTypeDisplayName',
    'places.types',
    'places.businessStatus',
    'nextPageToken',
  ].join(',');

  return placesTextSearch(body, fieldMask);
}

// --- Proste zabezpieczenia ---
const ALLOWED_ORIGINS = [
  'https://business-finder-nine.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Rate limiting per IP (in-memory, resetuje się przy cold start ~co kilka min)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuta
const RATE_LIMIT_MAX = 5; // max 5 wyszukiwań / minutę / IP

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return false;
  return true;
}

export default async function handler(req, res) {
  // Sprawdź origin — zezwól tylko na Twoją domenę i localhost
  const origin = req.headers.origin || req.headers.referer || '';
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));

  if (origin && !isAllowed) {
    return res.status(403).json({ error: 'Niedozwolone źródło' });
  }

  // CORS — tylko dla dozwolonych originów
  const corsOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Tylko GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  // Rate limit per IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Zbyt wiele zapytań. Spróbuj za minutę.' });
  }

  // Sprawdź autoryzację (token z /api/auth)
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Brak autoryzacji. Zaloguj się.' });
  }
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const appPassword = process.env.APP_PASSWORD;
    if (!decoded.startsWith(`${appPassword}:`)) {
      return res.status(401).json({ error: 'Nieprawidłowy token.' });
    }
  } catch {
    return res.status(401).json({ error: 'Nieprawidłowy token.' });
  }

  const { location, radius } = req.query;
  if (!location) return res.status(400).json({ error: 'Brak lokalizacji' });
  if (!API_KEY) return res.status(500).json({ error: 'Brak klucza API (GOOGLE_PLACES_API_KEY)' });

  const radiusMeters = Number(radius) || 5000;

  try {
    const geo = await geocodeLocation(location);

    const searchQueries = [
      'firma', 'sklep', 'usługi', 'restauracja',
      'warsztat', 'gabinet', 'biuro',
    ];

    const allPlaces = new Map();

    for (const query of searchQueries) {
      let pageToken = null;
      let pageNum = 0;
      const maxPages = 3;

      do {
        const data = await searchNearby(geo.lat, geo.lng, radiusMeters, query, pageToken);

        if (data.error) break;

        const places = data.places || [];
        for (const place of places) {
          const key = `${place.displayName?.text}|${place.formattedAddress}`;
          if (!allPlaces.has(key)) {
            allPlaces.set(key, {
              name: place.displayName?.text || '',
              address: place.formattedAddress || '',
              phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
              website: place.websiteUri || null,
              rating: place.rating || null,
              totalRatings: place.userRatingCount || 0,
              googleMapsUrl: place.googleMapsUri || null,
              category: place.primaryTypeDisplayName?.text || '',
              types: place.types || [],
              isOpen: null,
              businessStatus: place.businessStatus || null,
            });
          }
        }

        pageToken = data.nextPageToken || null;
        pageNum++;
      } while (pageToken && pageNum < maxPages);
    }

    const results = Array.from(allPlaces.values());

    res.json({
      results,
      total: results.length,
      location: geo.name,
      formattedAddress: geo.address,
      coordinates: { lat: geo.lat, lng: geo.lng },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
