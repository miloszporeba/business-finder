import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

config(); // załaduj .env

const app = express();
const PORT = 3001;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API = 'https://places.googleapis.com/v1/places:searchText';

app.use(cors());
app.use(express.json());

// Helper: wywołaj Places Text Search
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

// Krok 1: Geocode — znajdź współrzędne lokalizacji
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

// Krok 2: Szukaj firm w okolicy współrzędnych
// Używamy locationRestriction (nie Bias!) — wyniki MUSZĄ być w prostokącie
async function searchNearby(lat, lng, radiusMeters, query, pageToken) {
  // Oblicz bounding box z promienia
  const dlat = radiusMeters / 111320.0;
  const dlng = radiusMeters / (111320.0 * Math.cos(lat * Math.PI / 180));

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

// Główny endpoint wyszukiwania
app.get('/api/search', async (req, res) => {
  const { location, radius } = req.query;
  if (!location) return res.status(400).json({ error: 'Brak lokalizacji' });

  const radiusMeters = Number(radius) || 5000;

  try {
    // Krok 1: Znajdź współrzędne
    console.log(`\n� Szukam lokalizacji: "${location}"...`);
    const geo = await geocodeLocation(location);
    console.log(`📍 Znaleziono: ${geo.name} (${geo.lat}, ${geo.lng})`);

    // Krok 2: Szukaj firm w okolicy — robimy kilka zapytań z różnymi frazami
    // aby zebrać jak najwięcej wyników
    const searchQueries = [
      'firma',
      'sklep',
      'usługi',
      'restauracja',
      'warsztat',
      'gabinet',
      'biuro',
    ];

    const allPlaces = new Map(); // deduplikacja po adresie + nazwie
    let totalApiCalls = 0;

    for (const query of searchQueries) {
      let pageToken = null;
      let pageNum = 0;
      const maxPages = 3;

      do {
        const data = await searchNearby(geo.lat, geo.lng, radiusMeters, query, pageToken);
        totalApiCalls++;

        if (data.error) {
          console.log(`  ⚠️ Błąd dla "${query}": ${data.error.message}`);
          break;
        }

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

        console.log(`  📄 "${query}" strona ${pageNum}: +${places.length} (unikalne: ${allPlaces.size})`);
      } while (pageToken && pageNum < maxPages);
    }

    const results = Array.from(allPlaces.values());

    console.log(`✅ Gotowe! ${results.length} unikalnych firm (${totalApiCalls} zapytań API)`);

    res.json({
      results,
      total: results.length,
      location: geo.name,
      formattedAddress: geo.address,
      coordinates: { lat: geo.lat, lng: geo.lng },
    });
  } catch (err) {
    console.error('❌ Błąd:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server działa na http://localhost:${PORT}`);
  console.log(`📝 Używa Places API (New) — Text Search`);
});
