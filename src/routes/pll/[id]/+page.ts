/**
 * PLL detail page load function.
 *
 * Loads the PLL algorithm for the given id param.
 * Exports entries() for static prerendering with adapter-static.
 */
import { error } from '@sveltejs/kit';
import { PLL_ALGORITHMS } from '$lib/data/pll.js';
import type { PageLoad } from './$types.js';

export const prerender = true;

/** Export all PLL case IDs so adapter-static can prerender every detail page. */
export function entries() {
  return PLL_ALGORITHMS.map((alg) => ({ id: alg.id }));
}

export const load: PageLoad = ({ params }) => {
  const algorithm = PLL_ALGORITHMS.find((a) => a.id === params.id);
  if (!algorithm) {
    error(404, `PLL case "${params.id}" not found`);
  }

  const index = PLL_ALGORITHMS.indexOf(algorithm);
  const prevCase = index > 0 ? PLL_ALGORITHMS[index - 1] : null;
  const nextCase = index < PLL_ALGORITHMS.length - 1 ? PLL_ALGORITHMS[index + 1] : null;

  return { algorithm, prevCase, nextCase };
};
