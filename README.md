# HealthyCart Phlebotomist Dispatch System

An internal web application for managing a home-sample-collection service. The application enables dispatchers to assign phlebotomists to patient locations efficiently using a tactical map interface.

## Tech Stack
- **Framework**: Next.js 14
- **Database/Auth**: Firebase (Firestore & Auth)
- **Maps**: Leaflet.js (Open-Source)
- **Styling**: Tailwind CSS
- **Storage**: Cloudinary

## Core Features
- **Tactical Dashboard**: Real-time monitoring of active phlebotomists and assignments.
- **Quick Dispatch**: Rapid assignment entry from the main dashboard.
- **Live Terminal**: Proximity-based dispatching using Haversine distance calculations.
- **Phlebotomist Management**: CRUD operations with map-based base location selection and image uploads.
- **Operational History**: Detailed logging and CSV export of all assignments.

## Getting Started
1. Clone the repository.
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local` (see `.env.example`).
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment Guide

### 1. Environment Variables
Ensure the following variables are set in your hosting provider (Vercel/Netlify):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_PRESET`

### 2. Hosting (Vercel Recommended)
1. Push your code to GitHub.
2. Connect your repository to Vercel.
3. Vercel will automatically detect the Next.js framework.
4. Add the environment variables listed above.
5. Deploy.

### 3. Maps Policy
This system uses **Leaflet.js** and **CartoDB Dark Matter** tiles. It does not require a Google Maps or Mapbox API key, making it free to host and scale indefinitely.

---
*Built with HealthyCart Tactical Engine V6.2*
