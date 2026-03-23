/**
 * themeStore.svelte.ts
 *
 * Manages the user's dark/light theme preference using Svelte 5 runes.
 * Persists to localStorage and syncs the data-theme attribute on <html>.
 *
 * See docs/technical/theme-integration.md for the full theming strategy.
 *
 * FOUC prevention is handled separately in src/app.html via an inline
 * blocking script that runs before first paint.
 */

import { browser } from '$app/environment';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let theme = $state<'light' | 'dark'>('dark');

// ---------------------------------------------------------------------------
// Theme resolution
// ---------------------------------------------------------------------------

/**
 * Initialise the theme from localStorage or system preference.
 * Must be called in onMount (requires browser APIs).
 */
function initTheme(): void {
  if (!browser) return;

  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') {
    theme = saved;
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    theme = 'light';
  } else {
    theme = 'dark';
  }

  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Toggle between dark and light, persisting the result.
 */
function toggleTheme(): void {
  if (!browser) return;

  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

/**
 * Set a specific theme, persisting the result.
 * Used by the command palette theme commands.
 */
function setTheme(newTheme: 'light' | 'dark'): void {
  if (!browser) return;

  theme = newTheme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const themeStore = {
  get theme() {
    return theme;
  },
  initTheme,
  toggleTheme,
  setTheme,
};
