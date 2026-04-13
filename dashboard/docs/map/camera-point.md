# Interactive Camera Points Implementation

## Overview
The real-time camera points plotted over the dashboard map leverage the `@vis.gl/react-google-maps` library. This documentation covers how to setup custom-styled camera icons and accurately bind popup interaction logic.

## Implementation Details

### Custom Advanced Markers
We replace the default red Google Maps selection pin with a custom interactive component. This is achieved by nesting standard DOM elements (like an icon or badge styled with Tailwind) directly inside the `<AdvancedMarker>` wrapper.

```tsx
<AdvancedMarker 
  ref={markerRef}
  position={{ lat: 38.824412, lng: 0.111315 }} 
  title="Cámara de Vigilancia"
  onClick={() => setIsCameraOpen(true)}
>
  <div className="w-12 h-12 rounded-full bg-secondary shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer hover:scale-110">
    <span className="material-symbols-outlined text-white text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>videocam</span>
  </div>
</AdvancedMarker>
```

### InfoWindow Native Anchoring
When a user clicks on the camera marker, an interactive embedded stream popup needs to open. If we simply assign raw geographical locations internally to the popup, the dialog arrow overlaps and obscures the large icon element. 

To overcome this, we natively anchor the `InfoWindow` directly to the `AdvancedMarker` entity:

1. **Get Marker Reference**: Utilize the `useAdvancedMarkerRef()` hook natively supported by `@vis.gl`:
   ```tsx
   const [markerRef, marker] = useAdvancedMarkerRef();
   ```
2. **Anchor the InfoWindow**: Passing `anchor={marker}` inherently accounts for the width and height of the custom UI button, automatically calculating the bounds so the dialogue arrow is situated elegantly above the camera icon.

```tsx
{isCameraOpen && (
  <InfoWindow anchor={marker} onCloseClick={() => setIsCameraOpen(false)}>
    <div className="flex flex-col gap-2 min-w-[240px]">
       {/* Embedded Live Feed Frame Here */}
    </div>
  </InfoWindow>
)}
```
