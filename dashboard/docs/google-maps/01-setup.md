# Google Maps Setup in Next.js

## 1. Prerequisites
- **Google Cloud Console:** Create a project and enable the **Maps JavaScript API**.
- **API Key:** Generate an API key with appropriate restrictions (HTTP referrers in production).
- **Map ID (Recommended):** Create a Map ID in the Cloud Console for vector maps, custom styles, and to use `AdvancedMarker`.

## 2. Installation
We use the official Google Maps React wrapper library: `@vis.gl/react-google-maps`.

```bash
npm install @vis.gl/react-google-maps
```

> **Note:** If using Next.js 15+ (React 19), you might face peer dependency issues. Use `--force` or `--legacy-peer-deps` during installation if needed.

## 3. Environment Variables
Store the API key securely. In Next.js, use the `NEXT_PUBLIC_` prefix to expose it to the browser (which is required since the Maps API loads on the client side).

Add the following to `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_api_key_here"
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID="your_map_id_here" # Optional but recommended
```

## 4. Architectural Considerations
- The `@vis.gl/react-google-maps` library relies on browser-only objects (like `window`).
- Therefore, any Next.js component interacting with the map **must be a Client Component** (`'use client'`).
