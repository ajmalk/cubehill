/**
 * commandData.ts
 *
 * Builds the ninja-keys command array for the CubeHill command palette.
 *
 * Command hierarchy:
 *   NAVIGATION — Home, OLL, PLL pages
 *   ALGORITHMS — OLL groups → cases, PLL groups → cases
 *   THEME      — Light, Dark
 *
 * All navigation uses goto(resolve('/path/')) from $app/navigation + $app/paths.
 * Theme commands call themeStore.setTheme() directly without closing the palette.
 *
 * See designs/phase6-command-palette.md for the full UX spec.
 */

import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { themeStore } from '$lib/stores/themeStore.svelte.js';
import { OLL_ALGORITHMS } from '$lib/data/oll.js';
import { PLL_ALGORITHMS } from '$lib/data/pll.js';

// ---------------------------------------------------------------------------
// ninja-keys command shape
// ---------------------------------------------------------------------------

export interface NinjaCommand {
  id: string;
  title: string;
  parent?: string;
  keywords?: string;
  section?: string;
  handler?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect unique groups from an algorithm list, preserving insertion order. */
function uniqueGroups(algs: { group: string }[]): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const alg of algs) {
    if (!seen.has(alg.group)) {
      seen.add(alg.group);
      groups.push(alg.group);
    }
  }
  return groups;
}

/** Slugify a group name to a stable command id prefix. */
function groupId(category: string, group: string): string {
  return `${category}-group-${group.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

// ---------------------------------------------------------------------------
// Command builders
// ---------------------------------------------------------------------------

function buildNavigationCommands(): NinjaCommand[] {
  return [
    {
      id: 'nav-home',
      title: 'Home',
      section: 'Navigation',
      keywords: 'home start main',
      handler: () => goto(resolve('/')),
    },
    {
      id: 'nav-oll',
      title: 'OLL Algorithms',
      section: 'Navigation',
      keywords: 'oll orient last layer browse list',
      handler: () => goto(resolve('/oll/')),
    },
    {
      id: 'nav-pll',
      title: 'PLL Algorithms',
      section: 'Navigation',
      keywords: 'pll permute last layer browse list',
      handler: () => goto(resolve('/pll/')),
    },
  ];
}

function buildOllCommands(): NinjaCommand[] {
  const commands: NinjaCommand[] = [];

  // Top-level OLL parent entry (no handler — just opens the sub-menu)
  commands.push({
    id: 'oll',
    title: 'OLL',
    section: 'Algorithms',
    keywords: 'oll orient last layer',
  });

  // OLL group entries
  const ollGroups = uniqueGroups(OLL_ALGORITHMS);
  for (const group of ollGroups) {
    const gid = groupId('oll', group);
    commands.push({
      id: gid,
      title: group,
      parent: 'oll',
      keywords: `oll ${group.toLowerCase()}`,
    });

    // Individual OLL cases under each group
    const cases = OLL_ALGORITHMS.filter((a) => a.group === group);
    for (const alg of cases) {
      commands.push({
        id: alg.id,
        title: alg.name,
        parent: gid,
        keywords: `oll ${group.toLowerCase()} ${alg.category} ${alg.notation}`,
        handler: () => goto(resolve(`/oll/${alg.id}/`)),
      });
    }
  }

  return commands;
}

function buildPllCommands(): NinjaCommand[] {
  const commands: NinjaCommand[] = [];

  // Top-level PLL parent entry (no handler — just opens the sub-menu)
  commands.push({
    id: 'pll',
    title: 'PLL',
    section: 'Algorithms',
    keywords: 'pll permute last layer',
  });

  // PLL group entries
  const pllGroups = uniqueGroups(PLL_ALGORITHMS);
  for (const group of pllGroups) {
    const gid = groupId('pll', group);
    commands.push({
      id: gid,
      title: group,
      parent: 'pll',
      keywords: `pll ${group.toLowerCase()}`,
    });

    // Individual PLL cases under each group
    const cases = PLL_ALGORITHMS.filter((a) => a.group === group);
    for (const alg of cases) {
      commands.push({
        id: alg.id,
        title: alg.name,
        parent: gid,
        keywords: `pll ${group.toLowerCase()} ${alg.category} ${alg.notation}`,
        handler: () => goto(resolve(`/pll/${alg.id}/`)),
      });
    }
  }

  return commands;
}

function buildThemeCommands(): NinjaCommand[] {
  return [
    {
      id: 'theme-dark',
      title: 'Dark',
      section: 'Theme',
      keywords: 'dark theme night mode',
      handler: () => themeStore.setTheme('dark'),
    },
    {
      id: 'theme-light',
      title: 'Light',
      section: 'Theme',
      keywords: 'light theme day mode',
      handler: () => themeStore.setTheme('light'),
    },
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build and return the full ninja-keys command array.
 * Call this once inside onMount (requires browser APIs for navigation).
 */
export function buildCommands(): NinjaCommand[] {
  return [
    ...buildNavigationCommands(),
    ...buildOllCommands(),
    ...buildPllCommands(),
    ...buildThemeCommands(),
  ];
}
