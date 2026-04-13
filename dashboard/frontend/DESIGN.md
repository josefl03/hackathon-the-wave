# Design System Document: Nature Monitoring Dashboard

## 1. Overview & Creative North Star
**The Creative North Star: "The Curated Ecosystem"**

This design system moves away from the clinical, high-contrast rigidity of traditional SaaS dashboards. Instead, it adopts an editorial approach—blending the precision of corporate data with the serenity of a high-end botanical journal. We are not just displaying data; we are "curating" the natural world.

To break the "template" look, designers must embrace **Intentional Asymmetry**. Heavy data visualizations should be balanced by expansive white space (using the `surface` token) and organic, overlapping elements. This system prioritizes tonal depth over structural lines, ensuring the dashboard feels like an extension of the environment it monitors rather than a digital barrier.

---

## 2. Colors & Surface Philosophy

The palette is rooted in matte, earthy tones that mimic the shifting light of a forest canopy. 

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are prohibited for sectioning. Boundaries must be defined solely through background color shifts or subtle tonal transitions. Use `surface-container-low` for large content areas sitting on a `surface` background to create a "pasted" paper effect without a single line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of heavy-weight recycled paper.
*   **Background (`surface` / `#f8fce2`):** The foundational "tabletop."
*   **Content Areas (`surface-container-low`):** Large sections for grouped data.
*   **Actionable Elements (`surface-container-lowest` / `#ffffff`):** High-priority cards or inputs that need to "pop" forward.
*   **Contextual Overlays (`surface-container-highest`):** For navigation or secondary sidebars that sit "behind" the main stage.

### The "Glass & Gradient" Rule
To add a premium "soul," use subtle radial gradients on Primary CTAs (transitioning from `primary` to `primary_container`). For floating utility panels (e.g., map controls), use **Glassmorphism**: 
*   **Fill:** `surface_variant` at 60% opacity.
*   **Effect:** `backdrop-blur: 12px`.
*   **Result:** The UI feels integrated into the nature-focused photography or maps underneath it.

---

## 3. Typography: The Editorial Voice

We utilize **Manrope** for its balance of geometric precision and humanist warmth. 

*   **Display (lg/md/sm):** Reserved for high-level environmental metrics (e.g., "Air Quality Index"). Use `headline-lg` with tightened letter-spacing (-0.02em) to create an authoritative, editorial feel.
*   **Headlines & Titles:** Use `on_surface` for headers. Use `tertiary` (`#37637e`) for sub-headers to provide a professional, steel-blue contrast that guides the eye without the harshness of black.
*   **Body (lg/md):** The workhorse for data descriptions. Maintain generous line-height (1.6) to ensure the "serenity" of the system is preserved even in text-heavy areas.
*   **Labels:** Use `label-md` in `on_surface_variant` for metadata. This provides a clear visual distinction from primary data points.

---

## 4. Elevation & Depth

We convey hierarchy through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, natural lift.
*   **Ambient Shadows:** If a "floating" effect is required (e.g., a modal or floating action button), use a shadow tinted with the `on-surface` color:
    *   `box-shadow: 0 12px 32px -4px rgba(25, 29, 14, 0.08);`
    *   This mimics natural light filtered through trees rather than a sterile digital shadow.
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Buttons
*   **Primary:** `primary` background with `on_primary` text. Shape: `md` (0.75rem) roundedness.
*   **Secondary:** `secondary_container` background with `on_secondary_container` text. This "Forest Green" variant should be used for environmental actions.
*   **Tertiary:** No background; use `tertiary` text. High-end subtle interaction.

### Cards & Lists
**Forbid the use of divider lines.** 
*   Separate list items using `body-md` spacing (0.875rem) or alternating background shifts between `surface-container-low` and `surface-container-high`.
*   Cards should use the `lg` (1rem) roundedness scale to feel organic and approachable.

### Nature-Specific Components
*   **The Vitality Gauge:** Use `primary_container` for the track and `primary` for the active state. The shape should be a "pill" (`full` roundedness) to avoid sharp edges.
*   **Map Control Chips:** Floating glass containers (`surface_variant` @ 60% blur) with `on_surface` icons.
*   **Data Inputs:** Use `surface_container_lowest` for the field background with a "Ghost Border" on focus. Avoid traditional "box" inputs; use a "underline" style only if the editorial layout demands it.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a functional tool. If a dashboard feels crowded, increase the padding using the `xl` (1.5rem) scale.
*   **DO** overlap elements. A chart can slightly overlap a background image or a decorative organic shape to create depth.
*   **DO** use `tertiary` (`#37637e`) for technical data or coordinates to separate "Natural" data from "Technical" data.

### Don't
*   **DON'T** use high-saturation reds for errors. Use the `error` (`#ba1a1a`) token, which is a muted, earthy brick red.
*   **DON'T** use pure black `#000000`. The darkest point in this system should be `on_primary_fixed` (`#191e00`).
*   **DON'T** use "Standard" 40px buttons. Use 48px or 56px to provide a premium, touch-friendly, spacious feel.