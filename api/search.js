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

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

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
