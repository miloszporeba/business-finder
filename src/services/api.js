const API_BASE = '/api';

export function getToken() {
  return sessionStorage.getItem('bf_token');
}

export function setToken(token) {
  sessionStorage.setItem('bf_token', token);
}

export function clearToken() {
  sessionStorage.removeItem('bf_token');
}

export async function authenticate(password) {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Błąd logowania');
  setToken(data.token);
  return true;
}

export async function searchBusinesses(location, radius) {
  const token = getToken();
  const url = `${API_BASE}/search?location=${encodeURIComponent(location)}&radius=${radius}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
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
