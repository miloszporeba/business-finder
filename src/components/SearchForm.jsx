import { useState } from 'react';

const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
  { value: 50000, label: '50 km' },
];

export default function SearchForm({ onSearch, isLoading }) {
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(5000);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!location.trim()) return;
    onSearch({ location: location.trim(), radius });
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="location">📍 Miejscowość / adres</label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="np. Kraków, Rynek Główny 1"
          disabled={isLoading}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="radius">📏 Promień wyszukiwania</label>
        <select
          id="radius"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          disabled={isLoading}
        >
          {RADIUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={isLoading || !location.trim()}>
        {isLoading ? (
          <span className="loading-text">
            <span className="spinner" /> Szukam...
          </span>
        ) : (
          '🔍 Szukaj firm'
        )}
      </button>
    </form>
  );
}
