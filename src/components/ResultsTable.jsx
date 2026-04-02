import { useState, useMemo } from 'react';

export default function ResultsTable({ results, locationName }) {
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter) return results;
    const lc = filter.toLowerCase();
    return results.filter(
      (r) =>
        r.name?.toLowerCase().includes(lc) ||
        r.address?.toLowerCase().includes(lc) ||
        r.phone?.toLowerCase().includes(lc) ||
        r.types?.some((t) => t.toLowerCase().includes(lc))
    );
  }, [results, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';

      if (sortField === 'rating') {
        aVal = a.rating ?? 0;
        bVal = b.rating ?? 0;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal), 'pl')
        : String(bVal).localeCompare(String(aVal), 'pl');
    });
  }, [filtered, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field) => {
    if (sortField !== field) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const formatTypes = (types) => {
    if (!types?.length) return '—';
    return types
      .filter((t) => !['point_of_interest', 'establishment'].includes(t))
      .slice(0, 3)
      .map((t) => t.replace(/_/g, ' '))
      .join(', ') || '—';
  };

  const exportCSV = () => {
    const headers = ['Nazwa', 'Adres', 'Telefon', 'Strona WWW', 'Ocena', 'Liczba opinii'];
    const rows = sorted.map((r) => [
      r.name || '',
      r.address || '',
      r.phone || '',
      r.website || '',
      r.rating || '',
      r.totalRatings || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firmy_${locationName || 'wyniki'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!results.length) return null;

  return (
    <div className="results-section">
      <div className="results-header">
        <h2>
          📋 Znaleziono <span className="count">{results.length}</span> firm
          {locationName && <span className="location-tag"> w okolicy: {locationName}</span>}
        </h2>

        <div className="results-actions">
          <input
            type="text"
            className="filter-input"
            placeholder="Filtruj wyniki..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="export-btn" onClick={exportCSV}>
            📥 Eksport CSV
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="th-num">#</th>
              <th className="sortable" onClick={() => handleSort('name')}>
                Nazwa{sortIcon('name')}
              </th>
              <th className="sortable" onClick={() => handleSort('address')}>
                Adres{sortIcon('address')}
              </th>
              <th>Telefon</th>
              <th>WWW</th>
              <th className="sortable" onClick={() => handleSort('rating')}>
                Ocena{sortIcon('rating')}
              </th>
              <th>Kategoria</th>
              <th>Maps</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((place, idx) => (
              <tr key={idx}>
                <td className="td-num">{idx + 1}</td>
                <td className="td-name">
                  <strong>{place.name}</strong>
                  {place.isOpen !== null && (
                    <span className={`status ${place.isOpen ? 'open' : 'closed'}`}>
                      {place.isOpen ? 'Otwarte' : 'Zamknięte'}
                    </span>
                  )}
                </td>
                <td className="td-address">{place.address || '—'}</td>
                <td className="td-phone">
                  {place.phone ? (
                    <a href={`tel:${place.phone}`}>{place.phone}</a>
                  ) : (
                    <span className="no-data">—</span>
                  )}
                </td>
                <td className="td-website">
                  {place.website ? (
                    <a href={place.website} target="_blank" rel="noopener noreferrer" title={place.website}>
                      🌐 Strona
                    </a>
                  ) : (
                    <span className="no-data">—</span>
                  )}
                </td>
                <td className="td-rating">
                  {place.rating ? (
                    <span className="rating">
                      ⭐ {place.rating}
                      <small>({place.totalRatings})</small>
                    </span>
                  ) : (
                    <span className="no-data">—</span>
                  )}
                </td>
                <td className="td-types">{formatTypes(place.types)}</td>
                <td className="td-maps">
                  {place.googleMapsUrl && (
                    <a href={place.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                      🗺️
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filter && (
        <p className="filter-info">
          Wyświetlono {sorted.length} z {results.length} wyników
        </p>
      )}
    </div>
  );
}
