# 🏢 Business Finder

A web application for searching businesses and services near any location in Poland. Powered by Google Maps Platform (Places API), displaying results in a clean, interactive table.

## ✨ Features

- 🔍 Search businesses by city name or address
- 📍 Adjustable search radius (1–50 km)
- 📊 Sortable and filterable results table
- 📞 Contact details: phone, website, address
- ⭐ Google Maps ratings
- 📥 Export results to CSV
- 🔗 Direct links to Google Maps
- 🔒 Password-protected access

## 🛠 Tech Stack

- **Frontend:** React 19 + Vite
- **Backend:** Vercel Serverless Functions
- **API:** Google Places API (New) — Text Search
- **Hosting:** Vercel

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Create .env file with your keys
echo "GOOGLE_PLACES_API_KEY=your_key" > .env
echo "APP_PASSWORD=your_password" >> .env

# Run (frontend + backend)
npm run dev
```

The app will be available at `http://localhost:5173`.

## 📦 Deploy to Vercel

1. Push the repo to GitHub
2. Connect it to Vercel
3. Add environment variables:
   - `GOOGLE_PLACES_API_KEY` — Google Places API key
   - `APP_PASSWORD` — application access password

## 📝 License

Private project.
