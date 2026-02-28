# KTMB Live Tracker

A production-ready, high-performance live train tracker for KTMB (Keretapi Tanah Melayu Berhad) using the official Malaysia GTFS Static API.

## Features

- **Dynamic GTFS Integration**: Fetches and parses official ZIP data on-the-fly via a Next.js Proxy API.
- **Dark Railway Control Theme**: Custom dark map tiles and glassmorphism UI.
- **Real-time Simulation**: Interpolates train positions along shapes for smooth visual tracking.
- **Route Filtering**: Filter between ETS, Komuter, and Intercity routes.
- **PWA Ready**: Installable on mobile and desktop with offline support.
- **Optimized Performance**: Server-side parsing, ISR caching, and lazy-loaded map components.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Mapping**: Leaflet.js
- **Data Parsing**: Adm-Zip & CSV-Parse
- **State Management**: SWR (Stale-While-Revalidate)

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/app/api/ktmb/route.ts`: API Proxy for GTFS data.
- `/components/Map.tsx`: Main map visualization.
- `/components/TrainSimulation.tsx`: Simulation engine.
- `/lib/gtfsService.ts`: GTFS parsing and transformation logic.
- `/types/gtfs.ts`: TypeScript definitions.

## PWA Icons

Please place your `icon-192x192.png` and `icon-512x512.png` in the `public/icons/` directory to complete the PWA setup.
