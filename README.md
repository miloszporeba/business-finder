# 🏢 Business Finder

Aplikacja webowa do wyszukiwania firm i działalności w okolicy dowolnej lokalizacji w Polsce. Korzysta z Google Maps Platform (Places API) i wyświetla wyniki w przejrzystej tabeli.

## ✨ Funkcje

- 🔍 Wyszukiwanie firm po nazwie miejscowości lub adresie
- 📍 Wybór promienia wyszukiwania (1–50 km)
- 📊 Tabela wyników z sortowaniem i filtrowaniem
- 📞 Dane kontaktowe: telefon, strona WWW, adres
- ⭐ Oceny z Google Maps
- 📥 Eksport wyników do CSV
- 🔗 Bezpośrednie linki do Google Maps
- 🔒 Zabezpieczenie hasłem

## 🛠 Technologie

- **Frontend:** React 19 + Vite
- **Backend:** Vercel Serverless Functions
- **API:** Google Places API (New) — Text Search
- **Hosting:** Vercel

## 🚀 Uruchomienie lokalne

```bash
# Zainstaluj zależności
npm install

# Utwórz plik .env z kluczami
echo "GOOGLE_PLACES_API_KEY=twoj_klucz" > .env
echo "APP_PASSWORD=twoje_haslo" >> .env

# Uruchom (frontend + backend)
npm run dev
```

Aplikacja będzie dostępna pod `http://localhost:5173`.

## 📦 Deploy na Vercel

1. Wrzuć repo na GitHub
2. Połącz z Vercel
3. Dodaj zmienne środowiskowe:
   - `GOOGLE_PLACES_API_KEY` — klucz do Google Places API
   - `APP_PASSWORD` — hasło dostępu do aplikacji

## 📝 Licencja

Projekt prywatny.
