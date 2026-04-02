const API_BASE = '/api';

export async function searchBusinesses(location, radius) {
  const url = `${API_BASE}/search?location=${encodeURIComponent(location)}&radius=${radius}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.results?.length) {
    throw new Error(`Nie znaleziono firm w okolicy: "${location}"`);
  }

  const results = data.results.map((place) => ({
    name: place.name,
    address: place.address || null,
    phone: place.phone || null,
    website: place.website || null,
    googleMapsUrl: place.googleMapsUrl || null,
    rating: place.rating || null,
    totalRatings: place.totalRatings || 0,
    types: place.category ? [place.category] : place.types || [],
    isOpen: place.isOpen ?? null,
  }));

  return {
    results,
    locationName: data.location || location,
    formattedAddress: data.formattedAddress || '',
  };
}
