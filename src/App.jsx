import { useState, useCallback } from 'react';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import ProgressBar from './components/ProgressBar';
import { searchBusinesses } from './services/api';
import './App.css';

function App() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [progress, setProgress] = useState(null);

  const handleSearch = useCallback(async ({ location, radius }) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setLocationName(location);
    setProgress({ message: '🔍 Szukam firm w Google Maps...', current: 0, total: 100 });

    try {
      const data = await searchBusinesses(location, radius);

      setResults(data.results);
      setLocationName(data.formattedAddress || data.locationName);
      setProgress(null);
    } catch (err) {
      setError(err.message);
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏢 Business Finder</h1>
        <p>Wyszukuj firmy w okolicy dowolnej lokalizacji</p>
      </header>

      <main className="app-main">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {progress && (
          <ProgressBar
            message={progress.message}
            current={progress.current}
            total={progress.total}
          />
        )}

        <ResultsTable results={results} locationName={locationName} />
      </main>

      <footer className="app-footer">
        <p>Dane z Google Maps Platform • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
