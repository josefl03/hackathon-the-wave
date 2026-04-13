# Google Maps Implementation (App Router)

Because the Google Maps API requires the browser environment, your map components must be designated as Client Components.

## 1. Create a Reusable Map Component

Wrap the map logic in its own Client Component (e.g., `components/Map.tsx`). This allows you to import it seamlessly into Server Components on any page.

```tsx
'use client';

import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps';

export default function Map() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  // Example default coordinates (e.g., Madrid)
  const defaultPosition = { lat: 40.4168, lng: -3.7038 };

  if (!apiKey) {
    return <div className="p-4 bg-red-100 text-red-700">Missing Google Maps API Key</div>;
  }

  return (
    // APIProvider loads the Google Maps JavaScript API
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full min-h-[400px]">
        <GoogleMap
          defaultCenter={defaultPosition}
          defaultZoom={13}
          mapId={mapId}
        >
          {/* AdvancedMarker is the modern replacement for Marker */}
          <AdvancedMarker position={defaultPosition} />
        </GoogleMap>
      </div>
    </APIProvider>
  );
}
```

## 2. Usage Inside a Server Component

Once the Map is a Client Component, it can be safely used inside a Next.js Server Component without errors (Next.js automatically handles SSR for client components up to the boundary).

```tsx
// app/page.tsx (Server Component)

import Map from '@/components/Map';

export default function DashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Location Dashboard</h1>
      
      {/* Container to dictate map size */}
      <div className="w-full h-[500px] border rounded-xl overflow-hidden shadow-sm">
        <Map />
      </div>
    </main>
  );
}
```

## 3. Best Practices & Optimization

1.  **Avoid Multiple API Providers:** If you have multiple map components mounted across your application on the *same page*, move `<APIProvider>` to a higher-level layout or wrapper component. This prevents the Google Scripts from being injected multiple times.
2.  **`AdvancedMarker` over `Marker`:** Google is deprecating legacy standard markers. Always use `AdvancedMarker`. For `AdvancedMarker` to work, providing a `mapId` to the `<Map>` component is mandatory. 
3.  **Sizing:** The map container *must* have explicit height/width styling (e.g., via CSS or Tailwind `h-[500px] w-full`), otherwise the map will collapse to a height of 0px.
