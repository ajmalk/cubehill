# Theming

This document describes the DaisyUI theme system, theme selection, and theme-aware component styling. For the theme store implementation, FOUC prevention, and Three.js CSS variable sync, see [Technical: Theme Integration](../technical/theme-integration.md).

## DaisyUI Theme System

DaisyUI themes are applied via the `data-theme` attribute on the `<html>` element. Switching themes is as simple as changing this attribute — no JavaScript runtime, no CSS-in-JS, no class toggling on individual elements.

```html
<html data-theme="dark">  <!-- All DaisyUI components render in dark mode -->
<html data-theme="light"> <!-- All DaisyUI components render in light mode -->
```

### Configured Themes

The `tailwind.config.js` configures exactly two themes:

```javascript
module.exports = {
  // ...
  daisyui: {
    themes: ['light', 'dark'],
  },
};
```

DaisyUI ships with 35+ themes, but CubeHill uses only `light` and `dark` to keep the UI focused. These themes define CSS custom properties (e.g., `--b1` for base background, `--bc` for base content/text, `--p` for primary color) that all DaisyUI components consume.

## Theme-Aware Components

### ninja-keys

The `ninja-keys` web component supports theming via CSS custom properties. It can be styled to match DaisyUI's current theme:

```css
ninja-keys {
  --ninja-accent-color: oklch(var(--p));      /* DaisyUI primary */
  --ninja-text-color: oklch(var(--bc));        /* DaisyUI base content */
  --ninja-modal-background: oklch(var(--b1));  /* DaisyUI base background */
}
```

This ensures the command palette looks consistent in both light and dark modes without any JavaScript color bridging.

### Algorithm Cards

Algorithm cards use DaisyUI's `card` component class, which automatically adapts to the active theme. The 2D pattern thumbnails on cards use a neutral grid with colored/uncolored sticker indicators that work in both themes.

### Playback Controls

Buttons use DaisyUI's `btn` classes, which inherit theme colors automatically. Active/pressed states follow the theme's primary color.
